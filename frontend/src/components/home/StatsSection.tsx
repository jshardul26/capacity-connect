import React from 'react';
import { BookOpen, Users, Award, WifiOff, Info } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const stats = [
    {
      value: '—',
      badge: 'Live platform data pending',
      label: 'Specialized Courses',
      sublabel: 'Populates from Course Catalog (Phase 5)',
      icon: BookOpen,
    },
    {
      value: '—',
      badge: 'Live platform data pending',
      label: 'Registered Trainees',
      sublabel: 'Populates on User Onboarding (Phase 2)',
      icon: Users,
    },
    {
      value: '—',
      badge: 'Live platform data pending',
      label: 'Domain Instructors',
      sublabel: 'Verified Trainer Profiles (Phase 4)',
      icon: Award,
    },
    {
      value: '100%',
      badge: 'Architectural Guarantee',
      label: 'Offline Resilience',
      sublabel: 'Zero-Internet Assessment Parity',
      icon: WifiOff,
    },
  ];

  return (
    <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white py-14 border-y border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sample Metrics Notice Header */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-mono">
            <Info className="w-4 h-4" />
            <span className="font-semibold uppercase tracking-wider">Platform Metrics Status (Live Data Pending Deployment)</span>
          </div>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            MoES / IMD Capacity Building Portal
          </span>
        </div>

        {/* 4 Large Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center sm:items-start p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {stat.sublabel}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/60 w-full text-[10px] font-mono text-teal-400">
                  {stat.badge}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
