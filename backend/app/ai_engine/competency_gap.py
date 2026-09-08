import numpy as np
from typing import Dict, List, Any, Optional
from sklearn.metrics.pairwise import cosine_similarity

# Canonical Core Meteorological Competencies (from DATABASE_SCHEMA.md & PROJECT_BLUEPRINT.md)
DEFAULT_COMPETENCIES = [
    {
        "id": "c0000000-0000-0000-0000-000000000001",
        "name": "Doppler Weather Radar (DWR) Operation",
        "domain": "Instrumentation",
        "description": "Operation, maintenance, and data interpretation from Doppler weather radars"
    },
    {
        "id": "c0000000-0000-0000-0000-000000000002",
        "name": "Numerical Weather Prediction (NWP) Modeling",
        "domain": "Forecasting",
        "description": "Running WRF, GFS, and regional high-resolution atmospheric prediction models"
    },
    {
        "id": "c0000000-0000-0000-0000-000000000003",
        "name": "Satellite Meteorology & INSAT Imagery",
        "domain": "Remote Sensing",
        "description": "Analysis of infrared, visible, and water vapor imagery from INSAT-3D/3DR satellites"
    },
    {
        "id": "c0000000-0000-0000-0000-000000000004",
        "name": "Tropical Cyclone Tracking & Warning",
        "domain": "Disaster Warning",
        "description": "Dvorak intensity estimation, storm surge forecasting, and warning bulletin generation"
    },
    {
        "id": "c0000000-0000-0000-0000-000000000005",
        "name": "Automatic Weather Station (AWS) Maintenance",
        "domain": "Surface Instrumentation",
        "description": "Calibration and sensor maintenance of surface pressure, temperature, and anemometer sensors"
    },
    {
        "id": "c0000000-0000-0000-0000-000000000006",
        "name": "Agrometeorological Advisory Services",
        "domain": "Applied Meteorology",
        "description": "Preparation of district-level agromet bulletins for farmers and rural advisory"
    },
]

# Standard IMD/MoES Role Benchmarks with Target Proficiency Vectors (0.0 to 1.0)
STANDARD_ROLE_BENCHMARKS: Dict[str, Dict[str, Any]] = {
    "Senior_Radar_Meteorologist": {
        "title": "Senior Doppler Weather Radar Specialist",
        "description": "Responsible for radar scanning strategies, dual-polarization calibration, and severe convection warning.",
        "requirements": {
            "Doppler Weather Radar (DWR) Operation": 0.85,
            "Numerical Weather Prediction (NWP) Modeling": 0.75,
            "Satellite Meteorology & INSAT Imagery": 0.75,
            "Automatic Weather Station (AWS) Maintenance": 0.65,
        }
    },
    "Regional_NWP_Forecaster": {
        "title": "Regional High-Resolution NWP Forecaster",
        "description": "Oversees numerical model initialization, data assimilation, WRF parameter tuning, and ensemble post-processing.",
        "requirements": {
            "Numerical Weather Prediction (NWP) Modeling": 0.90,
            "Doppler Weather Radar (DWR) Operation": 0.70,
            "Satellite Meteorology & INSAT Imagery": 0.80,
            "Agrometeorological Advisory Services": 0.60,
        }
    },
    "Cyclone_Warning_Officer": {
        "title": "Tropical Cyclone Early Warning Officer",
        "description": "Specialized in Dvorak intensity estimates, cyclone track cone prediction, storm surge inundation, and stakeholder bulletins.",
        "requirements": {
            "Tropical Cyclone Tracking & Warning": 0.90,
            "Satellite Meteorology & INSAT Imagery": 0.85,
            "Doppler Weather Radar (DWR) Operation": 0.75,
            "Numerical Weather Prediction (NWP) Modeling": 0.70,
        }
    },
    "Agrometeorological_Specialist": {
        "title": "Agrometeorological Advisory Specialist",
        "description": "Prepares farm-level weather advisories, crop-weather calendar analyses, and drought/heatwave agricultural advisories.",
        "requirements": {
            "Agrometeorological Advisory Services": 0.85,
            "Numerical Weather Prediction (NWP) Modeling": 0.70,
            "Satellite Meteorology & INSAT Imagery": 0.70,
            "Automatic Weather Station (AWS) Maintenance": 0.75,
        }
    }
}


