import os
import sys
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("JWT_SECRET", "test-secret-key-for-testing-only")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("GROQ_MODEL", "llama-3.3-70b-versatile")


@pytest.fixture
def client():
    from app.main import app
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def auth_headers():
    from app.core.security import create_access_token
    token = create_access_token(subject="test-user-123", role="candidate")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def recruiter_headers():
    from app.core.security import create_access_token
    token = create_access_token(subject="test-recruiter-456", role="recruiter")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    mock.table.return_value = mock
    mock.select.return_value = mock
    mock.insert.return_value = mock
    mock.update.return_value = mock
    mock.delete.return_value = mock
    mock.eq.return_value = mock
    mock.order.return_value = mock
    mock.range.return_value = mock
    mock.limit.return_value = mock
    mock.execute.return_value = MagicMock(data=[], count=0)
    return mock
