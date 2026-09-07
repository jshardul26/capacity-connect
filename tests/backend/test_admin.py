import pytest
from httpx import AsyncClient

# Reusable Admin, Trainer, Trainee Test Credentials
ADMIN_LOGIN_DATA = {
    "email": "admin.imd@moes.gov.in",
    "password": "Admin@CapacityConnect2026"
}


async def get_auth_token(client: AsyncClient, email: str, password: str) -> str:
    res = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_dashboard_metrics(async_client: AsyncClient):
    """
    Validates that the admin dashboard returns accurate platform-wide aggregated metrics.
    """
    admin_token = await get_auth_token(async_client, ADMIN_LOGIN_DATA["email"], ADMIN_LOGIN_DATA["password"])
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = await async_client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "total_users" in data
    assert "trainees_count" in data
    assert "trainers_count" in data
    assert "admins_count" in data
    assert "pending_approvals_count" in data
    assert "approved_users_count" in data
    assert "total_courses" in data
    assert "total_enrollments" in data
    assert "total_assessments" in data
    assert "overall_pass_rate_percentage" in data
    assert data["admins_count"] >= 1


@pytest.mark.asyncio
async def test_admin_user_approval_and_rejection_workflow(async_client: AsyncClient):
    """
    Tests registering users, viewing pending approvals, approving and rejecting.
    """
    admin_token = await get_auth_token(async_client, ADMIN_LOGIN_DATA["email"], ADMIN_LOGIN_DATA["password"])
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Register a new trainee
    signup_data = {
        "email": "trainee.new.admin@imd.gov.in",
        "password": "Password@123",
        "full_name": "Trainee For Admin Approval",
        "phone_number": "+919876543211",
        "station_code": "IMD-KOC",
        "role": "trainee"
    }
    signup_res = await async_client.post("/api/v1/auth/signup", json=signup_data)
    assert signup_res.status_code == 201
    user_id = signup_res.json()["id"]

    # 2. Check pending queue
    pending_res = await async_client.get("/api/v1/admin/users/pending", headers=admin_headers)
    assert pending_res.status_code == 200
    pending_ids = [u["id"] for u in pending_res.json()]
    assert user_id in pending_ids

    # 3. Approve the user
    approve_res = await async_client.post(f"/api/v1/admin/users/{user_id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # Verify no longer in pending
    pending_res2 = await async_client.get("/api/v1/admin/users/pending", headers=admin_headers)
    pending_ids2 = [u["id"] for u in pending_res2.json()]
    assert user_id not in pending_ids2

    # 4. Register another user to reject
    rej_signup = {
        "email": "trainee.to.reject@imd.gov.in",
        "password": "Password@123",
        "full_name": "Trainee To Reject",
        "station_code": "IMD-LEH",
        "role": "trainee"
    }
    rej_res = await async_client.post("/api/v1/auth/signup", json=rej_signup)
    rej_user_id = rej_res.json()["id"]

    # Reject
    reject_res = await async_client.post(f"/api/v1/admin/users/{rej_user_id}/reject", headers=admin_headers)
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"


@pytest.mark.asyncio
async def test_admin_user_role_and_status_management(async_client: AsyncClient):
    """
    Tests modifying user roles (trainee -> trainer) and status (approved -> suspended).
    """
    admin_token = await get_auth_token(async_client, ADMIN_LOGIN_DATA["email"], ADMIN_LOGIN_DATA["password"])
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Register and approve user
    signup_data = {
        "email": "officer.promote@imd.gov.in",
        "password": "Password@123",
        "full_name": "Officer Promote",
        "station_code": "IMD-DEL",
        "role": "trainee"
    }
    signup_res = await async_client.post("/api/v1/auth/signup", json=signup_data)
    user_id = signup_res.json()["id"]
    await async_client.post(f"/api/v1/admin/users/{user_id}/approve", headers=admin_headers)

    # 1. Promote to trainer
    role_res = await async_client.put(
        f"/api/v1/admin/users/{user_id}/role",
        json={"role": "trainer"},
        headers=admin_headers
    )
    assert role_res.status_code == 200
    assert role_res.json()["new_role"] == "trainer"

    # 2. Suspend user
    status_res = await async_client.put(
        f"/api/v1/admin/users/{user_id}/status",
        json={"status": "suspended"},
        headers=admin_headers
    )
    assert status_res.status_code == 200
    assert status_res.json()["new_status"] == "suspended"

    # 3. Check /admin/users listing
    users_res = await async_client.get("/api/v1/admin/users?role=trainer&status=suspended", headers=admin_headers)
    assert users_res.status_code == 200
    found = [u for u in users_res.json() if u["id"] == user_id]
    assert len(found) == 1
    assert found[0]["role"] == "trainer"
    assert found[0]["status"] == "suspended"


@pytest.mark.asyncio
async def test_admin_rbac_protection(async_client: AsyncClient):
    """
    Ensures trainee and trainer roles are strictly forbidden (HTTP 403) from admin endpoints.
    """
    admin_token = await get_auth_token(async_client, ADMIN_LOGIN_DATA["email"], ADMIN_LOGIN_DATA["password"])
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Register & approve trainee
    trainee_signup = {
        "email": "trainee.unauthorized@imd.gov.in",
        "password": "Password@123",
        "full_name": "Unauthorized Trainee",
        "role": "trainee"
    }
    res = await async_client.post("/api/v1/auth/signup", json=trainee_signup)
    trainee_id = res.json()["id"]
    await async_client.post(f"/api/v1/admin/users/{trainee_id}/approve", headers=admin_headers)

    trainee_token = await get_auth_token(async_client, "trainee.unauthorized@imd.gov.in", "Password@123")
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # Trainee attempts admin operations
    r1 = await async_client.get("/api/v1/admin/dashboard", headers=trainee_headers)
    assert r1.status_code == 403

    r2 = await async_client.get("/api/v1/admin/users", headers=trainee_headers)
    assert r2.status_code == 403

    r3 = await async_client.post(
        "/api/v1/admin/announcements",
        json={"title": "Unauthorized", "content": "Forbidden"},
        headers=trainee_headers
    )
    assert r3.status_code == 403


@pytest.mark.asyncio
async def test_admin_courses_governance_and_audit(async_client: AsyncClient):
    """
    Tests administrative course audit and publishing overrides.
    """
    admin_token = await get_auth_token(async_client, ADMIN_LOGIN_DATA["email"], ADMIN_LOGIN_DATA["password"])
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Register & approve trainer
    trainer_signup = {
        "email": "trainer.audit@imd.gov.in",
        "password": "Password@123",
        "full_name": "Dr. Trainer Audit",
        "role": "trainer"
    }
    t_res = await async_client.post("/api/v1/auth/signup", json=trainer_signup)
    trainer_id = t_res.json()["id"]
    await async_client.post(f"/api/v1/admin/users/{trainer_id}/approve", headers=admin_headers)

    trainer_token = await get_auth_token(async_client, "trainer.audit@imd.gov.in", "Password@123")
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}

    # Trainer creates draft course
    course_data = {
        "title": "Audit Governance Course",
        "code": "MET-ADMIN-AUDIT",
        "description": "Administrative audit course",
        "category": "Radar Meteorology",
        "is_published": False
    }
    c_res = await async_client.post("/api/v1/trainer/courses", json=course_data, headers=trainer_headers)
    assert c_res.status_code == 201
    course_id = c_res.json()["id"]

    # Admin lists courses
    admin_courses_res = await async_client.get("/api/v1/admin/courses", headers=admin_headers)
    assert admin_courses_res.status_code == 200
    course_entry = next((c for c in admin_courses_res.json() if c["id"] == course_id), None)
    assert course_entry is not None
    assert course_entry["is_published"] is False

    # Admin forces publication
    pub_res = await async_client.put(
        f"/api/v1/admin/courses/{course_id}/publish?is_published=true",
        headers=admin_headers
    )
    assert pub_res.status_code == 200
    assert pub_res.json()["is_published"] is True


