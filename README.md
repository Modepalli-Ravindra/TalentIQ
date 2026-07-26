# TalentIQ AI - AI-Powered Hiring Intelligence Platform

[![CI/CD](https://github.com/your-org/TalentIQ-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/TalentIQ-AI/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

TalentIQ AI is a production-ready, AI-powered hiring intelligence platform with intelligent automation, candidate analytics, and dynamic workflows.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Auth     │  │  Jobs    │  │  AI      │  │  Recruiter/      │ │
│  │  Module   │  │  Search  │  │  Fit     │  │  Admin Dashboard │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬──────────┘ │
│       │              │              │                │             │
│  ┌────┴──────────────┴──────────────┴────────────────┴──────────┐│
│  │                    API Client (lib/api.ts)                    ││
│  │              JWT Bearer Token Auto-Injection                 ││
│  └──────────────────────────┬───────────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┼───────────────────────────────────┐
│                      FastAPI Backend                             │
│  ┌──────────────────────────┴───────────────────────────────────┐│
│  │              Middleware Pipeline                              ││
│  │  RequestLogging → BodySizeLimit → CORS → GZip                ││
│  └──────────────────────────┬───────────────────────────────────┘│
│                              │                                    │
│  ┌──────────────────────────┴───────────────────────────────────┐│
│  │              Router Layer                                     ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────────────┐  ││
│  │  │ /auth   │  │ /jobs   │  │ /ai/*   │  │ /health        │  ││
│  │  │ (public)│  │(public) │  │ (JWT)   │  │ (public)       │  ││
│  │  └─────────┘  └─────────┘  └────┬────┘  └────────────────┘  ││
│  └──────────────────────────────────┼───────────────────────────┘│
│                                      │                            │
│  ┌──────────────────────────────────┴───────────────────────────┐│
│  │              Service Layer                                    ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ ││
│  │  │AI Service│  │ ETL Sync │  │Resume    │  │Rate Limiter  │ ││
│  │  │(Groq)    │  │ Service  │  │Parser    │  │(per-IP)      │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────────┐
          │                   │                       │
   ┌──────┴──────┐    ┌──────┴──────┐    ┌──────────┴──────────┐
   │  Supabase   │    │  Groq API   │    │  Arbeitnow API      │
   │  PostgreSQL │    │  Llama 3.3  │    │  External Jobs      │
   │  + Auth     │    │  70B        │    │  (ETL Source)        │
   └─────────────┘    └─────────────┘    └─────────────────────┘
```

## Request Flow

```
User Action → React Component → React Query Hook → api.ts (fetch + JWT)
    → FastAPI Middleware (logging, size check, CORS)
    → Router (auth validation for /ai/*)
    → Rate Limiter Check
    → AI Cache Check → (Hit?) Return cached
                     → (Miss?) Groq API → Cache Response → Return
```

## Authentication Flow

```
Login Request → POST /api/v1/auth/login
    → Validate credentials (Supabase or mock DB)
    → Create JWT (sub=user_id, role, exp, iss)
    → Return { access_token, user }
    → Store in localStorage
    → Attach Bearer token to all /api/v1/ai/* requests
```

## ETL Flow

```
Arbeitnow API → Fetch Pages (with retry/backoff)
    → Transform (HTML clean, normalize, validate)
    → Deduplicate (external_id:source key)
    → AI Enrichment (summary, skills, seniority, salary, department)
    → Bulk Insert/Update Supabase
    → Return SyncReport { imported, updated, duplicates, failed }
```

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- Python >= 3.11
- Supabase project (or local PostgreSQL)

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

### API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/api/v1/openapi.json

---

## Testing

### Frontend (Vitest)

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Backend (Pytest)

```bash
cd backend
python -m pytest tests/ -v                    # Run all tests
python -m pytest tests/ -v --cov=app          # With coverage
python -m pytest tests/ -v -m "not slow"      # Skip slow tests
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

---

## Security

- **JWT Authentication** on all `/api/v1/ai/*` endpoints
- **CORS** restricted to configured origins (not `*`)
- **Rate limiting** per IP on AI endpoints
- **Input validation** via Pydantic models
- **Body size limits** (10MB max)
- **Sensitive data filtering** in logs
- **No hardcoded secrets** in codebase

---

## Performance

- **Code splitting** via React.lazy for all views and modals
- **AI response caching** with 1-hour TTL (SHA-256 key hashing)
- **GZip compression** for responses > 1KB
- **Database indexes** on search/filter columns
- **React Query** with 5-min stale time and retry logic
- **Vite manual chunks** for vendor splitting

---

## Code Quality

### Backend

- **Black** - Code formatting
- **isort** - Import sorting
- **Ruff** - Linting
- **Pytest** - Testing with coverage

### Frontend

- **TypeScript** strict mode
- **ESLint** via tsc --noEmit
- **Vitest** with React Testing Library
- **Prettier** - Code formatting

---

## CI/CD

GitHub Actions workflow runs on push/PR to main:

1. **Frontend**: Install → TypeScript Check → Tests → Build
2. **Backend**: Install → Pytest with Coverage → Black → isort → Ruff

---

## Project Structure

```
TalentIQ-AI/
├── .github/workflows/ci.yml     # CI/CD pipeline
├── backend/
│   ├── app/
│   │   ├── api/v1/              # Route handlers
│   │   │   ├── auth.py          # Login/register
│   │   │   ├── jobs.py          # Job CRUD + ETL
│   │   │   ├── ai.py            # AI endpoints (JWT required)
│   │   │   └── health.py        # Health check
│   │   ├── core/
│   │   │   ├── config.py        # Settings from env
│   │   │   ├── security.py      # JWT + password hashing
│   │   │   ├── deps.py          # Auth dependencies
│   │   │   ├── exceptions.py    # Global error handler
│   │   │   ├── logging_config.py # Centralized logging
│   │   │   ├── ai_cache.py      # AI response cache
│   │   │   ├── rate_limiter.py  # Per-IP rate limiting
│   │   │   └── supabase.py      # Supabase client
│   │   ├── etl/                 # ETL pipeline
│   │   ├── schemas/             # Pydantic models
│   │   └── services/            # Business logic
│   │       ├── ai_service.py    # Groq LLM integration
│   │       └── resume_parser.py # PDF/DOCX/TXT parsing
│   ├── tests/                   # Backend tests (20+)
│   ├── pyproject.toml           # Tool configs
│   └── requirements.txt
├── src/
│   ├── components/              # React components
│   ├── context/                 # Auth + Notification context
│   ├── hooks/                   # React Query hooks
│   ├── lib/                     # API client + Supabase
│   ├── views/                   # Page components
│   └── test/                    # Frontend tests (15+)
├── docs/
│   └── postman/                 # Postman collection
├── supabase/                    # DB schema + migrations
├── vite.config.ts               # Vite + Vitest config
└── package.json
```

---

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/register` | User registration |
| GET | `/api/v1/jobs` | List external jobs |
| GET | `/api/v1/jobs/search` | Search jobs |
| GET | `/api/v1/jobs/recommended` | Recommended jobs |
| GET | `/api/v1/jobs/:id` | Get job by ID |

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
| POST | `/api/v1/etl/jobs/sync` | Trigger ETL sync |

---

## License

MIT License. See [LICENSE](./docs/20_LICENSE.md) for details.
