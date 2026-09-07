import React from 'react';
import { Search, Video, Laptop, CheckSquare, TrendingUp, ArrowRight } from 'lucide-react';

export const LearningJourneySection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Discover',
      subtitle: 'Identify Role Competency',
      description: 'Review your personal competency matrix against target IMD operational benchmarks to identify skill gaps.',
      icon: Search,
      color: 'from-blue-600 to-blue-700',
    },
    {
      step: '02',
      title: 'Learn',
      subtitle: 'Stream or Study Offline',
      description: 'Watch 1080p lectures and study presentation decks locally via Capacity Connect OS without internet buffering.',
      icon: Video,
      color: 'from-teal-600 to-teal-700',
    },
    {
      step: '03',
      title: 'Practice',
      subtitle: 'Field Observation & Labs',
      description: 'Conduct radar calibration, AWS sensor checks, or satellite imagery interpretation exercises.',
      icon: Laptop,
      color: 'from-amber-500 to-amber-600',
    },
    {
      step: '04',
      title: 'Assess',
      subtitle: 'Timed MCQ Evaluations',
      description: 'Take subject-wise assessments locally. The offline grader scores attempts instantly and records tamper-proof cryptographic signatures.',
      icon: CheckSquare,
      color: 'from-indigo-600 to-indigo-700',
    },
    {
      step: '05',
      title: 'Certify & Grow',
      subtitle: 'Bi-Directional Sync',
      description: 'When connectivity returns, results synchronize to the central cloud, updating your official MoES competency record.',
      icon: TrendingUp,
      color: 'from-emerald-600 to-emerald-700',
    },
  ];

  return (
    <section id="learning-journey" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-bold uppercase tracking-wider">
            Operational Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            The 5-Stage Capacity Building Journey
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            From initial competency benchmarking to offline mastery and verified certification across remote meteorological stations.
          </p>
        </div>

        {/* Steps Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black font-mono text-slate-300 group-hover:text-amber-500 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {item.title}
                  </h3>
                  <div className="text-xs font-semibold text-teal-700 mb-2">
                    {item.subtitle}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Stage {idx + 1} of 5</span>
                  {idx < 4 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden lg:inline" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
