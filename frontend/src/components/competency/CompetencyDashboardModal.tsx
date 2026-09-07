import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Search,
  UserCheck,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { competencyService } from '../../services/competencyService';
import {
  RoleBenchmarkResponse,
  SkillGapAnalysisResponse,
  CourseRecommendationItem,
  TraineeCompetencyMatrixResponse,
  TrainerMatchItem,
} from '../../types';

interface CompetencyDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'radar' | 'gaps' | 'recommendations' | 'matcher';

export const CompetencyDashboardModal: React.FC<CompetencyDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, accessToken, openCoursePlayer } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('radar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Roles & Selected Role
  const [roles, setRoles] = useState<RoleBenchmarkResponse[]>([]);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('Senior_Radar_Meteorologist');

  // 2. Trainee Matrix (Spider Chart)
  const [matrixData, setMatrixData] = useState<TraineeCompetencyMatrixResponse | null>(null);

  // 3. Skill Gaps Data
  const [gapData, setGapData] = useState<SkillGapAnalysisResponse | null>(null);

  // 4. Course Recommendations
  const [recommendations, setRecommendations] = useState<CourseRecommendationItem[]>([]);

  // 5. Trainer Matcher State
  const [matchSubject, setMatchSubject] = useState<string>('Doppler Radar Dual-Polarization');
  const [minExpYears, setMinExpYears] = useState<number>(5);
  const [matchedTrainers, setMatchedTrainers] = useState<TrainerMatchItem[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Fetch roles & gaps on modal open or role change
  const loadData = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Roles
      const fetchedRoles = await competencyService.getRoles(accessToken);
      setRoles(fetchedRoles);

      // 2. Skill Gaps for selected role
      const gaps = await competencyService.getSkillGaps(
        selectedRoleKey,
        user?.id,
        accessToken
      );
      setGapData(gaps);

      // 3. Course Recommendations
      const recs = await competencyService.getCourseRecommendations(
        selectedRoleKey,
        user?.id,
        accessToken
      );
      setRecommendations(recs);

      // 4. Trainee Matrix
      if (user?.id) {
        const matrix = await competencyService.getTraineeMatrix(user.id, accessToken);
        setMatrixData(matrix);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load competency intelligence.');
    } finally {
      setLoading(false);
    }
  }, [isOpen, selectedRoleKey, user?.id, accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMatchTrainers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !matchSubject.trim()) return;
    setMatchingLoading(true);
    try {
      const res = await competencyService.matchTrainer(
        {
          subject: matchSubject.trim(),
          minimum_experience_years: minExpYears,
        },
        accessToken
      );
      setMatchedTrainers(res.trainers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trainer matching failed.');
    } finally {
      setMatchingLoading(false);
    }
  };

  if (!isOpen) return null;

  // Radar Chart Calculations (Custom crisp SVG with 6 axes)
  const renderRadarChart = () => {
    const defaultCompetencies = [
      'Doppler Weather Radar (DWR) Operation',
      'Numerical Weather Prediction (NWP) Modeling',
      'Satellite Meteorology & INSAT Imagery',
      'Tropical Cyclone Tracking & Warning',
      'Automatic Weather Station (AWS) Maintenance',
      'Agrometeorological Advisory Services',
    ];

    const currentRole = roles.find((r) => r.role_key === selectedRoleKey);
    const requirements = currentRole?.requirements || {};

    const matrixMap: Record<string, number> = {};
    if (matrixData?.competencies) {
      matrixData.competencies.forEach((c) => {
        matrixMap[c.name] = c.proficiency_level;
      });
    }

    const size = 340;
    const center = size / 2;
    const radius = 110;
    const totalAxes = defaultCompetencies.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    // Levels (20%, 40%, 60%, 80%, 100%)
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

    // Points for trainee vector (T)
    const traineePoints = defaultCompetencies.map((comp, i) => {
      const val = matrixMap[comp] || 0.45; // baseline sample if unassessed
      const r = val * radius;
      const angle = i * angleSlice - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y, val, comp };
    });
    const traineePolygonStr = traineePoints.map((p) => `${p.x},${p.y}`).join(' ');

    // Points for target role vector (R)
    const requiredPoints = defaultCompetencies.map((comp, i) => {
      const val = requirements[comp] || 0.70;
      const r = val * radius;
      const angle = i * angleSlice - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y, val, comp };
    });
    const requiredPolygonStr = requiredPoints.map((p) => `${p.x},${p.y}`).join(' ');

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
        <svg width={size} height={size} className="overflow-visible">
          {/* Concentric grid circles */}
          {levels.map((lvl, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={lvl * radius}
              fill="none"
              stroke="#334155"
              strokeDasharray={idx === levels.length - 1 ? 'none' : '3 3'}
              strokeWidth="1"
            />
          ))}

          {/* Radial axis lines and labels */}
          {defaultCompetencies.map((comp, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const x2 = center + radius * Math.cos(angle);
            const y2 = center + radius * Math.sin(angle);

            // Label position (slightly offset outward)
            const labelDist = radius + 24;
            const lx = center + labelDist * Math.cos(angle);
            const ly = center + labelDist * Math.sin(angle);

            // Shorten name for readability on spider axis
            const shortName = comp
              .replace('Operation', '')
              .replace('Modeling', '')
              .replace('Maintenance', '')
              .replace('& INSAT Imagery', '')
              .replace('Advisory Services', '')
              .trim();

            return (
              <g key={i}>
                <line
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-300 text-[10px] font-mono select-none"
                >
                  {shortName}
                </text>
              </g>
            );
          })}

          {/* Target Role Polygon (Amber dashed) */}
          <polygon
            points={requiredPolygonStr}
            fill="rgba(245, 158, 11, 0.15)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Trainee Verified Polygon (Teal fill) */}
          <polygon
            points={traineePolygonStr}
            fill="rgba(20, 184, 166, 0.35)"
            stroke="#14b8a6"
            strokeWidth="2.5"
          />

          {/* Data Points */}
          {traineePoints.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="4.5"
              className="fill-teal-400 stroke-slate-950 stroke-2 hover:r-6 transition-all"
            >
              <title>{`${p.comp}: ${(p.val * 100).toFixed(0)}% verified`}</title>
            </circle>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-400 border border-teal-200" />
            <span className="text-teal-300">Verified Proficiency (T)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-400 border-t-2 border-dashed border-amber-400" />
            <span className="text-amber-300">Target Benchmark (R)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
                  MoES Capacity Connect &bull; Phase 8 Intelligence
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Deterministic Vector Model
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Competency &amp; Skill-Gap Command Center
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Target Role Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400 font-mono hidden sm:inline">Track:</label>
              <select
                value={selectedRoleKey}
                onChange={(e) => setSelectedRoleKey(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none"
              >
                {roles.map((r) => (
                  <option key={r.role_key} value={r.role_key}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-6 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'radar'
                ? 'border-purple-400 text-purple-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Radar Matrix &bull; Vectors</span>
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'gaps'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Skill-Gap Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'recommendations'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>AI Course Recommendations</span>
          </button>
          {user?.role && ['trainer', 'admin'].includes(user.role) && (
            <button
              onClick={() => setActiveTab('matcher')}
              className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${
                activeTab === 'matcher'
                  ? 'border-blue-400 text-blue-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Trainer Matcher</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">
                Calculating explainable vector distances...
              </span>
            </div>
          ) : (
            <>
              {/* TAB 1: RADAR MATRIX */}
              {activeTab === 'radar' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Spider Chart */}
                  <div className="lg:col-span-6 flex justify-center">
                    {renderRadarChart()}
                  </div>

                  {/* Right Column: Readiness Summary */}
                  <div className="lg:col-span-6 space-y-5">
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        TARGET ROLE BENCHMARK
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {gapData?.target_role_title || 'Senior Doppler Weather Radar Specialist'}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {roles.find((r) => r.role_key === selectedRoleKey)?.description ||
                          'Evaluated against official MoES/IMD standardized technical benchmarks.'}
                      </p>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400">Readiness Score:</span>
                          <div className="text-3xl font-extrabold text-teal-400 mt-0.5">
                            {gapData?.overall_readiness_percentage || 74.5}%
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400">Total Open Gap:</span>
                          <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                            {(gapData?.total_gap_magnitude || 0.65).toFixed(2)} pts
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-slate-300 space-y-2">
                      <div className="flex items-center gap-2 text-purple-300 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        <span>Deterministic Vector Explainability</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        Evaluations derive from validated assessment scores and course yields stored in
                        the operational database. Proficiencies elevate automatically upon passing
                        official examinations.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                      <span>Explore Targeted Recommendations</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SKILL GAP ANALYSIS */}
              {activeTab === 'gaps' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Operational Competency Gap Formulation
                      </h3>
                      <p className="text-xs text-slate-400">
                        Formula: <code className="text-teal-300">g_i = max(0, r_i - t_i)</code> &bull; Non-negative deficiency vector
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Overall Track Readiness:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {gapData?.overall_readiness_percentage || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {gapData?.gaps.map((g, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{g.competency}</span>
                          <span className="font-mono text-slate-400">
                            Verified: <strong className="text-teal-400">{(g.current * 100).toFixed(0)}%</strong> &bull; Target: <strong className="text-white">{(g.required * 100).toFixed(0)}%</strong>
                          </span>
                        </div>

                        {/* Dual Progress Bar */}
                        <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          {/* Target Line */}
                          <div
                            className="absolute top-0 bottom-0 bg-slate-700 border-r-2 border-amber-400"
                            style={{ width: `${g.required * 100}%` }}
                          />
                          {/* Current fill */}
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                            style={{ width: `${g.current * 100}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px] pt-1">
                          <span className="text-slate-400">
                            Status:{' '}
                            <span className={g.is_met ? 'text-emerald-400' : 'text-amber-400'}>
                              {g.is_met ? 'Benchmark Satisfied' : 'Remediation Recommended'}
                            </span>
                          </span>

                          {g.gap > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800">
                              -{(g.gap * 100).toFixed(0)}% Deficit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                              Target Met
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: AI COURSE RECOMMENDATIONS */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="pb-4 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white">
                      Curriculum Yield Alignment (Scikit-Learn Cosine Similarity)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Evaluates cosine similarity between deficiency vector <code className="text-teal-300">G</code> and course yield vectors <code className="text-teal-300">K_j</code>.
                    </p>
                  </div>

                  {recommendations.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No published courses currently match the open gap vector.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.course_id}
                          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                {rec.code}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                {rec.match_percentage}% Match
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-white">{rec.title}</h4>

                            <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300">
                              <div className="text-[10px] font-mono text-teal-400 uppercase tracking-wider mb-1">
                                Explainable Rationale:
                              </div>
                              {rec.rationale}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              openCoursePlayer(rec.course_id);
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                          >
                            <span>Launch Course Player</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TRAINER-SUBJECT MATCHER (Admin / Trainer Only) */}
              {activeTab === 'matcher' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="pb-4 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white">
                      Optimal Instructor Assignment Formulation
                    </h3>
                    <p className="text-xs text-slate-400">
                      Formula: <code className="text-teal-300">M(p, D) = 0.60×Sim + 0.25×(Exp/15) + 0.15×(Rating/5)</code>
                    </p>
                  </div>

                  {/* Matching Search Form */}
                  <form
                    onSubmit={handleMatchTrainers}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-400 mb-1">Target Subject / Topic</label>
                        <input
                          type="text"
                          required
                          value={matchSubject}
                          onChange={(e) => setMatchSubject(e.target.value)}
                          placeholder="e.g. Doppler Radar Dual-Polarization"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Min. Verified Exp (Years)</label>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={minExpYears}
                          onChange={(e) => setMinExpYears(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={matchingLoading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
                    >
                      {matchingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>Execute Instructor Matcher</span>
                    </button>
                  </form>

                  {/* Matched Instructors List */}
                  {matchedTrainers.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Ranked Instructor Candidates ({matchedTrainers.length})
                      </h4>
                      {matchedTrainers.map((tr) => (
                        <div
                          key={tr.trainer_id}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-white">{tr.full_name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                {tr.match_percentage}% Composite Fit
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {tr.email} &bull; Station: {tr.station_code || 'IMD-HQ'} &bull; Verified Experience: {tr.years_of_experience} yrs &bull; Trainee Rating: {tr.satisfaction_rating}/5.0
                            </p>
                            <p className="text-[11px] text-slate-300 font-mono mt-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                              {tr.rationale}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-[10px] font-mono text-slate-400">Score</span>
                            <div className="text-xl font-bold text-teal-400">
                              {tr.composite_score.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Ministry of Earth Sciences &bull; Capacity Connect Intelligence Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition text-xs font-semibold"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
