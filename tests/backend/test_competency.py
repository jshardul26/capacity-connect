import pytest
import uuid
from httpx import AsyncClient

from app.ai_engine.competency_gap import (
    compute_skill_gaps,
    match_trainers_for_subject,
    recommend_courses_cosine_similarity,
)

DEFAULT_ADMIN_EMAIL = "admin.imd@moes.gov.in"
DEFAULT_ADMIN_PASSWORD = "Admin@CapacityConnect2026"


def test_vector_engines_are_deterministic_and_explainable():
    """Known vectors must produce a stable cosine ranking and formula breakdown."""
    competencies = [
        {"id": "radar", "name": "Doppler Weather Radar", "domain": "Instrumentation"},
        {"id": "nwp", "name": "Numerical Weather Prediction", "domain": "Forecasting"},
    ]
    recommendations = recommend_courses_cosine_similarity(
        gaps_dict={"Doppler Weather Radar": 0.8, "Numerical Weather Prediction": 0.1},
        courses_with_yields=[
            {"id": "radar-course", "title": "Radar", "yields": {"Doppler Weather Radar": 0.9}},
            {"id": "nwp-course", "title": "NWP", "yields": {"Numerical Weather Prediction": 0.9}},
        ],
        all_competencies=competencies,
    )
    assert recommendations[0]["course_id"] == "radar-course"
    assert "Vector alignment" in recommendations[0]["rationale"]

    matches = match_trainers_for_subject(
        trainers_data=[
            {
                "user_id": "radar-trainer",
                "full_name": "Radar Expert",
                "years_of_experience": 15,
                "satisfaction_rating": 5,
                "availability_confirmed": True,
                "expertise": [{"subject": "Doppler Weather Radar", "proficiency_level": "expert"}],
            },
            {
                "user_id": "nwp-trainer",
                "full_name": "NWP Expert",
                "years_of_experience": 15,
                "satisfaction_rating": 5,
                "availability_confirmed": True,
                "expertise": [{"subject": "Numerical Weather Prediction", "proficiency_level": "expert"}],
            },
        ],
        subject="Doppler Weather Radar",
        competency_id="radar",
        all_competencies=competencies,
    )
    assert matches[0]["trainer_id"] == "radar-trainer"
    assert matches[0]["expertise_similarity"] == 1.0
    assert matches[0]["composite_score"] == 1.0


def test_skill_gap_uses_declared_operational_criticality_and_availability():
    competencies = [
        {"id": "radar", "name": "Radar", "domain": "Operations", "criticality_weight": 2.0},
        {"id": "nwp", "name": "NWP", "domain": "Forecasting", "criticality_weight": 1.0},
    ]
    # Use a temporary canonical benchmark so the formula is tested directly.
    from app.ai_engine.competency_gap import STANDARD_ROLE_BENCHMARKS
    STANDARD_ROLE_BENCHMARKS["Test_Weighted_Role"] = {"title": "Test", "description": "Test", "requirements": {"Radar": 0.8, "NWP": 0.8}}
    try:
        result = compute_skill_gaps({"Radar": 0.4, "NWP": 0.4}, "Test_Weighted_Role", competencies)
        assert result["total_gap_magnitude"] == 1.2
        assert result["overall_readiness_percentage"] == 50.0
        assert result["gaps"][0]["weighted_gap"] == 0.8
    finally:
        STANDARD_ROLE_BENCHMARKS.pop("Test_Weighted_Role", None)

    unavailable = match_trainers_for_subject(
        trainers_data=[{"user_id": "unavailable", "full_name": "Unavailable", "years_of_experience": 20,
                        "satisfaction_rating": 5, "availability_confirmed": False,
                        "expertise": [{"subject": "Radar", "proficiency_level": "expert"}]}],
        subject="Radar", competency_id="radar", all_competencies=competencies,
    )
    assert unavailable == []


async def get_admin_token(client: AsyncClient) -> str:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


async def create_and_approve_user(
    client: AsyncClient,
    email: str,
    role: str,
    full_name: str,
    station_code: str = "IMD-HQ",
) -> tuple[str, str]:
    """Helper to create and approve a user, returning (user_id, access_token)."""
    admin_token = await get_admin_token(client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": full_name,
            "role": role,
            "station_code": station_code,
        },
    )
    assert signup_res.status_code == 201
    user_id = signup_res.json()["id"]

    # Approve
    appr_res = await client.post(
        f"/api/v1/admin/users/{user_id}/approve",
        headers=admin_headers,
    )
    assert appr_res.status_code == 200

    # Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return user_id, token


