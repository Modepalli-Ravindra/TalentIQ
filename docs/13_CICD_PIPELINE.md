# 13 CI/CD Pipeline Architecture

## GitHub Actions Workflow Summary

```mermaid
graph TD
    A[Git Push / PR] --> B[Lint & Format Check]
    B --> C[TypeScript / Pyright Type Check]
    C --> D[Unit & Integration Tests]
    D --> E[Build Next.js & FastAPI Containers]
    E --> F[Deploy Staging]
    F --> G[End-to-End Cypress / Playwright Verification]
    G --> H[Production Deployment Vercel / Render]
```

## Quality Gates
- Mandatory 80%+ unit test coverage requirement for backend services.
- Zero TypeScript strict compiler errors allowed.
