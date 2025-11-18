import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateEventDialog } from '@/components/create-event-dialog'
import * as apiClient from '@/lib/api-client'

jest.mock('@/lib/api-client')
jest.mock('@/lib/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

describe('CreateEventDialog', () => {
  const mockOnOpenChange = jest.fn()
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dialog when open', () => {
    render(<CreateEventDialog {...defaultProps} />)
    expect(screen.getByText('Create Emergency Event')).toBeInTheDocument()
  })

  it('submits event with valid data', async () => {
    const user = userEvent.setup()
    ;(apiClient.api.post as jest.Mock).mockResolvedValue({ id: 1 })

    render(<CreateEventDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Describe the emergency situation...'), 'Test flood')
    await user.type(screen.getByPlaceholderText('Enter location address...'), 'Test Street')
    await user.type(screen.getByPlaceholderText('-12.8432905'), '55.6761')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(apiClient.api.post).toHaveBeenCalledWith('/events/', expect.objectContaining({
        description: 'Test flood',
        priority: 2,
        status: 'pending'
      }))
    })
  })

  it('shows error on failed submission', async () => {
    const user = userEvent.setup()
    ;(apiClient.api.post as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(<CreateEventDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Describe the emergency situation...'), 'Test')
    await user.type(screen.getByPlaceholderText('Enter location address...'), 'Test')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to create event')).toBeInTheDocument()
    })
  })

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup()
    render(<CreateEventDialog {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})