# 04 Database Design & Schema Specifications

## Entity Relationship Summary

The relational model is optimized for multi-tenancy, candidate-job matching, and detailed recruitment lifecycle tracking.

### Core Tables

#### `users`
- `id` (UUID, PK)
- `email` (VARCHAR, Unique)
- `role` (ENUM: 'candidate', 'recruiter', 'admin')
- `full_name` (VARCHAR)
- `avatar_url` (VARCHAR)
- `created_at` (TIMESTAMPTZ)

#### `companies`
- `id` (UUID, PK)
- `name` (VARCHAR)
- `slug` (VARCHAR, Unique)
- `logo_url` (VARCHAR)
- `tech_stack` (JSONB)
- `verified` (BOOLEAN)

#### `job_postings`
- `id` (UUID, PK)
- `company_id` (FK -> companies.id)
- `title` (VARCHAR)
- `description` (TEXT)
- `embedding` (VECTOR(1536))
- `salary_min` (NUMERIC)
- `salary_max` (NUMERIC)
- `location_type` (ENUM: 'remote', 'hybrid', 'onsite')
- `status` (ENUM: 'draft', 'active', 'closed')

#### `resumes`
- `id` (UUID, PK)
- `candidate_id` (FK -> users.id)
- `file_url` (VARCHAR)
- `parsed_text` (TEXT)
- `skills` (JSONB)
- `experience_years` (NUMERIC)
- `embedding` (VECTOR(1536))

#### `applications`
- `id` (UUID, PK)
- `job_id` (FK -> job_postings.id)
- `candidate_id` (FK -> users.id)
- `resume_id` (FK -> resumes.id)
- `match_score` (NUMERIC)
- `stage` (ENUM: 'applied', 'screening', 'interview', 'offer', 'rejected')
- `created_at` (TIMESTAMPTZ)
