import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthModal } from '@/components/auth/AuthModal'

const mockLogin = vi.fn().mockResolvedValue(undefined)
const mockRegister = vi.fn().mockResolvedValue(undefined)

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    isAuthenticated: false,
    user: null,
    token: null,
  }),
}))

describe('AuthModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockReset()
    mockLogin.mockClear()
    mockRegister.mockClear()
  })

  it('renders login form by default', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText('Sign In to TalentIQ AI')).toBeInTheDocument()
  })

  it('renders email input', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('renders password input', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByPlaceholderText('Min. 6 characters')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<AuthModal isOpen={false} onClose={mockOnClose} />)
    expect(screen.queryByText('Sign In to TalentIQ AI')).not.toBeInTheDocument()
  })

  it('shows create account link', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText(/Don't have an account/)).toBeInTheDocument()
  })

  it('toggles to register mode', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText(/Don't have an account/))
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
  })

  it('shows name input in register mode', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText(/Don't have an account/))
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
  })

  it('shows confirm password input in register mode', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText(/Don't have an account/))
    expect(screen.getByPlaceholderText('Re-enter password')).toBeInTheDocument()
  })

  it('shows role selection in register mode', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText(/Don't have an account/))
    expect(screen.getByText('Job Seeker')).toBeInTheDocument()
    expect(screen.getByText('Recruiter')).toBeInTheDocument()
  })

  it('calls login on form submit', async () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123')
  })

  it('calls register on form submit in register mode', async () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText(/Don't have an account/))
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('Re-enter password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(mockRegister).toHaveBeenCalledWith('Test User', 'test@test.com', 'password123', 'candidate')
  })

  it('shows error when passwords do not match in register mode', async () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText(/Don't have an account/))
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('Re-enter password'), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })
})
