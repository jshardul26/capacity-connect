import React from 'react';
import { BookOpen, Award, CheckSquare, BrainCircuit } from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const features = [
    {
      number: '01',
      title: 'Structured Curriculum',
      subtitle: 'Atmospheric Sciences & NWP',
      description: 'Role-aligned syllabi covering Doppler Weather Radars, high-resolution WRF modeling, INSAT imagery, and automatic weather stations.',
      icon: BookOpen,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      number: '02',
      title: 'Verified Instructors',
      subtitle: 'Senior IMD Domain Experts',
      description: 'Courses authored and mentored by specialized meteorologists with proven observational and disaster-warning field expertise.',
      icon: Award,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      number: '03',
      title: 'Offline Assessments',
      subtitle: 'Tamper-Sealed Exam Engine',
      description: 'Timed subject-wise MCQ quizzes with local automated grading and HMAC-SHA256 attempt ledgers that sync once online.',
      icon: CheckSquare,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
    },
    {
      number: '04',
      title: 'Competency AI',
      subtitle: 'Explainable Gap Mapping',
      description: 'Deterministic vector cosine similarity analyzing individual proficiencies to recommend targeted courses and match trainers.',
      icon: BrainCircuit,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
  ];

  return (
    <div className="relative -mt-12 sm:-mt-16 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.number}
              className="bg-white rounded-2xl p-6 shadow-hero-card border border-slate-200/90 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header with Icon and Watermark Number */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${feat.iconBg} ${feat.iconColor} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black font-mono text-slate-200 group-hover:text-amber-400 transition-colors">
                    {feat.number}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs font-semibold text-teal-700 mt-0.5 mb-2">
                  {feat.subtitle}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-900">
                <span>Capacity Pillar</span>
                <span className="text-amber-500 font-bold">&bull;&bull;&bull;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