@pytest.mark.asyncio
async def test_competency_taxonomy_and_roles(async_client: AsyncClient):
    """Verifies that standard competencies are seeded and taxonomy/role endpoints return expected benchmarks."""
    _, trainee_token = await create_and_approve_user(
        async_client, "trainee.tax@imd.gov.in", "trainee", "Trainee Taxonomy"
    )
    headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Taxonomy
    resp = await async_client.get("/api/v1/competency/taxonomy", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 6
    comp_names = [c["name"] for c in data["competencies"]]
    assert "Doppler Weather Radar (DWR) Operation" in comp_names
    assert "Numerical Weather Prediction (NWP) Modeling" in comp_names
    assert "Tropical Cyclone Tracking & Warning" in comp_names

    # 2. Roles
    resp_roles = await async_client.get("/api/v1/competency/roles", headers=headers)
    assert resp_roles.status_code == 200
    roles = resp_roles.json()
    assert len(roles) >= 4
    role_keys = [r["role_key"] for r in roles]
    assert "Senior_Radar_Meteorologist" in role_keys
    assert "Regional_NWP_Forecaster" in role_keys
    assert "Cyclone_Warning_Officer" in role_keys


@pytest.mark.asyncio
async def test_trainee_competency_matrix_and_rbac(async_client: AsyncClient):
    """Verifies matrix retrieval and ownership RBAC."""
    trainee_id, trainee_token = await create_and_approve_user(
        async_client, "trainee.matrix@imd.gov.in", "trainee", "Trainee Matrix"
    )
    other_id, other_token = await create_and_approve_user(
        async_client, "trainee.other@imd.gov.in", "trainee", "Trainee Other"
    )
    trainer_id, trainer_token = await create_and_approve_user(
        async_client, "trainer.matrix@imd.gov.in", "trainer", "Trainer Matrix"
    )
    admin_token = await get_admin_token(async_client)

    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}
    other_headers = {"Authorization": f"Bearer {other_token}"}
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Trainee accesses own matrix
    resp = await async_client.get(f"/api/v1/competency/trainee/{trainee_id}/matrix", headers=trainee_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == trainee_id
    assert len(data["competencies"]) >= 6

    # 2. Another trainee attempts to access trainee's matrix -> 403
    resp_forbidden = await async_client.get(f"/api/v1/competency/trainee/{trainee_id}/matrix", headers=other_headers)
    assert resp_forbidden.status_code == 403

    # 3. Admin can access trainee's matrix
    resp_admin = await async_client.get(f"/api/v1/competency/trainee/{trainee_id}/matrix", headers=admin_headers)
    assert resp_admin.status_code == 200

    # 4. Trainer can access trainee's matrix
    resp_tr = await async_client.get(f"/api/v1/competency/trainee/{trainee_id}/matrix", headers=trainer_headers)
    assert resp_tr.status_code == 200


@pytest.mark.asyncio
async def test_skill_gap_analysis_calculation(async_client: AsyncClient):
    """Verifies skill gap formula: g_i = max(0, r_i - t_i) and readiness percentage."""
    _, trainee_token = await create_and_approve_user(
        async_client, "trainee.gaps@imd.gov.in", "trainee", "Trainee Gaps"
    )
    headers = {"Authorization": f"Bearer {trainee_token}"}

    resp = await async_client.get(
        "/api/v1/competency/gaps?target_role=Senior_Radar_Meteorologist",
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["target_role"] == "Senior_Radar_Meteorologist"
    assert "overall_readiness_percentage" in data
    assert "gaps" in data
    assert len(data["gaps"]) == 4

    for gap_item in data["gaps"]:
        expected_gap = round(max(0.0, gap_item["required"] - gap_item["current"]), 2)
        assert gap_item["gap"] == expected_gap


@pytest.mark.asyncio
async def test_course_competency_mapping_and_recommendations(async_client: AsyncClient):
    """Verifies course yield mapping and Scikit-Learn Cosine Similarity course recommendations."""
    _, trainer_token = await create_and_approve_user(
        async_client, "trainer.crsmap@imd.gov.in", "trainer", "Dr. Radar Trainer"
    )
    _, trainee_token = await create_and_approve_user(
        async_client, "trainee.recs@imd.gov.in", "trainee", "Trainee Recommender"
    )

    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Fetch a competency ID
    tax_resp = await async_client.get("/api/v1/competency/taxonomy", headers=trainer_headers)
    comps = tax_resp.json()["competencies"]
    dwr_comp = next(c for c in comps if "Doppler" in c["name"])

    # 2. Trainer creates a course
    unique_code = f"MET-REC-{uuid.uuid4().hex[:6].upper()}"
    crs_resp = await async_client.post(
        "/api/v1/trainer/courses",
        headers=trainer_headers,
        json={
            "title": "Advanced Doppler Radar Calibration",
            "code": unique_code,
            "description": "In-depth course on DWR operational calibration and pulse processing.",
            "category": "Instrumentation",
            "level": "advanced",
            "estimated_hours": 12.5,
        }
    )
    assert crs_resp.status_code == 201
    course_id = crs_resp.json()["id"]

    # Publish course
    await async_client.put(
        f"/api/v1/trainer/courses/{course_id}",
        headers=trainer_headers,
        json={"is_published": True}
    )

    # 3. Trainer maps competency to course
    map_resp = await async_client.post(
        f"/api/v1/competency/courses/{course_id}/mapping",
        headers=trainer_headers,
        json={"competency_id": dwr_comp["id"], "yield_level": 0.85}
    )
    assert map_resp.status_code == 200
    assert map_resp.json()["yield_level"] == 0.85

    # 4. Trainee cannot map course competency (unauthorized) -> 403
    non_auth_map = await async_client.post(
        f"/api/v1/competency/courses/{course_id}/mapping",
        headers=trainee_headers,
        json={"competency_id": dwr_comp["id"], "yield_level": 0.50}
    )
    assert non_auth_map.status_code == 403

    # 5. Trainee requests course recommendations
    rec_resp = await async_client.get(
        "/api/v1/competency/recommendations/courses?target_role=Senior_Radar_Meteorologist",
        headers=trainee_headers
    )
    assert rec_resp.status_code == 200
    recommendations = rec_resp.json()
    assert len(recommendations) >= 1

    top = recommendations[0]
    assert "match_score" in top
    assert "match_percentage" in top
    assert "rationale" in top
    assert top["match_score"] >= 0.0


@pytest.mark.asyncio
async def test_trainer_matching_algorithm(async_client: AsyncClient):
    """Verifies trainer matching composite score calculation and RBAC."""
    _, trainer_token = await create_and_approve_user(
        async_client, "trainer.match@imd.gov.in", "trainer", "Dr. Radar Matcher"
    )
    _, trainee_token = await create_and_approve_user(
        async_client, "trainee.matcher@imd.gov.in", "trainee", "Trainee Matcher"
    )
    admin_token = await get_admin_token(async_client)

    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Add expertise to trainer
    exp_resp = await async_client.post(
        "/api/v1/trainer/expertise",
        headers=trainer_headers,
        json={
            "subject": "Doppler Radar Dual-Polarization",
            "proficiency_level": "expert",
            "years_in_subject": 10.0,
        }
    )
    assert exp_resp.status_code == 201

    # 2. Update trainer profile experience years
    await async_client.put(
        "/api/v1/trainer/profile",
        headers=trainer_headers,
        json={"years_of_experience": 12.0, "is_available_for_assignment": True}
    )

    # 3. Admin matches trainer for subject
    match_resp = await async_client.post(
        "/api/v1/competency/match-trainer",
        headers=admin_headers,
        json={"subject": "Doppler Radar Dual-Polarization", "minimum_experience_years": 5.0}
    )
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert match_data["total_matched"] >= 1
    top_trainer = match_data["trainers"][0]
    assert top_trainer["composite_score"] > 0.0
    assert "rationale" in top_trainer
    assert "expertise_similarity" in top_trainer

    # 4. Trainee cannot run match-trainer -> 403
    tr_forbidden = await async_client.post(
        "/api/v1/competency/match-trainer",
        headers=trainee_headers,
        json={"subject": "Doppler Radar"}
    )
    assert tr_forbidden.status_code == 403


@pytest.mark.asyncio
async def test_assessment_completion_updates_competency(async_client: AsyncClient):
    """Verifies that passing an assessment dynamically updates trainee competency level."""
    _, trainer_token = await create_and_approve_user(
        async_client, "trainer.asmupd@imd.gov.in", "trainer", "Dr. Examiner"
    )
    trainee_id, trainee_token = await create_and_approve_user(
        async_client, "trainee.asmupd@imd.gov.in", "trainee", "Trainee Examinee"
    )

    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Fetch competency
    tax_resp = await async_client.get("/api/v1/competency/taxonomy", headers=trainer_headers)
    comps = tax_resp.json()["competencies"]
    nwp_comp = next(c for c in comps if "Numerical" in c["name"])

    # 2. Trainer creates assessment
    asm_resp = await async_client.post(
        "/api/v1/assessments",
        headers=trainer_headers,
        json={
            "title": f"NWP Competency Exam {uuid.uuid4().hex[:4]}",
            "subject": "Numerical Weather Prediction (NWP) Modeling",
            "duration_minutes": 20,
            "passing_score": 50.0,
            "total_marks": 100.0,
            "is_published": True,
        }
    )
    assert asm_resp.status_code == 201
    asm_id = asm_resp.json()["id"]

    # 3. Map assessment to NWP competency
    map_resp = await async_client.post(
        f"/api/v1/competency/assessments/{asm_id}/mapping",
        headers=trainer_headers,
        json={"competency_id": nwp_comp["id"]}
    )
    assert map_resp.status_code == 200

    # 4. Add question
    q_resp = await async_client.post(
        f"/api/v1/assessments/{asm_id}/questions",
        headers=trainer_headers,
        json={
            "question_text": "What does WRF stand for in NWP?",
            "question_type": "mcq",
            "options_json": [
                {"id": "A", "text": "Weather Research and Forecasting"},
                {"id": "B", "text": "Wind Radar Facility"}
            ],
            "correct_option": "A",
            "marks": 100.0,
        }
    )
    assert q_resp.status_code == 201
    q_id = q_resp.json()["id"]

    # 5. Trainee starts quiz
    start_resp = await async_client.post(f"/api/v1/assessments/{asm_id}/start", headers=trainee_headers)
    assert start_resp.status_code == 200
    attempt_id = start_resp.json()["attempt_id"]

    # 6. Trainee submits correct answer
    sub_resp = await async_client.post(
        f"/api/v1/assessments/{asm_id}/submit",
        headers=trainee_headers,
        json={
            "attempt_id": attempt_id,
            "answers": [{"question_id": q_id, "selected_option": "A"}]
        }
    )
    assert sub_resp.status_code == 200
    assert sub_resp.json()["is_passed"] is True

    # 7. Check that trainee competency matrix has been elevated for NWP
    matrix_resp = await async_client.get(
        f"/api/v1/competency/trainee/{trainee_id}/matrix",
        headers=trainee_headers
    )
    assert matrix_resp.status_code == 200
    trainee_comps = matrix_resp.json()["competencies"]
    nwp_item = next(c for c in trainee_comps if c["competency_id"] == nwp_comp["id"])
    assert nwp_item["proficiency_level"] >= 0.90  # scored 100/100 -> 1.0


@pytest.mark.asyncio
async def test_admin_direct_competency_update(async_client: AsyncClient):
    """Verifies direct competency level adjustment by admin and RBAC restriction for trainee."""
    admin_token = await get_admin_token(async_client)
    trainee_id, trainee_token = await create_and_approve_user(
        async_client, "trainee.direct@imd.gov.in", "trainee", "Trainee Direct"
    )

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    tax_resp = await async_client.get("/api/v1/competency/taxonomy", headers=admin_headers)
    comp_id = tax_resp.json()["competencies"][0]["id"]

    # Admin updates trainee competency
    upd_resp = await async_client.post(
        f"/api/v1/competency/trainee/{trainee_id}/update",
        headers=admin_headers,
        json={"competency_id": comp_id, "proficiency_level": 0.88}
    )
    assert upd_resp.status_code == 200
    assert upd_resp.json()["proficiency_level"] == 0.88

    # Trainee cannot update own competency directly -> 403
    forbidden_upd = await async_client.post(
        f"/api/v1/competency/trainee/{trainee_id}/update",
        headers=trainee_headers,
        json={"competency_id": comp_id, "proficiency_level": 1.0}
    )
    assert forbidden_upd.status_code == 403
