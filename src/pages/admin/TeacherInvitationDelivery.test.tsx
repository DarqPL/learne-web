import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TeacherInvitationDelivery } from './TeacherInvitationDelivery'
import type { TeacherInvitationDelivery as Delivery } from '../../lib/api/types'

const delivery: Delivery = { status: 'FAILED', requestedAt: null, completedAt: null, failureCode: 'SMTP_ERROR', canResend: true }

describe('TeacherInvitationDelivery', () => {
  it.each([
    ['NOT_REQUESTED', 'Chưa yêu cầu gửi'], ['HISTORY_UNAVAILABLE', 'Không có lịch sử gửi'],
    ['QUEUED', 'Đang chờ gửi'], ['SENDING', 'Đang gửi'], ['RETRYING', 'Đang thử gửi lại'],
    ['SENT', 'Máy chủ SMTP đã tiếp nhận'], ['FAILED', 'Gửi thất bại'], ['SKIPPED', 'Đã bỏ qua'],
  ] as const)('maps %s accurately with server-ineligible resend hidden', (status, label) => {
    render(<TeacherInvitationDelivery delivery={{ ...delivery, status, canResend: false }} onResend={vi.fn()} />)
    expect(screen.getByText(label)).toHaveAttribute('data-slot', 'badge')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it.each([null, undefined])('handles missing delivery without an action (%s)', (value) => {
    render(<TeacherInvitationDelivery delivery={value} onResend={vi.fn()} />)
    expect(screen.getByText('Chưa có thông tin gửi')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('warns about password invalidation, blocks duplicate pending clicks and keeps API errors accessible', async () => {
    let reject!: (reason: unknown) => void
    const action = vi.fn(() => new Promise<void>((_, rej) => { reject = rej }))
    const { rerender } = render(<TeacherInvitationDelivery delivery={delivery} onResend={action} />)
    fireEvent.click(screen.getByRole('button', { name: 'Gửi lại email cấp tài khoản' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Mật khẩu tạm mới sẽ vô hiệu hóa mật khẩu tạm cũ/)).toBeInTheDocument()
    expect(dialog.querySelector('input')).toBeNull()
    const confirm = within(dialog).getByRole('button', { name: 'Xác nhận gửi lại' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(confirm).toBeDisabled()
    expect(action).toHaveBeenCalledTimes(1)
    rerender(<TeacherInvitationDelivery delivery={{ ...delivery, canResend: false }} onResend={action} />)
    reject({ isAxiosError: true, response: { data: { message: 'Lỗi gửi lại' } } })
    await waitFor(() => expect(within(dialog).getByRole('alert')).toHaveTextContent('Lỗi gửi lại'))
    expect(confirm).toBeDisabled()
    expect(action).toHaveBeenCalledTimes(1)
  })
})
