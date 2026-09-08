import io
import pytest
from httpx import AsyncClient

DEFAULT_ADMIN_EMAIL = "admin.imd@moes.gov.in"
DEFAULT_ADMIN_PASSWORD = "Admin@CapacityConnect2026"


async def create_and_approve_trainer(
    client: AsyncClient,
    email: str = "trainer.lead@imd.gov.in",
    full_name: str = "Dr. Rajesh Singh"
) -> str:
    """Helper to register and approve a trainer, returning their access token."""
    # 1. Register trainer
    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": full_name,
            "role": "trainer",
            "station_code": "IMD-PUN",
        },
    )
    assert signup_res.status_code == 201
    user_id = signup_res.json()["id"]

    # 2. Login as admin and approve trainer
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    admin_token = admin_login.json()["access_token"]
    approve_res = await client.post(
        f"/api/v1/admin/users/{user_id}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert approve_res.status_code == 200

    # 3. Login as trainer and return token
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    return login_res.json()["access_token"]


async def create_and_approve_trainee(
    client: AsyncClient,
    email: str = "trainee.tester@imd.gov.in",
    full_name: str = "Pooja Patel"
) -> str:
    """Helper to register and approve a trainee, returning their access token."""
    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": full_name,
            "role": "trainee",
            "station_code": "IMD-DEL",
        },
    )
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
async def test_trainer_profile_get_and_update(async_client: AsyncClient):
    """Test getting and updating a trainer's professional profile."""
    token = await create_and_approve_trainer(async_client, "trainer.prof@imd.gov.in", "Dr. A. Sharma")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET initial profile
    get_res = await async_client.get("/api/v1/trainer/profile", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["email"] == "trainer.prof@imd.gov.in"
    assert data["role"] == "trainer"
    assert data["courses_count"] == 0

    # 2. PUT update profile
    update_res = await async_client.put(
        "/api/v1/trainer/profile",
        headers=headers,
        json={
            "designation": "Scientist-F",
            "division": "Numerical Weather Prediction Division",
            "years_of_experience": 14.5,
            "biography": "Head of Regional NWP Modeling, expert in high-resolution WRF data assimilation.",
            "avatar_url": "https://example.com/avatars/trainer-sharma.png",
        },
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["designation"] == "Scientist-F"
    assert updated["division"] == "Numerical Weather Prediction Division"
    assert updated["years_of_experience"] == 14.5
    assert "WRF data assimilation" in updated["biography"]


@pytest.mark.asyncio
async def test_trainer_expertise_crud(async_client: AsyncClient):
    """Test adding, listing, and deleting trainer expertise items."""
    token = await create_and_approve_trainer(async_client, "trainer.exp@imd.gov.in", "Dr. B. Kulkarni")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add expertise
    post_res = await async_client.post(
        "/api/v1/trainer/expertise",
        headers=headers,
        json={
            "subject": "Doppler Weather Radar Calibration",
            "proficiency_level": "expert",
            "years_in_subject": 9.5,
        },
    )
    assert post_res.status_code == 201
    item = post_res.json()
    expertise_id = item["id"]
    assert item["subject"] == "Doppler Weather Radar Calibration"
    assert item["years_in_subject"] == 9.5

    # 2. List expertise
    list_res = await async_client.get("/api/v1/trainer/expertise", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 1
    assert items[0]["id"] == expertise_id

    # 3. Delete expertise
    del_res = await async_client.delete(f"/api/v1/trainer/expertise/{expertise_id}", headers=headers)
    assert del_res.status_code == 204

    # 4. Confirm deleted
    list_res2 = await async_client.get("/api/v1/trainer/expertise", headers=headers)
    assert len(list_res2.json()) == 0


@pytest.mark.asyncio
async def test_trainer_course_module_lesson_crud(async_client: AsyncClient):
    """Test creating courses, adding modules and lessons, and cascading operations."""
    token = await create_and_approve_trainer(async_client, "trainer.course@imd.gov.in", "Dr. C. Verma")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Course
    course_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=headers,
        json={
            "code": "MET-401",
            "title": "Advanced Doppler Weather Radar & Quantitative Precipitation Estimation",
            "description": "Comprehensive capacity building course on S-band and X-band radar operation.",
            "category": "Instrumentation",
            "level": "intermediate",
            "estimated_hours": 12.5,
            "is_published": True,
        },
    )
    assert course_res.status_code == 201
    course = course_res.json()
    course_id = course["id"]
    assert course["code"] == "MET-401"
    assert course["is_published"] is True

    # Duplicate code check
    dup_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=headers,
        json={
            "code": "MET-401",
            "title": "Duplicate Code Course",
            "description": "Should fail with 400 error.",
            "category": "Instrumentation",
        },
    )
    assert dup_res.status_code == 400

    # 2. Add Module
    module_res = await async_client.post(
        f"/api/v1/trainer/courses/{course_id}/modules",
        headers=headers,
        json={
            "title": "Module 1: Radar Signal Processing",
            "description": "Pulse compression and Nyquist velocity folding.",
            "order_index": 1,
        },
    )
    assert module_res.status_code == 201
    module = module_res.json()
    module_id = module["id"]
    assert module["title"] == "Module 1: Radar Signal Processing"

    # 3. Add Lesson
    lesson_res = await async_client.post(
        f"/api/v1/trainer/modules/{module_id}/lessons",
        headers=headers,
        json={
            "title": "Lesson 1.1: Doppler Dilemma & PRF Optimization",
            "content_text": "Detailed overview of Doppler frequency shifts in weather targets.",
            "order_index": 1,
            "duration_minutes": 45,
        },
    )
    assert lesson_res.status_code == 201
    lesson = lesson_res.json()
    lesson_id = lesson["id"]
    assert lesson["duration_minutes"] == 45

    # 4. Fetch Course details with modules and lessons
    get_res = await async_client.get(f"/api/v1/trainer/courses/{course_id}", headers=headers)
    assert get_res.status_code == 200
    course_detail = get_res.json()
    assert course_detail["modules_count"] == 1
    assert course_detail["lessons_count"] == 1
    assert course_detail["modules"][0]["lessons"][0]["id"] == lesson_id

    # 5. Update Course
    put_res = await async_client.put(
        f"/api/v1/trainer/courses/{course_id}",
        headers=headers,
        json={"title": "Updated Course Title", "estimated_hours": 15.0},
    )
    assert put_res.status_code == 200
    assert put_res.json()["title"] == "Updated Course Title"

    # 6. Delete Lesson
    del_lesson = await async_client.delete(f"/api/v1/trainer/lessons/{lesson_id}", headers=headers)
    assert del_lesson.status_code == 204

    # 7. Delete Module
    del_module = await async_client.delete(f"/api/v1/trainer/modules/{module_id}", headers=headers)
    assert del_module.status_code == 204

    # 8. Delete Course
    del_course = await async_client.delete(f"/api/v1/trainer/courses/{course_id}", headers=headers)
    assert del_course.status_code == 204


@pytest.mark.asyncio
async def test_trainer_questionnaire_and_questions_crud(async_client: AsyncClient):
    """Test creating questionnaires (assessments foundation) and adding questions."""
    token = await create_and_approve_trainer(async_client, "trainer.quiz@imd.gov.in", "Dr. D. Sen")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Questionnaire
    q_res = await async_client.post(
        "/api/v1/trainer/questionnaires",
        headers=headers,
        json={
            "title": "Doppler Weather Radar Diagnostics Quiz",
            "description": "Timed MCQ questionnaire for operational radar certification.",
            "subject": "Radar Meteorology",
            "duration_minutes": 20,
            "passing_score": 75.0,
            "total_marks": 100.0,
            "is_published": True,
        },
    )
    assert q_res.status_code == 201
    questionnaire = q_res.json()
    q_id = questionnaire["id"]
    assert questionnaire["passing_score"] == 75.0

    # 2. Add Question
    item_res = await async_client.post(
        f"/api/v1/trainer/questionnaires/{q_id}/questions",
        headers=headers,
        json={
            "question_text": "What is the primary trade-off known as the Doppler Dilemma?",
            "question_type": "mcq",
            "options": [
                {"id": "A", "text": "Max unambiguous range vs max unambiguous velocity"},
                {"id": "B", "text": "Beam width vs transmitter frequency"},
                {"id": "C", "text": "Pulse width vs receiver bandwidth"},
                {"id": "D", "text": "Attenuation vs antenna rotation speed"},
            ],
            "correct_option": "A",
            "explanation": "PRF selection directly affects the product of max unambiguous range and velocity.",
            "marks": 5.0,
            "order_index": 1,
        },
    )
    assert item_res.status_code == 201
    question_item = item_res.json()
    question_id = question_item["id"]
    assert len(question_item["options"]) == 4
    assert question_item["correct_option"] == "A"

    # 3. Retrieve questionnaire with questions
    get_res = await async_client.get(f"/api/v1/trainer/questionnaires/{q_id}", headers=headers)
    assert get_res.status_code == 200
    q_data = get_res.json()
    assert q_data["questions_count"] == 1
    assert q_data["questions"][0]["id"] == question_id

    # 4. Delete question and questionnaire
    del_q_item = await async_client.delete(f"/api/v1/trainer/questions/{question_id}", headers=headers)
    assert del_q_item.status_code == 204

    del_q = await async_client.delete(f"/api/v1/trainer/questionnaires/{q_id}", headers=headers)
    assert del_q.status_code == 204


@pytest.mark.asyncio
async def test_trainer_library_crud_and_upload(async_client: AsyncClient):
    """Test uploading and managing study materials, presentations, and lecture packs."""
    token = await create_and_approve_trainer(async_client, "trainer.lib@imd.gov.in", "Dr. E. Mukherjee")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. JSON library item creation
    post_res = await async_client.post(
        "/api/v1/trainer/library",
        headers=headers,
        json={
            "title": "Doppler Velocity De-aliasing Algorithms Notes",
            "description": "Comprehensive reference guide on four-dimensional de-aliasing techniques.",
            "resource_type": "study_material",
            "file_path": "/materials/dwr/de-aliasing.pdf",
            "file_size_bytes": 1048576,
            "sha256_checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "is_public_to_trainees": True,
        },
    )
    assert post_res.status_code == 201
    lib_item = post_res.json()
    item_id = lib_item["id"]
    assert lib_item["is_public_to_trainees"] is True

    # 2. File upload test via /resources/upload
    fake_file_content = b"PDF Mock Content: Numerical Weather Prediction Parameterization Guide"
    files = {
        "file": ("nwp_param.pdf", io.BytesIO(fake_file_content), "application/pdf")
    }
    data = {
        "title": "NWP Parameterization Lecture Handout",
        "resource_type": "presentation",
        "is_public_to_trainees": "true",
    }
    upload_res = await async_client.post(
        "/api/v1/trainer/resources/upload",
        headers=headers,
        files=files,
        data=data,
    )
    assert upload_res.status_code == 201
    uploaded_item = upload_res.json()
    assert uploaded_item["file_size_bytes"] == len(fake_file_content)
    assert len(uploaded_item["sha256_checksum"]) == 64

    # 3. List library items
    list_res = await async_client.get("/api/v1/trainer/library", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 2

    # 4. Delete library item
    del_res = await async_client.delete(f"/api/v1/trainer/library/{item_id}", headers=headers)
    assert del_res.status_code == 204


@pytest.mark.asyncio
async def test_trainer_resource_upload_rejects_unsafe_files(async_client: AsyncClient):
    """Phase 13 security: uploads enforce extension allowlists and sanitize filenames."""
    token = await create_and_approve_trainer(async_client, "trainer.sec@imd.gov.in", "Dr. S. Kulkarni")
    headers = {"Authorization": f"Bearer {token}"}
    data = {"title": "Unsafe Upload", "resource_type": "study_material"}

    # 1. Hidden executable extension must be rejected.
    rejected = await async_client.post(
        "/api/v1/trainer/resources/upload", headers=headers,
        files={"file": ("payload.exe", io.BytesIO(b"MZ"), "application/octet-stream")}, data=data,
    )
    assert rejected.status_code == 422

    # 2. Unknown resource types must be rejected.
    rejected_type = await async_client.post(
        "/api/v1/trainer/resources/upload", headers=headers,
        files={"file": ("notes.pdf", io.BytesIO(b"pdf"), "application/pdf")},
        data={**data, "resource_type": "script"},
    )
    assert rejected_type.status_code == 422

    # 3. Path traversal in the client filename is neutralized to a basename.
    traversing = await async_client.post(
        "/api/v1/trainer/resources/upload", headers=headers,
        files={"file": ("../../etc/cron.d/evil.pdf", io.BytesIO(b"PDF"), "application/pdf")}, data=data,
    )
    assert traversing.status_code == 201
    assert ".." not in traversing.json()["file_path"], "stored path must never contain traversal segments"


@pytest.mark.asyncio
async def test_trainer_dashboard_and_analytics(async_client: AsyncClient):
    """Test trainer dashboard counters and performance monitoring foundation."""
    token = await create_and_approve_trainer(async_client, "trainer.dash@imd.gov.in", "Dr. F. Nair")
    headers = {"Authorization": f"Bearer {token}"}

    # Create a course and questionnaire first
    c_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=headers,
        json={
            "code": "CYC-301",
            "title": "Tropical Cyclone Tracking and Warning Operations",
            "description": "Techniques for Dvorak intensity estimation and track forecasting.",
            "category": "Disaster Warning",
            "is_published": True,
        },
    )
    course_id = c_res.json()["id"]

    await async_client.post(
        "/api/v1/trainer/questionnaires",
        headers=headers,
        json={
            "title": "Cyclone Tracking Basics",
            "subject": "Tropical Meteorology",
        },
    )

    # Fetch dashboard
    dash_res = await async_client.get("/api/v1/trainer/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["total_courses"] == 1
    assert dash["published_courses"] == 1
    assert dash["total_questionnaires"] == 1
    assert dash["total_enrolled_trainees"] == 0

    # Fetch course analytics
    analytics_res = await async_client.get(f"/api/v1/trainer/analytics/courses/{course_id}", headers=headers)
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert analytics["course_id"] == course_id
    assert analytics["total_enrolled_trainees"] == 0


@pytest.mark.asyncio
async def test_trainer_cross_trainer_isolation(async_client: AsyncClient):
    """Verify that Trainer B cannot access, modify, or delete Trainer A's courses, library, or questionnaires."""
    token_a = await create_and_approve_trainer(async_client, "trainer.a@imd.gov.in", "Trainer Alpha")
    token_b = await create_and_approve_trainer(async_client, "trainer.b@imd.gov.in", "Trainer Beta")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Trainer A creates Course, Library Item, Questionnaire
    c_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=headers_a,
        json={
            "code": "RAD-101",
            "title": "Radar Operations Alpha",
            "description": "Owner is Trainer Alpha.",
            "category": "Radar",
        },
    )
    course_id = c_res.json()["id"]

    lib_res = await async_client.post(
        "/api/v1/trainer/library",
        headers=headers_a,
        json={
            "title": "Alpha Radar Notes",
            "resource_type": "study_material",
            "file_path": "/docs/alpha.pdf",
            "sha256_checksum": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        },
    )
    lib_id = lib_res.json()["id"]

    q_res = await async_client.post(
        "/api/v1/trainer/questionnaires",
        headers=headers_a,
        json={
            "title": "Alpha Radar Assessment",
            "subject": "Radar",
        },
    )
    q_id = q_res.json()["id"]

    # Trainer B tries to view Trainer A's course -> 404
    get_res = await async_client.get(f"/api/v1/trainer/courses/{course_id}", headers=headers_b)
    assert get_res.status_code == 404

    # Trainer B tries to modify Trainer A's course -> 404
    put_res = await async_client.put(
        f"/api/v1/trainer/courses/{course_id}",
        headers=headers_b,
        json={"title": "Hacked Title"},
    )
    assert put_res.status_code == 404

    # Trainer B tries to delete Trainer A's course -> 404
    del_c = await async_client.delete(f"/api/v1/trainer/courses/{course_id}", headers=headers_b)
    assert del_c.status_code == 404

    # Trainer B tries to delete Trainer A's library item -> 404
    del_lib = await async_client.delete(f"/api/v1/trainer/library/{lib_id}", headers=headers_b)
    assert del_lib.status_code == 404

    # Trainer B tries to delete Trainer A's questionnaire -> 404
    del_q = await async_client.delete(f"/api/v1/trainer/questionnaires/{q_id}", headers=headers_b)
    assert del_q.status_code == 404


@pytest.mark.asyncio
async def test_trainer_rbac_protection(async_client: AsyncClient):
    """Verify that a trainee cannot access trainer endpoints (403 Forbidden)."""
    trainee_token = await create_and_approve_trainee(async_client, "trainee.unauthorized@imd.gov.in", "Trainee User")
    headers = {"Authorization": f"Bearer {trainee_token}"}

    # Attempt to access /api/v1/trainer/profile
    prof_res = await async_client.get("/api/v1/trainer/profile", headers=headers)
    assert prof_res.status_code == 403

    # Attempt to access /api/v1/trainer/courses
    courses_res = await async_client.get("/api/v1/trainer/courses", headers=headers)
    assert courses_res.status_code == 403
