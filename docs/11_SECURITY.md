# 11 Security & Compliance Specifications

## Authentication & Authorization
- **Authentication**: JWT with short expiration (15 mins) and HTTP-only Secure Refresh Cookies.
- **Role-Based Access Control (RBAC)**: Enforced via FastAPI dependencies and Supabase Row Level Security (RLS) policies.

## Data Protection
- **Encryption at Rest**: AES-256 for all stored resume documents and database volumes.
- **Encryption in Transit**: TLS 1.3 enforced across all web and API communications.
- **Sanitization**: Strict input validation using Pydantic and DOMPurify on frontend rich-text fields to eliminate XSS and SQL injection risks.
