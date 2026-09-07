import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  FileText,
  Video,
  Presentation,
  Download,
  Star,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { courseService } from '../../services/courseService';
import { CourseDetail, LessonDetail } from '../../types';

interface CoursePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string | null;
}

export const CoursePlayerModal: React.FC<CoursePlayerModalProps> = ({
  isOpen,
  onClose,
  courseId,
}) => {
  const { accessToken, openAuthModal } = useAuthStore();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeLesson, setActiveLesson] = useState<LessonDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'presentation' | 'notes' | 'resources'>('video');

  // Interactive Video Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSeconds, setPlaybackSeconds] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Presentation Slide State
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const totalSlides = 12; // Simulated slide deck count

  // Feedback State
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [feedbackTextInput, setFeedbackTextInput] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Action Loading
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);

  // Load Course Detail
  const fetchCourseData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourseById(courseId, accessToken || '');
      setCourse(data);

      // Select first lesson by default if none selected
      if (data.modules.length > 0 && data.modules[0].lessons.length > 0) {
        const firstLesson = data.modules[0].lessons[0];
        setActiveLesson(firstLesson);
        setPlaybackSeconds(firstLesson.watch_time_seconds || 0);

        // Pick default tab based on available resources
        const hasVideo = firstLesson.learning_resources.some((r) => r.resource_type === 'video');
        const hasPres = firstLesson.learning_resources.some((r) => r.resource_type === 'presentation');
        if (hasVideo) setActiveTab('video');
        else if (hasPres) setActiveTab('presentation');
        else setActiveTab('notes');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load course structure');
    } finally {
      setLoading(false);
    }
  }, [courseId, accessToken]);

  useEffect(() => {
    if (isOpen && courseId) {
      fetchCourseData();
    } else {
      setCourse(null);
      setActiveLesson(null);
      setIsPlaying(false);
      setPlaybackSeconds(0);
      setFeedbackSuccess(null);
    }
  }, [isOpen, courseId, fetchCourseData]);

  // Video playback timer simulator
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackSeconds((prev) => prev + 1);
      }, 1000 / playbackRate);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackRate]);

  if (!isOpen) return null;

  // Flattened lesson list for navigation
  const allLessons: LessonDetail[] = course
    ? course.modules.flatMap((m) => m.lessons)
    : [];
  const currentLessonIndex = activeLesson
    ? allLessons.findIndex((l) => l.id === activeLesson.id)
    : -1;

  const handleSelectLesson = (lesson: LessonDetail) => {
    setIsPlaying(false);
    setActiveLesson(lesson);
    setPlaybackSeconds(lesson.watch_time_seconds || 0);
    setCurrentSlide(1);

    const hasVideo = lesson.learning_resources.some((r) => r.resource_type === 'video');
    const hasPres = lesson.learning_resources.some((r) => r.resource_type === 'presentation');
    if (hasVideo) setActiveTab('video');
    else if (hasPres) setActiveTab('presentation');
    else setActiveTab('notes');
  };

  const handleNextLesson = () => {
    if (currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1) {
      handleSelectLesson(allLessons[currentLessonIndex + 1]);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      handleSelectLesson(allLessons[currentLessonIndex - 1]);
    }
  };

  // Toggle lesson completion
  const handleToggleComplete = async () => {
    if (!course || !activeLesson) return;
    if (!accessToken) {
      openAuthModal('login');
      return;
    }

    setIsUpdatingProgress(true);
    try {
      const isCurrentlyCompleted = activeLesson.is_completed;
      const res = await courseService.updateLessonProgress(
        course.id,
        {
          lesson_id: activeLesson.id,
          watch_time_seconds: Math.max(playbackSeconds, 60),
          is_completed: !isCurrentlyCompleted,
        },
        accessToken
      );

      // Update local state
      setActiveLesson({
        ...activeLesson,
        is_completed: res.is_completed,
        watch_time_seconds: res.watch_time_seconds,
      });

      // Refetch whole course to update overall percentage and completion
      await fetchCourseData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating lesson progress');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Handle Enrollment
  const handleEnroll = async () => {
    if (!course) return;
    if (!accessToken) {
      openAuthModal('login');
      return;
    }

    setIsEnrolling(true);
    try {
      await courseService.enrollInCourse(course.id, accessToken);
      await fetchCourseData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Submit Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !accessToken) return;

    setIsSubmittingFeedback(true);
    setFeedbackSuccess(null);
    try {
      await courseService.submitFeedback(
        course.id,
        {
          rating: ratingInput,
          feedback_text: feedbackTextInput.trim() || undefined,
        },
        accessToken
      );
      setFeedbackSuccess('Feedback submitted successfully!');
      setFeedbackTextInput('');
      await fetchCourseData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const videoResources = activeLesson?.learning_resources.filter((r) => r.resource_type === 'video') || [];
  const presentationResources = activeLesson?.learning_resources.filter((r) => r.resource_type === 'presentation') || [];
  const studyMaterials = activeLesson?.learning_resources.filter((r) => r.resource_type === 'study_material') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-blue-900/80 text-blue-300 border border-blue-700/50">
              {course?.code || 'LMS'}
            </span>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {course?.title || 'Loading Course Player...'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{course?.instructor_name || 'IMD Faculty'}</span>
                <span>&bull;</span>
                <span className="text-teal-400">{course?.category}</span>
                <span>&bull;</span>
                <span className="capitalize">{course?.level}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Enrollment Status Indicator */}
            {course && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
                {course.is_enrolled ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300 font-medium">
                      {course.enrollment_status === 'completed' ? 'Course Completed' : 'Enrolled (Active)'}
                    </span>
                    <span className="text-teal-400 font-bold ml-1">{course.progress_percentage}%</span>
                  </>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-600 hover:bg-teal-500 text-white font-semibold transition"
                  >
                    {isEnrolling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Enroll to Track Progress</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Course Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading syllabus and content delivery stream...</p>
          </div>
        )}

        {error && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <p className="text-sm text-rose-300 font-medium">{error}</p>
            <button
              onClick={fetchCourseData}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main LMS Workspace */}
        {!loading && !error && course && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Left Column: Lesson Player & Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900 border-r border-slate-800">
              
              {/* Active Lesson Header */}
              {activeLesson ? (
                <>
                  {/* Media Viewport Container */}
                  <div className="bg-slate-950 p-4 sm:p-6 border-b border-slate-800">
                    
                    {/* Mode Tabs */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setActiveTab('video')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          activeTab === 'video'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Lecture ({videoResources.length})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('presentation')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          activeTab === 'presentation'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Presentation className="w-3.5 h-3.5" />
                        <span>Slides ({presentationResources.length > 0 ? totalSlides : 0})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('resources')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          activeTab === 'resources'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Study Materials ({studyMaterials.length})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('notes')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          activeTab === 'notes'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Notes &amp; Synopsis</span>
                      </button>
                    </div>

                    {/* Tab 1: Interactive Video Player Viewport */}
                    {activeTab === 'video' && (
                      <div className="relative aspect-video w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4 group">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-teal-400 font-mono">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Encrypted Stream &bull; Low-Latency Delivery</span>
                          </span>
                          <span className="font-mono text-slate-400">
                            {videoResources[0]?.title || activeLesson.title}
                          </span>
                        </div>

                        {/* Center Play Button Simulator */}
                        <div className="flex flex-col items-center justify-center gap-2 my-auto">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-16 h-16 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform transform active:scale-95"
                          >
                            {isPlaying ? (
                              <Pause className="w-7 h-7 fill-current" />
                            ) : (
                              <Play className="w-7 h-7 fill-current ml-1" />
                            )}
                          </button>
                          <span className="text-xs text-slate-400 font-mono">
                            {isPlaying ? 'Streaming Active...' : 'Click to Resume Lecture'}
                          </span>
                        </div>

                        {/* Player Controls Bar */}
                        <div className="space-y-2 bg-slate-950/80 p-3 rounded-lg backdrop-blur-sm border border-slate-800">
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden cursor-pointer">
                            <div
                              className="bg-teal-400 h-full transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  (playbackSeconds / ((activeLesson.duration_minutes || 45) * 60)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="text-white hover:text-teal-400 font-semibold"
                              >
                                {isPlaying ? 'Pause' : 'Play'}
                              </button>
                              <span className="font-mono text-slate-400 text-[11px]">
                                {Math.floor(playbackSeconds / 60)}:
                                {(playbackSeconds % 60).toString().padStart(2, '0')} /{' '}
                                {activeLesson.duration_minutes || 45}:00
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[11px]">Speed:</span>
                              {[1, 1.25, 1.5].map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => setPlaybackRate(rate)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                    playbackRate === rate
                                      ? 'bg-teal-500 text-slate-950 font-bold'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Interactive Slides Deck Viewport */}
                    {activeTab === 'presentation' && (
                      <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-6">
                        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                          <span className="text-teal-400 font-semibold">
                            Interactive Presentation Viewer
                          </span>
                          <span className="font-mono">
                            Slide {currentSlide} of {totalSlides}
                          </span>
                        </div>

                        {/* Slide Content Simulator */}
                        <div className="my-auto text-center space-y-4 max-w-lg mx-auto">
                          <div className="inline-block px-3 py-1 rounded bg-blue-900/60 text-blue-300 text-xs font-mono font-bold">
                            SLIDE {currentSlide}
                          </div>
                          <h3 className="text-xl font-extrabold text-white">
                            {currentSlide === 1
                              ? activeLesson.title
                              : `Technical Deep-Dive: Parameterization Phase ${currentSlide}`}
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {currentSlide === 1
                              ? 'Curriculum module overview and foundational physical equations for meteorologists.'
                              : 'Vector fields, boundary conditions, numerical discretization grids, and Doppler reflectivity mapping.'}
                          </p>
                        </div>

                        {/* Slide Navigation */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <button
                            onClick={() => setCurrentSlide((s) => Math.max(s - 1, 1))}
                            disabled={currentSlide <= 1}
                            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white disabled:opacity-30"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous Slide</span>
                          </button>
                          <div className="flex gap-1">
                            {Array.from({ length: totalSlides }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentSlide(i + 1)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  currentSlide === i + 1 ? 'bg-teal-400 w-4' : 'bg-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            onClick={() => setCurrentSlide((s) => Math.min(s + 1, totalSlides))}
                            disabled={currentSlide >= totalSlides}
                            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white disabled:opacity-30"
                          >
                            <span>Next Slide</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Study Materials & Reference Documents */}
                    {activeTab === 'resources' && (
                      <div className="aspect-video w-full bg-slate-950 rounded-xl overflow-y-auto border border-slate-800 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Downloadable Lesson Resources &amp; Guides
                          </h4>
                          <span className="text-[11px] text-teal-400 font-mono">
                            Verified MoES / IMD Content
                          </span>
                        </div>

                        {studyMaterials.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 space-y-2">
                            <FileText className="w-8 h-8 opacity-50" />
                            <p className="text-xs">No standalone PDF documents attached to this lesson.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {studyMaterials.map((res) => (
                              <div
                                key={res.id}
                                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-teal-950/70 border border-teal-800/50 flex items-center justify-center text-teal-400">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-white">{res.title}</div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                                      <span>{(res.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                                      <span>&bull;</span>
                                      <span className="truncate max-w-[200px]" title={res.sha256_checksum}>
                                        SHA-256: {res.sha256_checksum.slice(0, 10)}...
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={res.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Notes and Synopsis */}
                    {activeTab === 'notes' && (
                      <div className="aspect-video w-full bg-slate-950 rounded-xl overflow-y-auto border border-slate-800 p-6 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                          Lecture Overview &amp; Learning Objectives
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                          {activeLesson.content_text ||
                            'Comprehensive operational lesson covering essential atmospheric diagnostics, standard procedures, radar signature decoding, and numerical stability bounds.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Lesson Controls & Completion Row */}
                  <div className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleToggleComplete}
                        disabled={isUpdatingProgress}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeLesson.is_completed
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                            : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md'
                        }`}
                      >
                        {isUpdatingProgress ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : activeLesson.is_completed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span>
                          {activeLesson.is_completed ? 'Lesson Completed' : 'Mark as Complete'}
                        </span>
                      </button>

                      <span className="text-xs text-slate-400">
                        Duration: <span className="text-white font-mono">{activeLesson.duration_minutes || 30} mins</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevLesson}
                        disabled={currentLessonIndex <= 0}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs font-medium transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      <button
                        onClick={handleNextLesson}
                        disabled={currentLessonIndex >= allLessons.length - 1}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs font-medium transition"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Course Feedback and Reviews Section */}
                  <div className="p-4 sm:p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>Course Reviews &amp; Feedback</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Average Rating: <span className="text-white font-bold">{course.average_rating.toFixed(1)} / 5.0</span> ({course.total_ratings} ratings)
                        </p>
                      </div>
                    </div>

                    {/* Submit Review Form */}
                    {course.is_enrolled && (
                      <form
                        onSubmit={handleSubmitFeedback}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-300">
                            Leave Your Rating &amp; Review:
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingInput(star)}
                                className="text-amber-400 hover:scale-110 transition"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= ratingInput ? 'fill-amber-400' : 'text-slate-600'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={feedbackTextInput}
                          onChange={(e) => setFeedbackTextInput(e.target.value)}
                          placeholder="Share operational feedback regarding course depth, clarity, or simulation drills..."
                          className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400"
                        />

                        <div className="flex items-center justify-between">
                          {feedbackSuccess && (
                            <span className="text-xs text-emerald-400 font-medium">
                              {feedbackSuccess}
                            </span>
                          )}
                          <button
                            type="submit"
                            disabled={isSubmittingFeedback}
                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition"
                          >
                            {isSubmittingFeedback ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>Submit Feedback</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Existing Reviews List */}
                    <div className="space-y-3">
                      {course.feedbacks.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          No reviews submitted yet for this course. Be the first to leave feedback!
                        </p>
                      ) : (
                        course.feedbacks.map((fb) => (
                          <div
                            key={fb.id}
                            className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-200">
                                {fb.user_name || 'Verified Trainee'}
                              </span>
                              <div className="flex items-center gap-0.5 text-amber-400">
                                {Array.from({ length: fb.rating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                                ))}
                              </div>
                            </div>
                            {fb.feedback_text && (
                              <p className="text-xs text-slate-400">{fb.feedback_text}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <BookOpen className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Select a lesson from the curriculum sidebar to begin.</p>
                </div>
              )}
            </div>

            {/* Right Column: Curriculum Syllabus Sidebar */}
            <div className="w-full lg:w-96 bg-slate-950 flex flex-col overflow-y-auto">
              
              {/* Syllabus Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950 sticky top-0 z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Course Curriculum
                  </h3>
                  <span className="text-xs font-mono text-teal-400">
                    {course.modules_count} Modules &bull; {course.lessons_count} Lessons
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Overall Progress</span>
                    <span className="font-bold text-white">{course.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-400 h-full transition-all duration-300"
                      style={{ width: `${course.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Modules & Lessons List */}
              <div className="p-4 space-y-4 flex-1">
                {course.modules.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No modules configured yet.</p>
                ) : (
                  course.modules.map((mod, modIdx) => (
                    <div key={mod.id} className="space-y-2">
                      <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-slate-800 text-teal-400 font-mono text-[10px] flex items-center justify-center">
                          {modIdx + 1}
                        </span>
                        <span className="truncate">{mod.title}</span>
                      </div>

                      <div className="space-y-1 pl-2 border-l border-slate-800">
                        {mod.lessons.map((lesson) => {
                          const isSelected = activeLesson?.id === lesson.id;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson)}
                              className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between group ${
                                isSelected
                                  ? 'bg-blue-900/40 text-blue-200 border border-blue-700/50'
                                  : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {lesson.is_completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-slate-400" />
                                )}
                                <span className={`truncate ${isSelected ? 'font-bold text-white' : ''}`}>
                                  {lesson.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0 font-mono">
                                <span>{lesson.duration_minutes || 30}m</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