def normalize_role_key(role_key: str) -> str:
    """Matches role key flexibly (e.g. radar -> Senior_Radar_Meteorologist)."""
    key = role_key.strip().lower()
    if "radar" in key:
        return "Senior_Radar_Meteorologist"
    if "nwp" in key or "forecast" in key:
        return "Regional_NWP_Forecaster"
    if "cyclone" in key:
        return "Cyclone_Warning_Officer"
    if "agro" in key:
        return "Agrometeorological_Specialist"
    for k in STANDARD_ROLE_BENCHMARKS:
        if k.lower() == key:
            return k
    return "Senior_Radar_Meteorologist"


def compute_skill_gaps(
    current_proficiencies: Dict[str, float],
    target_role: str,
    all_competencies: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Computes non-negative deficiency vector:
    g_i = max(0, r_i - t_i)
    overall_readiness_percentage = max(0, min(100, 100 * (1 - sum(g_i) / sum(r_i))))
    """
    matched_role_key = normalize_role_key(target_role)
    benchmark_info = STANDARD_ROLE_BENCHMARKS.get(
        matched_role_key,
        STANDARD_ROLE_BENCHMARKS["Senior_Radar_Meteorologist"]
    )
    requirements: Dict[str, float] = benchmark_info["requirements"]

    gaps_list = []
    total_required = 0.0
    total_gap = 0.0

    # Map all competency names to IDs for fast lookup if provided
    name_to_id = {}
    if all_competencies:
        for c in all_competencies:
            name_to_id[c["name"]] = c.get("id")

    for comp_name, req_level in requirements.items():
        curr_level = current_proficiencies.get(comp_name, 0.0)
        gap = max(0.0, round(req_level - curr_level, 2))
        weight = float((next((c.get("criticality_weight", 1.0) for c in (all_competencies or []) if c["name"] == comp_name), 1.0)))
        total_required += weight * req_level
        total_gap += weight * gap

        gaps_list.append({
            "competency": comp_name,
            "competency_id": name_to_id.get(comp_name),
            "required": round(req_level, 2),
            "current": round(curr_level, 2),
            "gap": gap,
            "weighted_gap": round(weight * gap, 2),
            "is_met": gap == 0.0,
        })

    if total_required > 0:
        readiness = max(0.0, min(100.0, round((1.0 - (total_gap / total_required)) * 100.0, 1)))
    else:
        readiness = 100.0

    return {
        "target_role": matched_role_key,
        "target_role_title": benchmark_info["title"],
        "overall_readiness_percentage": readiness,
        "total_gap_magnitude": round(total_gap, 2),
        "gaps": gaps_list,
    }


def recommend_courses_cosine_similarity(
    gaps_dict: Dict[str, float],
    courses_with_yields: List[Dict[str, Any]],
    all_competencies: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Calculates Cosine Similarity between skill deficiency vector G and course yield vector K_j:
    Sim(G, K_j) = (G . K_j) / (||G||_2 * ||K_j||_2)
    Ranks courses in descending order and generates deterministic explainable rationale.
    """
    if not all_competencies or not courses_with_yields:
        return []

    # Standardize dimension universe across all competencies
    comp_names = [c["name"] for c in all_competencies]
    dim = len(comp_names)
    comp_idx = {name: i for i, name in enumerate(comp_names)}

    # Build Gap Vector G
    G = np.zeros(dim, dtype=np.float64)
    for name, gap_val in gaps_dict.items():
        if name in comp_idx:
            G[comp_idx[name]] = max(0.0, float(gap_val))

    g_norm = np.linalg.norm(G)
    has_gaps = g_norm > 1e-6

    recommendations = []

    for c in courses_with_yields:
        course_id = c["id"]
        title = c["title"]
        code = c.get("code", "MET-CRS")
        thumbnail_url = c.get("thumbnail_url")
        yields = c.get("yields", {})  # Dict[comp_name, yield_level]

        # Build Course Yield Vector K
        K = np.zeros(dim, dtype=np.float64)
        for comp_name, yield_val in yields.items():
            if comp_name in comp_idx:
                K[comp_idx[comp_name]] = float(yield_val)

        k_norm = np.linalg.norm(K)

        if not has_gaps or k_norm < 1e-6:
            similarity = 0.0
        else:
            similarity = float(cosine_similarity(G.reshape(1, -1), K.reshape(1, -1))[0][0])

        similarity = max(0.0, min(1.0, round(similarity, 4)))

        # Explainable Rationale Generation
        # Find which competency has the highest yield that addresses a non-zero gap
        addressed_gaps = []
        for name, gap_val in gaps_dict.items():
            if gap_val > 0 and name in yields and yields[name] > 0:
                addressed_gaps.append((name, gap_val, yields[name]))

        if addressed_gaps:
            # Sort by yield * gap impact
            addressed_gaps.sort(key=lambda x: x[1] * x[2], reverse=True)
            top_comp, top_gap, top_yield = addressed_gaps[0]
            rationale = (
                f"Directly addresses primary skill gap in {top_comp} "
                f"(open gap: {top_gap:.2f}, course yield: {top_yield:.2f}). "
                f"Vector alignment: {similarity * 100:.1f}%."
            )
        elif yields:
            top_yield_comp = max(yields.items(), key=lambda x: x[1])
            rationale = (
                f"Imparts operational proficiency in {top_yield_comp[0]} "
                f"(yield: {top_yield_comp[1]:.2f})."
            )
        else:
            rationale = "General meteorological curriculum development course."

        recommendations.append({
            "course_id": course_id,
            "title": title,
            "code": code,
            "match_score": similarity,
            "match_percentage": round(similarity * 100, 1),
            "rationale": rationale,
            "thumbnail_url": thumbnail_url,
            "imparted_competencies": [
                {"competency": k, "yield_level": v} for k, v in yields.items()
            ]
        })

    # Rank by match_score descending, then title ascending
    recommendations.sort(key=lambda x: (x["match_score"], x["title"]), reverse=True)
    return recommendations


def match_trainers_for_subject(
    trainers_data: List[Dict[str, Any]],
    subject: str,
    minimum_experience_years: float = 0.0,
    all_competencies: Optional[List[Dict[str, Any]]] = None,
    competency_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Computes Explainable Matching Score:
    M(p, D) = alpha * CosineSim(E_p, D) + beta * min(1.0, Y_p / 15.0) + gamma * (S_p / 5.0)
    Calibrated weights: alpha = 0.60, beta = 0.25, gamma = 0.15.
    """
    alpha = 0.60
    beta = 0.25
    gamma = 0.15

    results = []
    competencies = all_competencies or []

    def tokens(value: str) -> set[str]:
        return {token for token in value.lower().replace("&", " ").replace("/", " ").split() if len(token) > 2}

    def alignment(source: str, competency: Dict[str, Any]) -> float:
        """Deterministically map a subject label to a canonical competency."""
        source_tokens = tokens(source)
        competency_tokens = tokens(
            f"{competency['name']} {competency.get('domain', '')} {competency.get('description', '')}"
        )
        if not source_tokens or not competency_tokens:
            return 0.0
        overlap = len(source_tokens & competency_tokens)
        return overlap / len(source_tokens)

    def competency_vector(label: str) -> np.ndarray:
        """Return one canonical dimension for an exact label, otherwise lexical alignment."""
        vector = np.zeros(dimensions, dtype=np.float64)
        label_tokens = tokens(label)
        exact_indexes = [
            index
            for index, competency in enumerate(competencies)
            if label_tokens == tokens(competency["name"])
        ]
        if exact_indexes:
            vector[exact_indexes[0]] = 1.0
            return vector
        for index, competency in enumerate(competencies):
            vector[index] = alignment(label, competency)
        return vector

    dimensions = len(competencies)
    demand = np.zeros(dimensions, dtype=np.float64)
    if competency_id:
        for index, competency in enumerate(competencies):
            if competency["id"] == competency_id:
                demand[index] = 1.0
                break
    else:
        demand = competency_vector(subject)

    demand_norm = np.linalg.norm(demand)

    for t in trainers_data:
        trainer_id = t["user_id"]
        full_name = t["full_name"]
        email = t.get("email", "")
        station_code = t.get("station_code", "")
        years_exp = float(t.get("years_of_experience") or 0.0)
        # A score is only used when it is backed by recorded course feedback.
        sat_rating = max(0.0, min(5.0, float(t.get("satisfaction_rating") or 0.0)))
        availability_confirmed = bool(t.get("availability_confirmed", False))

        # Availability is a required matching input.  Unconfirmed availability
        # is excluded rather than inferred from unrelated profile data.
        if not availability_confirmed:
            continue

        # Expertise list: List[{"subject": str, "proficiency": str, "years_in_subject": float}]
        expertise_list = t.get("expertise", [])

        expertise_vector = np.zeros(dimensions, dtype=np.float64)
        matched_expertise_title = None
        matched_expertise_alignment = 0.0

        for exp in expertise_list:
            exp_subj = exp["subject"]
            prof_level = exp.get("proficiency_level", "intermediate").lower()
            prof_weight = {
                "expert": 1.0,
                "advanced": 0.8,
                "intermediate": 0.6,
                "beginner": 0.4
            }.get(prof_level, 0.6)

            expertise_vector = np.maximum(
                expertise_vector,
                prof_weight * competency_vector(exp_subj),
            )

            expertise_subject_alignment = alignment(exp_subj, {"name": subject, "domain": "", "description": ""})
            if expertise_subject_alignment > matched_expertise_alignment:
                matched_expertise_alignment = expertise_subject_alignment
                matched_expertise_title = exp["subject"]

        # Filter by minimum experience if specified
        if minimum_experience_years > 0 and years_exp < minimum_experience_years:
            continue

        expertise_norm = np.linalg.norm(expertise_vector)
        expertise_sim = (
            float(cosine_similarity(expertise_vector.reshape(1, -1), demand.reshape(1, -1))[0][0])
            if dimensions and expertise_norm > 1e-6 and demand_norm > 1e-6
            else 0.0
        )
        experience_score = min(1.0, years_exp / 15.0)
        satisfaction_score = sat_rating / 5.0

        composite_score = (
            alpha * expertise_sim +
            beta * experience_score +
            gamma * satisfaction_score
        )
        composite_score = round(composite_score, 4)

        rationale = (
            f"Competency-vector cosine similarity: {expertise_sim * 100:.0f}% "
            f"({matched_expertise_title or 'no mapped expertise'}), "
            f"Verified experience: {years_exp:.1f} yrs (score: {experience_score * 100:.0f}%), "
            f"Trainee rating: {sat_rating:.1f}/5.0 (score: {satisfaction_score * 100:.0f}%). "
            f"Composite formula: (0.60×{expertise_sim:.2f}) + (0.25×{experience_score:.2f}) + (0.15×{satisfaction_score:.2f}) = {composite_score:.2f}."
        )

        results.append({
            "trainer_id": trainer_id,
            "full_name": full_name,
            "email": email,
            "station_code": station_code,
            "years_of_experience": years_exp,
            "satisfaction_rating": round(sat_rating, 2),
            "expertise_similarity": round(expertise_sim, 2),
            "experience_score": round(experience_score, 2),
            "satisfaction_score": round(satisfaction_score, 2),
            "composite_score": composite_score,
            "match_percentage": round(composite_score * 100, 1),
            "matched_expertise": matched_expertise_title,
            "availability_confirmed": availability_confirmed,
            "rationale": rationale,
        })

    # Sort descending by composite_score, then years_of_experience
    results.sort(key=lambda x: (x["composite_score"], x["years_of_experience"]), reverse=True)
    return results
