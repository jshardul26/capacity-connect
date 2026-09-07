import pytest
from httpx import AsyncClient


DEFAULT_ADMIN_EMAIL = "admin.imd@moes.gov.in"
DEFAULT_ADMIN_PASSWORD = "Admin@CapacityConnect2026"


@pytest.mark.asyncio
async def test_admin_default_seed_login(async_client: AsyncClient):
    """Verify seeded default admin can log in and receives JWT access/refresh tokens."""
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == DEFAULT_ADMIN_EMAIL
    assert data["user"]["role"] == "admin"
    assert data["user"]["status"] == "approved"


@pytest.mark.asyncio
async def test_trainee_registration_pending_approval(async_client: AsyncClient):
    """Verify a new trainee registers with pending_approval status and cannot log in until approved."""
    signup_payload = {
        "email": "trainee.met@imd.gov.in",
        "password": "SecurePassword123!",
        "full_name": "Rohan Sharma",
        "role": "trainee",
        "phone_number": "+919876543210",
        "station_code": "IMD-HQ-DELHI",
        "organization": "India Meteorological Department (IMD)",
    }
    response = await async_client.post("/api/v1/auth/signup", json=signup_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "trainee.met@imd.gov.in"
    assert data["role"] == "trainee"
    assert data["status"] == "pending_approval"
    assert "awaiting administrative approval" in data["message"].lower() or "account created" in data["message"].lower()

    # Attempt login before admin approval -> should fail with 403
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "trainee.met@imd.gov.in", "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 403
    assert "pending" in login_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_trainer_registration(async_client: AsyncClient):
    """Verify a new trainer can register successfully."""
    signup_payload = {
        "email": "trainer.radar@imd.gov.in",
        "password": "TrainerPassword123!",
        "full_name": "Dr. Sunita Rao",
        "role": "trainer",
        "station_code": "IMD-MUMBAI-RADAR",
        "organization": "IMD Radar Division",
    }
    response = await async_client.post("/api/v1/auth/signup", json=signup_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "trainer.radar@imd.gov.in"
    assert data["role"] == "trainer"
    assert data["status"] == "pending_approval"


@pytest.mark.asyncio
async def test_admin_self_registration_forbidden(async_client: AsyncClient):
    """Self-registration with 'admin' role must be rejected (422 schema validation or 400)."""
    signup_payload = {
        "email": "rogue.admin@imd.gov.in",
        "password": "RoguePassword123!",
        "full_name": "Rogue Admin",
        "role": "admin",
    }
    response = await async_client.post("/api/v1/auth/signup", json=signup_payload)
    assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_duplicate_email_registration_conflict(async_client: AsyncClient):
    """Registering with an already existing email returns 409 Conflict."""
    signup_payload = {
        "email": "duplicate.test@imd.gov.in",
        "password": "Password123!",
        "full_name": "First User",
        "role": "trainee",
    }
    res1 = await async_client.post("/api/v1/auth/signup", json=signup_payload)
    assert res1.status_code == 201

    res2 = await async_client.post("/api/v1/auth/signup", json=signup_payload)
    assert res2.status_code == 409
    assert "already registered" in res2.json()["detail"].lower() or "already exists" in res2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_invalid_login_credentials(async_client: AsyncClient):
    """Invalid password or non-existent user returns 401."""
    # Wrong password for existing admin
    res1 = await async_client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": "WrongPassword123"},
    )
    assert res1.status_code == 401

    # Non-existent user
    res2 = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@moes.gov.in", "password": "Password123!"},
    )
    assert res2.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_endpoint_and_token_refresh(async_client: AsyncClient):
    """Test /me profile retrieval and token refresh flows."""
    # 1. Login as admin
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    tokens = login_res.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # 2. Access /me without token -> 401
    unauth_res = await async_client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # 3. Access /me with invalid token -> 401
    bad_res = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert bad_res.status_code == 401

    # 4. Access /me with valid token -> 200
    me_res = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == DEFAULT_ADMIN_EMAIL
    assert profile["role"] == "admin"

    # 5. Refresh token
    refresh_res = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    refresh_data = refresh_res.json()
    assert "access_token" in refresh_data
    assert refresh_data["token_type"] == "bearer"

    # 6. Logout and verify token revocation
    logout_res = await async_client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_res.status_code == 200

    # 7. Access /me with revoked token -> 401
    post_logout_res = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert post_logout_res.status_code == 401


