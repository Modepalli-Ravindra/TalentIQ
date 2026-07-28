import pytest
from unittest.mock import MagicMock, patch, AsyncMock


class TestInterviewRepository:
    def test_create(self):
        from app.repositories.interview_repository import InterviewRepository
        mock_client = MagicMock()
        mock_client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "1"}])
        repo = InterviewRepository(mock_client)
        result = repo.create({"title": "Test Interview", "scheduled_at": "2026-08-01T10:00:00Z"})
        assert result is not None
        assert result["id"] == "1"

    def test_get_by_id(self):
        from app.repositories.interview_repository import InterviewRepository
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data={"id": "1"})
        repo = InterviewRepository(mock_client)
        result = repo.get_by_id("1")
        assert result is not None

    def test_list_by_user(self):
        from app.repositories.interview_repository import InterviewRepository
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(data=[])
        repo = InterviewRepository(mock_client)
        result = repo.list_by_user("user-1", role="candidate")
        assert isinstance(result, list)

    def test_get_upcoming(self):
        from app.repositories.interview_repository import InterviewRepository
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.gte.return_value.in_.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=[])
        repo = InterviewRepository(mock_client)
        result = repo.get_upcoming("user-1")
        assert isinstance(result, list)


class TestCalendarRepository:
    def test_get_connections(self):
        from app.repositories.calendar_repository import CalendarRepository
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        repo = CalendarRepository(mock_client)
        result = repo.get_connections("user-1")
        assert isinstance(result, list)

    def test_create_event(self):
        from app.repositories.calendar_repository import CalendarRepository
        mock_client = MagicMock()
        mock_client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "evt-1"}])
        repo = CalendarRepository(mock_client)
        result = repo.create_event({"user_id": "user-1", "title": "Meeting"})
        assert result is not None


class TestCopilotService:
    def test_create_conversation(self):
        from app.services.copilot_service import CopilotService
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=[])
        mock_client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "conv-1"}])
        service = CopilotService(mock_client)
        result = service.get_or_create_conversation("user-1", "general")
        assert result is not None

    def test_build_system_prompt_general(self):
        from app.services.copilot_service import CopilotService
        service = CopilotService(MagicMock())
        prompt = service._build_system_prompt()
        assert "TalentIQ Copilot" in prompt

    def test_build_system_prompt_job_search(self):
        from app.services.copilot_service import CopilotService
        service = CopilotService(MagicMock())
        prompt = service._build_system_prompt({"type": "job_search", "query": "python developer"})
        assert "python developer" in prompt

    def test_build_system_prompt_interview(self):
        from app.services.copilot_service import CopilotService
        service = CopilotService(MagicMock())
        prompt = service._build_system_prompt({"type": "interview", "job_title": "Engineer"})
        assert "Engineer" in prompt

    def test_call_groq_no_client(self):
        from app.services.copilot_service import CopilotService
        service = CopilotService(MagicMock(), groq_client=None)
        result = service._call_groq([{"role": "user", "content": "hello"}])
        assert isinstance(result, str)
        assert len(result) > 0


class TestResumeImprovementService:
    def test_improve_resume_no_groq(self):
        from app.services.resume_improvement_service import ResumeImprovementService
        mock_client = MagicMock()
        mock_client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "imp-1"}])
        service = ResumeImprovementService(mock_client, groq_client=None)
        result = service.improve_resume("user-1", "A" * 100, "full")
        assert result is not None
        assert result["id"] == "imp-1"

    def test_get_history(self):
        from app.services.resume_improvement_service import ResumeImprovementService
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=[])
        service = ResumeImprovementService(mock_client)
        result = service.get_history("user-1")
        assert isinstance(result, list)

    def test_build_improvement_prompt_rewrite(self):
        from app.services.resume_improvement_service import ResumeImprovementService
        service = ResumeImprovementService(MagicMock())
        prompt = service._build_improvement_prompt("resume text", "rewrite")
        assert "Rewrite" in prompt or "rewrite" in prompt.lower()

    def test_build_improvement_prompt_with_jd(self):
        from app.services.resume_improvement_service import ResumeImprovementService
        service = ResumeImprovementService(MagicMock())
        prompt = service._build_improvement_prompt("resume text", "keyword_boost", "Job description here")
        assert "Job description here" in prompt

    def test_parse_improvement_response_json(self):
        from app.services.resume_improvement_service import ResumeImprovementService
        service = ResumeImprovementService(MagicMock())
        raw = '{"improved_text": "better", "suggestions": ["tip1"], "score_before": 50, "score_after": 75}'
        result = service._parse_improvement_response(raw)
        assert result["improved_text"] == "better"
        assert result["score_after"] == 75

    def test_parse_improvement_response_markdown(self):
        from app.services.resume_improvement_service import ResumeImprovementService
        service = ResumeImprovementService(MagicMock())
        raw = '```json\n{"improved_text": "ok", "suggestions": []}\n```'
        result = service._parse_improvement_response(raw)
        assert result["improved_text"] == "ok"

    def test_parse_improvement_response_fallback(self):
        from app.services.resume_improvement_service import ResumeImprovementService
        service = ResumeImprovementService(MagicMock())
        result = service._parse_improvement_response("just plain text")
        assert result["improved_text"] == "just plain text"


