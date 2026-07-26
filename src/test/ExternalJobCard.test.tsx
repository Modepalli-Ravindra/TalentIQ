import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExternalJobCard } from '@/components/jobs/ExternalJobCard'

const mockJob = {
  id: '1',
  external_id: 'ext-1',
  title: 'Senior React Developer',
  company_name: 'TechCorp',
  company_logo: null,
  location: 'Berlin, Germany',
  is_remote: true,
  employment_type: 'Full-time',
  description: 'We are looking for a senior React developer.',
  tags: ['react', 'typescript', 'node.js'],
  job_url: 'https://example.com/job/1',
  source: 'arbeitnow',
  published_at: '2026-07-20T10:00:00Z',
  ai_summary: 'Senior role requiring React expertise.',
  ai_skills: ['React', 'TypeScript', 'Node.js'],
  ai_seniority: 'Senior',
  ai_salary_estimate: '€80,000 - €100,000',
  ai_department: 'Engineering',
  created_at: '2026-07-20T10:00:00Z',
  updated_at: '2026-07-20T10:00:00Z',
}

describe('ExternalJobCard', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    mockOnSelect.mockReset()
  })

  it('renders job title', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('Senior React Developer')).toBeInTheDocument()
  })

  it('renders company name', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('TechCorp')).toBeInTheDocument()
  })

  it('renders location', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('Berlin, Germany')).toBeInTheDocument()
  })

  it('renders remote badge', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('Remote')).toBeInTheDocument()
  })

  it('renders AI seniority badge', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('Senior')).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('renders AI summary', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('Senior role requiring React expertise.')).toBeInTheDocument()
  })

  it('renders View Details button', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('View Details')).toBeInTheDocument()
  })

  it('calls onSelect when View Details clicked', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    fireEvent.click(screen.getByText('View Details'))
    expect(mockOnSelect).toHaveBeenCalled()
  })

  it('renders employment type', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('Full-time')).toBeInTheDocument()
  })

  it('renders source', () => {
    render(<ExternalJobCard job={mockJob} onSelect={mockOnSelect} />)
    expect(screen.getByText('arbeitnow')).toBeInTheDocument()
  })
})
