import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient

DEFAULT_ADMIN_EMAIL = "admin.imd@moes.gov.in"
DEFAULT_ADMIN_PASSWORD = "Admin@CapacityConnect2026"


async def create_and_approve_user(
    client: AsyncClient,
    email: str,
    full_name: str,
    role: str = "trainee",
    station_code: str = "IMD-DEL"
) -> str:
    """Register and approve a user via admin, returning the access token."""
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

    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    admin_token = admin_login.json()["access_token"]
    await client.post(
        f"/api/v1/admin/users/{user_id}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    return login_res.json()["access_token"]


@pytest.mark.asyncio
async def test_assessment_crud_and_publishing(async_client: AsyncClient):
    """Test assessment authoring, adding questions, publishing, and catalog discovery."""
    trainer_token = await create_and_approve_user(
        async_client, "trainer.ass1@imd.gov.in", "Dr. A. P. J. Kalam", role="trainer"
    )
    trainee_token = await create_and_approve_user(
        async_client, "trainee.ass1@imd.gov.in", "Vikas Swarup", role="trainee"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Trainee cannot create assessment (403)
    unauth_res = await async_client.post(
        "/api/v1/assessments",
        headers=trainee_headers,
        json={
            "title": "Unauthorized Assessment",
            "subject": "Radar",
            "duration_minutes": 30,
            "passing_score": 60.0,
            "total_marks": 100.0,
        },
    )
    assert unauth_res.status_code == 403

    # 2. Trainer creates draft assessment
    create_res = await async_client.post(
        "/api/v1/assessments",
        headers=trainer_headers,
        json={
            "title": "Doppler Weather Radar Operator Certification",
            "subject": "Radar Meteorology",
            "description": "Technical evaluation of velocity de-aliasing, ground clutter filters, and QPE algorithms.",
            "duration_minutes": 45,
            "passing_score": 70.0,
            "total_marks": 100.0,
            "is_published": False,
        },
    )
    assert create_res.status_code == 201
    assessment_id = create_res.json()["id"]

    # 3. Add questions to assessment
    q1_res = await async_client.post(
        f"/api/v1/assessments/{assessment_id}/questions",
        headers=trainer_headers,
        json={
            "question_text": "What is the primary effect of elevating the Pulse Repetition Frequency (PRF)?",
            "question_type": "mcq",
            "options_json": [
                {"id": "A", "text": "Increases maximum unambiguous velocity and decreases maximum unambiguous range"},
                {"id": "B", "text": "Decreases maximum unambiguous velocity and increases maximum unambiguous range"},
                {"id": "C", "text": "Increases both range and velocity"},
                {"id": "D", "text": "No effect"},
            ],
            "correct_option": "A",
            "explanation": "According to the Doppler dilemma: V_max * R_max = c * lambda / 8.",
            "marks": 50.0,
            "order_index": 1,
        },
    )
    assert q1_res.status_code == 201
    assert q1_res.json()["correct_option"] == "A"

    # Add second question (True/False)
    q2_res = await async_client.post(
        f"/api/v1/assessments/{assessment_id}/questions",
        headers=trainer_headers,
        json={
            "question_text": "Ground clutter echoes in Doppler radar typically exhibit near-zero Doppler velocity.",
            "question_type": "true_false",
            "options_json": [
                {"id": "A", "text": "True"},
                {"id": "B", "text": "False"},
            ],
            "correct_option": "A",
            "explanation": "Stationary obstacles produce zero Doppler shift.",
            "marks": 50.0,
            "order_index": 2,
        },
    )
    assert q2_res.status_code == 201

    # 4. Trainee lists assessments: Draft assessment should NOT appear
    t_list_draft = await async_client.get("/api/v1/assessments", headers=trainee_headers)
    assert t_list_draft.status_code == 200
    assert not any(a["id"] == assessment_id for a in t_list_draft.json())

    # 5. Trainer publishes assessment
    pub_res = await async_client.put(
        f"/api/v1/assessments/{assessment_id}",
        headers=trainer_headers,
        json={"is_published": True},
    )
    assert pub_res.status_code == 200
    assert pub_res.json()["is_published"] is True

    # 6. Trainee lists assessments: Published assessment appears
    t_list_pub = await async_client.get("/api/v1/assessments", headers=trainee_headers)
    assert t_list_pub.status_code == 200
    found = next((a for a in t_list_pub.json() if a["id"] == assessment_id), None)
    assert found is not None
    assert found["title"] == "Doppler Weather Radar Operator Certification"
    assert found["questions_count"] == 2


@pytest.mark.asyncio
async def test_assessment_instructions_and_deadline_barriers(async_client: AsyncClient):
    """Test deadline validation: expired assessments cannot be started."""
    trainer_token = await create_and_approve_user(
        async_client, "trainer.dl@imd.gov.in", "Dr. Satish Dhawan", role="trainer"
    )
    trainee_token = await create_and_approve_user(
        async_client, "trainee.dl@imd.gov.in", "Sunil Gavaskar", role="trainee"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Create an assessment with past deadline
    past_deadline = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    ass_res = await async_client.post(
        "/api/v1/assessments",
        headers=trainer_headers,
        json={
            "title": "Expired Monsoon Diagnostics Quiz",
            "subject": "Synoptic Meteorology",
            "duration_minutes": 20,
            "passing_score": 60.0,
            "total_marks": 100.0,
            "deadline": past_deadline,
            "is_published": True,
        },
    )
    assessment_id = ass_res.json()["id"]

    # Add question
    await async_client.post(
        f"/api/v1/assessments/{assessment_id}/questions",
        headers=trainer_headers,
        json={
            "question_text": "What constitutes the Somali Jet?",
            "question_type": "mcq",
            "options_json": [{"id": "A", "text": "Low-level jet"}, {"id": "B", "text": "Upper tropospheric jet"}],
            "correct_option": "A",
            "marks": 100.0,
        },
    )

    # 2. Check assessment details: is_available should be False
    detail_res = await async_client.get(f"/api/v1/assessments/{assessment_id}", headers=trainee_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["is_available"] is False

    # 3. Trainee attempts to start: should return 400 Bad Request
    start_res = await async_client.post(f"/api/v1/assessments/{assessment_id}/start", headers=trainee_headers)
    assert start_res.status_code == 400
    assert "deadline" in start_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_timed_quiz_runner_and_question_sanitization(async_client: AsyncClient):
    """Test starting an assessment, question sanitization (no leaks), and session resumption."""
    trainer_token = await create_and_approve_user(
        async_client, "trainer.sec@imd.gov.in", "Dr. Homi Bhabha", role="trainer"
    )
    trainee_token = await create_and_approve_user(
        async_client, "trainee.sec@imd.gov.in", "Mira Nair", role="trainee"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Create assessment with questions
    ass_res = await async_client.post(
        "/api/v1/assessments",
        headers=trainer_headers,
        json={
            "title": "NWP Discretization & Stability",
            "subject": "Numerical Weather Prediction",
            "duration_minutes": 30,
            "passing_score": 70.0,
            "total_marks": 100.0,
            "is_published": True,
        },
    )
    assessment_id = ass_res.json()["id"]

    await async_client.post(
        f"/api/v1/assessments/{assessment_id}/questions",
        headers=trainer_headers,
        json={
            "question_text": "What is the Courant-Friedrichs-Lewy (CFL) stability criterion for advection?",
            "question_type": "mcq",
            "options_json": [
                {"id": "A", "text": "u * dt / dx <= 1"},
                {"id": "B", "text": "u * dt / dx > 1"},
                {"id": "C", "text": "u * dx / dt = 0"},
            ],
            "correct_option": "A",
            "explanation": "CFL condition ensures information propagates slower than the numerical grid speed.",
            "marks": 100.0,
        },
    )

    # 2. Trainee starts attempt
    start_res = await async_client.post(
        f"/api/v1/assessments/{assessment_id}/start",
        headers=trainee_headers,
    )
    assert start_res.status_code == 200
    start_data = start_res.json()
    attempt_id = start_data["attempt_id"]
    assert attempt_id is not None
    assert len(start_data["questions"]) == 1

    # CRITICAL: Verify correct_option and explanation are NOT returned in public questions
    q_data = start_data["questions"][0]
    assert "correct_option" not in q_data
    assert "explanation" not in q_data
    assert len(q_data["options"]) == 3

    # 3. Resuming active attempt returns the same attempt_id
    resume_res = await async_client.post(
        f"/api/v1/assessments/{assessment_id}/start",
        headers=trainee_headers,
    )
    assert resume_res.status_code == 200
    assert resume_res.json()["attempt_id"] == attempt_id


@pytest.mark.asyncio
async def test_automated_grading_scoring_and_passing_status(async_client: AsyncClient):
    """Test submitting answers, automatic scoring, pass/fail determination, and SHA-256 signature."""
    trainer_token = await create_and_approve_user(
        async_client, "trainer.grade@imd.gov.in", "Dr. C. V. Raman", role="trainer"
    )
    trainee_pass_token = await create_and_approve_user(
        async_client, "trainee.pass@imd.gov.in", "Rahul Sharma", role="trainee"
    )
    trainee_fail_token = await create_and_approve_user(
        async_client, "trainee.fail@imd.gov.in", "Sneha Roy", role="trainee"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    pass_headers = {"Authorization": f"Bearer {trainee_pass_token}"}
    fail_headers = {"Authorization": f"Bearer {trainee_fail_token}"}

    # 1. Create assessment (Passing score: 70 / 100)
    ass_res = await async_client.post(
        "/api/v1/assessments",
        headers=trainer_headers,
        json={
            "title": "Satellite Meteorology: INSAT-3DR Multispectral Assessment",
            "subject": "Satellite Meteorology",
            "duration_minutes": 30,
            "passing_score": 70.0,
            "total_marks": 100.0,
            "is_published": True,
        },
    )
    assessment_id = ass_res.json()["id"]

    # Q1: 60 marks, correct: B
    q1 = (await async_client.post(
        f"/api/v1/assessments/{assessment_id}/questions",
        headers=trainer_headers,
        json={
            "question_text": "Which spectral channel is best suited for mid-tropospheric water vapor tracking?",
            "question_type": "mcq",
            "options_json": [{"id": "A", "text": "Visible (0.65 um)"}, {"id": "B", "text": "Water Vapor (6.7 um)"}],
            "correct_option": "B",
            "marks": 60.0,
            "order_index": 1,
        },
    )).json()

    # Q2: 40 marks, correct: A
    q2 = (await async_client.post(
        f"/api/v1/assessments/{assessment_id}/questions",
        headers=trainer_headers,
        json={
            "question_text": "Thermal infrared channel 10.8 um measures cloud top temperature directly.",
            "question_type": "true_false",
            "options_json": [{"id": "A", "text": "True"}, {"id": "B", "text": "False"}],
            "correct_option": "A",
            "marks": 40.0,
            "order_index": 2,
        },
    )).json()

    # --- Scenario A: Trainee Rahul answers Q1 & Q2 correctly -> Score 100/100 (PASSED) ---
    start_pass = (await async_client.post(f"/api/v1/assessments/{assessment_id}/start", headers=pass_headers)).json()
    attempt_id_pass = start_pass["attempt_id"]

    submit_pass_res = await async_client.post(
        f"/api/v1/assessments/{assessment_id}/submit",
        headers=pass_headers,
        json={
            "attempt_id": attempt_id_pass,
            "answers": [
                {"question_id": q1["id"], "selected_option": "B"},
                {"question_id": q2["id"], "selected_option": "A"},
            ],
        },
    )
    assert submit_pass_res.status_code == 200
    pass_data = submit_pass_res.json()
    assert pass_data["score_obtained"] == 100.0
    assert pass_data["is_passed"] is True
    assert pass_data["attempt_status"] == "completed"
    assert len(pass_data["attempt_signature"]) == 64  # Valid SHA-256 hex digest
    assert pass_data["correct_answers_count"] == 2

    # Verify duplicate submission is rejected (400)
    dup_res = await async_client.post(
        f"/api/v1/assessments/{assessment_id}/submit",
        headers=pass_headers,
        json={"attempt_id": attempt_id_pass, "answers": []},
    )
    assert dup_res.status_code == 400

    # --- Scenario B: Trainee Sneha gets Q1 wrong and Q2 correct -> Score 40/100 (FAILED) ---
    start_fail = (await async_client.post(f"/api/v1/assessments/{assessment_id}/start", headers=fail_headers)).json()
    attempt_id_fail = start_fail["attempt_id"]

    submit_fail_res = await async_client.post(
        f"/api/v1/assessments/{assessment_id}/submit",
        headers=fail_headers,
        json={
            "attempt_id": attempt_id_fail,
            "answers": [
                {"question_id": q1["id"], "selected_option": "A"},  # Wrong (correct was B)
                {"question_id": q2["id"], "selected_option": "A"},  # Correct (+40)
            ],
        },
    )
    assert submit_fail_res.status_code == 200
    fail_data = submit_fail_res.json()
    assert fail_data["score_obtained"] == 40.0
    assert fail_data["is_passed"] is False  # 40 < 70 passing_score
    assert fail_data["attempt_status"] == "completed"
    assert fail_data["correct_answers_count"] == 1


@pytest.mark.asyncio
async def test_trainee_history_and_result_breakdown(async_client: AsyncClient):
    """Test fetching attempt history and viewing full result breakdown with question explanations."""
    trainer_token = await create_and_approve_user(
        async_client, "trainer.hist@imd.gov.in", "Dr. M. S. Swaminathan", role="trainer"
    )
    trainee_token = await create_and_approve_user(
        async_client, "trainee.hist@imd.gov.in", "Kavita Rao", role="trainee"
    )
    other_trainee_token = await create_and_approve_user(
        async_client, "trainee.other@imd.gov.in", "Suresh Raina", role="trainee"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}
    other_headers = {"Authorization": f"Bearer {other_trainee_token}"}

    # 1. Create and publish assessment
    ass_res = await async_client.post(
        "/api/v1/assessments",
        headers=trainer_headers,
        json={
            "title": "Agrometeorological Soil Moisture Indexing",
            "subject": "Agrometeorology",
            "duration_minutes": 25,
            "passing_score": 50.0,
            "total_marks": 50.0,
            "is_published": True,
        },
    )
    assessment_id = ass_res.json()["id"]

    q = (await async_client.post(
        f"/api/v1/assessments/{assessment_id}/questions",
        headers=trainer_headers,
        json={
            "question_text": "Field capacity represents the maximum water soil can hold against gravity.",
            "question_type": "true_false",
            "options_json": [{"id": "A", "text": "True"}, {"id": "B", "text": "False"}],
            "correct_option": "A",
            "explanation": "Field capacity is reached 2-3 days after rain or irrigation in permeable soils.",
            "marks": 50.0,
        },
    )).json()

    # 2. Trainee starts and completes attempt
    start = (await async_client.post(f"/api/v1/assessments/{assessment_id}/start", headers=trainee_headers)).json()
    attempt_id = start["attempt_id"]

    await async_client.post(
        f"/api/v1/assessments/{assessment_id}/submit",
        headers=trainee_headers,
        json={
            "attempt_id": attempt_id,
            "answers": [{"question_id": q["id"], "selected_option": "A"}],
        },
    )

    # 3. Query trainee all attempts (/attempts/me)
    history_res = await async_client.get("/api/v1/assessments/attempts/me", headers=trainee_headers)
    assert history_res.status_code == 200
    my_attempts = history_res.json()
    assert len(my_attempts) >= 1
    assert any(att["attempt_id"] == attempt_id for att in my_attempts)

    # 4. View detailed attempt breakdown
    detail_res = await async_client.get(f"/api/v1/assessments/attempts/{attempt_id}", headers=trainee_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["attempt_id"] == attempt_id
    assert detail["score_obtained"] == 50.0
    assert detail["is_passed"] is True
    assert len(detail["answers"]) == 1
    ans = detail["answers"][0]
    assert ans["selected_option"] == "A"
    assert ans["correct_option"] == "A"
    assert ans["is_correct"] is True
    assert "Field capacity is reached" in ans["explanation"]

    # 5. Cross-trainee access barrier: other trainee cannot view this attempt
    unauth_attempt_res = await async_client.get(f"/api/v1/assessments/attempts/{attempt_id}", headers=other_headers)
    assert unauth_attempt_res.status_code == 403


@pytest.mark.asyncio
async def test_trainer_admin_assessment_monitoring(async_client: AsyncClient):
    """Test trainer monitoring endpoint: viewing aggregated pass rate and student attempts."""
    trainer_token = await create_and_approve_user(
        async_client, "trainer.mon@imd.gov.in", "Dr. Vikram Sarabhai", role="trainer"
    )
    trainee1_token = await create_and_approve_user(
        async_client, "trainee.mon1@imd.gov.in", "Amitabh Bachchan", role="trainee"
    )
    trainee2_token = await create_and_approve_user(
        async_client, "trainee.mon2@imd.gov.in", "Rekha Ganesan", role="trainee"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    t1_headers = {"Authorization": f"Bearer {trainee1_token}"}
    t2_headers = {"Authorization": f"Bearer {trainee2_token}"}

    # 1. Create assessment
    ass_res = await async_client.post(
        "/api/v1/assessments",
        headers=trainer_headers,
        json={
            "title": "Aviation Weather Hazards & Aerodrome Warnings",
            "subject": "Aviation Meteorology",
            "duration_minutes": 20,
            "passing_score": 50.0,
            "total_marks": 100.0,
            "is_published": True,
        },
    )
    assessment_id = ass_res.json()["id"]

    q = (await async_client.post(
        f"/api/v1/assessments/{assessment_id}/questions",
        headers=trainer_headers,
        json={
            "question_text": "Microburst downdrafts induce intense low-level wind shear dangerous to aircraft.",
            "question_type": "true_false",
            "options_json": [{"id": "A", "text": "True"}, {"id": "B", "text": "False"}],
            "correct_option": "A",
            "marks": 100.0,
        },
    )).json()

    # Trainee 1 completes and passes (100)
    s1 = (await async_client.post(f"/api/v1/assessments/{assessment_id}/start", headers=t1_headers)).json()
    await async_client.post(
        f"/api/v1/assessments/{assessment_id}/submit",
        headers=t1_headers,
        json={"attempt_id": s1["attempt_id"], "answers": [{"question_id": q["id"], "selected_option": "A"}]},
    )

    # Trainee 2 completes and fails (0)
    s2 = (await async_client.post(f"/api/v1/assessments/{assessment_id}/start", headers=t2_headers)).json()
    await async_client.post(
        f"/api/v1/assessments/{assessment_id}/submit",
        headers=t2_headers,
        json={"attempt_id": s2["attempt_id"], "answers": [{"question_id": q["id"], "selected_option": "B"}]},
    )

    # 2. Trainee attempts to access monitoring -> 403
    unauth_mon = await async_client.get(f"/api/v1/assessments/{assessment_id}/monitoring", headers=t1_headers)
    assert unauth_mon.status_code == 403

    # 3. Trainer accesses monitoring
    mon_res = await async_client.get(f"/api/v1/assessments/{assessment_id}/monitoring", headers=trainer_headers)
    assert mon_res.status_code == 200
    mon = mon_res.json()
    assert mon["total_attempts"] == 2
    assert mon["passed_count"] == 1
    assert mon["failed_count"] == 1
    assert mon["average_score"] == 50.0  # (100 + 0) / 2
    assert mon["pass_percentage"] == 50.0  # 1 / 2 * 100
    assert len(mon["attempts"]) == 2
    names = [att["user_name"] for att in mon["attempts"]]
    assert "Amitabh Bachchan" in names
    assert "Rekha Ganesan" in names
