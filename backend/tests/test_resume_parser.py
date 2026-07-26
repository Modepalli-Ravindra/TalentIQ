import pytest
from app.services.resume_parser import (
    parse_txt,
    parse_resume_file,
    _clean_text,
    extract_sections,
    extract_email,
    extract_phone,
    extract_name_from_text,
)


class TestCleanText:
    def test_removes_html_tags(self):
        text = "<p>Hello <b>World</b></p>"
        result = _clean_text(text)
        assert "<p>" not in result
        assert "Hello" in result

    def test_removes_script_tags(self):
        text = "Before<script>alert('xss')</script>After"
        result = _clean_text(text)
        assert "script" not in result.lower() or "Before" in result

    def test_removes_style_tags(self):
        text = "Before<style>.red{color:red}</style>After"
        result = _clean_text(text)
        assert "Before" in result
        assert "After" in result

    def test_removes_event_handlers(self):
        text = 'Before onclick="alert(1)" After'
        result = _clean_text(text)
        assert "onclick" not in result

    def test_collapses_whitespace(self):
        text = "Hello    World\t\tTest"
        result = _clean_text(text)
        assert "    " not in result

    def test_reduces_newlines(self):
        text = "Hello\n\n\n\n\nWorld"
        result = _clean_text(text)
        assert "\n\n\n" not in result

    def test_strips_whitespace(self):
        text = "  Hello World  "
        result = _clean_text(text)
        assert result == "Hello World"


class TestParseTxt:
    def test_parse_utf8(self):
        content = "John Doe\nSoftware Engineer\nPython, JavaScript".encode("utf-8")
        result = parse_txt(content)
        assert "John Doe" in result
        assert "Software Engineer" in result

    def test_parse_latin1(self):
        content = "John Doe\nSoftware Engineer".encode("latin-1")
        result = parse_txt(content)
        assert "John Doe" in result

    def test_parse_empty(self):
        content = b""
        result = parse_txt(content)
        assert result == ""


class TestParseResumeFile:
    def test_parse_txt_file(self):
        content = "John Doe\nSoftware Engineer\nSkills: Python, React"
        result = parse_resume_file(content.encode("utf-8"), "resume.txt")
        assert "John Doe" in result

    def test_unsupported_file_type(self):
        with pytest.raises(ValueError, match="Unsupported file type"):
            parse_resume_file(b"content", "resume.xyz")


class TestExtractEmail:
    def test_valid_email(self):
        text = "Contact me at john.doe@example.com for details"
        result = extract_email(text)
        assert result == "john.doe@example.com"

    def test_no_email(self):
        text = "No email here"
        result = extract_email(text)
        assert result is None

    def test_multiple_emails_returns_first(self):
        text = "a@b.com or c@d.com"
        result = extract_email(text)
        assert result == "a@b.com"


class TestExtractPhone:
    def test_valid_phone(self):
        text = "Call me at +49 123 456 7890"
        result = extract_phone(text)
        assert result is not None

    def test_no_phone(self):
        text = "No phone number here"
        result = extract_phone(text)
        assert result is None


class TestExtractName:
    def test_valid_two_word_name(self):
        text = "John Doe\nSoftware Engineer\nBerlin, Germany"
        result = extract_name_from_text(text)
        assert result == "John Doe"

    def test_single_word_not_extracted(self):
        text = "Resume\nEngineer"
        result = extract_name_from_text(text)
        assert result is None


class TestExtractSections:
    def test_skills_section(self):
        text = "SKILLS\nPython, JavaScript, React, Node.js\n\nEXPERIENCE\nSoftware Engineer at Google"
        sections = extract_sections(text)
        assert "skills" in sections

    def test_experience_section(self):
        text = "EXPERIENCE\nSoftware Engineer at Google\n2020-2024\n\nEDUCATION\nMIT"
        sections = extract_sections(text)
        assert "experience" in sections

    def test_education_section(self):
        text = "EDUCATION\nMIT - Computer Science\n2016-2020\n\nSKILLS\nPython"
        sections = extract_sections(text)
        assert "education" in sections
