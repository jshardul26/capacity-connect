import pytest
from httpx import AsyncClient

DEFAULT_ADMIN_EMAIL = "admin.imd@moes.gov.in"
DEFAULT_ADMIN_PASSWORD = "Admin@CapacityConnect2026"


async def create_and_approve_trainee(
    client: AsyncClient,
    email: str = "trainee.phase3@imd.gov.in",
    full_name: str = "Pooja Patel"
) -> str:
    """Helper to register and approve a trainee, returning their access token."""
    # 1. Register trainee
    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": full_name,
            "role": "trainee",
            "station_code": "IMD-HQ-DELHI",
        },
    )
    assert signup_res.status_code == 201
    trainee_id = signup_res.json()["id"]

    # 2. Login as admin and approve trainee
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    admin_token = admin_login.json()["access_token"]
    approve_res = await client.post(
        f"/api/v1/admin/users/{trainee_id}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert approve_res.status_code == 200

    # 3. Login as trainee and return token
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    return login_res.json()["access_token"]


@pytest.mark.asyncio
async def test_trainee_profile_get_and_update(async_client: AsyncClient):
    """Test getting and updating a trainee's professional profile."""
    token = await create_and_approve_trainee(async_client, "trainee.profile@imd.gov.in", "S. Sharma")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET initial profile
    get_res = await async_client.get("/api/v1/trainee/profile", headers=headers)
    assert get_res.status_code == 200
    profile = get_res.json()
    assert profile["email"] == "trainee.profile@imd.gov.in"
    assert profile["role"] == "trainee"
    assert profile["designation"] is None

    # 2. PUT update profile
    update_payload = {
        "designation": "Meteorologist Gr-II",
        "department": "Radar Meteorology Division",
        "posting_location": "DWR Station, Kochi",
        "bio": "Specializing in coastal Doppler radar maintenance and radar reflectivity calibration.",
    }
    put_res = await async_client.put("/api/v1/trainee/profile", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["designation"] == "Meteorologist Gr-II"
    assert updated["department"] == "Radar Meteorology Division"
    assert updated["posting_location"] == "DWR Station, Kochi"

    # 3. GET profile again to verify persistence
    get_res2 = await async_client.get("/api/v1/trainee/profile", headers=headers)
    assert get_res2.status_code == 200
    profile2 = get_res2.json()
    assert profile2["designation"] == "Meteorologist Gr-II"
    assert profile2["bio"] == update_payload["bio"]


@pytest.mark.asyncio
async def test_trainee_qualifications_crud(async_client: AsyncClient):
    """Test creating, listing, and deleting qualifications."""
    token = await create_and_approve_trainee(async_client, "trainee.qual@imd.gov.in", "Anil Kumar")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add qualification
    qual_payload = {
        "degree": "M.Sc.",
        "field_of_study": "Atmospheric Sciences",
        "institution": "Cochin University of Science and Technology (CUSAT)",
        "passing_year": 2022,
        "grade_or_percentage": "8.8 CGPA",
    }
    post_res = await async_client.post("/api/v1/trainee/qualifications", json=qual_payload, headers=headers)
    assert post_res.status_code == 201
    qual = post_res.json()
    assert qual["degree"] == "M.Sc."
    assert qual["passing_year"] == 2022
    qual_id = qual["id"]

    # 2. List qualifications
    list_res = await async_client.get("/api/v1/trainee/qualifications", headers=headers)
    assert list_res.status_code == 200
    quals = list_res.json()
    assert len(quals) == 1
    assert quals[0]["id"] == qual_id

    # 3. Delete qualification
    del_res = await async_client.delete(f"/api/v1/trainee/qualifications/{qual_id}", headers=headers)
    assert del_res.status_code == 200

    # 4. Verify empty list
    list_res2 = await async_client.get("/api/v1/trainee/qualifications", headers=headers)
    assert list_res2.status_code == 200
    assert len(list_res2.json()) == 0


@pytest.mark.asyncio
async def test_trainee_work_experiences_crud(async_client: AsyncClient):
    """Test creating, listing, and deleting work experiences."""
    token = await create_and_approve_trainee(async_client, "trainee.exp@imd.gov.in", "Meera Nair")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add work experience
    exp_payload = {
        "organization": "IMD Pune",
        "designation": "Scientific Assistant",
        "start_date": "2022-07-01",
        "end_date": "2024-06-30",
        "is_current": False,
        "responsibilities": "Upper-air sounding data collation and radiosonde launch protocols.",
    }
    post_res = await async_client.post("/api/v1/trainee/work-experiences", json=exp_payload, headers=headers)
    assert post_res.status_code == 201
    exp = post_res.json()
    assert exp["organization"] == "IMD Pune"
    exp_id = exp["id"]

    # 2. List work experiences
    list_res = await async_client.get("/api/v1/trainee/work-experiences", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 3. Delete work experience
    del_res = await async_client.delete(f"/api/v1/trainee/work-experiences/{exp_id}", headers=headers)
    assert del_res.status_code == 200

    # 4. Verify deleted
    list_res2 = await async_client.get("/api/v1/trainee/work-experiences", headers=headers)
    assert len(list_res2.json()) == 0


@pytest.mark.asyncio
async def test_trainee_skills_and_interests_crud(async_client: AsyncClient):
    """Test skills and interests endpoints."""
    token = await create_and_approve_trainee(async_client, "trainee.skills@imd.gov.in", "Vikram Singh")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add Skill
    skill_res = await async_client.post(
        "/api/v1/trainee/skills",
        json={"name": "Doppler Radar Interpretation", "proficiency_level": "intermediate"},
        headers=headers,
    )
    assert skill_res.status_code == 201
    skill_id = skill_res.json()["id"]

    # 2. List Skills
    skills_list = await async_client.get("/api/v1/trainee/skills", headers=headers)
    assert len(skills_list.json()) == 1

    # 3. Add Interest
    int_res = await async_client.post(
        "/api/v1/trainee/interests",
        json={"name": "Tropical Cyclogenesis & Storm Surge Modeling"},
        headers=headers,
    )
    assert int_res.status_code == 201
    int_id = int_res.json()["id"]

    # 4. List Interests
    ints_list = await async_client.get("/api/v1/trainee/interests", headers=headers)
    assert len(ints_list.json()) == 1

    # 5. Delete Skill & Interest
    assert (await async_client.delete(f"/api/v1/trainee/skills/{skill_id}", headers=headers)).status_code == 200
    assert (await async_client.delete(f"/api/v1/trainee/interests/{int_id}", headers=headers)).status_code == 200

    # 6. Verify lists are now empty
    assert len((await async_client.get("/api/v1/trainee/skills", headers=headers)).json()) == 0
    assert len((await async_client.get("/api/v1/trainee/interests", headers=headers)).json()) == 0


@pytest.mark.asyncio
async def test_trainee_certificates_crud(async_client: AsyncClient):
    """Test certificate records creation, listing, and deletion."""
    token = await create_and_approve_trainee(async_client, "trainee.cert@imd.gov.in", "Ramesh Sen")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add Certificate
    cert_payload = {
        "title": "WMO Meteorological Observation Standards",
        "issuing_organization": "World Meteorological Organization",
        "issue_date": "2023-05-15",
        "credential_id": "WMO-OBS-2023-998",
    }
    post_res = await async_client.post("/api/v1/trainee/certificates", json=cert_payload, headers=headers)
    assert post_res.status_code == 201
    cert = post_res.json()
    assert cert["title"] == "WMO Meteorological Observation Standards"
    cert_id = cert["id"]

    # 2. List Certificates
    list_res = await async_client.get("/api/v1/trainee/certificates", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 3. Delete Certificate
    del_res = await async_client.delete(f"/api/v1/trainee/certificates/{cert_id}", headers=headers)
    assert del_res.status_code == 200

    # 4. Verify empty
    assert len((await async_client.get("/api/v1/trainee/certificates", headers=headers)).json()) == 0


@pytest.mark.asyncio
async def test_trainee_dashboard_overview(async_client: AsyncClient):
    """Test trainee dashboard metrics aggregation."""
    token = await create_and_approve_trainee(async_client, "trainee.dash@imd.gov.in", "Kavita Rao")
    headers = {"Authorization": f"Bearer {token}"}

    # Check baseline dashboard
    dash1 = await async_client.get("/api/v1/trainee/dashboard", headers=headers)
    assert dash1.status_code == 200
    data1 = dash1.json()
    assert data1["metrics"]["total_qualifications"] == 0
    assert data1["metrics"]["profile_completion_percentage"] == 0

    # Add profile details
    await async_client.put(
        "/api/v1/trainee/profile",
        json={"designation": "Observer", "department": "Surface Met", "bio": "Weather observer at IMD Delhi."},
        headers=headers,
    )
    # Add 1 qualification and 1 skill
    await async_client.post(
        "/api/v1/trainee/qualifications",
        json={"degree": "B.Sc.", "field_of_study": "Physics", "institution": "Delhi University", "passing_year": 2021},
        headers=headers,
    )
    await async_client.post(
        "/api/v1/trainee/skills",
        json={"name": "Barometer Calibration", "proficiency_level": "intermediate"},
        headers=headers,
    )

    # Re-check dashboard
    dash2 = await async_client.get("/api/v1/trainee/dashboard", headers=headers)
    assert dash2.status_code == 200
    data2 = dash2.json()
    assert data2["metrics"]["total_qualifications"] == 1
    assert data2["metrics"]["total_skills"] == 1
    assert data2["metrics"]["profile_completion_percentage"] > 50


@pytest.mark.asyncio
async def test_trainee_isolation_and_ownership(async_client: AsyncClient):
    """Verify trainee cannot modify another trainee's data."""
    # Create Trainee A and Trainee B
    token_a = await create_and_approve_trainee(async_client, "trainee.a@imd.gov.in", "Trainee A")
    token_b = await create_and_approve_trainee(async_client, "trainee.b@imd.gov.in", "Trainee B")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Trainee A creates a qualification
    res_a = await async_client.post(
        "/api/v1/trainee/qualifications",
        json={"degree": "B.Tech", "field_of_study": "CS", "institution": "IIT", "passing_year": 2020},
        headers=headers_a,
    )
    qual_a_id = res_a.json()["id"]

    # Trainee B attempts to delete Trainee A's qualification -> 404
    del_attempt = await async_client.delete(f"/api/v1/trainee/qualifications/{qual_a_id}", headers=headers_b)
    assert del_attempt.status_code == 404
