import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Award,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  HelpCircle,
  Loader2,
  BookOpen,
  Calendar,
  Play,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { assessmentService } from '../../services/assessmentService';
import {
  AssessmentListItem,
  AssessmentDetailResponse,
  AssessmentStartResponse,
  AssessmentSubmitResponse,
  AssessmentAttemptSummary,
  AssessmentAttemptDetail,
  AssessmentMonitoringResponse,
  AnswerResultDetail,
} from '../../types/assessment';

interface AssessmentCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssessmentId?: string | null;
}

type ModalView = 'catalog' | 'detail' | 'runner' | 'result' | 'monitoring';

export const AssessmentCenterModal: React.FC<AssessmentCenterModalProps> = ({
  isOpen,
  onClose,
  initialAssessmentId,
}) => {
  const { user, accessToken, openAuthModal } = useAuthStore();

  // Current view state
  const [currentView, setCurrentView] = useState<ModalView>('catalog');
  const [activeTab, setActiveTab] = useState<'assessments' | 'history' | 'monitoring'>('assessments');

  // Loading & error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Catalog State
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [myHistory, setMyHistory] = useState<AssessmentAttemptSummary[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // Active Assessment & Runner State
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetailResponse | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<AssessmentStartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Result & Review State
  const [latestResult, setLatestResult] = useState<AssessmentSubmitResponse | null>(null);
  const [reviewedAttempt, setReviewedAttempt] = useState<AssessmentAttemptDetail | null>(null);

  // Monitoring State (Trainers/Admin)
  const [monitoringData, setMonitoringData] = useState<AssessmentMonitoringResponse | null>(null);
  const [monitoringAssessmentId, setMonitoringAssessmentId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch Catalog
  const fetchAssessments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAssessments(accessToken);
      setAssessments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Fetch Attempt History
  const fetchMyHistory = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await assessmentService.getMyAttempts(accessToken);
      setMyHistory(data);
    } catch (err: unknown) {
      console.error('Failed to load attempt history:', err);
    }
  }, [accessToken]);

  // Reset or load initial assessment on modal open
  useEffect(() => {
    if (isOpen && accessToken) {
      fetchAssessments();
      fetchMyHistory();
      if (initialAssessmentId) {
        handleViewAssessmentDetail(initialAssessmentId);
      } else {
        setCurrentView('catalog');
      }
    } else {
      // Clear timers and state
      if (timerRef.current) clearInterval(timerRef.current);
      setSelectedAssessment(null);
      setActiveQuiz(null);
      setLatestResult(null);
      setReviewedAttempt(null);
      setMonitoringData(null);
      setCurrentView('catalog');
    }
  }, [isOpen, accessToken, initialAssessmentId]);

  // Timer countdown hook for Active Quiz Runner
  useEffect(() => {
    if (currentView === 'runner' && activeQuiz) {
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentView, activeQuiz]);

  // Select Assessment & View Instructions
  const handleViewAssessmentDetail = async (id: string) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await assessmentService.getAssessmentById(id, accessToken);
      setSelectedAssessment(detail);
      setCurrentView('detail');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment details');
    } finally {
      setLoading(false);
    }
  };

  // Start / Resume Assessment
  const handleStartAssessment = async (id: string) => {
    if (!accessToken) {
      openAuthModal('login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const quiz = await assessmentService.startAssessment(id, accessToken);
      setActiveQuiz(quiz);
      setAnswers({});
      setCurrentQuestionIndex(0);

      // Calculate remaining duration in seconds
      const startMs = new Date(quiz.start_time).getTime();
      const nowMs = Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      const totalAllowedSeconds = quiz.duration_minutes * 60;
      const remaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

      setTimeRemainingSeconds(remaining);
      setCurrentView('runner');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start assessment');
    } finally {
      setLoading(false);
    }
  };

  // Record Selected Option
  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Submit Assessment
  const handleSubmitAssessment = async () => {
    if (!activeQuiz || !accessToken || isSubmitting) return;

    const unansweredCount =
      activeQuiz.questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const proceed = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit your assessment?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (timerRef.current) clearInterval(timerRef.current);

      const submissionItems = Object.entries(answers).map(([qId, optId]) => ({
        question_id: qId,
        selected_option: optId,
      }));

      const result = await assessmentService.submitAssessment(
        activeQuiz.assessment_id,
        {
          attempt_id: activeQuiz.attempt_id,
          answers: submissionItems,
        },
        accessToken
      );

      setLatestResult(result);
      setCurrentView('result');

      // Refresh attempt history and catalog
      fetchAssessments();
      fetchMyHistory();

      // Load full review
      loadAttemptReview(result.attempt_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!activeQuiz || !accessToken) return;
    setIsSubmitting(true);
    try {
      const submissionItems = Object.entries(answers).map(([qId, optId]) => ({
        question_id: qId,
        selected_option: optId,
      }));

      const result = await assessmentService.submitAssessment(
        activeQuiz.assessment_id,
        {
          attempt_id: activeQuiz.attempt_id,
          answers: submissionItems,
        },
        accessToken
      );

      setLatestResult(result);
      setCurrentView('result');
      fetchAssessments();
      fetchMyHistory();
      loadAttemptReview(result.attempt_id);
    } catch (err) {
      console.error('Auto submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load Review of an Attempt
  const loadAttemptReview = async (attemptId: string) => {
    if (!accessToken) return;
    try {
      const attempt = await assessmentService.getAttemptDetail(attemptId, accessToken);
      setReviewedAttempt(attempt);
    } catch (err) {
      console.error('Failed to load attempt review:', err);
    }
  };

  // Trainer/Admin Monitoring
  const handleOpenMonitoring = async (assessmentId: string) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setMonitoringAssessmentId(assessmentId);
    try {
      const data = await assessmentService.getMonitoring(assessmentId, accessToken);
      setMonitoringData(data);
      setCurrentView('monitoring');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format remaining timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Filter subjects from assessment catalog
  const subjects = ['All', ...Array.from(new Set(assessments.map((a) => a.subject).filter(Boolean)))];
  const filteredAssessments = assessments.filter((a) => {
    return selectedSubject === 'All' || a.subject === selectedSubject;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Capacity Connect Examination Desk
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  IMD Certified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official competency evaluations, technical MCQ / True-False assessments &amp; scoring
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentView !== 'catalog' && currentView !== 'runner' && (
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                &larr; Catalog
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* VIEW 1: CATALOG & ATTEMPTS */}
        {currentView === 'catalog' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('assessments')}
                  className={`pb-2 text-sm font-semibold transition border-b-2 flex items-center space-x-2 ${
                    activeTab === 'assessments'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Available Assessments ({assessments.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`pb-2 text-sm font-semibold transition border-b-2 flex items-center space-x-2 ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>My Results &amp; History ({myHistory.length})</span>
                </button>

                {(user?.role === 'trainer' || user?.role === 'admin') && (
                  <button
                    onClick={() => setActiveTab('monitoring')}
                    className={`pb-2 text-sm font-semibold transition border-b-2 flex items-center space-x-2 ${
                      activeTab === 'monitoring'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Candidate Monitoring</span>
                  </button>
                )}
              </div>

              {/* Subject Filter */}
              {activeTab === 'assessments' && (
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                  >
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        Subject: {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p className="text-sm">Loading examination records...</p>
              </div>
            ) : activeTab === 'assessments' ? (
              /* Assessment Cards Grid */
              filteredAssessments.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                  <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-300">No Assessments Found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    There are no published evaluations matching the selected filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAssessments.map((a) => {
                    const isPassed = a.user_latest_attempt?.is_passed;
                    const hasAttempted = !!a.user_latest_attempt;
                    return (
                      <div
                        key={a.id}
                        className="bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 rounded-xl p-5 flex flex-col justify-between transition group hover:shadow-lg"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {a.subject}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              {hasAttempted && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded font-medium flex items-center space-x-1 ${
                                    isPassed
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {isPassed ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  <span>
                                    {isPassed ? 'Passed' : 'Failed'} ({a.user_latest_attempt?.score_obtained.toFixed(0)}%)
                                  </span>
                                </span>
                              )}
                              <span
                                className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  a.is_available
                                    ? 'bg-slate-700 text-slate-300'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {a.is_available ? 'Available' : 'Closed'}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition mb-1.5">
                            {a.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                            {a.description || 'Standard technical evaluation for meteorology trainees.'}
                          </p>
                        </div>

                        <div className="border-t border-slate-700/60 pt-3">
                          <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-400 mb-4 bg-slate-900/60 p-2 rounded-lg">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold">Questions</p>
                              <p className="font-bold text-slate-200">{a.questions_count}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold">Duration</p>
                              <p className="font-bold text-slate-200">{a.duration_minutes}m</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold">Pass Threshold</p>
                              <p className="font-bold text-emerald-400">{a.passing_score}%</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleViewAssessmentDetail(a.id)}
                              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg transition"
                            >
                              Instructions
                            </button>

                            <div className="flex items-center space-x-2">
                              {hasAttempted && a.user_latest_attempt && (
                                <button
                                  onClick={async () => {
                                    if (a.user_latest_attempt) {
                                      await loadAttemptReview(a.user_latest_attempt.attempt_id);
                                      setCurrentView('result');
                                    }
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition"
                                >
                                  Review Result
                                </button>
                              )}

                              <button
                                onClick={() => handleStartAssessment(a.id)}
                                disabled={!a.is_available}
                                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition flex items-center space-x-1.5 shadow-sm"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>{hasAttempted ? 'Retake' : 'Start Exam'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : activeTab === 'history' ? (
              /* Trainee Attempt History Table */
              myHistory.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                  <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-300">No Previous Attempts</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    You haven't completed any assessments yet. Choose an assessment from the catalog to begin!
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Attempt ID</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {myHistory.map((item) => (
                        <tr key={item.attempt_id} className="hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3.5 font-mono text-white">
                            {item.attempt_id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {item.end_time
                              ? new Date(item.end_time).toLocaleString()
                              : 'In Progress'}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-white">
                            {item.score_obtained.toFixed(1)} / {item.total_marks}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                item.is_passed
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {item.is_passed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={async () => {
                                await loadAttemptReview(item.attempt_id);
                                setCurrentView('result');
                              }}
                              className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              View Breakdown &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* Trainer / Admin Monitoring Panel */
              <div className="space-y-4">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Select an Assessment to Monitor:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {assessments.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleOpenMonitoring(a.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                          monitoringAssessmentId === a.id
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {a.title}
                      </button>
                    ))}
                  </div>
                </div>

                {monitoringData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl text-center">
                        <p className="text-xs text-slate-400">Total Attempts</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {monitoringData.total_attempts}
                        </p>
                      </div>
                      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl text-center">
                        <p className="text-xs text-slate-400">Passed Candidates</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {monitoringData.passed_count}
                        </p>
                      </div>
                      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl text-center">
                        <p className="text-xs text-slate-400">Pass Rate</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">
                          {monitoringData.pass_percentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl text-center">
                        <p className="text-xs text-slate-400">Average Score</p>
                        <p className="text-2xl font-bold text-blue-400 mt-1">
                          {monitoringData.average_score.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                      <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/40 flex justify-between items-center">
                        <h4 className="text-xs font-semibold uppercase text-slate-300">
                          Candidate Roster &amp; Results
                        </h4>
                      </div>
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                          <tr>
                            <th className="px-4 py-2.5">Candidate</th>
                            <th className="px-4 py-2.5">Email</th>
                            <th className="px-4 py-2.5">Score</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5">Submitted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {monitoringData.attempts.map((row) => (
                            <tr key={row.attempt_id} className="hover:bg-slate-800/30">
                              <td className="px-4 py-2.5 font-medium text-white">
                                {row.user_name}
                              </td>
                              <td className="px-4 py-2.5 text-slate-400">
                                {row.user_email}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-white">
                                {row.score_obtained.toFixed(1)} / {row.total_marks}
                              </td>
                              <td className="px-4 py-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    row.is_passed
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {row.is_passed ? 'PASSED' : 'FAILED'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-400">
                                {row.end_time
                                  ? new Date(row.end_time).toLocaleString()
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: INSTRUCTIONS & DETAIL */}
        {currentView === 'detail' && selectedAssessment && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedAssessment.subject}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  {selectedAssessment.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedAssessment.description ||
                    'Official certification examination created under IMD capacity standards.'}
                </p>
              </div>
            </div>

            {/* Assessment Rules Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl text-center">
                <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">Duration</p>
                <p className="text-base font-bold text-white">
                  {selectedAssessment.duration_minutes} Minutes
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl text-center">
                <Award className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">Passing Score</p>
                <p className="text-base font-bold text-emerald-400">
                  {selectedAssessment.passing_score}%
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl text-center">
                <BarChart3 className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">Questions</p>
                <p className="text-base font-bold text-white">
                  {selectedAssessment.questions_count} Questions
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl text-center">
                <Calendar className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">Deadline</p>
                <p className="text-xs font-bold text-white mt-1">
                  {selectedAssessment.deadline
                    ? new Date(selectedAssessment.deadline).toLocaleDateString()
                    : 'Open Enrollment'}
                </p>
              </div>
            </div>

            {/* Instructions box */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Examination Guidelines &amp; Integrity Protocol:</span>
              </h4>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
                <li>
                  Once started, the examination timer will run continuously and cannot be paused.
                </li>
                <li>
                  Questions consist of multiple-choice and true/false inquiries. Only one option can be chosen per question.
                </li>
                <li>
                  You can freely navigate between questions before clicking the final submit button.
                </li>
                <li>
                  Upon submission, your responses are sealed and graded with a cryptographically verified SHA-256 signature.
                </li>
                <li>
                  If the timer reaches zero, all currently recorded answers will automatically be submitted.
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Back to Catalog
              </button>
              <button
                onClick={() => handleStartAssessment(selectedAssessment.id)}
                disabled={!selectedAssessment.is_available}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition shadow-md flex items-center space-x-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Assessment Now</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: TIMED QUIZ RUNNER */}
        {currentView === 'runner' && activeQuiz && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Runner Header with Timer & Progress */}
            <div className="px-6 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                  {activeQuiz.subject} &bull; {activeQuiz.title}
                </span>
                <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                  <span>
                    Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                  </span>
                  <span>&bull;</span>
                  <span>{Object.keys(answers).length} of {activeQuiz.questions.length} answered</span>
                </div>
              </div>

              {/* Countdown Timer */}
              <div
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-mono text-sm font-bold border transition ${
                  timeRemainingSeconds <= 120
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-blue-400'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>
            </div>

            {/* Runner Main Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
              {(() => {
                const currentQuestion = activeQuiz.questions[currentQuestionIndex];
                if (!currentQuestion) return null;
                const currentSelection = answers[currentQuestion.id];

                return (
                  <div className="max-w-3xl mx-auto w-full space-y-6">
                    {/* Question Statement */}
                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span className="font-semibold uppercase tracking-wider text-slate-500">
                          Question #{currentQuestionIndex + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold">
                          {currentQuestion.marks} Marks
                        </span>
                      </div>
                      <p className="text-base font-semibold text-white leading-relaxed">
                        {currentQuestion.question_text}
                      </p>
                    </div>

                    {/* Options Selection */}
                    <div className="space-y-3">
                      {currentQuestion.options.map((option) => {
                        const isSelected = currentSelection === option.id;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                            className={`w-full text-left p-4 rounded-xl border transition flex items-center space-x-3.5 ${
                              isSelected
                                ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                                : 'bg-slate-800/40 border-slate-700/70 hover:bg-slate-800/70 text-slate-300'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border transition ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-500 text-white'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {option.id}
                            </div>
                            <span className="text-sm font-medium">{option.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Runner Navigation Footer */}
            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              {/* Question Dots / Palette */}
              <div className="flex items-center space-x-1.5 overflow-x-auto max-w-sm py-1">
                {activeQuiz.questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-blue-500 bg-blue-600 text-white'
                          : isAnswered
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next / Submit Controls */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentQuestionIndex === 0}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-40 flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentQuestionIndex((prev) =>
                        Math.min(activeQuiz.questions.length - 1, prev + 1)
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : null}

                <button
                  onClick={handleSubmitAssessment}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition flex items-center space-x-2 shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Submit Exam</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: RESULTS & REVIEW */}
        {currentView === 'result' && (reviewedAttempt || latestResult) && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {(() => {
              const attempt = reviewedAttempt;
              const result = latestResult;

              const isPassed = attempt ? attempt.is_passed : result ? result.is_passed : false;
              const scoreObtained = attempt ? attempt.score_obtained : result ? result.score_obtained : 0;
              const totalMarks = attempt ? attempt.total_marks : result ? result.total_marks : 0;
              const passingScore = attempt ? attempt.passing_score : result ? result.passing_score : 70;
              const signature = attempt ? attempt.attempt_signature : result ? result.attempt_signature : '';
              const details: AnswerResultDetail[] = attempt?.answers || [];

              return (
                <div className="space-y-6">
                  {/* Big Pass / Fail Hero Card */}
                  <div
                    className={`p-6 rounded-2xl border ${
                      isPassed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-3 rounded-xl border ${
                            isPassed
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="w-8 h-8" />
                          ) : (
                            <XCircle className="w-8 h-8" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {isPassed ? 'Assessment Passed' : 'Assessment Not Cleared'}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {isPassed
                              ? 'Congratulations! You have satisfied the threshold requirements for this competency module.'
                              : 'You did not meet the required passing mark. Review the explanations below and attempt again when ready.'}
                          </p>
                        </div>
                      </div>

                      {/* Score Metrics */}
                      <div className="flex items-center space-x-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800 shrink-0">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Your Score</p>
                          <p
                            className={`text-2xl font-black ${
                              isPassed ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {scoreObtained.toFixed(1)} / {totalMarks}
                          </p>
                        </div>
                        <div className="h-8 w-px bg-slate-800" />
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Passing Target</p>
                          <p className="text-2xl font-black text-slate-300">
                            {passingScore}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cryptographic SHA-256 Verification Signature */}
                    {signature && (
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <span>Tamper-Proof Verification Hash:</span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate max-w-md">
                          {signature}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Question by Question Detailed Breakdown */}
                  {details.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <span>Question Performance &amp; Explanations:</span>
                      </h4>

                      <div className="space-y-3">
                        {details.map((detail: AnswerResultDetail, idx: number) => {
                          const isCorrect = detail.is_correct;
                          return (
                            <div
                              key={detail.question_id}
                              className={`p-4 rounded-xl border ${
                                isCorrect
                                  ? 'bg-emerald-950/10 border-emerald-500/20'
                                  : 'bg-rose-950/10 border-rose-500/20'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-400">
                                  #{idx + 1}. {detail.question_text}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {isCorrect ? `+${detail.marks_awarded} Marks` : '0 Marks'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs my-2">
                                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                                  <span className="text-slate-500">Your Selection: </span>
                                  <span
                                    className={`font-semibold ${
                                      isCorrect ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    Option {detail.selected_option || 'None'}
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                                  <span className="text-slate-500">Correct Option: </span>
                                  <span className="font-semibold text-emerald-400">
                                    Option {detail.correct_option}
                                  </span>
                                </div>
                              </div>

                              {detail.explanation && (
                                <div className="mt-2 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                                  <span className="font-semibold text-blue-400">
                                    Official Explanation:{' '}
                                  </span>
                                  {detail.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Back to Catalog Action */}
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={() => setCurrentView('catalog')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    >
                      Return to Catalog
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
export default AssessmentCenterModal;
