import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  BookOpen,
  FolderPlus,
  FileText,
  HelpCircle,
  UploadCloud,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Layers,
  Sparkles,
  Award,
  Video,
  FileSpreadsheet,
  Code,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { trainerService } from '../../services/trainerService';
import {
  TrainerProfile,
  TrainerDashboardData,
  Course,
  CourseCreateRequest,
  Questionnaire,
  TrainerLibraryItem,
} from '../../types';

export const TrainerStudioModal: React.FC = () => {
  const { isTrainerModalOpen, closeTrainerModal, accessToken, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'questionnaires' | 'library' | 'profile'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<TrainerDashboardData | null>(null);
  const [profile, setProfile] = useState<TrainerProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [libraryItems, setLibraryItems] = useState<TrainerLibraryItem[]>([]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    designation: '',
    division: '',
    years_of_experience: 0,
    biography: '',
    avatar_url: '',
  });

  const [newExpertise, setNewExpertise] = useState({
    subject: '',
    proficiency_level: 'expert' as 'intermediate' | 'advanced' | 'expert',
    years_in_subject: 5,
  });

  const [newCourse, setNewCourse] = useState<CourseCreateRequest>({
    code: '',
    title: '',
    description: '',
    category: 'Radar Meteorology',
    level: 'intermediate',
    estimated_hours: 10,
    is_published: false,
  });
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  const [newModule, setNewModule] = useState({ title: '', description: '', order_index: 1 });
  const [isAddingModule, setIsAddingModule] = useState(false);

  const [newLesson, setNewLesson] = useState({
    title: '',
    content_text: '',
    order_index: 1,
    duration_minutes: 30,
  });
  const [isAddingLessonForModule, setIsAddingLessonForModule] = useState<string | null>(null);

  const [newQuestionnaire, setNewQuestionnaire] = useState({
    title: '',
    description: '',
    subject: 'Radar Meteorology',
    duration_minutes: 20,
    passing_score: 60,
    total_marks: 100,
    is_published: false,
  });
  const [isCreatingQuestionnaire, setIsCreatingQuestionnaire] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'mcq' as 'mcq' | 'true_false',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_option: 'A',
    explanation: '',
    marks: 1,
    order_index: 1,
  });
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const [newLibraryItem, setNewLibraryItem] = useState({
    title: '',
    description: '',
    resource_type: 'study_material' as 'video' | 'presentation' | 'study_material' | 'dataset' | 'code',
    file_path: '',
    file_size_bytes: 1048576,
    sha256_checksum: '',
    is_public_to_trainees: true,
  });
  const [isAddingLibrary, setIsAddingLibrary] = useState(false);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const loadAllData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [dashData, profData, coursesData, questData, libData] = await Promise.all([
        trainerService.getDashboard(accessToken),
        trainerService.getProfile(accessToken),
        trainerService.getCourses(accessToken),
        trainerService.getQuestionnaires(accessToken),
        trainerService.getLibrary(accessToken),
      ]);
      setDashboard(dashData);
      setProfile(profData);
      setCourses(coursesData);
      setQuestionnaires(questData);
      setLibraryItems(libData);

      setProfileForm({
        designation: profData.designation || '',
        division: profData.division || '',
        years_of_experience: profData.years_of_experience || 0,
        biography: profData.biography || '',
        avatar_url: profData.avatar_url || '',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load trainer studio data';
      showToast(msg, true);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isTrainerModalOpen && accessToken) {
      loadAllData();
    }
  }, [isTrainerModalOpen, accessToken, loadAllData]);

  if (!isTrainerModalOpen) return null;

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    try {
      const updated = await trainerService.updateProfile(accessToken, profileForm);
      setProfile(updated);
      showToast('Trainer profile updated successfully!');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExpertise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newExpertise.subject.trim()) return;
    setSaving(true);
    try {
      await trainerService.addExpertise(accessToken, newExpertise);
      setNewExpertise({ subject: '', proficiency_level: 'expert', years_in_subject: 5 });
      const updatedProf = await trainerService.getProfile(accessToken);
      setProfile(updatedProf);
      showToast('Expertise added successfully!');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add expertise', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpertise = async (id: string) => {
    if (!accessToken) return;
    try {
      await trainerService.deleteExpertise(accessToken, id);
      const updatedProf = await trainerService.getProfile(accessToken);
      setProfile(updatedProf);
      showToast('Expertise deleted');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete expertise', true);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newCourse.code || !newCourse.title) return;
    setSaving(true);
    try {
      const created = await trainerService.createCourse(accessToken, newCourse);
      setCourses([created, ...courses]);
      setNewCourse({
        code: '',
        title: '',
        description: '',
        category: 'Radar Meteorology',
        level: 'intermediate',
        estimated_hours: 10,
        is_published: false,
      });
      setIsCreatingCourse(false);
      showToast('Course created successfully!');
      // Refresh dashboard
      const d = await trainerService.getDashboard(accessToken);
      setDashboard(d);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create course', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!accessToken || !confirm('Are you sure you want to delete this course?')) return;
    try {
      await trainerService.deleteCourse(accessToken, id);
      setCourses(courses.filter((c) => c.id !== id));
      if (selectedCourse?.id === id) setSelectedCourse(null);
      showToast('Course deleted');
      const d = await trainerService.getDashboard(accessToken);
      setDashboard(d);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete course', true);
    }
  };

  const handleSelectCourse = async (courseId: string) => {
    if (!accessToken) return;
    try {
      const full = await trainerService.getCourseDetails(accessToken, courseId);
      setSelectedCourse(full);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load course details', true);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedCourse || !newModule.title.trim()) return;
    setSaving(true);
    try {
      await trainerService.addModule(accessToken, selectedCourse.id, newModule);
      setNewModule({ title: '', description: '', order_index: (selectedCourse.modules?.length || 0) + 2 });
      setIsAddingModule(false);
      await handleSelectCourse(selectedCourse.id);
      showToast('Module added successfully!');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add module', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!accessToken || !selectedCourse) return;
    try {
      await trainerService.deleteModule(accessToken, moduleId);
      await handleSelectCourse(selectedCourse.id);
      showToast('Module deleted');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete module', true);
    }
  };

  const handleAddLesson = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    if (!accessToken || !selectedCourse || !newLesson.title.trim()) return;
    setSaving(true);
    try {
      await trainerService.addLesson(accessToken, moduleId, newLesson);
      setNewLesson({ title: '', content_text: '', order_index: 1, duration_minutes: 30 });
      setIsAddingLessonForModule(null);
      await handleSelectCourse(selectedCourse.id);
      showToast('Lesson added successfully!');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add lesson', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!accessToken || !selectedCourse) return;
    try {
      await trainerService.deleteLesson(accessToken, lessonId);
      await handleSelectCourse(selectedCourse.id);
      showToast('Lesson deleted');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete lesson', true);
    }
  };

  const handleCreateQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newQuestionnaire.title.trim()) return;
    setSaving(true);
    try {
      const created = await trainerService.createQuestionnaire(accessToken, newQuestionnaire);
      setQuestionnaires([created, ...questionnaires]);
      setIsCreatingQuestionnaire(false);
      setNewQuestionnaire({
        title: '',
        description: '',
        subject: 'Radar Meteorology',
        duration_minutes: 20,
        passing_score: 60,
        total_marks: 100,
        is_published: false,
      });
      showToast('Questionnaire created successfully!');
      const d = await trainerService.getDashboard(accessToken);
      setDashboard(d);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create questionnaire', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestionnaire = async (id: string) => {
    if (!accessToken || !confirm('Delete this questionnaire?')) return;
    try {
      await trainerService.deleteQuestionnaire(accessToken, id);
      setQuestionnaires(questionnaires.filter((q) => q.id !== id));
      if (selectedQuestionnaire?.id === id) setSelectedQuestionnaire(null);
      showToast('Questionnaire deleted');
      const d = await trainerService.getDashboard(accessToken);
      setDashboard(d);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete questionnaire', true);
    }
  };

  const handleSelectQuestionnaire = async (id: string) => {
    if (!accessToken) return;
    try {
      const q = await trainerService.getQuestionnaire(accessToken, id);
      setSelectedQuestionnaire(q);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load questionnaire', true);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedQuestionnaire || !newQuestion.question_text.trim()) return;
    setSaving(true);
    try {
      const options = [
        { id: 'A', text: newQuestion.optionA.trim() || 'Option A' },
        { id: 'B', text: newQuestion.optionB.trim() || 'Option B' },
        { id: 'C', text: newQuestion.optionC.trim() || 'Option C' },
        { id: 'D', text: newQuestion.optionD.trim() || 'Option D' },
      ];
      await trainerService.addQuestion(accessToken, selectedQuestionnaire.id, {
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        options,
        correct_option: newQuestion.correct_option,
        explanation: newQuestion.explanation,
        marks: newQuestion.marks,
        order_index: (selectedQuestionnaire.questions?.length || 0) + 1,
      });
      setNewQuestion({
        question_text: '',
        question_type: 'mcq',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correct_option: 'A',
        explanation: '',
        marks: 1,
        order_index: 1,
      });
      setIsAddingQuestion(false);
      await handleSelectQuestionnaire(selectedQuestionnaire.id);
      showToast('Question added successfully!');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add question', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!accessToken || !selectedQuestionnaire) return;
    try {
      await trainerService.deleteQuestion(accessToken, questionId);
      await handleSelectQuestionnaire(selectedQuestionnaire.id);
      showToast('Question deleted');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete question', true);
    }
  };

  const handleAddLibraryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newLibraryItem.title.trim() || !newLibraryItem.file_path.trim()) return;
    setSaving(true);
    try {
      const fakeChecksum = newLibraryItem.sha256_checksum.trim() || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const created = await trainerService.addLibraryItem(accessToken, {
        ...newLibraryItem,
        sha256_checksum: fakeChecksum,
      });
      setLibraryItems([created, ...libraryItems]);
      setIsAddingLibrary(false);
      setNewLibraryItem({
        title: '',
        description: '',
        resource_type: 'study_material',
        file_path: '',
        file_size_bytes: 1048576,
        sha256_checksum: '',
        is_public_to_trainees: true,
      });
      showToast('Material added to Trainer Library!');
      const d = await trainerService.getDashboard(accessToken);
      setDashboard(d);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add library item', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLibraryItem = async (id: string) => {
    if (!accessToken || !confirm('Delete this material?')) return;
    try {
      await trainerService.deleteLibraryItem(accessToken, id);
      setLibraryItems(libraryItems.filter((i) => i.id !== id));
      showToast('Library item deleted');
      const d = await trainerService.getDashboard(accessToken);
      setDashboard(d);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete item', true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-950/20 overflow-hidden my-8">
        {/* Modal Top Banner */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Trainer Studio</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {user?.station_code || 'IMD-CENTRAL'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {profile?.full_name || user?.full_name} &bull; {profile?.designation || 'Domain Instructor'}
              </h2>
            </div>
          </div>
          <button
            onClick={closeTrainerModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: Layers },
            { id: 'courses', label: 'Course Studio', icon: FolderPlus, count: courses.length },
            { id: 'questionnaires', label: 'Questionnaires', icon: HelpCircle, count: questionnaires.length },
            { id: 'library', label: 'Trainer Library', icon: UploadCloud, count: libraryItems.length },
            { id: 'profile', label: 'Expertise & Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  setSelectedCourse(null);
                  setSelectedQuestionnaire(null);
                }}
                className={`flex items-center gap-2 py-3.5 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                  isActive
                    ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-xs font-mono">Loading Trainer Studio environment...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400">COURSES AUTHORED</div>
                      <div className="text-2xl font-black font-mono text-white mt-1">{dashboard?.total_courses || 0}</div>
                      <div className="text-[10px] text-amber-400 mt-0.5">{dashboard?.published_courses || 0} Published</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400">CURRICULUM MODULES</div>
                      <div className="text-2xl font-black font-mono text-white mt-1">{dashboard?.total_modules || 0}</div>
                      <div className="text-[10px] text-teal-400 mt-0.5">{dashboard?.total_lessons || 0} Lessons</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400">QUESTIONNAIRES</div>
                      <div className="text-2xl font-black font-mono text-white mt-1">{dashboard?.total_questionnaires || 0}</div>
                      <div className="text-[10px] text-purple-400 mt-0.5">{dashboard?.total_questions || 0} Questions</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400">LIBRARY MATERIALS</div>
                      <div className="text-2xl font-black font-mono text-white mt-1">{dashboard?.total_library_resources || 0}</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">Verified SHA-256</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400">ENROLLED TRAINEES</div>
                      <div className="text-2xl font-black font-mono text-white mt-1">{dashboard?.total_enrolled_trainees || 0}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Phase 5 LMS link</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400">EXAM ATTEMPTS</div>
                      <div className="text-2xl font-black font-mono text-white mt-1">{dashboard?.total_assessments_attempted || 0}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Phase 6 Quizzes</div>
                    </div>
                  </div>

                  {/* Operational Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>MoES / IMD Central Training Directorate &bull; Trainer Studio Active</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Authorship credentials validated for {profile?.division || 'Meteorological Training Division'}.
                        All course materials and questionnaires generate cryptographic digests for offline station delivery.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('courses');
                        setIsCreatingCourse(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow whitespace-nowrap"
                    >
                      + Author New Course
                    </button>
                  </div>

                  {/* Recent Authored Courses */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-amber-400" />
                      <span>Recently Authored Courses ({courses.length})</span>
                    </h3>
                    {courses.length === 0 ? (
                      <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                        No courses authored yet. Click "+ Author New Course" above or go to the Course Studio tab.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.slice(0, 6).map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setActiveTab('courses');
                              handleSelectCourse(c.id);
                            }}
                            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-amber-400">{c.code}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${c.is_published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                {c.is_published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white line-clamp-1">{c.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-900">
                              <span>{c.category}</span>
                              <span>{c.modules_count || 0} modules &bull; {c.estimated_hours}h</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: COURSE STUDIO */}
              {activeTab === 'courses' && (
                <div className="space-y-6">
                  {/* Top action bar */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">Course Studio & Curriculum Manager</h3>
                      <p className="text-xs text-slate-400">Build comprehensive syllabi, modules, and lessons for field personnel.</p>
                    </div>
                    {!isCreatingCourse && !selectedCourse && (
                      <button
                        onClick={() => setIsCreatingCourse(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Course</span>
                      </button>
                    )}
                    {selectedCourse && (
                      <button
                        onClick={() => setSelectedCourse(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                      >
                        &larr; Back to Courses List
                      </button>
                    )}
                  </div>

                  {/* Create Course Form */}
                  {isCreatingCourse && (
                    <form onSubmit={handleCreateCourse} className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <FolderPlus className="w-4 h-4 text-amber-400" />
                          <span>Author New Curriculum Course</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsCreatingCourse(false)}
                          className="text-slate-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Course Code * (e.g. MET-401)</label>
                          <input
                            type="text"
                            required
                            value={newCourse.code}
                            onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                            placeholder="RAD-201"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Subject Category *</label>
                          <select
                            value={newCourse.category}
                            onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          >
                            <option value="Radar Meteorology">Radar Meteorology</option>
                            <option value="NWP Modeling">NWP Modeling</option>
                            <option value="Satellite Remote Sensing">Satellite Remote Sensing</option>
                            <option value="Surface Instrumentation">Surface Instrumentation</option>
                            <option value="Disaster Warning">Disaster Warning</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Course Title *</label>
                        <input
                          type="text"
                          required
                          value={newCourse.title}
                          onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                          placeholder="Advanced Doppler Radar Signal Processing & Interpretation"
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Description *</label>
                        <textarea
                          required
                          rows={3}
                          value={newCourse.description}
                          onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                          placeholder="Comprehensive training on radar pulse compression, clutter filtering, and precipitation estimation..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Proficiency Level</label>
                          <select
                            value={newCourse.level}
                            onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          >
                            <option value="all_levels">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Hours</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={newCourse.estimated_hours}
                            onChange={(e) => setNewCourse({ ...newCourse, estimated_hours: parseFloat(e.target.value) || 1 })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            id="course_pub"
                            checked={newCourse.is_published}
                            onChange={(e) => setNewCourse({ ...newCourse, is_published: e.target.checked })}
                            className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                          />
                          <label htmlFor="course_pub" className="text-xs font-medium text-slate-300">Publish Immediately</label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingCourse(false)}
                          className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow flex items-center gap-2"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>Save Course</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Single Course Detail / Curriculum Editor */}
                  {selectedCourse ? (
                    <div className="space-y-6">
                      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400">{selectedCourse.code}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${selectedCourse.is_published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                              {selectedCourse.is_published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteCourse(selectedCourse.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <h2 className="text-lg font-bold text-white">{selectedCourse.title}</h2>
                        <p className="text-xs text-slate-300 leading-relaxed">{selectedCourse.description}</p>
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-900">
                          <span>Category: {selectedCourse.category}</span>
                          <span>Level: {selectedCourse.level}</span>
                          <span>Est: {selectedCourse.estimated_hours}h</span>
                        </div>
                      </div>

                      {/* Course Modules & Lessons */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-teal-400" />
                            <span>Curriculum Modules ({selectedCourse.modules?.length || 0})</span>
                          </h4>
                          {!isAddingModule && (
                            <button
                              onClick={() => setIsAddingModule(true)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Module</span>
                            </button>
                          )}
                        </div>

                        {/* Add Module Form */}
                        {isAddingModule && (
                          <form onSubmit={handleAddModule} className="p-4 rounded-xl bg-slate-950 border border-teal-500/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">New Curriculum Module</span>
                              <button type="button" onClick={() => setIsAddingModule(false)} className="text-slate-400 text-xs">Cancel</button>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Module Title (e.g. Module 1: Radar Signal Processing)"
                              value={newModule.title}
                              onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                            />
                            <textarea
                              rows={2}
                              placeholder="Module description..."
                              value={newModule.description}
                              onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setIsAddingModule(false)}
                                className="px-3 py-1.5 text-xs text-slate-400"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300"
                              >
                                {saving ? 'Adding...' : 'Save Module'}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Modules list */}
                        {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                            No modules yet. Add the first module to start assembling the course curriculum.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedCourse.modules.map((m) => (
                              <div key={m.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-[11px] font-mono text-teal-400">MODULE {m.order_index}</div>
                                    <h5 className="text-sm font-bold text-white">{m.title}</h5>
                                    {m.description && <p className="text-xs text-slate-400">{m.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setIsAddingLessonForModule(m.id)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Lesson</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteModule(m.id)}
                                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Add Lesson Form */}
                                {isAddingLessonForModule === m.id && (
                                  <form onSubmit={(e) => handleAddLesson(e, m.id)} className="p-3 rounded-lg bg-slate-900 border border-teal-500/20 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-white">
                                      <span>Add Lesson to {m.title}</span>
                                      <button type="button" onClick={() => setIsAddingLessonForModule(null)} className="text-slate-400">Cancel</button>
                                    </div>
                                    <input
                                      type="text"
                                      required
                                      placeholder="Lesson Title (e.g. Pulse Compression & Nyquist Velocity)"
                                      value={newLesson.title}
                                      onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                                    />
                                    <textarea
                                      rows={2}
                                      placeholder="Lesson content text / summary..."
                                      value={newLesson.content_text}
                                      onChange={(e) => setNewLesson({ ...newLesson, content_text: e.target.value })}
                                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                                    />
                                    <div className="flex items-center gap-3">
                                      <div className="w-32">
                                        <input
                                          type="number"
                                          placeholder="Minutes"
                                          value={newLesson.duration_minutes}
                                          onChange={(e) => setNewLesson({ ...newLesson, duration_minutes: parseInt(e.target.value) || 0 })}
                                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                                        />
                                      </div>
                                      <div className="flex-1 flex justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setIsAddingLessonForModule(null)}
                                          className="px-3 py-1 text-xs text-slate-400"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          disabled={saving}
                                          className="px-3 py-1 rounded-lg text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300"
                                        >
                                          Save Lesson
                                        </button>
                                      </div>
                                    </div>
                                  </form>
                                )}

                                {/* Lessons in this module */}
                                {m.lessons.length > 0 && (
                                  <div className="space-y-1.5 pl-3 border-l-2 border-slate-800">
                                    {m.lessons.map((l) => (
                                      <div key={l.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-slate-200 font-medium">{l.title}</span>
                                          <span className="text-[10px] font-mono text-slate-500">({l.duration_minutes} mins)</span>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteLesson(l.id)}
                                          className="text-slate-500 hover:text-rose-400 p-1"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Courses List Grid */
                    <div className="space-y-4">
                      {courses.length === 0 ? (
                        <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                          No courses authored yet. Click "+ Create Course" to begin designing a syllabus.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {courses.map((c) => (
                            <div
                              key={c.id}
                              className="p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-amber-400">{c.code}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${c.is_published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                    {c.is_published ? 'Published' : 'Draft'}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteCourse(c.id)}
                                    className="text-slate-500 hover:text-rose-400 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <h4 className="text-sm font-bold text-white">{c.title}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                                <span className="text-slate-400 font-mono text-[11px]">{c.modules_count || 0} modules &bull; {c.estimated_hours}h</span>
                                <button
                                  onClick={() => handleSelectCourse(c.id)}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Manage Syllabus</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: QUESTIONNAIRE BUILDER */}
              {activeTab === 'questionnaires' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">Assessment & Questionnaire Builder</h3>
                      <p className="text-xs text-slate-400">Author subject evaluations and question banks for certified learning verification.</p>
                    </div>
                    {!isCreatingQuestionnaire && !selectedQuestionnaire && (
                      <button
                        onClick={() => setIsCreatingQuestionnaire(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Questionnaire</span>
                      </button>
                    )}
                    {selectedQuestionnaire && (
                      <button
                        onClick={() => setSelectedQuestionnaire(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                      >
                        &larr; Back to Questionnaires
                      </button>
                    )}
                  </div>

                  {/* Create Questionnaire Form */}
                  {isCreatingQuestionnaire && (
                    <form onSubmit={handleCreateQuestionnaire} className="p-5 rounded-xl bg-slate-950 border border-purple-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-purple-400" />
                          <span>Author New Questionnaire</span>
                        </h4>
                        <button type="button" onClick={() => setIsCreatingQuestionnaire(false)} className="text-slate-400 text-xs">Cancel</button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="Doppler Radar Calibration Diagnostic Quiz"
                            value={newQuestionnaire.title}
                            onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Subject *</label>
                          <input
                            type="text"
                            required
                            placeholder="Radar Meteorology"
                            value={newQuestionnaire.subject}
                            onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, subject: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                          rows={2}
                          placeholder="Timed multiple choice evaluation on pulse repetition frequency and velocity folding..."
                          value={newQuestionnaire.description}
                          onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Minutes)</label>
                          <input
                            type="number"
                            min="5"
                            max="360"
                            value={newQuestionnaire.duration_minutes}
                            onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, duration_minutes: parseInt(e.target.value) || 20 })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Passing Score (%)</label>
                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={newQuestionnaire.passing_score}
                            onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, passing_score: parseFloat(e.target.value) || 60 })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            id="q_pub"
                            checked={newQuestionnaire.is_published}
                            onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, is_published: e.target.checked })}
                            className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-0"
                          />
                          <label htmlFor="q_pub" className="text-xs font-medium text-slate-300">Publish to Trainees</label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsCreatingQuestionnaire(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                        <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-purple-400 hover:bg-purple-300">
                          Save Questionnaire
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Selected Questionnaire View & Question Builder */}
                  {selectedQuestionnaire ? (
                    <div className="space-y-6">
                      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-purple-400">{selectedQuestionnaire.subject}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${selectedQuestionnaire.is_published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                            {selectedQuestionnaire.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-white">{selectedQuestionnaire.title}</h2>
                        {selectedQuestionnaire.description && <p className="text-xs text-slate-300">{selectedQuestionnaire.description}</p>}
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-900">
                          <span>Duration: {selectedQuestionnaire.duration_minutes} mins</span>
                          <span>Passing: {selectedQuestionnaire.passing_score}%</span>
                          <span>Total Marks: {selectedQuestionnaire.total_marks}</span>
                        </div>
                      </div>

                      {/* Question Bank */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-purple-400" />
                            <span>Questions ({selectedQuestionnaire.questions?.length || 0})</span>
                          </h4>
                          {!isAddingQuestion && (
                            <button
                              onClick={() => setIsAddingQuestion(true)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-purple-400 hover:bg-purple-300 shadow flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Question</span>
                            </button>
                          )}
                        </div>

                        {/* Add Question Form */}
                        {isAddingQuestion && (
                          <form onSubmit={handleAddQuestion} className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-white">
                              <span>Add Multiple Choice Question</span>
                              <button type="button" onClick={() => setIsAddingQuestion(false)} className="text-slate-400">Cancel</button>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-300 mb-1">Question Prompt *</label>
                              <textarea
                                required
                                rows={2}
                                placeholder="What is the effect of pulse repetition frequency on radar max unambiguous range?"
                                value={newQuestion.question_text}
                                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-mono text-slate-400 mb-1">Option A</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Option A description"
                                  value={newQuestion.optionA}
                                  onChange={(e) => setNewQuestion({ ...newQuestion, optionA: e.target.value })}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-mono text-slate-400 mb-1">Option B</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Option B description"
                                  value={newQuestion.optionB}
                                  onChange={(e) => setNewQuestion({ ...newQuestion, optionB: e.target.value })}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-mono text-slate-400 mb-1">Option C</label>
                                <input
                                  type="text"
                                  placeholder="Option C description"
                                  value={newQuestion.optionC}
                                  onChange={(e) => setNewQuestion({ ...newQuestion, optionC: e.target.value })}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-mono text-slate-400 mb-1">Option D</label>
                                <input
                                  type="text"
                                  placeholder="Option D description"
                                  value={newQuestion.optionD}
                                  onChange={(e) => setNewQuestion({ ...newQuestion, optionD: e.target.value })}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Correct Option</label>
                                <select
                                  value={newQuestion.correct_option}
                                  onChange={(e) => setNewQuestion({ ...newQuestion, correct_option: e.target.value })}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                                >
                                  <option value="A">Option A</option>
                                  <option value="B">Option B</option>
                                  <option value="C">Option C</option>
                                  <option value="D">Option D</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Marks</label>
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={newQuestion.marks}
                                  onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseFloat(e.target.value) || 1 })}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-300 mb-1">Explanation / Hint</label>
                              <input
                                type="text"
                                placeholder="Radar equation dictates unambiguous range = c / (2 * PRF)"
                                value={newQuestion.explanation}
                                onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button type="button" onClick={() => setIsAddingQuestion(false)} className="px-3 py-1 text-xs text-slate-400">Cancel</button>
                              <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-purple-400 hover:bg-purple-300">
                                Save Question
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Questions list */}
                        {(!selectedQuestionnaire.questions || selectedQuestionnaire.questions.length === 0) ? (
                          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                            No questions added yet. Click "+ Add Question" to assemble the quiz items.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedQuestionnaire.questions.map((q, idx) => (
                              <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-xs font-mono font-bold text-purple-400 mt-0.5">Q{idx + 1}.</span>
                                    <span className="text-xs font-medium text-white">{q.question_text}</span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="text-slate-500 hover:text-rose-400 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pl-6 pt-1 text-[11px]">
                                  {q.options.map((opt) => (
                                    <div
                                      key={opt.id}
                                      className={`p-1.5 rounded border ${
                                        opt.id === q.correct_option
                                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold'
                                          : 'bg-slate-900 border-slate-800 text-slate-400'
                                      }`}
                                    >
                                      <span className="font-mono mr-1.5 font-bold">{opt.id}:</span>
                                      {opt.text}
                                    </div>
                                  ))}
                                </div>
                                {q.explanation && (
                                  <div className="pl-6 text-[10px] text-slate-400 italic">
                                    Explanation: {q.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Questionnaires List */
                    <div className="space-y-4">
                      {questionnaires.length === 0 ? (
                        <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                          No questionnaires created yet. Click "+ Create Questionnaire" to author diagnostic evaluations.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {questionnaires.map((q) => (
                            <div
                              key={q.id}
                              className="p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 transition space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-purple-400">{q.subject}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${q.is_published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                    {q.is_published ? 'Published' : 'Draft'}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteQuestionnaire(q.id)}
                                    className="text-slate-500 hover:text-rose-400 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <h4 className="text-sm font-bold text-white">{q.title}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2">{q.description || 'No description provided.'}</p>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                                <span className="text-slate-400 font-mono text-[11px]">{q.duration_minutes}m &bull; {q.passing_score}% pass</span>
                                <button
                                  onClick={() => handleSelectQuestionnaire(q.id)}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Manage Questions</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TRAINER LIBRARY */}
              {activeTab === 'library' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">Trainer Media & Study Material Library</h3>
                      <p className="text-xs text-slate-400">Lectures, presentations, datasets, and guides with automatic SHA-256 cryptographic verification.</p>
                    </div>
                    {!isAddingLibrary && (
                      <button
                        onClick={() => setIsAddingLibrary(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Material</span>
                      </button>
                    )}
                  </div>

                  {/* Add Library Item Form */}
                  {isAddingLibrary && (
                    <form onSubmit={handleAddLibraryItem} className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <UploadCloud className="w-4 h-4 text-amber-400" />
                          <span>Register Library Resource</span>
                        </h4>
                        <button type="button" onClick={() => setIsAddingLibrary(false)} className="text-slate-400 text-xs">Cancel</button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Resource Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="Doppler Velocity De-aliasing Technical Notes"
                            value={newLibraryItem.title}
                            onChange={(e) => setNewLibraryItem({ ...newLibraryItem, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Resource Type</label>
                          <select
                            value={newLibraryItem.resource_type}
                            onChange={(e) => setNewLibraryItem({ ...newLibraryItem, resource_type: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          >
                            <option value="study_material">Study Material (PDF/Doc)</option>
                            <option value="presentation">Presentation (PPTX/Slides)</option>
                            <option value="video">Lecture Video (MP4)</option>
                            <option value="dataset">Meteorological Dataset</option>
                            <option value="code">Algorithm / Code Sample</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">File Path or Media URL *</label>
                        <input
                          type="text"
                          required
                          placeholder="/storage/trainer_library/dwr/de-aliasing.pdf"
                          value={newLibraryItem.file_path}
                          onChange={(e) => setNewLibraryItem({ ...newLibraryItem, file_path: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                          rows={2}
                          placeholder="Comprehensive reference guide on four-dimensional de-aliasing algorithms..."
                          value={newLibraryItem.description}
                          onChange={(e) => setNewLibraryItem({ ...newLibraryItem, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="lib_pub"
                            checked={newLibraryItem.is_public_to_trainees}
                            onChange={(e) => setNewLibraryItem({ ...newLibraryItem, is_public_to_trainees: e.target.checked })}
                            className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                          />
                          <label htmlFor="lib_pub" className="text-xs font-medium text-slate-300">Publicly available to enrolled trainees</label>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setIsAddingLibrary(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                          <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300">
                            Save Material
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Library Items Table / Grid */}
                  <div className="space-y-3">
                    {libraryItems.length === 0 ? (
                      <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                        Trainer Library is currently empty. Click "+ Add Material" to upload or register study materials.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {libraryItems.map((item) => {
                          const iconMap = {
                            video: Video,
                            presentation: FileSpreadsheet,
                            study_material: FileText,
                            dataset: Layers,
                            code: Code,
                          };
                          const ItemIcon = iconMap[item.resource_type] || FileText;
                          return (
                            <div
                              key={item.id}
                              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                                  <ItemIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-white line-clamp-1">{item.title}</h5>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                                    <span className="uppercase text-amber-400">{item.resource_type}</span>
                                    <span>&bull;</span>
                                    <span>{(item.file_size_bytes / 1024).toFixed(0)} KB</span>
                                    <span>&bull;</span>
                                    <span className="text-slate-500 truncate max-w-[200px]">SHA: {item.sha256_checksum.substring(0, 16)}...</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${item.is_public_to_trainees ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                  {item.is_public_to_trainees ? 'Trainee Visible' : 'Restricted'}
                                </span>
                                <button
                                  onClick={() => handleDeleteLibraryItem(item.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: PROFILE & EXPERTISE */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Edit Profile Form */}
                  <form onSubmit={handleSaveProfile} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-400" />
                      <span>Trainer Professional Identity</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Official Designation</label>
                        <input
                          type="text"
                          value={profileForm.designation}
                          onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                          placeholder="Scientist-F / Senior Director"
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Division / Unit</label>
                        <input
                          type="text"
                          value={profileForm.division}
                          onChange={(e) => setProfileForm({ ...profileForm, division: e.target.value })}
                          placeholder="Numerical Weather Prediction Division"
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Years of Domain Experience</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="70"
                          value={profileForm.years_of_experience}
                          onChange={(e) => setProfileForm({ ...profileForm, years_of_experience: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Avatar Image URL</label>
                        <input
                          type="text"
                          value={profileForm.avatar_url}
                          onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Professional Biography</label>
                      <textarea
                        rows={3}
                        value={profileForm.biography}
                        onChange={(e) => setProfileForm({ ...profileForm, biography: e.target.value })}
                        placeholder="Expert in high-resolution numerical weather prediction, convective storm diagnostics, and radar remote sensing..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Save Profile</span>
                      </button>
                    </div>
                  </form>

                  {/* Expertise Management */}
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Domain Expertise & Specializations</span>
                    </h3>

                    {/* Add Expertise Form */}
                    <form onSubmit={handleAddExpertise} className="p-3 rounded-lg bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="Subject Area (e.g. Doppler Radar Calibration)"
                          value={newExpertise.subject}
                          onChange={(e) => setNewExpertise({ ...newExpertise, subject: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <select
                          value={newExpertise.proficiency_level}
                          onChange={(e) => setNewExpertise({ ...newExpertise, proficiency_level: e.target.value as any })}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                        >
                          <option value="expert">Expert</option>
                          <option value="advanced">Advanced</option>
                          <option value="intermediate">Intermediate</option>
                        </select>
                      </div>
                      <div>
                        <button
                          type="submit"
                          disabled={saving}
                          className="w-full py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300"
                        >
                          + Add
                        </button>
                      </div>
                    </form>

                    {/* Expertise Badges */}
                    {(!profile?.expertise || profile.expertise.length === 0) ? (
                      <p className="text-xs text-slate-500 italic">No expertise tags added yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {profile.expertise.map((exp) => (
                          <div
                            key={exp.id}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/20 text-xs text-slate-200 flex items-center gap-2"
                          >
                            <span className="font-semibold text-white">{exp.subject}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {exp.proficiency_level}
                            </span>
                            <button
                              onClick={() => handleDeleteExpertise(exp.id)}
                              className="text-slate-500 hover:text-rose-400 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
