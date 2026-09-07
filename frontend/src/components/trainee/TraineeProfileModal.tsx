import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  Save,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { traineeService } from '../../services/traineeService';
import {
  TraineeDashboardResponse,
  Qualification,
  WorkExperience,
  Skill,
  Interest,
  Certificate,
} from '../../types';

interface TraineeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'qualifications' | 'experience' | 'skills' | 'certificates';

export const TraineeProfileModal: React.FC<TraineeProfileModalProps> = ({ isOpen, onClose }) => {
  const { accessToken, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<TraineeDashboardResponse | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  // 1. Profile
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [postingLocation, setPostingLocation] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // 2. Qualification form
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [passingYear, setPassingYear] = useState<number>(new Date().getFullYear());
  const [grade, setGrade] = useState('');
  const [addingQual, setAddingQual] = useState(false);

  // 3. Experience form
  const [org, setOrg] = useState('');
  const [expDesignation, setExpDesignation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [responsibilities, setResponsibilities] = useState('');
  const [addingExp, setAddingExp] = useState(false);

  // 4. Skills & Interests form
  const [skillName, setSkillName] = useState('');
  const [skillProficiency, setSkillProficiency] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [addingSkill, setAddingSkill] = useState(false);

  const [interestName, setInterestName] = useState('');
  const [addingInterest, setAddingInterest] = useState(false);

  // 5. Certificate form
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certCredentialId, setCertCredentialId] = useState('');
  const [addingCert, setAddingCert] = useState(false);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await traineeService.getDashboard(accessToken);
      setDashboard(data);
      setDesignation(data.designation || '');
      setDepartment(data.department || '');
      setPostingLocation(data.station_code || '');
      // If profile bio exists
      const prof = await traineeService.getProfile(accessToken);
      setBio(prof.bio || '');
      setPostingLocation(prof.posting_location || data.station_code || '');
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load trainee profile.',
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen && accessToken && user?.role === 'trainee') {
      loadData();
    }
  }, [isOpen, accessToken, user, loadData]);

  if (!isOpen) return null;

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSavingProfile(true);
    setNotification(null);
    try {
      await traineeService.updateProfile(accessToken, {
        designation: designation.trim() || undefined,
        department: department.trim() || undefined,
        posting_location: postingLocation.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      setNotification({ type: 'success', text: 'Professional profile updated successfully.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setAddingQual(true);
    setNotification(null);
    try {
      await traineeService.addQualification(accessToken, {
        degree: degree.trim(),
        field_of_study: fieldOfStudy.trim(),
        institution: institution.trim(),
        passing_year: Number(passingYear),
        grade_or_percentage: grade.trim() || null,
      });
      setDegree('');
      setFieldOfStudy('');
      setInstitution('');
      setGrade('');
      setNotification({ type: 'success', text: 'Qualification added successfully.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to add qualification.',
      });
    } finally {
      setAddingQual(false);
    }
  };

  const handleDeleteQualification = async (id: string) => {
    if (!accessToken) return;
    try {
      await traineeService.deleteQualification(accessToken, id);
      setNotification({ type: 'success', text: 'Qualification removed.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete qualification.',
      });
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setAddingExp(true);
    setNotification(null);
    try {
      await traineeService.addWorkExperience(accessToken, {
        organization: org.trim(),
        designation: expDesignation.trim(),
        start_date: startDate,
        end_date: isCurrent ? null : endDate || null,
        is_current: isCurrent,
        responsibilities: responsibilities.trim() || null,
      });
      setOrg('');
      setExpDesignation('');
      setStartDate('');
      setEndDate('');
      setIsCurrent(false);
      setResponsibilities('');
      setNotification({ type: 'success', text: 'Work experience added successfully.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to add work experience.',
      });
    } finally {
      setAddingExp(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!accessToken) return;
    try {
      await traineeService.deleteWorkExperience(accessToken, id);
      setNotification({ type: 'success', text: 'Work experience removed.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete work experience.',
      });
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !skillName.trim()) return;
    setAddingSkill(true);
    setNotification(null);
    try {
      await traineeService.addSkill(accessToken, {
        name: skillName.trim(),
        proficiency_level: skillProficiency,
      });
      setSkillName('');
      setNotification({ type: 'success', text: 'Skill added successfully.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to add skill.',
      });
    } finally {
      setAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!accessToken) return;
    try {
      await traineeService.deleteSkill(accessToken, id);
      setNotification({ type: 'success', text: 'Skill removed.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete skill.',
      });
    }
  };

  const handleAddInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !interestName.trim()) return;
    setAddingInterest(true);
    setNotification(null);
    try {
      await traineeService.addInterest(accessToken, interestName.trim());
      setInterestName('');
      setNotification({ type: 'success', text: 'Interest added.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to add interest.',
      });
    } finally {
      setAddingInterest(false);
    }
  };

  const handleDeleteInterest = async (id: string) => {
    if (!accessToken) return;
    try {
      await traineeService.deleteInterest(accessToken, id);
      setNotification({ type: 'success', text: 'Interest removed.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete interest.',
      });
    }
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setAddingCert(true);
    setNotification(null);
    try {
      await traineeService.addCertificate(accessToken, {
        title: certTitle.trim(),
        issuing_organization: certIssuer.trim(),
        issue_date: certIssueDate,
        credential_id: certCredentialId.trim() || null,
      });
      setCertTitle('');
      setCertIssuer('');
      setCertIssueDate('');
      setCertCredentialId('');
      setNotification({ type: 'success', text: 'Certificate registered successfully.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to register certificate.',
      });
    } finally {
      setAddingCert(false);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!accessToken) return;
    try {
      await traineeService.deleteCertificate(accessToken, id);
      setNotification({ type: 'success', text: 'Certificate removed.' });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete certificate.',
      });
    }
  };

  const completionPct = dashboard?.metrics.profile_completion_percentage || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 text-white p-6 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-teal-400 text-slate-950">
                  TRAINEE CADRE PORTAL
                </span>
                <span className="text-[11px] font-mono text-slate-300">MoES &bull; IMD</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-400" />
                <span>{user?.full_name || 'Trainee Officer Profile'}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {user?.email} &bull; Node: <strong className="text-teal-300">{user?.station_code || 'IMD-HQ-DELHI'}</strong>
              </p>
            </div>

            {/* Profile Completion Bar */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 min-w-[200px]">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Profile Strength</span>
                <span className="text-amber-400 font-bold">{completionPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-amber-400 transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>{dashboard?.metrics.total_qualifications || 0} Quals</span>
                <span>{dashboard?.metrics.total_experiences || 0} Exp</span>
                <span>{dashboard?.metrics.total_skills || 0} Skills</span>
              </div>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex mt-6 bg-slate-900/70 p-1 rounded-xl border border-white/10 overflow-x-auto text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === 'overview' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Bio &amp; Postings</span>
            </button>
            <button
              onClick={() => setActiveTab('qualifications')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === 'qualifications' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Qualifications ({dashboard?.metrics.total_qualifications || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === 'experience' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work Experience ({dashboard?.metrics.total_experiences || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === 'skills' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skills &amp; Interests ({dashboard?.metrics.total_skills || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === 'certificates' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certificates ({dashboard?.metrics.total_certificates || 0})</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
                : 'bg-rose-50 text-rose-800 border-b border-rose-100'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
          {loading && !dashboard ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-500" />
              Loading trainee records...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & BIO */}
              {activeTab === 'overview' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Current Designation
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Meteorologist Gr-II"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Operational Department / Division
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Radar Meteorology Division"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Current Posting Location
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={postingLocation}
                        onChange={(e) => setPostingLocation(e.target.value)}
                        placeholder="e.g. DWR Station, Kochi / IMD New Delhi"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Professional Biography &amp; Meteorological Specialization
                    </label>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief summary of your meteorological background, field experience, and current research or monitoring duties..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 transition leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 transition shadow-sm disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile Details</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: QUALIFICATIONS */}
              {activeTab === 'qualifications' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Add Qualification Form */}
                  <form onSubmit={handleAddQualification} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Add Academic or Professional Qualification</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Degree / Diploma</label>
                        <input
                          type="text"
                          required
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          placeholder="e.g. M.Sc. / B.Tech"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Field of Study</label>
                        <input
                          type="text"
                          required
                          value={fieldOfStudy}
                          onChange={(e) => setFieldOfStudy(e.target.value)}
                          placeholder="e.g. Atmospheric Sciences"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Institution / University</label>
                        <input
                          type="text"
                          required
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="e.g. CUSAT / IIT Delhi"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Passing Year</label>
                        <input
                          type="number"
                          required
                          min={1950}
                          max={2050}
                          value={passingYear}
                          onChange={(e) => setPassingYear(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Grade / CGPA</label>
                        <input
                          type="text"
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          placeholder="e.g. 8.8 CGPA / 85%"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={addingQual}
                          className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition disabled:opacity-50"
                        >
                          {addingQual ? 'Adding...' : '+ Add Qualification'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* List */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Recorded Qualifications ({dashboard?.qualifications.length || 0})
                    </div>
                    {dashboard?.qualifications.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No qualifications added yet. Use the form above to record your degrees.
                      </div>
                    ) : (
                      dashboard?.qualifications.map((q: Qualification) => (
                        <div key={q.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              {q.degree} in {q.field_of_study}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {q.institution} &bull; Year: {q.passing_year} {q.grade_or_percentage && `(${q.grade_or_percentage})`}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteQualification(q.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete qualification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: WORK EXPERIENCE */}
              {activeTab === 'experience' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Add Experience Form */}
                  <form onSubmit={handleAddExperience} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Add Work Experience / Station Posting</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Organization / Center</label>
                        <input
                          type="text"
                          required
                          value={org}
                          onChange={(e) => setOrg(e.target.value)}
                          placeholder="e.g. IMD Pune / Regional Met Centre"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Designation</label>
                        <input
                          type="text"
                          required
                          value={expDesignation}
                          onChange={(e) => setExpDesignation(e.target.value)}
                          placeholder="e.g. Scientific Assistant"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Start Date</label>
                        <input
                          type="text"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          placeholder="YYYY-MM-DD or YYYY-MM"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">End Date</label>
                        <input
                          type="text"
                          disabled={isCurrent}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          placeholder={isCurrent ? 'Present' : 'YYYY-MM-DD'}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 disabled:bg-slate-100"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="isCurrentExp"
                        checked={isCurrent}
                        onChange={(e) => setIsCurrent(e.target.checked)}
                        className="rounded text-blue-900"
                      />
                      <label htmlFor="isCurrentExp" className="text-xs text-slate-700 cursor-pointer">
                        Currently working in this role
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Responsibilities &amp; Protocols</label>
                      <textarea
                        rows={2}
                        value={responsibilities}
                        onChange={(e) => setResponsibilities(e.target.value)}
                        placeholder="Brief summary of duties (e.g. upper-air radiosonde launches, radar telemetry, AWS monitoring)..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={addingExp}
                      className="py-2 px-4 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition disabled:opacity-50"
                    >
                      {addingExp ? 'Adding...' : '+ Add Experience Record'}
                    </button>
                  </form>

                  {/* List */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Work Experience History ({dashboard?.work_experiences.length || 0})
                    </div>
                    {dashboard?.work_experiences.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No previous experience added. Use the form above to record your postings.
                      </div>
                    ) : (
                      dashboard?.work_experiences.map((exp: WorkExperience) => (
                        <div key={exp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-bold text-xs text-slate-900">
                              {exp.designation} &bull; {exp.organization}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-teal-600" />
                              <span>{exp.start_date} to {exp.is_current ? 'Present' : exp.end_date || 'N/A'}</span>
                            </div>
                            {exp.responsibilities && (
                              <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                                {exp.responsibilities}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SKILLS & INTERESTS */}
              {activeTab === 'skills' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
                  {/* Skills Column */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Add Meteorological Skill</span>
                      </div>
                      <form onSubmit={handleAddSkill} className="space-y-2">
                        <input
                          type="text"
                          required
                          value={skillName}
                          onChange={(e) => setSkillName(e.target.value)}
                          placeholder="e.g. Doppler Radar Interpretation"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                        <div className="flex gap-2">
                          <select
                            value={skillProficiency}
                            onChange={(e) => setSkillProficiency(e.target.value as any)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                          </select>
                          <button
                            type="submit"
                            disabled={addingSkill}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shrink-0 transition"
                          >
                            + Add
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Skills Inventory ({dashboard?.skills.length || 0})
                      </div>
                      {dashboard?.skills.length === 0 ? (
                        <div className="text-xs text-slate-400 py-4 text-center">No skills logged yet.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {dashboard?.skills.map((s: Skill) => (
                            <div
                              key={s.id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 text-xs"
                            >
                              <span className="font-semibold">{s.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono capitalize bg-white text-blue-800 border border-blue-200">
                                {s.proficiency_level}
                              </span>
                              <button
                                onClick={() => handleDeleteSkill(s.id)}
                                className="text-slate-400 hover:text-rose-600 transition"
                                title="Remove skill"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interests Column */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Add Learning Interest</span>
                      </div>
                      <form onSubmit={handleAddInterest} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={interestName}
                          onChange={(e) => setInterestName(e.target.value)}
                          placeholder="e.g. Cyclone Modeling"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                        <button
                          type="submit"
                          disabled={addingInterest}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shrink-0 transition"
                        >
                          + Add
                        </button>
                      </form>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Learning Interests ({dashboard?.interests.length || 0})
                      </div>
                      {dashboard?.interests.length === 0 ? (
                        <div className="text-xs text-slate-400 py-4 text-center">No learning interests recorded.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {dashboard?.interests.map((it: Interest) => (
                            <div
                              key={it.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs"
                            >
                              <span>{it.name}</span>
                              <button
                                onClick={() => handleDeleteInterest(it.id)}
                                className="text-slate-400 hover:text-rose-600 transition"
                                title="Remove interest"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CERTIFICATES */}
              {activeTab === 'certificates' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Add Certificate Form */}
                  <form onSubmit={handleAddCertificate} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Register Certificate Credential</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Certificate Title</label>
                        <input
                          type="text"
                          required
                          value={certTitle}
                          onChange={(e) => setCertTitle(e.target.value)}
                          placeholder="e.g. WMO Observation Standards"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Issuing Body</label>
                        <input
                          type="text"
                          required
                          value={certIssuer}
                          onChange={(e) => setCertIssuer(e.target.value)}
                          placeholder="e.g. WMO / MoES"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Issue Date</label>
                        <input
                          type="text"
                          required
                          value={certIssueDate}
                          onChange={(e) => setCertIssueDate(e.target.value)}
                          placeholder="YYYY-MM-DD"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Credential ID (Optional)</label>
                        <input
                          type="text"
                          value={certCredentialId}
                          onChange={(e) => setCertCredentialId(e.target.value)}
                          placeholder="e.g. WMO-998"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={addingCert}
                      className="py-2 px-4 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition disabled:opacity-50"
                    >
                      {addingCert ? 'Registering...' : '+ Register Certificate Record'}
                    </button>
                  </form>

                  {/* List */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Verified Credentials ({dashboard?.certificates.length || 0})
                    </div>
                    {dashboard?.certificates.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No certificates registered yet. Add credentials using the form above.
                      </div>
                    ) : (
                      dashboard?.certificates.map((c: Certificate) => (
                        <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                              <Award className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>{c.title}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {c.issuing_organization} &bull; Issued {c.issue_date} {c.credential_id && `(ID: ${c.credential_id})`}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCertificate(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete certificate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Data synced with local SQLite / PostgreSQL backend
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
