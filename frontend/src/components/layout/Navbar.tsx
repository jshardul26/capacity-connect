import React, { useState } from 'react';
import { CloudRain, Menu, X, LogOut, ShieldCheck, User as UserIcon, GraduationCap, BookOpen, Award, BrainCircuit } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    isAuthenticated,
    user,
    logout,
    openAuthModal,
    openAdminModal,
    openTraineeModal,
    openTrainerModal,
    openAssessmentModal,
    openCompetencyModal,
  } = useAuthStore();

  const navLinks = [
    { name: 'Curriculum', href: '#courses' },
    { name: 'How It Works', href: '#learning-journey' },
    { name: 'Competency AI', href: '#competency-ai' },
    { name: 'Offline Hub', href: '#offline-ecosystem' },
    { name: 'Role Previews', href: '#role-previews' },
    { name: 'System Health', href: '#system-health' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand Identity */}
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-900 via-teal-700 to-amber-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <CloudRain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                  CAPACITY CONNECT
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
                  SIH 26075
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                MoES &bull; India Meteorological Department
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-blue-800 transition-colors relative py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-500 hover:after:w-full after:transition-all"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Action CTA & Auth Status */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* Admin Clearance Button */}
                {user.role === 'admin' && (
                  <button
                    onClick={openAdminModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 shadow-sm transition"
                    title="Open User Approval Queue"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Admin Clearance</span>
                  </button>
                )}

                {/* Trainee Profile Button */}
                {user.role === 'trainee' && (
                  <button
                    onClick={openTraineeModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-950 bg-teal-100 hover:bg-teal-200 border border-teal-300 shadow-sm transition"
                    title="Open Trainee Workspace & Profile"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
                    <span>My Profile</span>
                  </button>
                )}

                {user.role === 'trainer' && (
                  <button
                    onClick={openTrainerModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 shadow-sm transition"
                    title="Open Trainer Studio & Course Creator"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Trainer Studio</span>
                  </button>
                )}

                {/* Assessments Desk Button */}
                <button
                  onClick={() => openAssessmentModal()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-950 bg-blue-100 hover:bg-blue-200 border border-blue-300 shadow-sm transition"
                  title="Open Examination & Assessment Desk"
                >
                  <Award className="w-3.5 h-3.5 text-blue-700" />
                  <span>Assessments</span>
                </button>

                {/* Competency & Skill Gap Command Center Button */}
                <button
                  onClick={openCompetencyModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-950 bg-purple-100 hover:bg-purple-200 border border-purple-300 shadow-sm transition"
                  title="Open Competency & Skill-Gap Command Center"
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-700" />
                  <span>Skill Gaps</span>
                </button>

                {/* User Session Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-[11px]">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left pr-1">
                    <span className="font-bold text-slate-900 leading-tight max-w-[120px] truncate">
                      {user.full_name}
                    </span>
                    <span className="text-[10px] font-mono capitalize text-slate-500">
                      [{user.role}]
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-900 to-teal-700 hover:from-blue-950 hover:to-teal-800 shadow-sm transition group"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-50 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Mobile Auth Actions */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{user.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono capitalize">Role: {user.role} ({user.station_code})</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      openAdminModal();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Clearance Panel</span>
                  </button>
                )}
                {user.role === 'trainee' && (
                  <button
                    onClick={() => {
                      openTraineeModal();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-teal-950 bg-teal-100 border border-teal-300"
                  >
                    <GraduationCap className="w-4 h-4 text-teal-700" />
                    <span>My Trainee Profile &amp; Qualifications</span>
                  </button>
                )}
                {user.role === 'trainer' && (
                  <button
                    onClick={() => {
                      openTrainerModal();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300"
                  >
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span>Trainer Studio &amp; Courses</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    openAssessmentModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-950 bg-blue-100 border border-blue-300"
                >
                  <Award className="w-4 h-4 text-blue-700" />
                  <span>Assessment &amp; Examination Desk</span>
                </button>
                <button
                  onClick={() => {
                    openCompetencyModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-purple-950 bg-purple-100 border border-purple-300"
                >
                  <BrainCircuit className="w-4 h-4 text-purple-700" />
                  <span>Competency &amp; Skill Gaps</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    openAuthModal('register');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 transition text-center"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

