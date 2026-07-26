import pytest
from unittest.mock import patch, MagicMock
from app.etl.transformer import transform_arbeitnow_job
from app.etl.deduplicator import deduplicate_jobs
from app.etl.models import ExternalJobRecord


class TestTransformer:
    def _make_raw_job(self, **overrides):
        base = {
            "id": 1,
            "title": "Software Engineer",
            "company_name": "TechCorp",
            "description": "<p>We are looking for a software engineer to join our team.</p>",
            "remote": True,
            "url": "https://example.com/job/1",
            "tags": ["python", "react"],
            "location": "Berlin, Germany",
            "job_types": ["full_time"],
            "created_at": "2026-01-15",
        }
        base.update(overrides)
        return base

    def test_transform_basic_job(self):
        raw = self._make_raw_job()
        result = transform_arbeitnow_job(raw, index=0)
        assert result is not None
        assert result.title == "Software Engineer"
        assert result.company_name == "TechCorp"
        assert result.source == "arbeitnow"

    def test_transform_strips_html(self):
        raw = self._make_raw_job(description="<p>Hello <b>World</b></p>")
        result = transform_arbeitnow_job(raw, index=0)
        assert result is not None
        assert "<p>" not in result.description
        assert "Hello" in result.description

    def test_transform_missing_title_returns_none(self):
        raw = self._make_raw_job()
        del raw["title"]
        result = transform_arbeitnow_job(raw, index=0)
        assert result is None

    def test_transform_missing_company_returns_none(self):
        raw = self._make_raw_job()
        del raw["company_name"]
        result = transform_arbeitnow_job(raw, index=0)
        assert result is None

    def test_transform_employment_type_normalization(self):
        raw = self._make_raw_job(job_types=["full_time"])
        result = transform_arbeitnow_job(raw, index=0)
        assert result is not None
        assert result.employment_type is None or isinstance(result.employment_type, str)

    def test_transform_remote_detection(self):
        raw = self._make_raw_job(description="This is a remote position available anywhere.")
        result = transform_arbeitnow_job(raw, index=0)
        assert result is not None
        assert result.is_remote is True

    def test_transform_sets_source(self):
        raw = self._make_raw_job()
        result = transform_arbeitnow_job(raw, index=0)
        assert result.source == "arbeitnow"

    def test_transform_generates_external_id(self):
        raw = self._make_raw_job(id=42)
        result = transform_arbeitnow_job(raw, index=0)
        assert result is not None
        assert result.external_id is not None
        assert len(result.external_id) > 0


class TestDeduplicator:
    def test_new_jobs_only(self):
        incoming = [
            ExternalJobRecord(
                external_id="job-1", title="Engineer", company_name="Corp1",
                job_url="https://example.com/1"
            ),
            ExternalJobRecord(
                external_id="job-2", title="Designer", company_name="Corp2",
                job_url="https://example.com/2"
            ),
        ]
        existing = {}
        new_jobs, existing_jobs, dup_count = deduplicate_jobs(incoming, existing)
        assert len(new_jobs) == 2
        assert len(existing_jobs) == 0
        assert dup_count == 0

    def test_all_duplicates(self):
        incoming = [
            ExternalJobRecord(
                external_id="job-1", title="Engineer", company_name="Corp1",
                job_url="https://example.com/1"
            ),
        ]
        existing = {"job-1": "internal-id-1"}
        new_jobs, existing_jobs, dup_count = deduplicate_jobs(incoming, existing)
        assert len(new_jobs) == 0
        assert len(existing_jobs) == 1
        assert dup_count == 0

    def test_mixed_new_and_duplicates(self):
        incoming = [
            ExternalJobRecord(
                external_id="job-1", title="Engineer", company_name="Corp1",
                job_url="https://example.com/1"
            ),
            ExternalJobRecord(
                external_id="job-3", title="PM", company_name="Corp3",
                job_url="https://example.com/3"
            ),
        ]
        existing = {"job-1": "internal-id-1"}
        new_jobs, existing_jobs, dup_count = deduplicate_jobs(incoming, existing)
        assert len(new_jobs) == 1
        assert new_jobs[0].external_id == "job-3"
        assert dup_count == 0

    def test_empty_incoming(self):
        new_jobs, existing_jobs, dup_count = deduplicate_jobs([], {"job-1": "id"})
        assert len(new_jobs) == 0
        assert dup_count == 0