@pytest.mark.asyncio
async def test_admin_announcements_crud_and_public_feed(async_client: AsyncClient):
    """
    Tests creating, updating, public listing, and deleting announcements.
    """
    admin_token = await get_auth_token(async_client, ADMIN_LOGIN_DATA["email"], ADMIN_LOGIN_DATA["password"])
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin creates announcement
    ann_data = {
        "title": "Monsoon 2026 Preparedness Conference",
        "content": "All station officers must complete the updated NWP radar modules.",
        "is_featured_on_homepage": True,
        "is_active": True
    }
    res = await async_client.post("/api/v1/admin/announcements", json=ann_data, headers=admin_headers)
    assert res.status_code == 201
    ann = res.json()
    ann_id = ann["id"]
    assert ann["title"] == ann_data["title"]
    assert ann["is_featured_on_homepage"] is True

    # 2. Public feed contains announcement
    public_res = await async_client.get("/api/v1/announcements?featured_only=true")
    assert public_res.status_code == 200
    featured = public_res.json()
    assert any(a["id"] == ann_id for a in featured)

    # 3. Admin updates announcement
    upd_res = await async_client.put(
        f"/api/v1/admin/announcements/{ann_id}",
        json={"title": "Monsoon 2026 Preparedness Conference (UPDATED)"},
        headers=admin_headers
    )
    assert upd_res.status_code == 200
    assert "UPDATED" in upd_res.json()["title"]

    # 4. Admin deletes announcement
    del_res = await async_client.delete(f"/api/v1/admin/announcements/{ann_id}", headers=admin_headers)
    assert del_res.status_code == 200


