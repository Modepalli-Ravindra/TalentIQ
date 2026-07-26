import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResumeUploader } from '@/components/jobs/ResumeUploader'

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', name: 'Test User', email: 'test@test.com', role: 'candidate' },
    isAuthenticated: true,
  }),
}))

vi.mock('@/lib/supabase', () => ({
  resumeService: {
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
    upload: vi.fn(),
    delete: vi.fn(),
  },
  isSupabaseConfigured: vi.fn().mockReturnValue(false),
  storageService: {
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('ResumeUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload area with drop text', () => {
    render(<ResumeUploader />)
    expect(screen.getByText(/drop your resume/i)).toBeInTheDocument()
  })

  it('shows accepted file types', () => {
    render(<ResumeUploader />)
    expect(screen.getByText(/pdf or docx/i)).toBeInTheDocument()
  })

  it('shows size limit', () => {
    render(<ResumeUploader />)
    expect(screen.getByText(/10mb/i)).toBeInTheDocument()
  })

  it('has accessible upload button', () => {
    render(<ResumeUploader />)
    expect(screen.getByRole('button', { name: /upload resume/i })).toBeInTheDocument()
  })
})
