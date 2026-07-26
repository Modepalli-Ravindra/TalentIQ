# 14 Deployment Guide

## Production Environment Setup

### 1. Frontend (Vercel)
- Set Environment Variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Root Directory: `apps/web`.

### 2. Backend (Render / Railway / Docker)
- Deploy using Dockerfile in `apps/api/Dockerfile`.
- Set Environment Variables: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `JWT_SECRET`.

### 3. Database (Supabase)
- Run Alembic migrations: `alembic upgrade head`.
- Enable `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`.
