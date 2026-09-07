import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, CheckCircle, ArrowRight, Loader2, Award } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { competencyService } from '../../services/competencyService';
import { SkillGapAnalysisResponse, CourseRecommendationItem } from '../../types';

export const CompetencyAISection: React.FC = () => {
  const { user, accessToken, openCompetencyModal, openCoursePlayer } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<
    'Senior_Radar_Meteorologist' | 'Regional_NWP_Forecaster' | 'Cyclone_Warning_Officer' | 'Agrometeorological_Specialist'
  >('Senior_Radar_Meteorologist');

  const [gapData, setGapData] = useState<SkillGapAnalysisResponse | null>(null);
  const [recommendations, setRecommendations] = useState<CourseRecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      competencyService.getSkillGaps(selectedRole, user?.id, accessToken),
      competencyService.getCourseRecommendations(selectedRole, user?.id, accessToken),
    ])
      .then(([gaps, recs]) => {
        if (!isMounted) return;
        setGapData(gaps);
        setRecommendations(recs);
      })
      .catch((err) => {
        console.error('Failed to load live competency data:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRole, user?.id, accessToken]);

  const topRec = recommendations.length > 0 ? recommendations[0] : null;

  return (
    <section id="competency-ai" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Graphic Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(13,148,136,0.18)_0,transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Explainable Competency Intelligence &bull; Live Scikit-Learn Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Automated Skill-Gap Mapping &amp; Training Matching
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Deterministic vector-matching architecture in compliance with MoES/IMD requirements. Evaluates trainee proficiencies against standardized operational benchmarks to compute non-negative deficiency vectors and prioritize optimal course syllabi without generative hallucination.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setSelectedRole('Senior_Radar_Meteorologist')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedRole === 'Senior_Radar_Meteorologist'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Radar Specialist
            </button>
            <button
              onClick={() => setSelectedRole('Regional_NWP_Forecaster')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedRole === 'Regional_NWP_Forecaster'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              NWP Forecaster
            </button>
            <button
              onClick={() => setSelectedRole('Cyclone_Warning_Officer')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedRole === 'Cyclone_Warning_Officer'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Cyclone Warning
            </button>
            <button
              onClick={() => setSelectedRole('Agrometeorological_Specialist')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedRole === 'Agrometeorological_Specialist'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Agromet Specialist
            </button>
          </div>
        </div>

        {/* Interactive Competency Matrix Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950/80 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl backdrop-blur-md">
          {/* Left Column: Skill Bars & Gaps */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-teal-400 font-mono">
                  {user ? `EVALUATED PROFILE: ${user.full_name}` : 'OPERATIONAL BENCHMARK TRACK:'}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {gapData?.target_role_title || 'Senior Doppler Weather Radar Specialist'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Readiness:</span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {gapData ? `${gapData.overall_readiness_percentage}% Fit` : 'Calculating...'}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center items-center space-x-2 text-xs text-slate-400 font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                <span>Querying live competency vector matrix...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {gapData?.gaps.map((comp, idx) => (
                  <div key={idx} className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{comp.competency}</span>
                      <span className="font-mono text-slate-400">
                        Verified: <strong className="text-teal-400">{(comp.current * 100).toFixed(0)}%</strong> &bull; Target: <strong className="text-white">{(comp.required * 100).toFixed(0)}%</strong>
                      </span>
                    </div>

                    {/* Dual Progress Bar */}
                    <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      {/* Target marker */}
                      <div
                        className="absolute top-0 bottom-0 bg-slate-700/80 border-r-2 border-amber-400"
                        style={{ width: `${comp.required * 100}%` }}
                      />
                      {/* Current level fill */}
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                        style={{ width: `${comp.current * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-slate-400 font-mono text-[10px]">
                        Target Requirement: {(comp.required * 100).toFixed(0)}%
                      </span>
                      {comp.gap > 0 ? (
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800">
                          -{(comp.gap * 100).toFixed(0)}% Deficit
                        </span>
                      ) : (
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          Target Satisfied
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: AI Engine Rationale Card */}
          <div className="lg:col-span-5 space-y-5 p-6 rounded-2xl bg-slate-900 border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-400 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">AI Recommendation Engine</h4>
                <p className="text-[11px] text-slate-400">Deterministic Vector Cosine Similarity &bull; Scikit-Learn</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="text-[10px] font-mono text-teal-400 uppercase tracking-wider flex items-center justify-between">
                <span>Top Curriculum Priority:</span>
                {topRec && (
                  <span className="text-amber-300 font-bold">{topRec.match_percentage}% Vector Match</span>
                )}
              </div>
              <div className="text-sm font-bold text-white">
                {topRec ? topRec.title : 'MET-401: Operational Radar & NWP Calibration'}
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {topRec
                  ? topRec.rationale
                  : 'Directly resolves primary operational deficiency in Doppler Weather Radar and atmospheric parameter tuning.'}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Deterministic vector math: Zero generative hallucination or opaque scoring.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Automatic trainer matching based on domain expertise, tenure, and feedback.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Runs 100% locally on Capacity Connect OS without external dependencies.</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={openCompetencyModal}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-all flex items-center justify-center gap-2 shadow"
              >
                <Award className="w-3.5 h-3.5 text-slate-950" />
                <span>Open Radar Matrix Console</span>
              </button>
              {topRec && (
                <button
                  onClick={() => openCoursePlayer(topRec.course_id)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Launch Syllabi</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