@pytest.mark.asyncio
async def test_admin_approval_and_rbac_workflow(async_client: AsyncClient):
    """
    Complete end-to-end RBAC test:
    1. Trainee registers (pending_approval)
    2. Trainer registers (pending_approval)
    3. Admin logs in
    4. Admin lists pending users
    5. Admin approves trainee
    6. Admin rejects trainer
    7. Trainee logs in and verifies RBAC access
    8. Rejected trainer attempts login and receives 403
    """
    # 1. Register Trainee
    trainee_signup = {
        "email": "trainee.workflow@imd.gov.in",
        "password": "Password1234!",
        "full_name": "Trainee Workflow",
        "role": "trainee",
    }
    t_res = await async_client.post("/api/v1/auth/signup", json=trainee_signup)
    assert t_res.status_code == 201
    trainee_id = t_res.json()["id"]

    # 2. Register Trainer
    trainer_signup = {
        "email": "trainer.workflow@imd.gov.in",
        "password": "Password1234!",
        "full_name": "Trainer Workflow",
        "role": "trainer",
    }
    tr_res = await async_client.post("/api/v1/auth/signup", json=trainer_signup)
    assert tr_res.status_code == 201
    trainer_id = tr_res.json()["id"]

    # 3. Admin Login
    admin_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 4. Admin lists pending users
    pending_res = await async_client.get("/api/v1/admin/users/pending", headers=admin_headers)
    assert pending_res.status_code == 200
    pending_users = pending_res.json()
    pending_emails = [u["email"] for u in pending_users]
    assert "trainee.workflow@imd.gov.in" in pending_emails
    assert "trainer.workflow@imd.gov.in" in pending_emails

    # 5. Admin approves trainee
    approve_res = await async_client.post(
        f"/api/v1/admin/users/{trainee_id}/approve",
        headers=admin_headers,
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # 6. Admin rejects trainer
    reject_res = await async_client.post(
        f"/api/v1/admin/users/{trainer_id}/reject",
        headers=admin_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"

    # 7. Approved trainee logs in
    t_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "trainee.workflow@imd.gov.in", "password": "Password1234!"},
    )
    assert t_login.status_code == 200
    trainee_token = t_login.json()["access_token"]
    trainee_headers = {"Authorization": f"Bearer {trainee_token}"}

    # Verify Trainee RBAC
    # Trainee can access trainee test endpoint
    t_test_res = await async_client.get("/api/v1/auth/test/trainee", headers=trainee_headers)
    assert t_test_res.status_code == 200
    assert "trainee" in t_test_res.json()["message"].lower()

    # Trainee CANNOT access trainer test endpoint (403)
    t_trainer_res = await async_client.get("/api/v1/auth/test/trainer", headers=trainee_headers)
    assert t_trainer_res.status_code == 403

    # Trainee CANNOT access admin test endpoint (403)
    t_admin_res = await async_client.get("/api/v1/auth/test/admin", headers=trainee_headers)
    assert t_admin_res.status_code == 403

    # Trainee CANNOT access admin pending users endpoint (403)
    t_pending_res = await async_client.get("/api/v1/admin/users/pending", headers=trainee_headers)
    assert t_pending_res.status_code == 403

    # Admin CAN access all test endpoints
    assert (await async_client.get("/api/v1/auth/test/trainee", headers=admin_headers)).status_code == 200
    assert (await async_client.get("/api/v1/auth/test/trainer", headers=admin_headers)).status_code == 200
    assert (await async_client.get("/api/v1/auth/test/admin", headers=admin_headers)).status_code == 200

    # 8. Rejected trainer attempts login -> 403
    tr_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "trainer.workflow@imd.gov.in", "password": "Password1234!"},
    )
    assert tr_login.status_code == 403
    assert "rejected" in tr_login.json()["detail"].lower()


@pytest.mark.asyncio
async def test_dev_endpoints_blocked_in_production(async_client: AsyncClient, monkeypatch):
    """Verify development-only test routes return 404 in production environment."""
    from app.core.config import settings

    admin_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Simulate production environment
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    # In production, /test/* endpoints must return 404 Not Found
    res1 = await async_client.get("/api/v1/auth/test/trainee", headers=admin_headers)
    assert res1.status_code == 404

    res2 = await async_client.get("/api/v1/auth/test/trainer", headers=admin_headers)
    assert res2.status_code == 404

    res3 = await async_client.get("/api/v1/auth/test/admin", headers=admin_headers)
    assert res3.status_code == 404

