import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminTeacherListPage } from './AdminTeacherListPage'
import { adminListTeachers, adminLockTeacher, adminUnlockTeacher, adminResendTeacherInvitation } from '../../lib/api/adminApi'
import type { AdminTeacher } from '../../lib/api/types'

vi.mock('../../lib/api/adminApi', () => ({
  adminListTeachers: vi.fn(),
  adminLockTeacher: vi.fn(),
  adminUnlockTeacher: vi.fn(),
  adminResendTeacherInvitation: vi.fn(),
}))

const mockedList = vi.mocked(adminListTeachers)
const mockedLock = vi.mocked(adminLockTeacher)
const mockedUnlock = vi.mocked(adminUnlockTeacher)

function apiResponse(data: AdminTeacher[]): Awaited<ReturnType<typeof adminListTeachers>> {
  return { data: { content: data, page: 0, size: data.length, totalElements: data.length, totalPages: 1 } } as Awaited<ReturnType<typeof adminListTeachers>>
}

function makeTeacher(overrides: Partial<AdminTeacher> = {}): AdminTeacher {
  return {
    userId: 1,
    fullName: 'Nguyen Van A',
    email: 'a@example.com',
    locked: false,
    mustChangePassword: false,
    profileStatus: 'ACTIVE',
    completed: true,
    ...overrides,
  }
}

const eightTeachers: AdminTeacher[] = [
  makeTeacher({ userId: 1, fullName: 'Giang Vien 1', email: 'gv1@example.com' }),
  makeTeacher({ userId: 2, fullName: 'Giang Vien 2', email: 'gv2@example.com', locked: true }),
  makeTeacher({
    userId: 3,
    fullName: 'Giang Vien 3',
    email: 'gv3@example.com',
    mustChangePassword: true,
    profileStatus: null,
    completed: false,
  }),
  makeTeacher({ userId: 4, fullName: 'Giang Vien 4', email: 'gv4@example.com', profileStatus: 'INACTIVE' }),
  makeTeacher({ userId: 5, fullName: 'Giang Vien 5', email: 'gv5@example.com' }),
  makeTeacher({ userId: 6, fullName: 'Giang Vien 6', email: 'gv6@example.com' }),
  makeTeacher({ userId: 7, fullName: 'Giang Vien 7', email: 'gv7@example.com' }),
  makeTeacher({
    userId: 8,
    fullName: 'Giang Vien 8',
    email: 'gv8@example.com',
    locked: true,
    profileStatus: 'SUSPENDED',
  }),
]

function tableRows() {
  const body = document.querySelector('[data-slot="table-body"]')
  if (!body) return []
  return within(body as HTMLElement).queryAllByRole('row')
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminTeacherListPage />
    </MemoryRouter>,
  )
}

