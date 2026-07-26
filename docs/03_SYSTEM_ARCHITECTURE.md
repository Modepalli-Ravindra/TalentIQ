# 03 System Architecture

## Overview
TalentIQ AI follows a modern, decoupled microservices-ready monolith architecture designed for enterprise scalability, resilience, and rapid response times.

```
+-----------------------------------------------------------------------+
|                              CLIENT LAYER                             |
|    Next.js 14 Web App (App Router, Server Components, Framer Motion)   |
+-----------------------------------+-----------------------------------+
                                    | HTTPS / WSS
                                    v
+-----------------------------------+-----------------------------------+
|                              API GATEWAY                              |
|                    FastAPI (Python 3.11) + Pydantic                   |
+---------+-------------------------+-------------------------+---------+
          |                         |                         |
          v                         v                         v
+---------+---------+     +---------+---------+     +---------+---------+
|   AUTH SERVICE    |     |  MATCHING ENGINE  |     |   ANALYTICS ENGINE|
| Supabase JWT/RBAC |     | OpenAI / LangChain|     |  SQLAlchemy/Pandas|
+---------+---------+     +---------+---------+     +---------+---------+
          |                         |                         |
          +-------------------------+-------------------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                            DATA LAYER                             |
|         Supabase PostgreSQL (Vector Extension) + Redis Cache          |
+-----------------------------------------------------------------------+
```

## Core Components
1. **Frontend Application**: Hosted on Vercel, leveraging React Server Components (RSC) for SSR performance and client-side Framer Motion animations.
2. **Backend API Service**: High-throughput FastAPI application managing business logic, CRUD endpoints, and async worker task dispatches.
3. **AI Pipeline**: Asynchronous worker processing embeddings, resume semantic parsing, and match calculations via OpenAI API / PyTorch models.
4. **Database & Storage**: PostgreSQL hosted on Supabase with `pgvector` for candidate-job semantic embeddings storage.
