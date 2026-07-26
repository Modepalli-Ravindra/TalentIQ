# 05 API Documentation (RESTful Specification)

All API endpoints require Bearer JWT Authentication and follow standard HTTP status conventions.

---

## Authentication Endpoints (`/api/v1/auth`)
- `POST /login` - User login (Returns Access & Refresh Tokens)
- `POST /register` - User registration
- `GET /me` - Get current authenticated user profile

---

## Job Endpoints (`/api/v1/jobs`)
- `GET /` - Search & filter jobs (Query: `q`, `skills`, `location`, `salary_min`)
- `POST /` - Create job posting (Recruiter only)
- `GET /{id}` - Get detailed job post + AI summary
- `POST /{id}/fit-check` - Run pre-application AI fit analysis for current candidate
- `POST /{id}/assistant` - Query AI Job Assistant

---

## Resume & Match Endpoints (`/api/v1/resumes`)
- `POST /parse` - Upload and parse resume PDF/DOCX
- `POST /match` - Calculate AI Match Score between resume and job posting
- `GET /candidate/{id}/recommendations` - Get AI job recommendations for candidate

---

## Recruiter Pipeline Endpoints (`/api/v1/recruiter`)
- `GET /pipelines/{job_id}` - Get Kanban pipeline candidates
- `PATCH /applications/{id}/stage` - Move candidate stage (Triggers automated actions/follow-ups)
- `GET /analytics/funnel` - Fetch recruitment funnel & velocity metrics
