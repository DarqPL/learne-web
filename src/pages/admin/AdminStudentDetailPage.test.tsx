import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminStudentDetailPage } from './AdminStudentDetailPage'
import { adminGetStudent, adminLockUser, adminUnlockUser } from '../../lib/api/adminApi'
import type { AdminStudentDetail } from '../../lib/api/types'

vi.mock('../../lib/api/adminApi', () => ({
  adminGetStudent: vi.fn(),
  adminLockUser: vi.fn(),
  adminUnlockUser: vi.fn(),
}))

const mockedGet = vi.mocked(adminGetStudent)
const mockedLock = vi.mocked(adminLockUser)
const mockedUnlock = vi.mocked(adminUnlockUser)

function makeDetail(overrides: Partial<AdminStudentDetail> = {}): AdminStudentDetail {
  return {
    userId: 42,
    fullName: 'Hoc Sinh Chi Tiet',
    email: 'detail@example.com',
    locked: false,
    mustChangePassword: false,
    stats: { totalXp: 1250, currentStreakDays: 7, longestStreakDays: 30, lastActivityDate: null },
    enrollments: [
      {
        enrollmentId: 11,
        courseId: 5,
        courseName: 'Tieng Anh Co Ban',
        status: 'ACTIVE',
        progressPercent: 45,
        enrolledAt: '2026-02-01T00:00:00.000Z',
      },
    ],
    recentQuizAttempts: [
      { attemptId: 21, lessonTitle: 'Bai quiz 1', scorePercent: 80, passed: true, submittedAt: '2026-03-01T00:00:00.000Z' },
    ],
    recentGrammarChecks: [
      { id: 31, originalText: 'I go school', correctedText: 'I go to school', createdAt: '2026-03-02T00:00:00.000Z' },
    ],
    recentAiConversations: [{ id: 41, title: 'Hoi thoai AI', practiceType: 'FREE_CHAT', updatedAt: '2026-03-03T00:00:00.000Z' }],
    ...overrides,
  }
}

function apiResponse(data: AdminStudentDetail): Awaited<ReturnType<typeof adminGetStudent>> {
  return { data } as Awaited<ReturnType<typeof adminGetStudent>>
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/admin/students/42']}>
      <Routes>
        <Route path="/admin/students/:id" element={<AdminStudentDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminStudentDetailPage shadcn sync', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedLock.mockReset()
    mockedUnlock.mockReset()
    mockedLock.mockResolvedValue({ data: { message: 'ok' } } as never)
    mockedUnlock.mockResolvedValue({ data: { message: 'ok' } } as never)
    vi.restoreAllMocks()
  })

  it('shows shadcn skeletons while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderDetail()

    expect(document.querySelector('[data-slot="skeleton"]')).not.toBeNull()
  })

  it('shows a shadcn error alert when the detail request fails', async () => {
    mockedGet.mockRejectedValue(new Error('boom'))

    renderDetail()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveAttribute('data-slot', 'alert')
    expect(within(alert).getByText('Không thể tải thông tin học sinh.')).toBeInTheDocument()
  })

  it('renders breadcrumb root plus slim hero and stat cards', async () => {
    mockedGet.mockResolvedValue(apiResponse(makeDetail()))

    renderDetail()

    expect(await screen.findByText('Quản lý học sinh')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Hoc Sinh Chi Tiet' })).toBeInTheDocument()
    expect(screen.getByText('detail@example.com')).toBeInTheDocument()
    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument()

    expect(screen.getByText('1250')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="card"]')).not.toBeNull()
    expect(document.querySelector('[data-slot="badge"]')).not.toBeNull()

    expect(screen.getByText('Tieng Anh Co Ban')).toBeInTheDocument()
    expect(screen.getByText('Bai quiz 1')).toBeInTheDocument()
    expect(screen.getByText(/I go school/)).toBeInTheDocument()
    expect(screen.getByText('Hoi thoai AI')).toBeInTheDocument()
  })

  it('locks via AlertDialog naming the user without window.confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    mockedGet.mockResolvedValue(apiResponse(makeDetail({ locked: false })))

    renderDetail()

    await screen.findByRole('heading', { name: 'Hoc Sinh Chi Tiet' })
    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Hoc Sinh Chi Tiet')).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: /^Khóa$/ }))

    expect(mockedLock).toHaveBeenCalledWith(42)
    await waitFor(() => expect(mockedGet.mock.calls.length).toBeGreaterThanOrEqual(2))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('unlocks via AlertDialog with loading state kept open while pending', async () => {
    let resolve!: (value: unknown) => void
    const pending = new Promise((res) => {
      resolve = res as (value: unknown) => void
    })
    mockedUnlock.mockReturnValue(pending as never)
    mockedGet.mockResolvedValue(apiResponse(makeDetail({ locked: true })))

    renderDetail()

    await screen.findByRole('heading', { name: 'Hoc Sinh Chi Tiet' })
    fireEvent.click(screen.getByRole('button', { name: 'Mở khóa' }))

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mở khóa' }))

    await waitFor(() => expect(mockedUnlock).toHaveBeenCalledWith(42))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Mở khóa' })).toBeDisabled()

    resolve({ data: { message: 'ok' } })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('shows the lock error inside the dialog on failure', async () => {
    mockedUnlock.mockRejectedValue({ isAxiosError: true, response: { data: { message: 'mo khoa that bai' } } })
    mockedGet.mockResolvedValue(apiResponse(makeDetail({ locked: true })))

    renderDetail()

    await screen.findByRole('heading', { name: 'Hoc Sinh Chi Tiet' })
    fireEvent.click(screen.getByRole('button', { name: 'Mở khóa' }))

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mở khóa' }))

    const alert = await within(screen.getByRole('alertdialog')).findByRole('alert')
    expect(within(alert).getByText('mo khoa that bai')).toBeInTheDocument()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
