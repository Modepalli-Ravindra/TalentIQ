# 15 Testing Strategy

## Test Coverage Matrix

1. **Unit Testing**:
   - Backend: `pytest` covering service layer logic, score calculation formulas, and validation schemas.
   - Frontend: `Jest` + `React Testing Library` for isolated component rendering.

2. **Integration Testing**:
   - API endpoints tested using FastAPI `TestClient` with in-memory database instance.

3. **End-to-End (E2E) Testing**:
   - Playwright suites testing key user flows (Resume upload -> Match evaluation -> Application submission).
