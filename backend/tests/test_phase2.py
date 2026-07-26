import pytest
from unittest.mock import patch, MagicMock


class TestEmbeddingService:
    @patch("app.services.embedding_service._get_vectorizer")
    def test_generate_embedding_returns_list(self, mock_get_vec):
        mock_vec = MagicMock()
        mock_vec.transform.return_value.toarray.return_value.__flaten__ = MagicMock(return_value=[0.1] * 512)
        mock_get_vec.return_value = mock_vec

        from app.services.embedding_service import generate_embedding
        result = generate_embedding("python react developer")
        assert isinstance(result, list)
        assert len(result) == 512

    def test_generate_embedding_empty_text(self):
        from app.services.embedding_service import generate_embedding
        result = generate_embedding("")
        assert isinstance(result, list)
        assert len(result) == 512
        assert all(v == 0.0 for v in result)

    def test_generate_job_embedding(self):
        from app.services.embedding_service import generate_job_embedding
        result = generate_job_embedding("Python Developer", "We need a Python developer with FastAPI experience", ["python", "fastapi"])
        assert isinstance(result, list)
        assert len(result) == 512

    def test_generate_profile_embedding(self):
        from app.services.embedding_service import generate_profile_embedding
        result = generate_profile_embedding(
            name="John Doe",
            skills=["Python", "React", "AWS"],
            summary="Senior developer with 5 years experience",
        )
        assert isinstance(result, list)
        assert len(result) == 512


class TestRecommendationEngine:
    def test_score_job_match_basic(self):
        from app.services.recommendation_engine import RecommendationEngine
        mock_client = MagicMock()
        engine = RecommendationEngine(mock_client)
        result = engine._score_job_match(
            job={"tags": ["python", "react"], "description": "Python developer"},
            user_skills=["python", "javascript"],
            resume_text="",
        )
        assert "match_score" in result
        assert "skills_matched" in result
        assert "skills_missing" in result
        assert 0 <= result["match_score"] <= 99
        assert "python" in result["skills_matched"]


class TestSavedJobsRepository:
    def test_init(self):
        from app.repositories.saved_jobs_repository import SavedJobsRepository
        mock_client = MagicMock()
        repo = SavedJobsRepository(mock_client)
        assert repo.table == "saved_jobs"


class TestRecentJobsRepository:
    def test_init(self):
        from app.repositories.recent_jobs_repository import RecentJobsRepository
        mock_client = MagicMock()
        repo = RecentJobsRepository(mock_client)
        assert repo.table == "recently_viewed_jobs"
        assert repo.max_per_user == 50


class TestEmailService:
    def test_render_template(self):
        from app.services.email_service import email_service
        subject, body = email_service._render_template("welcome", {"name": "John", "dashboard_url": "https://app.example.com"})
        assert "Welcome" in subject
        assert "John" in body
        assert "dashboard_url" in body or "app.example.com" in body

    def test_render_unknown_template(self):
        from app.services.email_service import email_service
        with pytest.raises(ValueError):
            email_service._render_template("nonexistent", {})


class TestAuditLogger:
    def test_audit_logger_init(self):
        from app.core.audit_logger import audit_logger
        assert audit_logger is not None

    @patch("app.core.audit_logger.audit_logger._get_client")
    def test_log_method(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        from app.core.audit_logger import audit_logger
        audit_logger._client = mock_client
        audit_logger.log("test_action", "test_resource", user_id="user-1")
        mock_client.table.assert_called_with("audit_logs")


class TestSemanticSearchEndpoints:
    def test_semantic_search_router_exists(self):
        from app.api.v1.semantic_search import router
        assert router is not None


class TestRecommendationsEndpoints:
    def test_recommendations_router_exists(self):
        from app.api.v1.recommendations import router
        assert router is not None


class TestSavedJobsEndpoints:
    def test_saved_jobs_router_exists(self):
        from app.api.v1.saved_jobs import router
        assert router is not None


class TestRecentJobsEndpoints:
    def test_recent_jobs_router_exists(self):
        from app.api.v1.recent_jobs import router
        assert router is not None


class TestHealthMetrics:
    def test_metrics_endpoint_exists(self):
        from app.api.v1.health import _metrics
        assert "requests_total" in _metrics
        assert "errors_total" in _metrics

    def test_record_request(self):
        from app.api.v1.health import _metrics, record_request
        before = _metrics["requests_total"]
        record_request(200, "/test")
        assert _metrics["requests_total"] == before + 1
        assert _metrics["requests_by_status"].get("200", 0) >= 1

    def test_format_uptime(self):
        from app.api.v1.health import _format_uptime
        assert _format_uptime(60) == "1m"
        assert _format_uptime(3660) == "1h 1m"
        assert _format_uptime(90000) == "1d 1h 0m"
