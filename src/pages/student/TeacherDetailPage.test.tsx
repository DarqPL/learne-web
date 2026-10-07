import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherDetailPage } from './TeacherDetailPage'
import { getTeacherDetail } from '../../lib/api/teacherApi'
import type { TeacherProfile } from '../../lib/api/types'

vi.mock('../../lib/api/teacherApi', () => ({
  getTeacherDetail: vi.fn(),
}))

const mockedGetTeacherDetail = vi.mocked(getTeacherDetail)

const profile: TeacherProfile = {
  teacherId: 7,
  fullName: 'Nguyen Van Giao',
  email: 'giao@example.com',
  bio: 'Giao vien IELTS 8.0.',
  expertise: 'IELTS, Giao tiep',
  yearsOfExperience: 6,
  avatarUrl: 'https://example.com/giao.png',
  introductionVideoUrl: 'https://example.com/intro.mp4',
  status: 'ACTIVE',
  completed: true,
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student/teachers/:id" element={<TeacherDetailPage />} />
        <Route path="/student/teachers" element={<div>Danh sach giang vien</div>} />
        <Route path="/student/courses" element={<div>Khoa hoc</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TeacherDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetTeacherDetail.mockResolvedValue({ data: profile } as Awaited<ReturnType<typeof getTeacherDetail>>)
  })

  it('renders header, video, bio, expertise and experience sections', async () => {
    renderAt('/student/teachers/7')

    expect(await screen.findByText('Nguyen Van Giao')).toBeInTheDocument()
    expect(screen.getByText('giao@example.com')).toBeInTheDocument()
    expect(screen.getByText('Giao vien IELTS 8.0.')).toBeInTheDocument()
    expect(screen.getByText('IELTS, Giao tiep')).toBeInTheDocument()
    expect(screen.getByText(/6 năm kinh nghiệm/)).toBeInTheDocument()
    expect(document.querySelector('video')).toHaveAttribute('src', 'https://example.com/intro.mp4')
  })

  it('hides status badges and edit controls', async () => {
    renderAt('/student/teachers/7')

    await screen.findByText('Nguyen Van Giao')
    expect(screen.queryByText(/Chỉnh sửa/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Đổi ảnh/)).not.toBeInTheDocument()
    expect(screen.queryByText(/ACTIVE/)).not.toBeInTheDocument()
  })

  it('navigates back to the list', async () => {
    renderAt('/student/teachers/7')

    fireEvent.click(await screen.findByRole('button', { name: /quay lại danh sách/i }))
    expect(await screen.findByText('Danh sach giang vien')).toBeInTheDocument()
  })

  it('shows an error alert for unknown teachers', async () => {
    mockedGetTeacherDetail.mockRejectedValueOnce({ isAxiosError: true, response: { data: { message: 'Khong tim thay' } } })
    renderAt('/student/teachers/999')

    expect(await screen.findByText('Khong tim thay')).toBeInTheDocument()
  })
})
