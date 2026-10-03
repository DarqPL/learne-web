import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateTeacherPage } from './CreateTeacherPage'
import { adminCreateTeacher } from '../../lib/api/authApi'

vi.mock('../../lib/api/authApi', () => ({
  adminCreateTeacher: vi.fn(),
}))

const mockedCreate = vi.mocked(adminCreateTeacher)

function renderPage() {
  return render(
    <MemoryRouter>
      <CreateTeacherPage />
    </MemoryRouter>,
  )
}

describe('CreateTeacherPage shadcn sync', () => {
  beforeEach(() => {
    mockedCreate.mockReset()
    vi.restoreAllMocks()
  })

  it('renders a FieldGroup/Field form with email and fullName plus a back link to /admin/teachers', () => {
    renderPage()

    expect(document.querySelector('[data-slot="field-group"]')).not.toBeNull()
    expect(document.querySelectorAll('[data-slot="field"]').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByLabelText('Họ và tên')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()

    const backLink = screen.getByRole('link', { name: 'Quay lại' })
    expect(backLink).toHaveAttribute('href', '/admin/teachers')
  })

  it('shows required validation without calling the API', async () => {
    renderPage()

    fireEvent.submit(document.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập họ và tên.')).toBeInTheDocument()
    })
    expect(screen.getByText('Trường này là bắt buộc.')).toBeInTheDocument()
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('shows email format validation without calling the API', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyen Van A' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
    fireEvent.submit(document.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByText('Email không hợp lệ.')).toBeInTheDocument()
    })
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('disables submit while the request is pending', async () => {
    let resolve!: (value: unknown) => void
    mockedCreate.mockReturnValue(
      new Promise((res) => {
        resolve = res as (value: unknown) => void
      }) as never,
    )

    renderPage()

    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyen Van A' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'gv@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Tạo tài khoản' })).toBeDisabled()

    resolve({ data: { fullName: 'Nguyen Van A', email: 'gv@example.com' } })
    await screen.findByText(/Đã tạo tài khoản giảng viên/)
  })

  it('shows a success message after creating a teacher', async () => {
    mockedCreate.mockResolvedValue({
      data: { fullName: 'Nguyen Van A', email: 'gv@example.com' },
    } as never)

    renderPage()

    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyen Van A' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'gv@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))

    expect(await screen.findByText(/Đã tạo tài khoản giảng viên Nguyen Van A/)).toBeInTheDocument()
    expect(mockedCreate).toHaveBeenCalledWith({ email: 'gv@example.com', fullName: 'Nguyen Van A' })
  })

  it('shows a shadcn error Alert when creation fails', async () => {
    mockedCreate.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'tao that bai' } },
    })

    renderPage()

    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyen Van A' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'gv@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveAttribute('data-slot', 'alert')
    expect(within(alert).getByText('tao that bai')).toBeInTheDocument()
  })
})