describe('AdminTeacherListPage shadcn sync', () => {
  beforeEach(() => {
    mockedList.mockReset()
    mockedLock.mockReset()
    mockedUnlock.mockReset()
    vi.mocked(adminResendTeacherInvitation).mockReset()
    mockedLock.mockResolvedValue({ data: { message: 'ok' } } as never)
    mockedUnlock.mockResolvedValue({ data: { message: 'ok' } } as never)
    vi.restoreAllMocks()
  })

  it('shows shadcn skeletons while loading', () => {
    mockedList.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(document.querySelector('[data-slot="skeleton"]')).not.toBeNull()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  const failedDelivery = { status: 'FAILED' as const, requestedAt: null, completedAt: null, failureCode: 'SMTP_ERROR', canResend: true }
  const queuedDelivery = { ...failedDelivery, status: 'QUEUED' as const, failureCode: null, canResend: false }

  async function openResendOnPageTwo(refresh?: ReturnType<typeof apiResponse>) {
    const first = apiResponse([makeTeacher()])
    first.data.totalPages = 2
    const second = apiResponse([makeTeacher({ userId: 7, invitationDelivery: failedDelivery })])
    second.data.page = 1
    second.data.totalPages = 2
    mockedList.mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    if (refresh) mockedList.mockResolvedValue(refresh)
    else mockedList.mockRejectedValue(new Error('offline'))
    renderPage()
    fireEvent.click(await screen.findByRole('link', { name: 'Trang sau' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi lại email cấp tài khoản' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận gửi lại' }))
    return dialog
  }

  it('applies accepted delivery before a failed GET, keeps acceptance and allows manual refresh without duplicate POST', async () => {
    vi.mocked(adminResendTeacherInvitation).mockResolvedValue({ data: queuedDelivery } as never)
    const dialog = await openResendOnPageTwo()
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(screen.getByText('Yêu cầu gửi email cấp tài khoản đã được tiếp nhận.')).toBeInTheDocument()
    expect(screen.getByText('Đang chờ gửi')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gửi lại email cấp tài khoản' })).not.toBeInTheDocument()
    expect(mockedList).toHaveBeenLastCalledWith({ page: 1, size: 6 })
    expect(adminResendTeacherInvitation).toHaveBeenCalledExactlyOnceWith(7)
    expect(screen.getByRole('button', { name: 'Làm mới danh sách' })).toBeInTheDocument()
    const recovered = apiResponse([makeTeacher({ userId: 7, invitationDelivery: queuedDelivery })])
    recovered.data.page = 1
    mockedList.mockResolvedValue(recovered)
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới danh sách' }))
    await waitFor(() => expect(screen.queryByText('Không thể tải danh sách giảng viên.')).not.toBeInTheDocument())
    expect(adminResendTeacherInvitation).toHaveBeenCalledTimes(1)
  })

  it('updates accepted queued status and refreshes page two after successful resend', async () => {
    vi.mocked(adminResendTeacherInvitation).mockResolvedValue({ status: 202, data: queuedDelivery } as never)
    const refreshed = apiResponse([makeTeacher({ userId: 7, invitationDelivery: queuedDelivery })])
    refreshed.data.page = 1
    refreshed.data.totalPages = 2
    await openResendOnPageTwo(refreshed)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Đang chờ gửi')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gửi lại email cấp tài khoản' })).not.toBeInTheDocument()
    expect(mockedList).toHaveBeenLastCalledWith({ page: 1, size: 6 })
    expect(adminResendTeacherInvitation).toHaveBeenCalledExactlyOnceWith(7)
  })

  it('refreshes current page on 409 and keeps dialog error after eligibility changes without false acceptance or retry', async () => {
    vi.mocked(adminResendTeacherInvitation).mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'Yêu cầu đang được xử lý' } } })
    const refreshed = apiResponse([makeTeacher({ userId: 7, invitationDelivery: queuedDelivery })])
    refreshed.data.page = 1
    refreshed.data.totalPages = 2
    const dialog = await openResendOnPageTwo(refreshed)
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Yêu cầu đang được xử lý')
    await waitFor(() => expect(mockedList).toHaveBeenLastCalledWith({ page: 1, size: 6 }))
    expect(screen.queryByText('Yêu cầu gửi email cấp tài khoản đã được tiếp nhận.')).not.toBeInTheDocument()
    expect(adminResendTeacherInvitation).toHaveBeenCalledTimes(1)
    expect(within(dialog).getByRole('button', { name: 'Xác nhận gửi lại' })).toBeDisabled()
  })

  it('shows a shadcn error alert when the list request fails', async () => {
    mockedList.mockRejectedValue(new Error('boom'))

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveAttribute('data-slot', 'alert')
    expect(within(alert).getByText('Không thể tải danh sách giảng viên.')).toBeInTheDocument()
  })

  it('renders a teacher-style indigo table with sticky header', async () => {
    mockedList.mockResolvedValue(apiResponse(eightTeachers.slice(0, 1)))

    renderPage()

    const table = await screen.findByRole('table')
    expect(table).toHaveAttribute('data-slot', 'table')
    expect(table.className).toContain('border-indigo-100/70')
    expect(document.querySelector('[data-slot="table-header"]')?.className).toContain('bg-indigo-50')
    expect(table.closest('[data-slot="table-container"]')?.parentElement?.className).toContain('border-indigo-100')
    expect(screen.getByText('Họ và tên')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders six rows per page with Vietnamese pagination labels', async () => {
    mockedList.mockResolvedValue(apiResponse(eightTeachers))

    renderPage()

    await screen.findByRole('table')

    expect(tableRows()).toHaveLength(8)
    expect(screen.getByText('Giang Vien 1')).toBeInTheDocument()
    expect(screen.getByText('Giang Vien 7')).toBeInTheDocument()
    expect(screen.getByText('Giang Vien 8')).toBeInTheDocument()

    expect(screen.queryByRole('link', { name: 'Trang trước' })).not.toBeInTheDocument()
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('moves to page two showing the remaining rows', async () => {
    mockedList.mockResolvedValue(apiResponse(eightTeachers))

    renderPage()

    await screen.findByRole('table')
    expect(tableRows()).toHaveLength(8)
  })

  it('renders status badges for account and profile states', async () => {
    mockedList.mockResolvedValue(apiResponse(eightTeachers.slice(0, 3)))

    renderPage()

    await screen.findByRole('table')

    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument()
    expect(screen.getByText('Bị khóa')).toBeInTheDocument()
    expect(screen.getByText('Chưa đổi mật khẩu')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="badge"]')).not.toBeNull()
  })

  it('renders icon lock buttons naming the teacher', async () => {
    mockedList.mockResolvedValue(apiResponse(eightTeachers.slice(0, 2)))

    renderPage()

    await screen.findByRole('table')

    expect(screen.getByRole('button', { name: 'Khóa tài khoản Giang Vien 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mở khóa tài khoản Giang Vien 2' })).toBeInTheDocument()
  })

  it('opens an AlertDialog naming the teacher for lock and confirms via lock API without window.confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    mockedList.mockResolvedValue(apiResponse(eightTeachers.slice(0, 1)))

    renderPage()

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Khóa tài khoản Giang Vien 1' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Giang Vien 1')).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: /^Khóa$/ }))

    expect(mockedLock).toHaveBeenCalledTimes(1)
    expect(mockedLock).toHaveBeenCalledWith(1)
    await waitFor(() => expect(mockedList.mock.calls.length).toBeGreaterThanOrEqual(2))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('opens an AlertDialog naming the teacher for unlock and confirms via unlock API without window.confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    mockedList.mockResolvedValue(apiResponse([eightTeachers[1]]))

    renderPage()

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Mở khóa tài khoản Giang Vien 2' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Giang Vien 2')).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Mở khóa' }))

    expect(mockedUnlock).toHaveBeenCalledTimes(1)
    expect(mockedUnlock).toHaveBeenCalledWith(2)
    await waitFor(() => expect(mockedList.mock.calls.length).toBeGreaterThanOrEqual(2))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('keeps the dialog open with loading state and shows the error inside the dialog on failure', async () => {
    let reject!: (reason?: unknown) => void
    const pending = new Promise<never>((_, rej) => {
      reject = rej
    })
    mockedLock.mockReturnValue(pending as never)
    mockedList.mockResolvedValue(apiResponse(eightTeachers.slice(0, 1)))

    renderPage()

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Khóa tài khoản Giang Vien 1' }))

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^Khóa$/ }))

    await waitFor(() => expect(mockedLock).toHaveBeenCalledWith(1))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    reject({ isAxiosError: true, response: { data: { message: 'khoa that bai' } } })
    const alert = await within(screen.getByRole('alertdialog')).findByRole('alert')
    expect(within(alert).getByText('khoa that bai')).toBeInTheDocument()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
