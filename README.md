# TalentIQ AI - AI-Powered Hiring Intelligence Platform

[![CI/CD](https://github.com/Modepalli-Ravindra/TalentIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/Modepalli-Ravindra/TalentIQ/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

TalentIQ AI is a production-ready, AI-powered hiring intelligence platform with semantic search, intelligent automation, candidate analytics, and dynamic workflows.

---

## Features

### Phase 1 - Core Platform
- **Job Search & ETL** — Automated job ingestion from Arbeitnow API with AI enrichment
- **AI Resume Analysis** — Parse, score, and extract skills from resumes (PDF/DOCX/TXT)
- **AI Job Fit Analysis** — Match candidates to jobs with skill gap analysis
- **Bias Detection** — Analyze job descriptions for inclusive language
- **AI Email Generation** — Auto-generate recruitment emails
- **Authentication** — JWT-based auth with Supabase (candidate/recruiter/admin roles)
- **Dashboards** — Candidate, Recruiter, Analytics, and Admin dashboards

### Phase 2 - Enterprise Enhancements
- **Semantic Search** — pgvector-powered AI search with TF-IDF embeddings (512-dim)
- **AI Recommendations** — Skill-based job matching with learning suggestions
- **Saved & Recent Jobs** — Persistent saved jobs and recently viewed tracking
- **Email Notifications** — Resend/SendGrid integration with HTML templates
- **Incremental ETL** — Content hash-based change detection and expiry tracking
- **Docker** — Multi-stage builds, docker-compose, Nginx reverse proxy
- **Monitoring** — Health, metrics, and status endpoints with audit logging
- **Better UX** — Skeletons, error pages, offline detection, empty states

### Phase 3 - Advanced Features
- **Interview Scheduling** — Full scheduling with conflict detection, feedback, and ratings
- **Calendar Integration** — Google/Outlook connect, ICS export, event management
- **AI Recruiter Copilot** — Context-aware chat with conversation history
- **AI Resume Improvement** — 6 modes: rewrite, enhance, ATS optimize, keywords, format, full
- **Candidate Comparison** — Side-by-side analysis with skill coverage scoring
- **Company Verification** — Request/approve workflow with admin review

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│  React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query       │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Auth     │ │  Jobs    │ │  AI      │ │Interviews│ │ Copilot  │  │
│  │  Module   │ │  Search  │ │  Fit     │ │Calendar  │ │ Resume AI│  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │             │             │             │             │        │
│  ┌────┴─────────────┴─────────────┴─────────────┴────────────┴─────┐ │
│  │                    API Client (lib/api.ts)                       │ │
│  │              JWT Bearer Token Auto-Injection                     │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┼───────────────────────────────────────┐
│                      FastAPI Backend                                  │
│  ┌──────────────────────────┴──────────────────────────────────────┐ │
│  │              Middleware Pipeline                                  │ │
│  │  RequestLogging → Audit → BodySizeLimit → GZip → CORS           │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                              │                                        │
│  ┌──────────────────────────┴──────────────────────────────────────┐ │
│  │              Router Layer (14 routers)                           │ │
│  │  /auth /jobs /ai /health /search /recommendations               │ │
│  │  /saved-jobs /recent-jobs /interviews /calendar                 │ │
│  │  /copilot /resume /compare /company/verification                │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                              │                                        │
│  ┌──────────────────────────┴──────────────────────────────────────┐ │
│  │              Service Layer                                       │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │ │
│  │  │AI Service│ │Embedding │ │Copilot   │ │Resume Improvement  │  │ │
│  │  │(Groq)    │ │Service   │ │Service   │ │Service             │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │ │
│  │  │Recommen- │ │Email     │ │Comparison│ │Interview           │  │ │
│  │  │dation    │ │Service   │ │Service   │ │Repository          │  │ │
│  │  │Engine    │ │(Resend)  │ │          │ │                    │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────────┐
          │                   │                       │
   ┌──────┴──────┐    ┌──────┴──────┐    ┌──────────┴──────────┐
   │  Supabase   │    │  Groq API   │    │  Arbeitnow API      │
   │  PostgreSQL │    │  Llama 3.3  │    │  External Jobs      │
   │  + pgvector │    │  70B        │    │  (ETL Source)        │
   │  + Auth     │    └─────────────┘    └─────────────────────┘
   └─────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- Python >= 3.11
- Supabase project (or local PostgreSQL with pgvector)

### Frontend

```bash
cd TalentIQ-AI
npm install
cp .env.example .env  # Fill in your values
npm run dev           # http://localhost:5173
```

### Backend

```bash
cd TalentIQ-AI/backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Fill in your values
uvicorn app.main:app --reload  # http://localhost:8000
```

### Docker

```bash
# Production
docker-compose up -d

# Development (hot reload)
docker-compose -f docker-compose.dev.yml up
```

### API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Testing

### Frontend (Vitest)

```bash
npm test              # Run all tests (67 tests)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Backend (Pytest)

```bash
cd backend
python -m pytest tests/ -v                    # Run all tests (151 tests)
python -m pytest tests/ -v --cov=app          # With coverage
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `GROQ_API_KEY` | Groq API key for AI | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `CORS_ORIGINS` | Comma-separated allowed origins | No |
| `SYNC_INTERVAL_HOURS` | ETL sync interval | No |
| `LOG_LEVEL` | Logging level (INFO, DEBUG) | No |
| `EMAIL_PROVIDER` | Email provider (resend/sendgrid) | No |
| `RESEND_API_KEY` | Resend API key | No |
| `SENDGRID_API_KEY` | SendGrid API key | No |
| `EMAIL_FROM` | Sender email address | No |
| `REDIS_URL` | Redis URL for caching | No |

---

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Request metrics |
| GET | `/status` | Feature flags & version |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/register` | User registration |
| GET | `/api/v1/jobs` | List external jobs |
| GET | `/api/v1/jobs/search` | Search jobs |
| GET | `/api/v1/jobs/recommended` | Recommended jobs |

### Authenticated (JWT Required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ai/summarize` | Summarize job description |
| POST | `/api/v1/ai/parse-resume` | Parse resume text |
| POST | `/api/v1/ai/extract-skills` | Extract skills from text |
| POST | `/api/v1/ai/fit-analysis` | Candidate-job fit analysis |
| POST | `/api/v1/ai/bias-analysis` | Job posting bias analysis |
| POST | `/api/v1/ai/generate-email` | Generate recruitment email |
| POST | `/api/v1/ai/task-suggestions` | AI task suggestions |
| POST | `/api/v1/ai/chat` | AI chat assistant |
| GET | `/api/v1/search/semantic` | Semantic AI search |
| GET | `/api/v1/recommendations` | AI job recommendations |
| GET | `/api/v1/saved-jobs` | List saved jobs |
| POST | `/api/v1/saved-jobs` | Save a job |
| GET | `/api/v1/recent-jobs` | Recently viewed jobs |
| GET | `/api/v1/interviews` | List interviews |
| POST | `/api/v1/interviews` | Schedule interview |
| PUT | `/api/v1/interviews/:id` | Update interview |
| POST | `/api/v1/interviews/:id/feedback` | Submit feedback |
| GET | `/api/v1/calendar/connections` | List calendar connections |
| POST | `/api/v1/calendar/connect` | Connect calendar |
| GET | `/api/v1/calendar/events` | List calendar events |
| GET | `/api/v1/copilot/conversations` | List copilot conversations |
| POST | `/api/v1/copilot/chat` | Chat with AI copilot |
| POST | `/api/v1/resume/improve` | Improve resume with AI |
| GET | `/api/v1/resume/score` | Score resume |
| POST | `/api/v1/compare` | Compare candidates |
| POST | `/api/v1/company/verification` | Request company verification |
| POST | `/api/v1/etl/jobs/sync` | Trigger ETL sync |

---

## Project Structure

```
TalentIQ-AI/
├── backend/
│   ├── app/
│   │   ├── api/v1/                  # Route handlers (14 routers)
│   │   │   ├── auth.py              # Login/register
│   │   │   ├── jobs.py              # Job CRUD + ETL
│   │   │   ├── ai.py                # AI endpoints
│   │   │   ├── health.py            # Health/metrics/status
│   │   │   ├── semantic_search.py   # AI semantic search
│   │   │   ├── recommendations.py   # Job recommendations
│   │   │   ├── saved_jobs.py        # Saved jobs CRUD
│   │   │   ├── recent_jobs.py       # Recently viewed
│   │   │   ├── interviews.py        # Interview scheduling
│   │   │   ├── calendar.py          # Calendar integration
│   │   │   ├── copilot.py           # AI copilot chat
│   │   │   ├── resume_improvement.py# Resume AI improvement
│   │   │   ├── comparison.py        # Candidate comparison
│   │   │   └── company_verification.py # Company verification
│   │   ├── core/
│   │   │   ├── config.py            # Settings from env
│   │   │   ├── security.py          # JWT + password hashing
│   │   │   ├── deps.py              # Auth dependencies
│   │   │   ├── audit_logger.py      # Audit logging middleware
│   │   │   ├── ai_cache.py          # AI response cache
│   │   │   ├── rate_limiter.py      # Per-IP rate limiting
│   │   │   └── supabase.py          # Supabase client
│   │   ├── repositories/            # Data access layer
│   │   │   ├── semantic_search_repository.py
│   │   │   ├── saved_jobs_repository.py
│   │   │   ├── recent_jobs_repository.py
│   │   │   ├── interview_repository.py
│   │   │   └── calendar_repository.py
│   │   ├── services/                # Business logic
│   │   │   ├── ai_service.py        # Groq LLM integration
│   │   │   ├── embedding_service.py # TF-IDF embeddings
│   │   │   ├── recommendation_engine.py
│   │   │   ├── email_service.py     # Resend/SendGrid
│   │   │   ├── copilot_service.py   # AI copilot
│   │   │   ├── resume_improvement_service.py
│   │   │   ├── comparison_service.py
│   │   │   └── resume_parser.py     # PDF/DOCX/TXT parsing
│   │   └── etl/                     # ETL pipeline
│   ├── tests/                       # 151 backend tests
│   └── requirements.txt
├── src/
│   ├── components/
│   │   ├── auth/                    # Auth modal
│   │   ├── jobs/                    # Job cards, modals, saved jobs
│   │   ├── interviews/              # Interview scheduling
│   │   ├── copilot/                 # AI copilot chat
│   │   ├── resume/                  # Resume improvement
│   │   ├── comparison/              # Candidate comparison
│   │   ├── verification/            # Company verification
│   │   ├── search/                  # Semantic search bar
│   │   ├── layout/                  # Navbar, Footer
│   │   ├── ui/                      # Skeletons, ErrorPages, EmptyState
│   │   └── notifications/           # Notification panel
│   ├── hooks/                       # Custom hooks
│   ├── lib/api.ts                   # API client (10 API modules)
│   ├── views/                       # Page components
│   └── test/                        # 67 frontend tests
├── supabase/
│   ├── schema.sql                   # Database schema
│   └── migrations/                  # 8 migrations
├── Dockerfile                       # Multi-stage frontend
├── backend/Dockerfile               # Python backend
├── docker-compose.yml               # Production
├── docker-compose.dev.yml           # Development
├── nginx/nginx.conf                 # Reverse proxy
└── package.json
```

---

## Security

- **JWT Authentication** on all protected endpoints
- **RLS (Row Level Security)** on all database tables
- **CORS** restricted to configured origins
- **Rate limiting** per IP on AI endpoints
- **Input validation** via Pydantic models
- **Body size limits** (10MB max)
- **Audit logging** on auth and sync actions
- **Immutable audit logs** (trigger-protected)
- **Sensitive data filtering** in logs

---

## Performance

- **Code splitting** via React.lazy for all views
- **AI response caching** with 1-hour TTL
- **Semantic search** with pgvector IVFFlat index
- **GZip compression** for responses > 1KB
- **Database indexes** on all search/filter columns
- **React Query** with stale time and retry logic
- **Vite manual chunks** for vendor splitting
- **Incremental ETL** with content hash change detection

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query |
| Backend | Python 3.11+, FastAPI, Pydantic, Uvicorn |
| Database | Supabase PostgreSQL + pgvector |
| AI | Groq API (Llama 3.3 70B) |
| Search | TF-IDF Embeddings + pgvector cosine similarity |
| Auth | Supabase Auth + JWT |
| Email | Resend / SendGrid |
| Containers | Docker, Docker Compose, Nginx |
| Testing | Vitest, Pytest, React Testing Library |

---

## License

MIT License. See [LICENSE](./docs/20_LICENSE.md) for details.
