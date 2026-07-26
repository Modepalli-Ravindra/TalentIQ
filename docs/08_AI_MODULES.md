# 08 AI Modules & Pipeline Architecture

## 1. Resume Parser & Entity Extraction
- **Input**: Raw PDF / DOCX resume file.
- **Pipeline**: PDFPlumber / Unstructured text extraction -> LLM Schema Extractor -> Pydantic Structured Data.
- **Output**: JSON payload of skills, work history, projects, and education.

## 2. Match & Ranking Engine
- **Methodology**: Hybrid retrieval (Dense vector search via OpenAI Embeddings + Sparse BM25 keyword match) weighted against seniority and project context.
- **Score Calculation Formula**:
  $$Score = (0.45 	imes S_{vector}) + (0.35 	imes S_{skills}) + (0.20 	imes S_{experience})$$

## 3. Pre-Application Job Fit Analyzer
- **Capabilities**: Evaluates candidate experience against job requirements, computes gap analysis, and generates personalized learning resources to bridge missing skills.

## 4. Job Description Bias & Quality Optimizer
- **Rules Engine**: Identifies gender-coded language, jargon density, missing salary transparency, and readability scores.
