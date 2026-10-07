import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentProfilePage } from './StudentProfilePage'
import {
  deleteStudentAvatar,
  getStudentProfile,
  updateStudentProfile,
  uploadStudentAvatar,
} from '@/lib/api/studentProfileApi'
import type { StudentProfile } from '@/lib/api/types'

vi.mock('@/lib/api/studentProfileApi', () => ({
  getStudentProfile: vi.fn(),
  updateStudentProfile: vi.fn(),
  uploadStudentAvatar: vi.fn(),
  deleteStudentAvatar: vi.fn(),
}))

const mockedGet = vi.mocked(getStudentProfile)
const mockedUpdate = vi.mocked(updateStudentProfile)
const mockedUpload = vi.mocked(uploadStudentAvatar)
const mockedDelete = vi.mocked(deleteStudentAvatar)

const profile: StudentProfile = {
  studentId: 71,
  fullName: 'Student One',
  email: 'student@example.com',
  phoneNumber: '0909000000',
  dateOfBirth: '2001-02-03',
  bio: 'Dang hoc IELTS.',
  learningGoal: 'Dat B2 trong nam nay.',
  currentLevel: 'A2',
  dailyLearningMinutes: 45,
  preferredSkills: ['GRAMMAR', 'READING'],
  avatarUrl: 'https://example.com/avatar.png',
  publicProfileEnabled: true,
  showEmail: false,
  showPhoneNumber: false,
  showDateOfBirth: false,
}

function apiResponse<T>(data: T) {
  return { data } as unknown as Awaited<ReturnType<typeof getStudentProfile>>
}

function mockLoaded(overrides: Partial<StudentProfile> = {}) {
  const merged = { ...profile, ...overrides }
  mockedGet.mockResolvedValue(apiResponse(merged))
  mockedUpdate.mockResolvedValue(apiResponse(merged))
  mockedUpload.mockResolvedValue(apiResponse({ ...merged, avatarUrl: 'https://example.com/new.png' }))
  mockedDelete.mockResolvedValue(apiResponse({ ...merged, avatarUrl: null }))
}

describe('StudentProfilePage', () => {
  beforeEach(() => {
    mockLoaded()
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the profile header and three tabs', async () => {
    render(<StudentProfilePage />)

    expect(await screen.findByRole('heading', { name: /hồ sơ học viên/i })).toBeInTheDocument()
    expect(screen.getByText('Student One')).toBeInTheDocument()
    expect(screen.getByText('student@example.com')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /thông tin/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /học tập/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /riêng tư/i })).toBeInTheDocument()
  })

  it('saves info tab with a complete merged payload', async () => {
    mockedUpdate.mockResolvedValue(
      apiResponse({ ...profile, fullName: 'Student Updated' }),
    )
    render(<StudentProfilePage />)

    await screen.findByDisplayValue('Student One')
    fireEvent.click(screen.getByRole('button', { name: /chỉnh sửa thông tin/i }))
    const nameInput = screen.getByLabelText(/họ và tên/i)
    fireEvent.change(nameInput, { target: { value: 'Student Updated' } })
    fireEvent.click(screen.getByRole('button', { name: /lưu thông tin/i }))

    await waitFor(() =>
      expect(mockedUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Student Updated',
          phoneNumber: '0909000000',
          dateOfBirth: '2001-02-03',
          learningGoal: 'Dat B2 trong nam nay.',
          preferredSkills: ['GRAMMAR', 'READING'],
          publicProfileEnabled: true,
          showEmail: false,
          showPhoneNumber: false,
          showDateOfBirth: false,
        }),
      ),
    )
  })

  it('blocks invalid full name before submit', async () => {
    render(<StudentProfilePage />)

    await screen.findByDisplayValue('Student One')
    fireEvent.click(screen.getByRole('button', { name: /chỉnh sửa thông tin/i }))
    fireEvent.change(screen.getByLabelText(/họ và tên/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /lưu thông tin/i }))

    expect(await screen.findByText(/vui lòng nhập họ và tên/i)).toBeInTheDocument()
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('uploads and deletes an avatar', async () => {
    render(<StudentProfilePage />)

    await screen.findByText('Student One')
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/đổi ảnh/i), { target: { files: [file] } })
    await waitFor(() => expect(mockedUpload).toHaveBeenCalledWith(file))

    fireEvent.click(screen.getByRole('button', { name: /xóa ảnh/i }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^xóa ảnh$/i }))
    await waitFor(() => expect(mockedDelete).toHaveBeenCalled())
  })

  it('confirms before discarding unsaved edits when switching tabs', async () => {
    render(<StudentProfilePage />)

    await screen.findByDisplayValue('Student One')
    fireEvent.click(screen.getByRole('button', { name: /chỉnh sửa thông tin/i }))
    fireEvent.change(screen.getByLabelText(/tiểu sử/i), { target: { value: 'Dang hoc IELTS. changed' } })
    fireEvent.click(screen.getByRole('tab', { name: /học tập/i }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent(/bỏ thay đổi/i)
    fireEvent.click(within(dialog).getByRole('button', { name: /tiếp tục bỏ/i }))
    expect(await screen.findByText(/mục tiêu học tập/i)).toBeInTheDocument()
  })
})
