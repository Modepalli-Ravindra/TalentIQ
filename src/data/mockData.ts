import { CandidateProfile, CandidateApplication } from '../types';

export const MOCK_CANDIDATE: CandidateProfile = {
  id: 'cand-101',
  name: 'Alex Rivera',
  title: 'Senior Full Stack AI Engineer',
  avatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`,
  resumeScore: 94,
  experienceYears: 6.5,
  appliedJobsCount: 12,
  parsedSkills: ['React', 'Next.js', 'TypeScript', 'FastAPI', 'Python', 'Tailwind CSS', 'PostgreSQL', 'LangChain', 'Docker'],
  matchHeatmap: [
    { skill: 'React & Next.js', mastery: 98 },
    { skill: 'TypeScript', mastery: 95 },
    { skill: 'FastAPI & Python', mastery: 90 },
    { skill: 'PostgreSQL & SQL', mastery: 88 },
    { skill: 'AI & LangChain', mastery: 85 },
    { skill: 'Rust / C++', mastery: 45 }
  ]
};

export const MOCK_APPLICATIONS: CandidateApplication[] = [
  {
    id: 'app-1',
    jobId: 'job-1',
    jobTitle: 'Senior Staff Frontend Architect',
    company: 'Linear Build',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    appliedDate: '2026-07-20',
    stage: 'Interview',
    matchScore: 96,
    nextStep: 'Final Architecture Review (July 28 at 3:00 PM)',
    candidateName: 'Alex Rivera',
    candidateEmail: 'alex.rivera@example.com',
    candidateAvatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    jobTitle: 'Lead AI Infrastructure Engineer',
    company: 'Vercel Labs',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    appliedDate: '2026-07-22',
    stage: 'AI Assessment',
    matchScore: 89,
    nextStep: 'Complete System Design Takehome Challenge',
    candidateName: 'Sarah Chen',
    candidateEmail: 'sarah.chen@example.com',
    candidateAvatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`
  },
  {
    id: 'app-3',
    jobId: 'job-3',
    jobTitle: 'Principal Full Stack Product Engineer',
    company: 'Stripe Pay',
    companyLogo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=80',
    appliedDate: '2026-07-18',
    stage: 'Offer',
    matchScore: 92,
    nextStep: 'Offer Letter Review & Compensation Sign-off',
    candidateName: 'Marcus Vance',
    candidateEmail: 'marcus.vance@example.com',
    candidateAvatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`
  },
  {
    id: 'app-4',
    jobId: 'job-4',
    jobTitle: 'Senior Systems Engineer',
    company: 'Cursor IDE',
    companyLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&auto=format&fit=crop&q=80',
    appliedDate: '2026-07-15',
    stage: 'Screening',
    matchScore: 78,
    nextStep: 'Recruiter Initial Chat',
    candidateName: 'Elena Rostova',
    candidateEmail: 'elena.rostova@example.com',
    candidateAvatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`
  }
];
