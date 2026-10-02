import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminTeacherListPage } from './AdminTeacherListPage'
import { adminListTeachers, adminLockTeacher, adminUnlockTeacher } from '../../lib/api/adminApi'
import type { AdminTeacher } from '../../lib/api/types'

vi.mock('../../lib/api/adminApi', () => ({
  adminListTeachers: vi.fn(),
  adminLockTeacher: vi.fn(),
  adminUnlockTeacher: vi.fn(),
}))

const mockedList = vi.mocked(adminListTeachers)
const mockedLock = vi.mocked(adminLockTeacher)
const mockedUnlock = vi.mocked(adminUnlockTeacher)

function apiResponse(data: AdminTeacher[]): Awaited<ReturnType<typeof adminListTeachers>> {
  return { data } as Awaited<ReturnType<typeof adminListTeachers>>
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
    expect(within(alert).getByText('Không thể tải danh sách giảng viên.')).toBeInTheDocument()
  })

  it('renders a shadcn table with sticky header', async () => {
    mockedList.mockResolvedValue(apiResponse(eightTeachers.slice(0, 1)))

    renderPage()

    const table = await screen.findByRole('table')
    expect(table).toHaveAttribute('data-slot', 'table')
    expect(document.querySelector('[data-slot="table-header"]')).not.toBeNull()
    expect(screen.getByText('Họ và tên')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders six rows per page with Vietnamese pagination labels', async () => {
    mockedList.mockResolvedValue(apiResponse(eightTeachers))

    renderPage()

    await screen.findByRole('table')

    expect(tableRows()).toHaveLength(6)
    expect(screen.getByText('Giang Vien 1')).toBeInTheDocument()
    expect(screen.queryByText('Giang Vien 7')).not.toBeInTheDocument()
    expect(screen.queryByText('Giang Vien 8')).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Trang trước' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trang sau' })).toBeInTheDocument()
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('moves to page two showing the remaining rows', async () => {
    mockedList.mockResolvedValue(apiResponse(eightTeachers))

    renderPage()

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('link', { name: '2' }))

    expect(tableRows()).toHaveLength(2)
    expect(screen.getByText('Giang Vien 7')).toBeInTheDocument()
    expect(screen.getByText('Giang Vien 8')).toBeInTheDocument()
    expect(screen.queryByText('Giang Vien 1')).not.toBeInTheDocument()
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

  it('opens an AlertDialog naming the teacher for lock and confirms via lock API without window.confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    mockedList.mockResolvedValue(apiResponse(eightTeachers.slice(0, 1)))

    renderPage()

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }))

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
    fireEvent.click(screen.getByRole('button', { name: 'Mở khóa' }))

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
