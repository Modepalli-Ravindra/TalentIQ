import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8" role="status">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

function EmptyState({ message, onAction, actionLabel }: { message: string; onAction?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center" role="status">
      <p className="text-gray-400 text-sm mb-4">{message}</p>
      {onAction && actionLabel && (
        <button onClick={onAction} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" role="alert">
      <p className="text-red-400 text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          Try Again
        </button>
      )}
    </div>
  )
}

describe('LoadingSpinner', () => {
  it('renders loading indicator', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders message', () => {
    render(<EmptyState message="No jobs found" />)
    expect(screen.getByText('No jobs found')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const mockAction = vi.fn()
    render(<EmptyState message="No results" onAction={mockAction} actionLabel="Clear Filters" />)
    expect(screen.getByText('Clear Filters')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Clear Filters'))
    expect(mockAction).toHaveBeenCalled()
  })

  it('does not render button when no action', () => {
    render(<EmptyState message="Nothing here" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage message="Failed to load data" />)
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders retry button when onRetry provided', () => {
    const mockRetry = vi.fn()
    render(<ErrorMessage message="Error occurred" onRetry={mockRetry} />)
    fireEvent.click(screen.getByText('Try Again'))
    expect(mockRetry).toHaveBeenCalled()
  })

  it('does not render retry button when no onRetry', () => {
    render(<ErrorMessage message="Error occurred" />)
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
  })
})