@pytest.mark.asyncio
async def test_admin_notifications_and_user_read(async_client: AsyncClient):
    """
    Tests admin sending notifications and trainee receiving/marking read.
    """
    admin_token = await get_auth_token(async_client, ADMIN_LOGIN_DATA["email"], ADMIN_LOGIN_DATA["password"])
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Register & approve trainee
    trainee_signup = {
        "email": "trainee.notif@imd.gov.in",
        "password": "Password@123",
        "full_name": "Trainee Notification Receiver",
        "role": "trainee"
    }
    res = await async_client.post("/api/v1/auth/signup", json=trainee_signup)
    trainee_id = res.json()["id"]
    await async_client.post(f"/api/v1/admin/users/{trainee_id}/approve", headers=admin_headers)

    trainee_token = await get_auth_token(async_client, "trainee.notif@imd.gov.in", "Password@123")
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # Admin sends notification to this trainee
    notif_data = {
        "user_id": trainee_id,
        "title": "Welcome to Capacity Connect",
        "message": "Your profile has been cleared by administration.",
        "notification_type": "success"
    }
    n_res = await async_client.post("/api/v1/admin/notifications", json=notif_data, headers=admin_headers)
    assert n_res.status_code == 201
    notif_id = n_res.json()["id"]

    # Trainee reads notifications
    my_notifs = await async_client.get("/api/v1/notifications/me", headers=trainee_headers)
    assert my_notifs.status_code == 200
    notifs_list = my_notifs.json()
    assert any(n["id"] == notif_id for n in notifs_list)

    # Trainee marks read
    read_res = await async_client.post(f"/api/v1/notifications/{notif_id}/read", headers=trainee_headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True


@pytest.mark.asyncio
async def test_admin_achievements_and_audit_logs(async_client: AsyncClient):
    """
    Tests awarding an achievement badge and verifying the audit log trail.
    """
    admin_token = await get_auth_token(async_client, ADMIN_LOGIN_DATA["email"], ADMIN_LOGIN_DATA["password"])
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Register & approve trainee
    trainee_signup = {
        "email": "trainee.achieve@imd.gov.in",
        "password": "Password@123",
        "full_name": "Trainee Achiever",
        "role": "trainee"
    }
    res = await async_client.post("/api/v1/auth/signup", json=trainee_signup)
    trainee_id = res.json()["id"]
    await async_client.post(f"/api/v1/admin/users/{trainee_id}/approve", headers=admin_headers)

    # 1. Admin awards achievement
    ach_data = {
        "user_id": trainee_id,
        "title": "Doppler Radar Operations Specialist",
        "description": "Completed all radar calibration competency criteria.",
        "badge_icon_url": "/badges/radar-specialist.png",
        "is_displayed_on_homepage": True
    }
    a_res = await async_client.post("/api/v1/admin/achievements", json=ach_data, headers=admin_headers)
    assert a_res.status_code == 201
    ach_id = a_res.json()["id"]

    # 2. Check homepage showcase
    home_ach = await async_client.get("/api/v1/achievements/homepage")
    assert home_ach.status_code == 200
    assert any(item["id"] == ach_id for item in home_ach.json())

    # 3. Check audit logs
    audit_res = await async_client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    actions = [l["action"] for l in logs]
    assert "ACHIEVEMENT_AWARD" in actions
    assert "USER_APPROVE" in actions
