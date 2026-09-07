import pytest
from httpx import AsyncClient

DEFAULT_ADMIN_EMAIL = "admin.imd@moes.gov.in"
DEFAULT_ADMIN_PASSWORD = "Admin@CapacityConnect2026"


async def create_and_approve_trainer(
    client: AsyncClient,
    email: str = "trainer.lms@imd.gov.in",
    full_name: str = "Dr. C. Raman"
) -> str:
    """Helper to register and approve a trainer, returning their access token."""
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


async def create_and_approve_trainee(
    client: AsyncClient,
    email: str = "trainee.lms@imd.gov.in",
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
async def test_course_catalog_discovery_and_filtering(async_client: AsyncClient):
    """Test public course catalog discovery, filtering by category/level/search, and pagination."""
    trainer_token = await create_and_approve_trainer(
        async_client, "trainer.cat@imd.gov.in", "Dr. S. K. Bose"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}

    # 1. Create a published course
    pub_course_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=trainer_headers,
        json={
            "code": "MET-501",
            "title": "Satellite Meteorology & Cyclone Genesis",
            "description": "Comprehensive remote sensing techniques for tracking tropical cyclones.",
            "category": "Remote Sensing",
            "level": "intermediate",
            "estimated_hours": 16.0,
            "is_published": True,
        },
    )
    assert pub_course_res.status_code == 201
    pub_course_id = pub_course_res.json()["id"]

    # 2. Create an unpublished draft course
    draft_course_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=trainer_headers,
        json={
            "code": "MET-502-DRAFT",
            "title": "Draft NWP Physics Parametrization",
            "description": "Internal curriculum draft for microphysics.",
            "category": "NWP",
            "level": "advanced",
            "estimated_hours": 20.0,
            "is_published": False,
        },
    )
    assert draft_course_res.status_code == 201

    # 3. Discover catalog without authentication (public access)
    catalog_res = await async_client.get("/api/v1/courses")
    assert catalog_res.status_code == 200
    catalog = catalog_res.json()
    codes = [c["code"] for c in catalog]
    assert "MET-501" in codes
    assert "MET-502-DRAFT" not in codes  # Draft must not appear in public catalog

    # 4. Filter by category
    cat_res = await async_client.get("/api/v1/courses?category=Remote%20Sensing")
    assert cat_res.status_code == 200
    assert all(c["category"] == "Remote Sensing" for c in cat_res.json())

    # 5. Filter by level
    lvl_res = await async_client.get("/api/v1/courses?level=intermediate")
    assert lvl_res.status_code == 200
    assert any(c["code"] == "MET-501" for c in lvl_res.json())

    # 6. Search query
    search_res = await async_client.get("/api/v1/courses?search=Cyclone")
    assert search_res.status_code == 200
    assert any("Cyclone" in c["title"] for c in search_res.json())


