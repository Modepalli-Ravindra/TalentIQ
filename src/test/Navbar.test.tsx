import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Navbar } from '@/components/layout/Navbar'

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}))

vi.mock('@/context/NotificationContext', () => ({
  NotificationContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: unknown) => React.ReactNode }) => children({ unreadCount: 0 }),
  },
  useNotifications: () => ({ unreadCount: 0 }),
}))

describe('Navbar', () => {
  const mockNavigate = vi.fn()
  const mockOpenCommandPalette = vi.fn()
  const mockOpenAuthModal = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders brand logo', () => {
    render(
      <Navbar
        currentView="landing"
        onNavigateView={mockNavigate}
        onOpenCommandPalette={mockOpenCommandPalette}
        onOpenAuthModal={mockOpenAuthModal}
      />
    )
    expect(screen.getByText('TalentIQ')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('shows sign in button for unauthenticated users', () => {
    render(
      <Navbar
        currentView="landing"
        onNavigateView={mockNavigate}
        onOpenCommandPalette={mockOpenCommandPalette}
        onOpenAuthModal={mockOpenAuthModal}
      />
    )
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('shows search command palette trigger', () => {
    render(
      <Navbar
        currentView="landing"
        onNavigateView={mockNavigate}
        onOpenCommandPalette={mockOpenCommandPalette}
        onOpenAuthModal={mockOpenAuthModal}
      />
    )
    expect(screen.getByText('Search...')).toBeInTheDocument()
  })

  it('calls onOpenCommandPalette when search clicked', () => {
    render(
      <Navbar
        currentView="landing"
        onNavigateView={mockNavigate}
        onOpenCommandPalette={mockOpenCommandPalette}
        onOpenAuthModal={mockOpenAuthModal}
      />
    )
    fireEvent.click(screen.getByText('Search...'))
    expect(mockOpenCommandPalette).toHaveBeenCalled()
  })

  it('calls onOpenAuthModal when Sign In clicked', () => {
    render(
      <Navbar
        currentView="landing"
        onNavigateView={mockNavigate}
        onOpenCommandPalette={mockOpenCommandPalette}
        onOpenAuthModal={mockOpenAuthModal}
      />
    )
    fireEvent.click(screen.getByText('Sign In'))
    expect(mockOpenAuthModal).toHaveBeenCalled()
  })
})
