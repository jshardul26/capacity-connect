import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  UploadCloud, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const DashboardPreviewsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trainee' | 'trainer' | 'admin'>('trainee');
  const { user, openAuthModal, openAdminModal, openTraineeModal, openTrainerModal } = useAuthStore();

  return (
    <section id="role-previews" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-bold uppercase tracking-wider">
            Interactive Role Previews
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tailored Experiences for Every MoES Stakeholder
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Capacity Connect establishes dedicated workflows for Trainees, Trainers, and Administrators. Preview each persona below:
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Interactive Prototype Preview &bull; Phase 1 Visual Demonstration</span>
          </div>
        </div>

        {/* Role Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold shadow-inner">
            <button
              onClick={() => setActiveTab('trainee')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${
                activeTab === 'trainee'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Trainee Workspace</span>
            </button>
            <button
              onClick={() => setActiveTab('trainer')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${
                activeTab === 'trainer'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Trainer Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${
                activeTab === 'admin'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Command</span>
            </button>
          </div>
        </div>

        {/* Dynamic Role Mockup Card */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-white">
          {/* Tab 1: Trainee Experience */}
          {activeTab === 'trainee' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs text-teal-400 font-mono">TRAINEE WORKSPACE &bull; {user?.role === 'trainee' ? 'AUTHENTICATED OFFICER SESSION' : 'DEMO WORKSPACE PREVIEW'}</div>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {user?.role === 'trainee' ? user.full_name : '[Demo Workspace] Scientist S. Sharma'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Station: {user?.station_code || 'DWR Kochi Station (Sample Context)'} &bull; Org: {user?.organization || 'India Meteorological Department (IMD)'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {user?.role === 'trainee' ? (
                    <button
                      onClick={openTraineeModal}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow flex items-center gap-2 transition"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Manage My Profile &amp; Qualifications</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openAuthModal('login')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-800 hover:bg-blue-700 shadow flex items-center gap-2 transition"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Sign In as Trainee</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Course Card */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-slate-950">
                      CONTINUE LEARNING (SAMPLE)
                    </span>
                    <span className="text-xs text-teal-400 font-mono">68% Complete (Demo)</span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">MET-401: Advanced Doppler Weather Radar &amp; QPE</h4>
                    <p className="text-xs text-slate-400 mt-1">Current Module: Lesson 2.3 — Pulse Compression &amp; Nyquist Velocity Unfolding</p>
                  </div>

                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-400 to-blue-500 w-[68%]" />
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-slate-400">Offline cached: 18/18 lectures on local OS</span>
                    <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow">
                      Resume Offline Player
                    </button>
                  </div>
                </div>

                {/* Upcoming Assessment Card */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                    <Clock className="w-4 h-4" />
                    <span>TIMED ASSESSMENT (SAMPLE)</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">DWR Certification Quiz</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    10 Multiple Choice Questions &bull; 15 Minutes &bull; Instant Local Grading with HMAC signature.
                  </p>
                  <div className="pt-2">
                    <button className="w-full py-2 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 shadow">
                      Launch Offline Exam
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Trainer Studio */}
          {activeTab === 'trainer' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs text-amber-400 font-mono">
                    TRAINER STUDIO &bull; {user?.role === 'trainer' ? 'LIVE SESSION' : 'DEMO WORKSPACE PREVIEW'}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {user?.role === 'trainer' ? `Trainer Studio: ${user.full_name}` : '[Demo Workspace] Dr. Rajesh Singh • Lead Instructor'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {user?.role === 'trainer' ? 'Authorized IMD Trainer &bull; Curriculum & Library Studio' : 'Division: Radar Meteorology • 14.5 Years Domain Experience (Sample Profile)'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (user?.role === 'trainer') {
                      openTrainerModal();
                    } else {
                      openAuthModal('login');
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow flex items-center gap-1.5 transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{user?.role === 'trainer' ? 'Open Trainer Studio' : '+ Author Course (Sign In)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-xs font-mono">COURSES AUTHORED</div>
                  <div className="text-2xl font-black font-mono text-white">—</div>
                  <div className="text-[11px] text-teal-400">Populates in Phase 4 Studio</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-xs font-mono">ENROLLED TRAINEES</div>
                  <div className="text-2xl font-black font-mono text-white">—</div>
                  <div className="text-[11px] text-emerald-400">Live platform data pending</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-xs font-mono">TRAINER LIBRARY</div>
                  <div className="text-2xl font-black font-mono text-white">—</div>
                  <div className="text-[11px] text-purple-400">Populates in Phase 4 Library</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-teal-400" />
                  <span>Trainer Library Upload: Automatic SHA-256 verification and offline pack generator.</span>
                </div>
                <span className="font-mono text-teal-300">Phase 4 Specification</span>
              </div>
            </div>
          )}

          {/* Tab 3: Admin Command Center */}
          {activeTab === 'admin' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs text-purple-400 font-mono">ADMIN COMMAND &bull; {user?.role === 'admin' ? 'LIVE SESSION' : 'DEMO WORKSPACE PREVIEW'}</div>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {user?.role === 'admin' ? `Admin Console: ${user.full_name}` : 'Central Portal Administration Console'}
                  </h3>
                  <p className="text-xs text-slate-400">Ministry of Earth Sciences &bull; India Meteorological Department</p>
                </div>
                <div className="flex items-center gap-2">
                  {user?.role === 'admin' ? (
                    <button
                      onClick={openAdminModal}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow flex items-center gap-2 transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Review Pending Approvals</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openAuthModal('login')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-800 hover:bg-blue-700 shadow flex items-center gap-2 transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sign In as Admin</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-mono">AUTHENTICATION ENGINE</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">RBAC v1.0</div>
                  <div className="text-[10px] text-slate-400">JWT + Bcrypt (Active)</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-mono">STATION OS NODES</div>
                  <div className="text-2xl font-black font-mono text-teal-300 mt-1">—</div>
                  <div className="text-[10px] text-slate-400">Available after edge deployment</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-mono">COMPLETED ASSESSMENTS</div>
                  <div className="text-2xl font-black font-mono text-amber-300 mt-1">—</div>
                  <div className="text-[10px] text-slate-400">Populates on sync (Phase 6/10)</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-mono">PENDING CLEARANCE QUEUE</div>
                  <div className="text-xl font-black font-mono text-amber-400 mt-1">
                    {user?.role === 'admin' ? 'Live Queue Available' : 'Requires Admin Auth'}
                  </div>
                  <div className="text-[10px] text-slate-400">Click Review to inspect</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Governance Controls: User role elevation, identity clearance, and sync audit logging.</span>
                </div>
                <span className="font-mono text-amber-300">Phase 2 Implemented</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