@pytest.mark.asyncio
async def test_course_enrollment_and_unenrollment(async_client: AsyncClient):
    """Test trainee enrollment, querying enrolled courses, and unenrollment."""
    trainer_token = await create_and_approve_trainer(
        async_client, "trainer.enr@imd.gov.in", "Dr. A. Sen"
    )
    trainee_token = await create_and_approve_trainee(
        async_client, "trainee.enr@imd.gov.in", "Ananya Ghosh"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Create a published course
    course_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=trainer_headers,
        json={
            "code": "MET-503",
            "title": "Aviation Meteorology & SIGMET Issuance",
            "description": "Terminal aerodrome forecasts and clear-air turbulence detection.",
            "category": "Aviation",
            "level": "beginner",
            "estimated_hours": 10.0,
            "is_published": True,
        },
    )
    assert course_res.status_code == 201
    course_id = course_res.json()["id"]

    # 2. Trainee enrolls
    enroll_res = await async_client.post(
        f"/api/v1/courses/{course_id}/enroll",
        headers=trainee_headers,
    )
    assert enroll_res.status_code == 200
    enroll_data = enroll_res.json()
    assert enroll_data["status"] == "in_progress"
    assert enroll_data["course_id"] == course_id

    # 3. Check my enrolled courses
    my_courses_res = await async_client.get(
        "/api/v1/courses/enrolled/me",
        headers=trainee_headers,
    )
    assert my_courses_res.status_code == 200
    enrolled_list = my_courses_res.json()
    assert len(enrolled_list) >= 1
    assert any(item["course"]["id"] == course_id for item in enrolled_list)

    # 4. Trainee drops/unenrolls course
    drop_res = await async_client.delete(
        f"/api/v1/courses/{course_id}/enroll",
        headers=trainee_headers,
    )
    assert drop_res.status_code == 204

    # 5. Check my enrolled courses after dropping
    my_courses_after = await async_client.get(
        "/api/v1/courses/enrolled/me",
        headers=trainee_headers,
    )
    assert my_courses_after.status_code == 200
    assert not any(item["course"]["id"] == course_id for item in my_courses_after.json())

    # 6. Re-enroll activates status
    re_enroll = await async_client.post(
        f"/api/v1/courses/{course_id}/enroll",
        headers=trainee_headers,
    )
    assert re_enroll.status_code == 200
    assert re_enroll.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_course_structure_and_learning_resources(async_client: AsyncClient):
    """Test modules, lessons, attaching learning resources (video, presentation, PDF), and viewing structure."""
    trainer_token = await create_and_approve_trainer(
        async_client, "trainer.res@imd.gov.in", "Dr. H. J. Bhabha"
    )
    trainee_token = await create_and_approve_trainee(
        async_client, "trainee.res@imd.gov.in", "Karan Verma"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Create course
    course_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=trainer_headers,
        json={
            "code": "MET-504",
            "title": "Doppler Radar Data Quality Control",
            "description": "Ground clutter removal and de-aliasing techniques.",
            "category": "Radar",
            "level": "intermediate",
            "is_published": True,
        },
    )
    course_id = course_res.json()["id"]

    # 2. Add module
    mod_res = await async_client.post(
        f"/api/v1/trainer/courses/{course_id}/modules",
        headers=trainer_headers,
        json={"title": "Module 1: Clutter Filtering", "order_index": 1},
    )
    assert mod_res.status_code == 201
    module_id = mod_res.json()["id"]

    # 3. Add lesson
    lesson_res = await async_client.post(
        f"/api/v1/trainer/modules/{module_id}/lessons",
        headers=trainer_headers,
        json={
            "title": "Lesson 1: I&Q Signal Phase Filtering",
            "content_text": "In-phase and quadrature component spectrum analysis.",
            "duration_minutes": 40,
            "order_index": 1,
        },
    )
    assert lesson_res.status_code == 201
    lesson_id = lesson_res.json()["id"]

    # 4. Attach learning resources to lesson (video and PDF)
    video_res = await async_client.post(
        f"/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/resources",
        headers=trainer_headers,
        json={
            "title": "Lecture Video: Signal Clutter Processing",
            "resource_type": "video",
            "file_url": "https://media.capacity-connect.imd.gov.in/videos/clutter_proc.mp4",
            "file_size_bytes": 104857600,
            "sha256_checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "duration_seconds": 2400,
        },
    )
    assert video_res.status_code == 201
    video_data = video_res.json()
    assert video_data["resource_type"] == "video"

    pdf_res = await async_client.post(
        f"/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/resources",
        headers=trainer_headers,
        json={
            "title": "Study Notes: Signal Clutter Reference Guide",
            "resource_type": "study_material",
            "file_url": "https://media.capacity-connect.imd.gov.in/docs/clutter_guide.pdf",
            "file_size_bytes": 2097152,
            "sha256_checksum": "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
        },
    )
    assert pdf_res.status_code == 201

    # 5. Trainee attempts to attach resource (Forbidden - only trainer/admin can attach)
    unauth_res = await async_client.post(
        f"/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/resources",
        headers=trainee_headers,
        json={
            "title": "Unauthorized Resource",
            "resource_type": "video",
            "file_url": "https://example.com/unauth.mp4",
            "file_size_bytes": 100,
            "sha256_checksum": "0000000000000000000000000000000000000000000000000000000000000000",
        },
    )
    assert unauth_res.status_code == 403

    # 6. Trainee views course structure
    struct_res = await async_client.get(
        f"/api/v1/courses/{course_id}",
        headers=trainee_headers,
    )
    assert struct_res.status_code == 200
    struct = struct_res.json()
    assert struct["id"] == course_id
    assert len(struct["modules"]) == 1
    mod = struct["modules"][0]
    assert len(mod["lessons"]) == 1
    les = mod["lessons"][0]
    assert len(les["learning_resources"]) == 2
    types = [r["resource_type"] for r in les["learning_resources"]]
    assert "video" in types
    assert "study_material" in types


