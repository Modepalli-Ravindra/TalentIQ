# 06 Frontend Architecture

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS Modules + Tailwind CSS
- **Component Library**: shadcn/ui
- **Animation**: Framer Motion
- **State Management**: TanStack Query (React Query) + Zustand (Global Client UI State)
- **Form Engine**: React Hook Form + Zod Schema Validation

## Directory Layout
```
apps/web/
├── app/
│   ├── (auth)/          # Auth layouts & pages
│   ├── candidate/       # Candidate Dashboard routes
│   ├── recruiter/       # Recruiter Dashboard routes
│   ├── admin/           # Admin Dashboard routes
│   ├── jobs/            # Job detail & search routes
│   ├── api/             # Next.js API Route handlers
│   └── page.tsx         # SaaS Landing Page
├── components/
│   ├── ui/              # Primitive shadcn components
│   ├── modules/         # Feature components (MatchMeter, Kanban, Chat)
│   └── layout/          # Navbar, Sidebar, Footer
├── hooks/               # Custom React hooks (useAI, usePipeline)
└── lib/                 # Utilities, API client, Tailwind plugins
```
