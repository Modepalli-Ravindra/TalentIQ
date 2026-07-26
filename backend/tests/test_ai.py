import pytest
from unittest.mock import patch, MagicMock


class TestAITransform:
    def test_summarize_request_validation(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/summarize",
            json={"description": "short"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_summarize_request_valid(self, client, auth_headers):
        with patch("app.api.v1.ai.summarize_job") as mock_fn:
            mock_fn.return_value = {"summary": "Test summary of the job."}
            response = client.post(
                "/api/v1/ai/summarize",
                json={"description": "This is a valid job description for testing.", "max_sentences": 3},
                headers=auth_headers,
            )
            assert response.status_code == 200

    def test_parse_resume_request_validation(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/parse-resume",
            json={"resume_text": "short"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_extract_skills_request_validation(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/extract-skills",
            json={"text": "ab"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_fit_analysis_request_validation(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/fit-analysis",
            json={"job_description": "short", "candidate_profile": {}},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_bias_analysis_request_validation(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/bias-analysis",
            json={"job_text": "short"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_chat_request_validation_empty(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/chat",
            json={"prompt": ""},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_email_request_invalid_type(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/generate-email",
            json={
                "email_type": "invalid_type",
                "candidate_name": "John Doe",
                "job_title": "Engineer",
                "company": "TestCorp",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_task_suggestions_negative_values(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/task-suggestions",
            json={"pending_applications": -1},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_chat_max_length(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/chat",
            json={"prompt": "a" * 6000},
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestAICaching:
    def test_cached_response_returned(self, client, auth_headers):
        with patch("app.api.v1.ai.cached_ai_call") as mock_cache, \
             patch("app.api.v1.ai.store_ai_response"):
            mock_cache.return_value = {"summary": "Cached summary"}
            response = client.post(
                "/api/v1/ai/summarize",
                json={"description": "This is a test job description for caching."},
                headers=auth_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["data"]["summary"] == "Cached summary"

    def test_cache_miss_calls_ai(self, client, auth_headers):
        with patch("app.api.v1.ai.cached_ai_call", return_value=None), \
             patch("app.api.v1.ai.summarize_job", return_value={"summary": "Fresh summary"}), \
             patch("app.api.v1.ai.store_ai_response"):
            response = client.post(
                "/api/v1/ai/summarize",
                json={"description": "This is a test job description for cache miss."},
                headers=auth_headers,
            )
            assert response.status_code == 200


class TestHealthEndpoint:
    def test_health_check(self, client):
        with patch("app.api.v1.health._check_database", return_value={"status": "healthy", "message": "ok"}), \
             patch("app.api.v1.health._check_groq", return_value={"status": "healthy", "message": "ok"}), \
             patch("app.api.v1.health._check_supabase", return_value={"status": "healthy", "message": "ok"}), \
             patch("app.api.v1.health._check_scheduler", return_value={"status": "healthy", "message": "ok"}), \
             patch("app.api.v1.health._check_cache", return_value={"status": "healthy", "message": "ok"}), \
             patch("app.api.v1.health._check_email", return_value={"status": "healthy", "message": "ok"}):
            response = client.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["version"] == "1.0.0"
            assert "components" in data
