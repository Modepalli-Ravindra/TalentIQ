import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.schemas.jobs import ExternalJobResponse, JobSearchRequest, SyncTriggerResponse
from app.etl.models import ExternalJobRecord, ETLResult, SyncReport


class TestJobSchemas:
    def test_external_job_response(self):
        job = ExternalJobResponse(
            id="1",
            external_id="ext-1",
            title="Engineer",
            company_name="Corp",
        )
        assert job.id == "1"
        assert job.title == "Engineer"
        assert job.tags == []
        assert job.source == "arbeitnow"

    def test_job_search_request_defaults(self):
        req = JobSearchRequest()
        assert req.page == 1
        assert req.per_page == 20
        assert req.sort_by == "published_at"
        assert req.sort_order == "desc"

    def test_sync_trigger_response(self):
        resp = SyncTriggerResponse(
            status="success",
            imported=10,
            updated=5,
            duplicates=3,
            failed=1,
            execution_time_seconds=45.5,
        )
        assert resp.imported == 10
        assert resp.status == "success"


class TestETLModels:
    def test_external_job_record(self):
        record = ExternalJobRecord(
            external_id="ext-1",
            title="Engineer",
            company_name="Corp",
            job_url="https://example.com/1",
        )
        assert record.source == "arbeitnow"
        assert record.is_remote is False

    def test_etl_result_defaults(self):
        result = ETLResult()
        assert result.imported == 0
        assert result.failed == 0
        assert result.errors == []

    def test_sync_report_defaults(self):
        report = SyncReport()
        assert report.status == "success"
        assert report.source == "arbeitnow"
        assert report.imported == 0


class TestJobsEndpoints:
    def test_list_jobs(self, client):
        with patch("app.api.v1.jobs._get_repo") as mock_repo:
            mock_repo.return_value.search_jobs.return_value = {"data": [], "count": 0}
            response = client.get("/api/v1/jobs")
            assert response.status_code == 200

    def test_search_jobs(self, client):
        with patch("app.api.v1.jobs._get_repo") as mock_repo:
            mock_repo.return_value.search_jobs.return_value = {"data": [], "count": 0}
            response = client.get("/api/v1/jobs/search?keyword=python")
            assert response.status_code == 200

    def test_recommended_jobs(self, client):
        with patch("app.api.v1.jobs._get_repo") as mock_repo:
            mock_repo.return_value.search_jobs.return_value = {"data": [], "count": 0}
            response = client.get("/api/v1/jobs/recommended?skills=python&skills=react")
            assert response.status_code == 200

    def test_get_job_not_found(self, client):
        with patch("app.api.v1.jobs._get_repo") as mock_repo:
            mock_repo.return_value.get_job_by_id.return_value = None
            response = client.get("/api/v1/jobs/nonexistent-id")
            assert response.status_code == 404

    def test_get_job_found(self, client):
        with patch("app.api.v1.jobs._get_repo") as mock_repo:
            mock_repo.return_value.get_job_by_id.return_value = {"id": "1", "title": "Engineer"}
            response = client.get("/api/v1/jobs/1")
            assert response.status_code == 200

    def test_trigger_sync_requires_auth(self, client):
        response = client.post("/api/v1/etl/jobs/sync")
        assert response.status_code == 401

    def test_trigger_sync_with_auth(self, client, auth_headers):
        with patch("app.api.v1.jobs._get_repo") as mock_repo, \
             patch("app.api.v1.jobs.JobSyncService") as mock_service:
            mock_service.return_value.sync = AsyncMock(return_value=SyncReport(
                status="success", imported=10, updated=5, duplicates=3, failed=1,
                execution_time_seconds=45.5,
            ))
            response = client.post("/api/v1/etl/jobs/sync", headers=auth_headers)
            assert response.status_code == 200
