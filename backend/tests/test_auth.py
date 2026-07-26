import pytest
from unittest.mock import patch
from app.core.security import create_access_token, decode_access_token, verify_password, get_password_hash


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        result = get_password_hash("testpassword")
        assert isinstance(result, str)

    def test_hash_password_deterministic(self):
        hash1 = get_password_hash("samepassword")
        hash2 = get_password_hash("samepassword")
        assert hash1 == hash2

    def test_hash_password_different_inputs(self):
        hash1 = get_password_hash("password1")
        hash2 = get_password_hash("password2")
        assert hash1 != hash2

    def test_verify_password_correct(self):
        password = "mypassword"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        hashed = get_password_hash("correctpassword")
        assert verify_password("wrongpassword", hashed) is False


class TestJWTToken:
    def test_create_token_returns_string(self):
        token = create_access_token(subject="user-123", role="candidate")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_valid_token(self):
        token = create_access_token(subject="user-123", role="candidate")
        payload = decode_access_token(token)
        assert payload is not None
        assert payload.get("sub") == "user-123"
        assert payload.get("role") == "candidate"
        assert payload.get("iss") == "TalentIQ-AI-Auth"

    def test_decode_invalid_token(self):
        payload = decode_access_token("invalid.token.here")
        assert payload == {}

    def test_decode_tampered_token(self):
        token = create_access_token(subject="user-123", role="candidate")
        tampered = token[:-5] + "XXXXX"
        payload = decode_access_token(tampered)
        assert payload == {}

    def test_token_has_expiration(self):
        token = create_access_token(subject="user-123", role="candidate")
        payload = decode_access_token(token)
        assert "exp" in payload

    def test_recruiter_role_token(self):
        token = create_access_token(subject="recruiter-1", role="recruiter")
        payload = decode_access_token(token)
        assert payload.get("role") == "recruiter"

    def test_admin_role_token(self):
        token = create_access_token(subject="admin-1", role="admin")
        payload = decode_access_token(token)
        assert payload.get("role") == "admin"


class TestAuthDependencies:
    def test_protected_endpoint_no_token(self, client):
        response = client.post("/api/v1/ai/summarize", json={
            "description": "This is a test job description for summarization.",
            "max_sentences": 3,
        })
        assert response.status_code == 401

    def test_protected_endpoint_invalid_token(self, client):
        response = client.post(
            "/api/v1/ai/summarize",
            json={"description": "This is a test job description for summarization."},
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    def test_protected_endpoint_valid_token(self, client, auth_headers):
        with patch("app.api.v1.ai.summarize_job") as mock_summarize:
            mock_summarize.return_value = {"summary": "Test summary"}
            response = client.post(
                "/api/v1/ai/summarize",
                json={"description": "This is a test job description for summarization testing."},
                headers=auth_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_root_endpoint_no_auth(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"

    def test_jobs_list_no_auth(self, client):
        with patch("app.api.v1.jobs._get_repo") as mock_repo:
            mock_repo.return_value.search_jobs.return_value = {"data": [], "count": 0}
            response = client.get("/api/v1/jobs")
            assert response.status_code == 200
