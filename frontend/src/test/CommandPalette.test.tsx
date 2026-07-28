import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommandPalette } from '@/components/ui/CommandPalette'

describe('CommandPalette', () => {
  const mockOnClose = vi.fn()
  const mockOnNavigateView = vi.fn()
  const mockOnSelectRole = vi.fn()

  beforeEach(() => {
    mockOnClose.mockReset()
    mockOnNavigateView.mockReset()
    mockOnSelectRole.mockReset()
  })

  it('renders when open', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={mockOnClose}
        onNavigateView={mockOnNavigateView}
        onSelectRole={mockOnSelectRole}
      />
    )
    expect(screen.getByText('Explore Developer Jobs')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <CommandPalette
        isOpen={false}
        onClose={mockOnClose}
        onNavigateView={mockOnNavigateView}
        onSelectRole={mockOnSelectRole}
      />
    )
    expect(screen.queryByText('Explore Developer Jobs')).not.toBeInTheDocument()
  })

  it('shows all navigation actions', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={mockOnClose}
        onNavigateView={mockOnNavigateView}
        onSelectRole={mockOnSelectRole}
      />
    )
    expect(screen.getByText('Explore Developer Jobs')).toBeInTheDocument()
    expect(screen.getByText('Candidate Dashboard (AI Fit Heatmap)')).toBeInTheDocument()
    expect(screen.getByText('Recruiter Dashboard (Kanban & AI Ranking)')).toBeInTheDocument()
    expect(screen.getByText('Hiring Analytics & Funnel Metrics')).toBeInTheDocument()
    expect(screen.getByText('Admin & Verification Console')).toBeInTheDocument()
  })

  it('shows footer keyboard hints', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={mockOnClose}
        onNavigateView={mockOnNavigateView}
        onSelectRole={mockOnSelectRole}
      />
    )
    expect(screen.getByText(/navigate/)).toBeInTheDocument()
    expect(screen.getByText(/close/)).toBeInTheDocument()
  })

  it('shows TalentIQ branding', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={mockOnClose}
        onNavigateView={mockOnNavigateView}
        onSelectRole={mockOnSelectRole}
      />
    )
    expect(screen.getByText(/TalentIQ AI Copilot/)).toBeInTheDocument()
  })
})
