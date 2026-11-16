import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RateLimitAlert } from './RateLimitAlert'

describe('RateLimitAlert', () => {
  it('renders the live countdown inside a non-live timer', () => {
    render(<RateLimitAlert info={{ kind: 'limited', retryAfterSeconds: 42 }} secondsLeft={42} />)

    expect(screen.getByText(/Quá nhiều lần thử/)).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('00:42')
    expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'off')
    expect(screen.getByRole('status')).toHaveTextContent('Đã tạm khóa gửi yêu cầu.')
    expect(screen.getByRole('group')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('announces the start and the finish without per-second changes', () => {
    const { rerender } = render(
      <RateLimitAlert info={{ kind: 'limited', retryAfterSeconds: 2 }} secondsLeft={2} />,
    )
    const status = screen.getByRole('status')

    expect(screen.getByRole('timer')).toHaveTextContent('00:02')
    expect(status).toHaveTextContent('Đã tạm khóa gửi yêu cầu.')

    rerender(<RateLimitAlert info={{ kind: 'limited', retryAfterSeconds: 1 }} secondsLeft={1} />)
    expect(screen.getByRole('status')).toBe(status)
    expect(screen.getByRole('timer')).toHaveTextContent('00:01')
    expect(status).toHaveTextContent('Đã tạm khóa gửi yêu cầu.')
    expect(screen.queryByText('Bạn có thể thử lại.')).not.toBeInTheDocument()

    rerender(<RateLimitAlert info={{ kind: 'limited', retryAfterSeconds: 0 }} secondsLeft={0} />)
    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent('Bạn có thể thử lại.')
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByRole('group')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders the unavailable copy without a timer', () => {
    render(<RateLimitAlert info={{ kind: 'unavailable' }} secondsLeft={0} />)

    expect(screen.getByText(/Tạm thời không thể xác thực/)).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
