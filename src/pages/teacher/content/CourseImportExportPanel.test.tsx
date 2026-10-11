import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { downloadCourseTemplate } from '../../../lib/api/teacherContentApi'
import { CourseImportExportPanel } from './CourseImportExportPanel'

vi.mock('../../../lib/api/teacherContentApi', () => ({
  downloadCourseTemplate: vi.fn(),
  exportTeacherCourse: vi.fn(),
  importTeacherCourse: vi.fn(),
}))

describe('CourseImportExportPanel', () => {
  it('accepts zip rar and 7z import packages', () => {
    render(<CourseImportExportPanel />)

    expect(screen.getByLabelText('File gói nén')).toHaveAttribute(
      'accept',
      '.zip,.rar,.7z,application/zip,application/x-zip-compressed,application/vnd.rar,application/x-7z-compressed',
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

  it('downloads the course template as an xlsm file', async () => {
    vi.mocked(downloadCourseTemplate).mockResolvedValue({ data: new Blob(['template']) })
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
    expect(createdAnchor?.download).toBe('course-template.xlsm')
    expect(click).toHaveBeenCalledTimes(1)

    createElement.mockRestore()
    createObjectUrl.mockRestore()
    revokeObjectUrl.mockRestore()
    click.mockRestore()
  })
})
