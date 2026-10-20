import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadCourseTemplate, exportTeacherCourse, importTeacherCourse } from '../../../lib/api/teacherContentApi'
import type { CourseImportResponse } from '../../../lib/api/types'
import { CourseImportExportPanel } from './CourseImportExportPanel'

vi.mock('../../../lib/api/teacherContentApi', () => ({
  downloadCourseTemplate: vi.fn(),
  exportTeacherCourse: vi.fn(),
  importTeacherCourse: vi.fn(),
}))

const mockedImportTeacherCourse = vi.mocked(importTeacherCourse)

beforeEach(() => {
  vi.clearAllMocks()
})

function blobResponse(data: Blob) {
  return { data } as AxiosResponse<Blob>
}

describe('CourseImportExportPanel', () => {
  it('closes pending import confirmation on lock, blocks submit, and still exports', async () => {
    const props = { courseId: 42 }
    const { rerender } = render(<CourseImportExportPanel {...props} />)
    fireEvent.change(screen.getByLabelText('File gói nén'), { target: { files: [new File(['x'], 'course.zip')] } })
    fireEvent.click(screen.getByRole('button', { name: 'Import gói nén' }))
    expect(screen.getByRole('button', { name: 'Xác nhận import' })).toBeInTheDocument()
    rerender(<CourseImportExportPanel {...props} editingState={{ kind: 'locked', reason: 'Đang xử lý' }} />)
    expect(screen.queryByRole('button', { name: 'Xác nhận import' })).not.toBeInTheDocument()
    const input = screen.getByLabelText('File gói nén')
    const submit = screen.getByRole('button', { name: 'Import gói nén' })
    expect(input).toBeDisabled(); expect(submit).toBeDisabled()
    submit.focus(); expect(submit).not.toHaveFocus()
    fireEvent.keyDown(submit, { key: 'Enter' }); fireEvent.click(submit)
    fireEvent.submit(submit.closest('form')!)
    expect(importTeacherCourse).not.toHaveBeenCalled()
    vi.mocked(exportTeacherCourse).mockResolvedValue(blobResponse(new Blob(['zip'])))
    const url = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:locked-export')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const exportButton = screen.getByRole('button', { name: 'Export khóa học' })
    expect(exportButton).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Tải template Excel' })).toBeEnabled()
    fireEvent.click(exportButton)
    await waitFor(() => expect(exportTeacherCourse).toHaveBeenCalledWith(42))
    expect(click).toHaveBeenCalledTimes(1)
    url.mockRestore(); revoke.mockRestore(); click.mockRestore()
  })

  it('accepts zip rar and 7z import packages', () => {
    render(<CourseImportExportPanel />)

    expect(screen.getByLabelText('File gói nén')).toHaveAttribute(
      'accept',
      '.zip,.rar,.7z,application/zip,application/x-zip-compressed,application/vnd.rar,application/x-rar-compressed,application/x-7z-compressed',
    )
  })

  it('uses archive package wording instead of zip-only wording', () => {
    render(<CourseImportExportPanel />)

    expect(screen.getByRole('button', { name: 'Import gói nén' })).toBeInTheDocument()
    expect(screen.queryByText('File ZIP')).not.toBeInTheDocument()
    expect(screen.queryByText('Import ZIP')).not.toBeInTheDocument()

    const input = screen.getByLabelText('File gói nén')
    fireEvent.change(input, { target: { files: [new File(['course'], 'course.zip', { type: 'application/zip' })] } })
    fireEvent.click(screen.getByRole('button', { name: 'Import gói nén' }))

    expect(screen.getByText('Hãy kiểm tra kỹ file gói nén trước khi tiếp tục.')).toBeInTheDocument()
  })

  it('rejects oversized archives before upload', async () => {
    render(<CourseImportExportPanel />)

    const big = new File(['x'], 'big.zip', { type: 'application/zip' })
    Object.defineProperty(big, 'size', { value: 101 * 1024 * 1024 })
    fireEvent.change(screen.getByLabelText(/file gói nén/i), { target: { files: [big] } })
    fireEvent.click(screen.getByRole('button', { name: /import gói nén/i }))
    expect(await screen.findByText(/File vượt quá 100MB/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /xác nhận import/i })).not.toBeInTheDocument()
    expect(mockedImportTeacherCourse).not.toHaveBeenCalled()
  })

  it('blocks confirm when the file is replaced by an oversized one before confirming', async () => {
    render(<CourseImportExportPanel />)

    fireEvent.change(screen.getByLabelText(/file gói nén/i), {
      target: { files: [new File(['x'], 'ok.zip', { type: 'application/zip' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: /import gói nén/i }))
    expect(await screen.findByRole('button', { name: /xác nhận import/i })).toBeInTheDocument()

    const big = new File(['x'], 'big.zip', { type: 'application/zip' })
    Object.defineProperty(big, 'size', { value: 101 * 1024 * 1024 })
    fireEvent.change(screen.getByLabelText(/file gói nén/i), { target: { files: [big] } })
    fireEvent.click(screen.getByRole('button', { name: /xác nhận import/i }))

    expect(await screen.findByText(/File vượt quá 100MB/i)).toBeInTheDocument()
    expect(mockedImportTeacherCourse).not.toHaveBeenCalled()
  })

  it('clears the oversize error when a valid file is picked', async () => {
    render(<CourseImportExportPanel />)

    const big = new File(['x'], 'big.zip', { type: 'application/zip' })
    Object.defineProperty(big, 'size', { value: 101 * 1024 * 1024 })
    fireEvent.change(screen.getByLabelText(/file gói nén/i), { target: { files: [big] } })
    fireEvent.click(screen.getByRole('button', { name: /import gói nén/i }))
    expect(await screen.findByText(/File vượt quá 100MB/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/file gói nén/i), {
      target: { files: [new File(['x'], 'ok.zip', { type: 'application/zip' })] },
    })
    await waitFor(() => expect(screen.queryByText(/File vượt quá 100MB/i)).not.toBeInTheDocument())
  })

  it('shows revision info after import', async () => {
    mockedImportTeacherCourse.mockResolvedValueOnce({
      data: { courseId: 1, revisionId: 4, status: 'DRAFT', errors: [] },
    } as unknown as AxiosResponse<CourseImportResponse>)
    render(<CourseImportExportPanel />)

    fireEvent.change(screen.getByLabelText(/file gói nén/i), {
      target: { files: [new File(['x'], 'ok.zip', { type: 'application/zip' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: /import gói nén/i }))
    fireEvent.click(await screen.findByRole('button', { name: /xác nhận import/i }))

    expect(await screen.findByText(/bản nháp R4/i)).toBeInTheDocument()
  })

  it('downloads the course template as an xlsm file', async () => {
    vi.mocked(downloadCourseTemplate).mockResolvedValue(blobResponse(new Blob(['template'])))
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:template')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    let createdAnchor: HTMLAnchorElement | null = null
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName)
      if (tagName === 'a') {
        createdAnchor = element as HTMLAnchorElement
      }
      return element as HTMLElement
    })

    render(<CourseImportExportPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Tải template Excel' }))

    await waitFor(() => expect(downloadCourseTemplate).toHaveBeenCalledTimes(1))
    expect((createdAnchor as HTMLAnchorElement | null)?.download).toBe('course-template.xlsm')
    expect(click).toHaveBeenCalledTimes(1)

    createElement.mockRestore()
    createObjectUrl.mockRestore()
    revokeObjectUrl.mockRestore()
    click.mockRestore()
  })

  it('downloads course exports as zip files', async () => {
    vi.mocked(exportTeacherCourse).mockResolvedValue(blobResponse(new Blob(['zip'], { type: 'application/zip' })))
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    let createdAnchor: HTMLAnchorElement | null = null
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName)
      if (tagName === 'a') {
        createdAnchor = element as HTMLAnchorElement
      }
      return element as HTMLElement
    })

    render(<CourseImportExportPanel courseId={42} />)

    fireEvent.click(screen.getByRole('button', { name: 'Export khóa học' }))

    await waitFor(() => expect(exportTeacherCourse).toHaveBeenCalledWith(42))
    expect((createdAnchor as HTMLAnchorElement | null)?.download).toBe('course-42-export.zip')
    expect(click).toHaveBeenCalledTimes(1)

    createElement.mockRestore()
    createObjectUrl.mockRestore()
    revokeObjectUrl.mockRestore()
    click.mockRestore()
  })
})
