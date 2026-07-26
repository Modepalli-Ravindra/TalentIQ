import pytest
from app.core.logging_config import SensitiveFilter, setup_logging, get_logger
import logging


class TestSensitiveFilter:
    def test_filters_password(self):
        f = SensitiveFilter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0,
            msg="password=secret123", args=(), exc_info=None,
        )
        f.filter(record)
        assert "secret123" not in str(record.msg)

    def test_filters_token(self):
        f = SensitiveFilter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0,
            msg="token: abc123xyz", args=(), exc_info=None,
        )
        f.filter(record)
        assert "abc123xyz" not in str(record.msg)

    def test_filters_api_key(self):
        f = SensitiveFilter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0,
            msg="api_key=sk_live_12345", args=(), exc_info=None,
        )
        f.filter(record)
        assert "sk_live_12345" not in str(record.msg)

    def test_no_filter_normal_text(self):
        f = SensitiveFilter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0,
            msg="Job search completed successfully", args=(), exc_info=None,
        )
        f.filter(record)
        assert "Job search completed successfully" == record.msg


class TestSetupLogging:
    def test_setup_returns_logger(self):
        logger = setup_logging("INFO")
        assert logger is not None
        assert isinstance(logger, logging.Logger)

    def test_get_logger(self):
        logger = get_logger("test_module")
        assert logger.name == "talentiq.test_module"
