import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherListPage } from './TeacherListPage'
import { getTeachers } from '../../lib/api/teacherApi'
import type { TeacherProfileSummary } from '../../lib/api/types'

vi.mock('../../lib/api/teacherApi', () => ({
  getTeachers: vi.fn(),
}))

const mockedGetTeachers = vi.mocked(getTeachers)

const teachers: TeacherProfileSummary[] = [
  {
    teacherId: 1,
    fullName: 'Nguyen Van Giao',
    email: 'giao@example.com',
    avatarUrl: 'https://example.com/giao.png',
    expertise: 'Giao tiep, IELTS',
    yearsOfExperience: 5,
  },
  {
    teacherId: 2,
    fullName: 'Tran Thi Vien',
    email: 'vien@example.com',
    avatarUrl: undefined,
    expertise: 'Ngu phap',
    yearsOfExperience: 3,
  },
]

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/student/teachers']}>
      <Routes>
        <Route path="/student/teachers" element={<TeacherListPage />} />
        <Route path="/student/teachers/:id" element={<div>Teacher detail page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TeacherListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetTeachers.mockResolvedValue({ data: teachers } as Awaited<ReturnType<typeof getTeachers>>)
  })

  it('renders teacher cards with name, expertise and experience', async () => {
    renderPage()

    expect(await screen.findByText('Nguyen Van Giao')).toBeInTheDocument()
    expect(screen.getByText('Giao tiep, IELTS')).toBeInTheDocument()
    expect(screen.getByText(/5 năm kinh nghiệm/)).toBeInTheDocument()
    expect(screen.getByText('Tran Thi Vien')).toBeInTheDocument()
  })

  it('navigates to the detail page when a card is clicked', async () => {
    renderPage()

    fireEvent.click(await screen.findByText('Nguyen Van Giao'))
    expect(await screen.findByText('Teacher detail page')).toBeInTheDocument()
  })

  it('shows an error alert when loading fails', async () => {
    mockedGetTeachers.mockRejectedValueOnce({ isAxiosError: true, response: { data: { message: 'Loi' } } })
    renderPage()

    expect(await screen.findByText('Loi')).toBeInTheDocument()
  })

  it('shows an empty message when there are no teachers', async () => {
    mockedGetTeachers.mockResolvedValueOnce({ data: [] } as Awaited<ReturnType<typeof getTeachers>>)
    renderPage()

    expect(await screen.findByText(/Chưa có giảng viên nào/)).toBeInTheDocument()
  })
})
