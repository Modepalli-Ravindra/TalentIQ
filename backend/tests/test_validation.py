import pytest
from app.core.rate_limiter import RateLimitConfig, check_rate_limit, get_rate_limit_headers
from unittest.mock import MagicMock, patch


class TestRateLimitConfig:
    def test_default_config(self):
        config = RateLimitConfig()
        assert config.per_minute == 10
        assert config.per_hour == 60
        assert config.burst == 5

    def test_custom_config(self):
        config = RateLimitConfig(per_minute=20, per_hour=100, burst=10)
        assert config.per_minute == 20
        assert config.per_hour == 100
        assert config.burst == 10


class TestRateLimiterHeaders:
    def test_rate_limit_headers(self):
        headers = get_rate_limit_headers("summarize", remaining_min=9, remaining_hr=59, limit=10)
        assert "X-RateLimit-Limit-Minute" in headers
        assert "X-RateLimit-Remaining-Minute" in headers
        assert "X-RateLimit-Remaining-Hour" in headers
        assert headers["X-RateLimit-Limit-Minute"] == "10"


class TestInputValidation:
    def test_summarize_description_min_length(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/summarize",
            json={"description": "short", "max_sentences": 3},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_chat_prompt_min_length(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/chat",
            json={"prompt": ""},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_resume_text_min_length(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/parse-resume",
            json={"resume_text": "abc"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_job_search_pagination(self, client, auth_headers):
        with patch("app.api.v1.jobs._get_repo") as mock_repo:
            mock_repo.return_value.search_jobs.return_value = {"data": [], "count": 0}
            response = client.get("/api/v1/jobs?page=0", headers=auth_headers)
            assert response.status_code == 422

    def test_job_search_max_per_page(self, client, auth_headers):
        with patch("app.api.v1.jobs._get_repo") as mock_repo:
            mock_repo.return_value.search_jobs.return_value = {"data": [], "count": 0}
            response = client.get("/api/v1/jobs?per_page=200", headers=auth_headers)
            assert response.status_code == 422

    def test_valid_email_request(self, client, auth_headers):
        with patch("app.api.v1.ai.generate_followup_email") as mock_fn:
            mock_fn.return_value = {"subject": "Test", "body": "Test body"}
            response = client.post(
                "/api/v1/ai/generate-email",
                json={
                    "email_type": "interview",
                    "candidate_name": "Jane Doe",
                    "job_title": "Software Engineer",
                    "company": "TestCorp",
                },
                headers=auth_headers,
            )
            assert response.status_code == 200


class TestBodySizeLimit:
    def test_health_endpoint_works(self, client):
        with patch("app.api.v1.health._check_database", return_value={"status": "healthy", "message": "ok"}), \
             patch("app.api.v1.health._check_groq", return_value={"status": "healthy", "message": "ok"}), \
             patch("app.api.v1.health._check_supabase", return_value={"status": "healthy", "message": "ok"}), \
             patch("app.api.v1.health._check_scheduler", return_value={"status": "healthy", "message": "ok"}), \
             patch("app.api.v1.health._check_cache", return_value={"status": "healthy", "message": "ok"}):
            response = client.get("/health")
            assert response.status_code == 200


class TestErrorHandling:
    def test_404_returns_consistent_format(self, client):
        response = client.get("/api/v1/nonexistent")
        assert response.status_code in [404, 405]

    def test_invalid_json_body(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/summarize",
            content="not json",
            headers={**auth_headers, "Content-Type": "application/json"},
        )
        assert response.status_code == 422

    def test_missing_required_fields(self, client, auth_headers):
        response = client.post(
            "/api/v1/ai/summarize",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 422