class TestComparisonService:
    def test_compare_candidates_too_few(self):
        from app.services.comparison_service import ComparisonService
        mock_client = MagicMock()
        service = ComparisonService(mock_client)
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data={"id": "c1"})
        result = service.compare_candidates("recruiter-1", ["c1"])
        assert result is None

    def test_get_comparisons(self):
        from app.services.comparison_service import ComparisonService
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=[])
        service = ComparisonService(mock_client)
        result = service.get_comparisons("recruiter-1")
        assert isinstance(result, list)

    def test_build_comparison(self):
        from app.services.comparison_service import ComparisonService
        service = ComparisonService(MagicMock())
        candidates = [
            {"id": "c1", "full_name": "Alice", "headline": "Dev", "location": "NYC", "skills": ["python", "react"], "experience_years": 5, "education": "BS CS", "profile_url": ""},
            {"id": "c2", "full_name": "Bob", "headline": "Eng", "location": "SF", "skills": ["python", "java"], "experience_years": 3, "education": "MS CS", "profile_url": ""},
        ]
        result = service._build_comparison(candidates, None, None)
        assert len(result["candidates"]) == 2
        assert result["total_skills_pool"] == 3


class TestIntervewEndpointImports:
    def test_interviews_router_exists(self):
        from app.api.v1.interviews import router
        assert router is not None
        routes = [r.path for r in router.routes]
        assert "/interviews" in routes

    def test_calendar_router_exists(self):
        from app.api.v1.calendar import router
        assert router is not None
        routes = [r.path for r in router.routes]
        assert "/calendar/connections" in routes

    def test_copilot_router_exists(self):
        from app.api.v1.copilot import router
        assert router is not None
        routes = [r.path for r in router.routes]
        assert "/copilot/conversations" in routes

    def test_resume_router_exists(self):
        from app.api.v1.resume_improvement import router
        assert router is not None
        routes = [r.path for r in router.routes]
        assert "/resume/improve" in routes

    def test_comparison_router_exists(self):
        from app.api.v1.comparison import router
        assert router is not None
        routes = [r.path for r in router.routes]
        assert "/compare" in routes

    def test_verification_router_exists(self):
        from app.api.v1.company_verification import router
        assert router is not None
        routes = [r.path for r in router.routes]
        assert "/company/verification" in routes


class TestNewFixes:
    def test_safe_uuid(self):
        from app.core.supabase import safe_uuid
        import uuid
        assert safe_uuid(None) is None
        assert safe_uuid("") is None
        valid = str(uuid.uuid4())
        assert safe_uuid(valid) == valid
        
        mock_id = "job-1"
        hashed = safe_uuid(mock_id)
        assert hashed != mock_id
        assert uuid.UUID(hashed)
        assert safe_uuid(mock_id) == hashed

    def test_resume_improvement_robust_parse(self):
        from app.services.resume_improvement_service import ResumeImprovementService
        from unittest.mock import MagicMock
        service = ResumeImprovementService(MagicMock())
        
        raw_standard = '{"improved_text": "hello", "suggestions": ["tip"], "score_before": 10, "score_after": 90}'
        res = service._parse_improvement_response(raw_standard)
        assert res["improved_text"] == "hello"
        assert res["suggestions"] == ["tip"]
        assert res["score_before"] == 10
        
        raw_md = '```json\n{"improved_text": "hello", "suggestions": ["tip"], "score_before": 10, "score_after": 90}\n```'
        res = service._parse_improvement_response(raw_md)
        assert res["improved_text"] == "hello"
        assert res["suggestions"] == ["tip"]
        
        raw_messy = 'Here is the response:\n```json\n{"improved_text": "hello", "suggestions": ["tip"]}\n```\nHope this helps!'
        res = service._parse_improvement_response(raw_messy)
        assert res["improved_text"] == "hello"
        assert res["suggestions"] == ["tip"]