@pytest.mark.asyncio
async def test_lesson_progress_tracking_and_auto_completion(async_client: AsyncClient):
    """Test tracking watch time, marking lessons completed, and automatic course enrollment completion."""
    trainer_token = await create_and_approve_trainer(
        async_client, "trainer.prog@imd.gov.in", "Dr. Vikram Sarabhai"
    )
    trainee_token = await create_and_approve_trainee(
        async_client, "trainee.prog@imd.gov.in", "Rohit Kumar"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Create course with 2 lessons
    course_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=trainer_headers,
        json={
            "code": "MET-505",
            "title": "Numerical Weather Prediction Fundamentals",
            "description": "Grid resolutions and finite difference methods.",
            "category": "NWP",
            "level": "intermediate",
            "is_published": True,
        },
    )
    course_id = course_res.json()["id"]

    mod_res = await async_client.post(
        f"/api/v1/trainer/courses/{course_id}/modules",
        headers=trainer_headers,
        json={"title": "Module 1: Finite Differences", "order_index": 1},
    )
    module_id = mod_res.json()["id"]

    les1_res = await async_client.post(
        f"/api/v1/trainer/modules/{module_id}/lessons",
        headers=trainer_headers,
        json={"title": "Lesson 1: Forward Euler Scheme", "duration_minutes": 30, "order_index": 1},
    )
    lesson1_id = les1_res.json()["id"]

    les2_res = await async_client.post(
        f"/api/v1/trainer/modules/{module_id}/lessons",
        headers=trainer_headers,
        json={"title": "Lesson 2: Leapfrog Scheme & Stability", "duration_minutes": 30, "order_index": 2},
    )
    lesson2_id = les2_res.json()["id"]

    # 2. Attempt progress update before enrollment (Should fail 403)
    unauth_prog = await async_client.post(
        f"/api/v1/courses/{course_id}/progress",
        headers=trainee_headers,
        json={"lesson_id": lesson1_id, "watch_time_seconds": 600, "is_completed": True},
    )
    assert unauth_prog.status_code == 403

    # 3. Enroll in course
    enroll_res = await async_client.post(
        f"/api/v1/courses/{course_id}/enroll",
        headers=trainee_headers,
    )
    assert enroll_res.status_code == 200

    # 4. Complete Lesson 1
    prog1_res = await async_client.post(
        f"/api/v1/courses/{course_id}/progress",
        headers=trainee_headers,
        json={"lesson_id": lesson1_id, "watch_time_seconds": 1800, "is_completed": True},
    )
    assert prog1_res.status_code == 200
    assert prog1_res.json()["is_completed"] is True
    assert prog1_res.json()["watch_time_seconds"] == 1800

    # Verify course structure shows 50% progress (1 of 2 completed)
    detail_res = await async_client.get(
        f"/api/v1/courses/{course_id}",
        headers=trainee_headers,
    )
    assert detail_res.status_code == 200
    assert detail_res.json()["progress_percentage"] == 50.0
    assert lesson1_id in detail_res.json()["completed_lesson_ids"]

    # 5. Complete Lesson 2 -> Triggers auto-completion of entire course enrollment
    prog2_res = await async_client.post(
        f"/api/v1/courses/{course_id}/progress",
        headers=trainee_headers,
        json={"lesson_id": lesson2_id, "watch_time_seconds": 1800, "is_completed": True},
    )
    assert prog2_res.status_code == 200

    # Check enrolled courses shows completed
    my_courses_res = await async_client.get(
        "/api/v1/courses/enrolled/me",
        headers=trainee_headers,
    )
    assert my_courses_res.status_code == 200
    enrolled_record = next(
        item for item in my_courses_res.json() if item["course"]["id"] == course_id
    )
    assert enrolled_record["status"] == "completed"
    assert enrolled_record["progress_percentage"] == 100.0
    assert enrolled_record["completed_at"] is not None


@pytest.mark.asyncio
async def test_course_feedback_submission(async_client: AsyncClient):
    """Test leaving feedback and numerical rating for an enrolled course."""
    trainer_token = await create_and_approve_trainer(
        async_client, "trainer.fb@imd.gov.in", "Dr. Satish Dhawan"
    )
    trainee_token = await create_and_approve_trainee(
        async_client, "trainee.fb@imd.gov.in", "Priya Nair"
    )
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # 1. Create published course
    course_res = await async_client.post(
        "/api/v1/trainer/courses",
        headers=trainer_headers,
        json={
            "code": "MET-506",
            "title": "Monsoon Meteorology Dynamics",
            "description": "Tibetan anticyclone and Somali jet stream analysis.",
            "category": "Synoptic",
            "level": "intermediate",
            "is_published": True,
        },
    )
    course_id = course_res.json()["id"]

    # 2. Non-enrolled trainee attempts feedback (Forbidden 403)
    unauth_fb = await async_client.post(
        f"/api/v1/courses/{course_id}/feedback",
        headers=trainee_headers,
        json={"rating": 5, "feedback_text": "Great course!"},
    )
    assert unauth_fb.status_code == 403

    # 3. Enroll trainee
    await async_client.post(
        f"/api/v1/courses/{course_id}/enroll",
        headers=trainee_headers,
    )

    # 4. Submit feedback
    fb_res = await async_client.post(
        f"/api/v1/courses/{course_id}/feedback",
        headers=trainee_headers,
        json={
            "rating": 5,
            "feedback_text": "Outstanding coverage of low-level jet streams.",
        },
    )
    assert fb_res.status_code == 201
    fb_data = fb_res.json()
    assert fb_data["rating"] == 5
    assert fb_data["feedback_text"] == "Outstanding coverage of low-level jet streams."
    assert fb_data["user_name"] == "Priya Nair"

    # 5. Check course detail shows feedback and rating
    detail_res = await async_client.get(
        f"/api/v1/courses/{course_id}",
        headers=trainee_headers,
    )
    assert detail_res.status_code == 200
    course_detail = detail_res.json()
    assert course_detail["average_rating"] == 5.0
    assert course_detail["total_ratings"] == 1
    assert len(course_detail["feedbacks"]) == 1
