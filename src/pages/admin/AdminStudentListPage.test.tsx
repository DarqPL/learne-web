import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminStudentListPage } from './AdminStudentListPage'
import { adminListStudents, adminLockUser, adminUnlockUser } from '../../lib/api/adminApi'
import type { AdminStudentSummary } from '../../lib/api/types'

vi.mock('../../lib/api/adminApi', () => ({
  adminListStudents: vi.fn(),
  adminLockUser: vi.fn(),
  adminUnlockUser: vi.fn(),
}))

const mockedList = vi.mocked(adminListStudents)
const mockedLock = vi.mocked(adminLockUser)
const mockedUnlock = vi.mocked(adminUnlockUser)

function apiResponse(data: AdminStudentSummary[]): Awaited<ReturnType<typeof adminListStudents>> {
  return { data } as Awaited<ReturnType<typeof adminListStudents>>
}

function makeStudent(overrides: Partial<AdminStudentSummary> = {}): AdminStudentSummary {
  return {
    userId: 1,
    fullName: 'Nguyen Van A',
    email: 'a@example.com',
    locked: false,
    mustChangePassword: false,
    totalXp: 100,
    currentStreakDays: 3,
    longestStreakDays: 10,
    lastActivityDate: null,
    enrollmentCount: 2,
    completedLessonCount: 5,
    ...overrides,
  }
}

const eightStudents: AdminStudentSummary[] = [
  makeStudent({ userId: 1, fullName: 'Hoc Sinh 1', email: 'hs1@example.com' }),
  makeStudent({ userId: 2, fullName: 'Hoc Sinh 2', email: 'hs2@example.com', locked: true }),
  makeStudent({ userId: 3, fullName: 'Hoc Sinh 3', email: 'hs3@example.com', mustChangePassword: true }),
  makeStudent({ userId: 4, fullName: 'Hoc Sinh 4', email: 'hs4@example.com' }),
  makeStudent({ userId: 5, fullName: 'Hoc Sinh 5', email: 'hs5@example.com' }),
  makeStudent({ userId: 6, fullName: 'Hoc Sinh 6', email: 'hs6@example.com' }),
  makeStudent({ userId: 7, fullName: 'Hoc Sinh 7', email: 'hs7@example.com' }),
  makeStudent({ userId: 8, fullName: 'Hoc Sinh 8', email: 'hs8@example.com', locked: true }),
]

function tableRows() {
  const body = document.querySelector('[data-slot="table-body"]')
  if (!body) return []
  return within(body as HTMLElement).queryAllByRole('row')
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminStudentListPage />
    </MemoryRouter>,
  )
}

describe('AdminStudentListPage shadcn sync', () => {
  beforeEach(() => {
    mockedList.mockReset()
    mockedLock.mockReset()
    mockedUnlock.mockReset()
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

  it('shows a shadcn error alert when the list request fails', async () => {
    mockedList.mockRejectedValue(new Error('boom'))

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveAttribute('data-slot', 'alert')
    expect(within(alert).getByText('Không thể tải danh sách học sinh.')).toBeInTheDocument()
  })

  it('renders six rows per page with Vietnamese pagination labels', async () => {
    mockedList.mockResolvedValue(apiResponse(eightStudents))

    renderPage()

    await screen.findByRole('table')

    expect(tableRows()).toHaveLength(6)
    expect(screen.getByText('Hoc Sinh 1')).toBeInTheDocument()
    expect(screen.queryByText('Hoc Sinh 7')).not.toBeInTheDocument()
    expect(screen.queryByText('Hoc Sinh 8')).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Trang trước' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trang sau' })).toBeInTheDocument()
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('moves to page two showing the remaining rows', async () => {
    mockedList.mockResolvedValue(apiResponse(eightStudents))

    renderPage()

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('link', { name: '2' }))

    expect(tableRows()).toHaveLength(2)
    expect(screen.getByText('Hoc Sinh 7')).toBeInTheDocument()
    expect(screen.getByText('Hoc Sinh 8')).toBeInTheDocument()
    expect(screen.queryByText('Hoc Sinh 1')).not.toBeInTheDocument()
  })

  it('renders status badges and detail links per row', async () => {
    mockedList.mockResolvedValue(apiResponse(eightStudents.slice(0, 3)))

    renderPage()

    await screen.findByRole('table')

    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument()
    expect(screen.getByText('Bị khóa')).toBeInTheDocument()
    expect(screen.getByText('Chưa đổi mật khẩu')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="badge"]')).not.toBeNull()

    const links = screen.getAllByRole('link', { name: 'Chi tiết' })
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute('href', '/admin/students/1')
  })

  it('opens an AlertDialog naming the user for lock and confirms via lock API without window.confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    mockedList.mockResolvedValue(apiResponse(eightStudents.slice(0, 1)))

    renderPage()

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Hoc Sinh 1')).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: /^Khóa$/ }))

    expect(mockedLock).toHaveBeenCalledTimes(1)
    expect(mockedLock).toHaveBeenCalledWith(1)
    await waitFor(() => expect(mockedList.mock.calls.length).toBeGreaterThanOrEqual(2))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('opens an AlertDialog naming the user for unlock and confirms via unlock API without window.confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    mockedList.mockResolvedValue(apiResponse([eightStudents[1]]))

    renderPage()

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Mở khóa' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Hoc Sinh 2')).toBeInTheDocument()
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
    mockedList.mockResolvedValue(apiResponse(eightStudents.slice(0, 1)))

    renderPage()

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }))

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
