import os
import sys
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from auth import hash_password, verify_password, create_access_token, decode_access_token

client = TestClient(app)

def test_password_hashing():
    pwd = "SecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_encode_decode():
    payload = {"sub": "USR-TEST123", "email": "test@domain.org", "username": "testuser"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "USR-TEST123"
    assert decoded["email"] == "test@domain.org"

def test_auth_login_demo_user():
    # Login with demo user created during database seeding
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "alex_mercer", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "alex_mercer"
    assert data["user"]["email"] == "alex.mercer@net-labs.com"

def test_auth_login_invalid_credentials():
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "alex_mercer", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_auth_register_new_user():
    import uuid
    unique_user = f"user_{uuid.uuid4().hex[:6]}"
    unique_email = f"{unique_user}@example.com"
    
    response = client.post(
        "/api/auth/register",
        json={
            "email": unique_email,
            "username": unique_user,
            "password": "mysecretpassword",
            "role": "Senior Network Engineer"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == unique_user
    assert data["user"]["email"] == unique_email

def test_user_history_isolation():
    import uuid
    u_user = f"user_{uuid.uuid4().hex[:6]}"
    u_email = f"{u_user}@example.com"
    
    reg_res = client.post(
        "/api/auth/register",
        json={"email": u_email, "username": u_user, "password": "pwd", "role": "Engineer"}
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fresh user starts with 0 history entries
    hist_res = client.get("/api/user-history", headers=headers)
    assert hist_res.status_code == 200
    assert len(hist_res.json()) == 0

    # Submit a review as this user for CASE-001
    # First diagnose case
    diag_res = client.post("/api/cases/CASE-001/diagnose")
    diag_id = diag_res.json()["id"]

    rev_res = client.post(
        f"/api/cases/CASE-001/review?diagnosis_id={diag_id}",
        json={"verdict": "accepted", "reviewer_note": "Verified by new user"},
        headers=headers
    )
    assert rev_res.status_code == 200

    # User history should now be exactly 1
    hist_res_2 = client.get("/api/user-history", headers=headers)
    assert hist_res_2.status_code == 200
    assert len(hist_res_2.json()) == 1
    assert hist_res_2.json()[0]["case_id"] == "CASE-001"
