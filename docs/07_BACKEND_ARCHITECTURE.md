# 07 Backend Architecture

## Design Patterns
- **Clean Architecture & Repository Pattern**: Decoupling database queries from core domain services.
- **Dependency Injection**: FastAPI's built-in `Depends` module used across routes for auth, db sessions, and AI engines.
- **Asynchronous Task Queue**: Background worker execution for heavy embedding and resume parsing tasks.

## Layered Folder Architecture
```
apps/api/
├── app/
│   ├── core/            # Config, security, database session
│   ├── api/             # V1 Router definitions
│   ├── services/        # Business logic (MatchService, FitService)
│   ├── repositories/    # Database CRUD abstractions
│   ├── models/          # SQLAlchemy ORM models
│   ├── schemas/         # Pydantic validation models
│   └── ai/              # AI Prompts, Embeddings, Parser pipelines
└── main.py              # Application entrypoint
```
