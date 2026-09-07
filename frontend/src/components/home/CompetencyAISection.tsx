import React, { useState } from 'react';
import { BrainCircuit, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

export const CompetencyAISection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'radar' | 'nwp' | 'cyclone'>('radar');

  const roleProfiles = {
    radar: {
      roleTitle: 'Senior Doppler Weather Radar Specialist',
      readinessScore: 71,
      competencies: [
        { name: 'Doppler Radar Operation (DWR)', current: 55, required: 85, gap: 30, recommended: 'MET-401: Advanced DWR & QPE' },
        { name: 'Numerical Weather Prediction (WRF)', current: 40, required: 75, gap: 35, recommended: 'NWP-502: Operational WRF Modeling' },
        { name: 'Satellite Multispectral Imagery', current: 70, required: 75, gap: 5, recommended: 'SAT-301: INSAT Imagery Analysis' },
        { name: 'AWS Surface Maintenance', current: 85, required: 65, gap: 0, recommended: 'Proficiency Exceeded' },
      ],
      topRecommendation: 'MET-401: Advanced Doppler Weather Radar & QPE',
      rationale: 'Addresses primary 30% deficit in Doppler pulse compression and velocity dealiasing algorithms.',
    },
    nwp: {
      roleTitle: 'Regional High-Resolution Forecaster',
      readinessScore: 64,
      competencies: [
        { name: 'Numerical Weather Prediction (WRF)', current: 45, required: 90, gap: 45, recommended: 'NWP-502: Operational WRF Modeling' },
        { name: 'Doppler Radar Operation (DWR)', current: 60, required: 70, gap: 10, recommended: 'MET-401: Advanced DWR & QPE' },
        { name: 'Satellite Multispectral Imagery', current: 65, required: 80, gap: 15, recommended: 'SAT-301: INSAT Imagery Analysis' },
        { name: 'Atmospheric Physics & Soundings', current: 75, required: 85, gap: 10, recommended: 'MET-302: Upper-Air Soundings' },
      ],
      topRecommendation: 'NWP-502: Operational WRF Modeling & Data Assimilation',
      rationale: 'Directly resolves 45% gap in grid nesting, convective parameterization, and boundary condition tuning.',
    },
    cyclone: {
      roleTitle: 'Tropical Cyclone Early Warning Officer',
      readinessScore: 82,
      competencies: [
        { name: 'Tropical Cyclone Tracking (Dvorak)', current: 65, required: 90, gap: 25, recommended: 'CYC-601: Cyclone Tracking & Warnings' },
        { name: 'Satellite Multispectral Imagery', current: 85, required: 85, gap: 0, recommended: 'Proficiency Met' },
        { name: 'Doppler Radar Operation (DWR)', current: 80, required: 75, gap: 0, recommended: 'Proficiency Met' },
        { name: 'Hydrodynamic Storm Surge Modeling', current: 50, required: 80, gap: 30, recommended: 'CYC-601: Storm Surge Calculations' },
      ],
      topRecommendation: 'CYC-601: Tropical Cyclone Tracking, Dvorak & Storm Surge',
      rationale: 'Targets the critical 30% gap in storm surge surge-height prediction and evacuation contour calculation.',
    },
  };

  const active = roleProfiles[selectedRole];

  return (
    <section id="competency-ai" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Graphic Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(13,148,136,0.18)_0,transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Explainable Competency Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Automated Skill-Gap Mapping &amp; Training Matching
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Capacity Connect maps verified trainee skills against official MoES job-role benchmarks, calculating deterministic gaps to recommend optimal learning pathways.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setSelectedRole('radar')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedRole === 'radar' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Radar Meteorologist Track
            </button>
            <button
              onClick={() => setSelectedRole('nwp')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedRole === 'nwp' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              NWP Forecaster Track
            </button>
            <button
              onClick={() => setSelectedRole('cyclone')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedRole === 'cyclone' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Cyclone Warning Track
            </button>
          </div>
        </div>

        {/* Interactive Competency Matrix Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950/80 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl backdrop-blur-md">
          {/* Left Column: Skill Bars & Gaps */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-mono">TARGET BENCHMARK ROLE:</span>
                <h3 className="text-xl font-bold text-white mt-0.5">{active.roleTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Readiness:</span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {active.readinessScore}% Match
                </span>
              </div>
            </div>

            {/* Competency Gap Sliders */}
            <div className="space-y-4">
              {active.competencies.map((comp, idx) => (
                <div key={idx} className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{comp.name}</span>
                    <span className="font-mono text-slate-400">
                      Current: <strong className="text-teal-400">{comp.current}%</strong> &bull; Target: <strong className="text-white">{comp.required}%</strong>
                    </span>
                  </div>

                  {/* Dual Progress Bar */}
                  <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    {/* Target marker */}
                    <div
                      className="absolute top-0 bottom-0 bg-slate-700/80 border-r-2 border-amber-400"
                      style={{ width: `${comp.required}%` }}
                    />
                    {/* Current level fill */}
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                      style={{ width: `${comp.current}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-400">
                      Recommended Course: <span className="text-amber-300">{comp.recommended}</span>
                    </span>
                    {comp.gap > 0 ? (
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800">
                        -{comp.gap}% Gap
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        Target Met
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: AI Engine Rationale Card */}
          <div className="lg:col-span-5 space-y-5 p-6 rounded-2xl bg-slate-900 border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-400 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">AI Recommendation Engine</h4>
                <p className="text-[11px] text-slate-400">Vector Cosine Similarity &bull; Scikit-Learn</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">Top Priority Match:</div>
              <div className="text-sm font-bold text-white">{active.topRecommendation}</div>
              <p className="text-slate-300 leading-relaxed text-[11px]">{active.rationale}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Deterministic vector math: Zero generative hallucination or opaque scoring.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Automatic trainer-to-subject matching based on verified domain experience.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Runs 100% locally on Capacity Connect OS without cloud connectivity.</span>
              </div>
            </div>

            <a
              href="#courses"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-2"
            >
              <span>View Recommended Course Syllabi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
