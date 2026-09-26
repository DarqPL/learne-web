import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { getApiErrorMessage } from '../../../lib/api/client'
import { downloadCourseTemplate, exportTeacherCourse, importTeacherCourse } from '../../../lib/api/teacherContentApi'
import type { CourseImportError, CourseImportResponse } from '../../../lib/api/types'

interface CourseImportExportPanelProps {
  courseId?: number
  title?: string
  description?: string
  onImported?: (response: CourseImportResponse) => void
}

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatImportError(error: CourseImportError) {
  const prefix = [error.rowNumber !== null ? `Dòng ${error.rowNumber}` : null, error.field].filter(Boolean).join(': ')
  return prefix ? `${prefix} - ${error.message}` : error.message
}

export function CourseImportExportPanel({
  courseId,
  title = 'Import / Export khóa học',
  description = 'Tải template Excel, export khóa học hiện có hoặc import gói ZIP nội dung.',
  onImported,
}: CourseImportExportPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<CourseImportError[]>([])

  const handleDownloadTemplate = async () => {
    setAction('template')
    setError(null)
    setInfo(null)
    try {
      const response = await downloadCourseTemplate()
      downloadBlob(response.data, 'course-template.xlsx')
      setInfo('Đã tải template Excel.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải template Excel.'))
    } finally {
      setAction(null)
    }
  }

  const handleExportCourse = async () => {
    if (!courseId) return
    setAction('export')
    setError(null)
    setInfo(null)
    try {
      const response = await exportTeacherCourse(courseId)
      downloadBlob(response.data, `course-${courseId}-export.xlsx`)
      setInfo('Đã export khóa học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể export khóa học.'))
    } finally {
      setAction(null)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null)
    setImportErrors([])
  }

  const handleImportCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFile) return
    setAction('import')
    setError(null)
    setInfo(null)
    setImportErrors([])
    try {
      const response = await importTeacherCourse(selectedFile)
      setImportErrors(response.data.errors)
      setInfo('Đã import ZIP khóa học.')
      onImported?.(response.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể import ZIP khóa học.'))
    } finally {
      setAction(null)
    }
  }

  return (
    <section className={cardClassName}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={action === 'template'} disabled={action !== null && action !== 'template'} onClick={handleDownloadTemplate}>
          Tải template Excel
        </Button>
        {courseId ? (
          <Button variant="secondary" loading={action === 'export'} disabled={action !== null && action !== 'export'} onClick={handleExportCourse}>
            Export khóa học
          </Button>
        ) : null}
      </div>

      <form className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-end" onSubmit={handleImportCourse}>
        <label className="flex-1 text-sm font-medium text-gray-700">
          File ZIP
          <input
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-800"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={handleFileChange}
          />
        </label>
        <Button type="submit" loading={action === 'import'} disabled={!selectedFile || (action !== null && action !== 'import')}>
          Import ZIP
        </Button>
      </form>

      <div className="mt-4 space-y-3">
        {error ? <Alert>{error}</Alert> : null}
        {info ? <Alert variant="success">{info}</Alert> : null}
        {importErrors.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">Import có cảnh báo:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {importErrors.map((item, index) => (
                <li key={`${item.rowNumber ?? 'row'}-${item.field ?? 'field'}-${index}`}>{formatImportError(item)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
