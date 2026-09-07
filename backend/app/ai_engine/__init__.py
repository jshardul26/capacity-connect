"""
Capacity Connect AI Engine: Deterministic, explainable competency gap analysis,
course recommendation (via Scikit-Learn Cosine Similarity), and trainer matching.
"""
from app.ai_engine.competency_gap import (
    DEFAULT_COMPETENCIES,
    STANDARD_ROLE_BENCHMARKS,
    compute_skill_gaps,
    recommend_courses_cosine_similarity,
    match_trainers_for_subject,
)

__all__ = [
    "DEFAULT_COMPETENCIES",
    "STANDARD_ROLE_BENCHMARKS",
    "compute_skill_gaps",
    "recommend_courses_cosine_similarity",
    "match_trainers_for_subject",
]
