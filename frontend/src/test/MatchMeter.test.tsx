import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchMeter } from '@/components/ui/MatchMeter'

describe('MatchMeter', () => {
  it('renders score percentage', () => {
    render(<MatchMeter score={85} />)
    expect(screen.getByText('85% Match')).toBeInTheDocument()
  })

  it('applies emerald color for high scores (>=90)', () => {
    const { container } = render(<MatchMeter score={95} />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('emerald')
  })

  it('applies blue color for good scores (>=75)', () => {
    const { container } = render(<MatchMeter score={80} />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('blue')
  })

  it('applies amber color for average scores (>=60)', () => {
    const { container } = render(<MatchMeter score={65} />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('amber')
  })

  it('applies rose color for low scores (<60)', () => {
    const { container } = render(<MatchMeter score={40} />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('rose')
  })

  it('shows AI Fit label in lg size', () => {
    render(<MatchMeter score={85} size="lg" />)
    expect(screen.getByText('AI Fit')).toBeInTheDocument()
  })

  it('does not show AI Fit label in sm size', () => {
    render(<MatchMeter score={85} size="sm" />)
    expect(screen.queryByText('AI Fit')).not.toBeInTheDocument()
  })

  it('does not show AI Fit label when showLabel is false', () => {
    render(<MatchMeter score={85} size="lg" showLabel={false} />)
    expect(screen.queryByText('AI Fit')).not.toBeInTheDocument()
  })
})
