import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Download, FileArchive, FileUp, TriangleAlert, Upload } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn/ui/accordion'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Field, FieldLabel } from '@/components/shadcn/ui/field'
import { Input } from '@/components/shadcn/ui/input'
import { getApiErrorMessage } from '../../../lib/api/client'
import { downloadCourseTemplate, exportTeacherCourse, importTeacherCourse } from '../../../lib/api/teacherContentApi'
import type { CourseImportError, CourseImportResponse } from '../../../lib/api/types'
import type { ContentEditingState } from './contentUtils'

interface CourseImportExportPanelProps {
  editingState?: ContentEditingState
  onConflict?: () => Promise<void>
  courseId?: number
  title?: string
  description?: string
  onImported?: (response: CourseImportResponse) => void
}

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

const MAX_IMPORT_ARCHIVE_BYTES = 100 * 1024 * 1024

export function CourseImportExportPanel({
  courseId,
  title = 'Import / Export khóa học',
  description = 'Tải template Excel, export khóa học hiện có hoặc import gói nén nội dung.',
  onImported,
  editingState = { kind: 'editable' },
  onConflict,
}: CourseImportExportPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<CourseImportError[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleDownloadTemplate = async () => {
    setAction('template')
    setError(null)
    setInfo(null)
    try {
      const response = await downloadCourseTemplate()
      downloadBlob(response.data, 'course-template.xlsm')
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
      downloadBlob(response.data, `course-${courseId}-export.zip`)
      setInfo('Đã export khóa học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể export khóa học.'))
    } finally {
      setAction(null)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null)
    setError(null)
    setInfo(null)
    setImportErrors([])
  }

  const handleImportCourse = async () => {
    if (!selectedFile || action !== null || editingState.kind !== 'editable') return
    if (selectedFile.size > MAX_IMPORT_ARCHIVE_BYTES) {
      setConfirmOpen(false)
      setError('File vượt quá 100MB cho phép.')
      return
    }
    setConfirmOpen(false)
    setAction('import')
    setError(null)
    setInfo(null)
    setImportErrors([])
    try {
      const response = await importTeacherCourse(selectedFile)
      setImportErrors(response.data.errors)
      const { revisionId, status } = response.data
      setInfo(`Đã import khóa học (bản nháp R${revisionId}, trạng thái ${status}). Dữ liệu đã xuất bản không đổi cho đến khi được duyệt.`)
      onImported?.(response.data)
    } catch (err) {
      if ((err as { response?: { status?: number } }).response?.status === 409) await onConflict?.()
      setError(getApiErrorMessage(err, 'Không thể import gói nén khóa học.'))
    } finally {
      setAction(null)
    }
  }

  const handleImportSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFile || action !== null || editingState.kind !== 'editable') return
    if (selectedFile.size > MAX_IMPORT_ARCHIVE_BYTES) {
      setError('File vượt quá 100MB cho phép.')
      return
    }
    setConfirmOpen(true)
  }

  return (
    <Card className="border-indigo-100 bg-white/95 shadow-sm shadow-indigo-100/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-indigo-200"
            loading={action === 'template'}
            disabled={action !== null && action !== 'template'}
            onClick={handleDownloadTemplate}
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            Tải template Excel
          </Button>
          {courseId ? (
            <Button
              variant="outline"
              className="border-indigo-200"
              loading={action === 'export'}
              disabled={action !== null && action !== 'export'}
              onClick={handleExportCourse}
            >
              <Upload data-icon="inline-start" aria-hidden="true" />
              Export khóa học
            </Button>
          ) : null}
        </div>

        <Accordion type="single" collapsible className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4">
          <AccordionItem value="import-guide">
            <AccordionTrigger>Hướng dẫn file import</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-indigo-950/80">
                <li>1 file `.xlsm` duy nhất từ template Tải template Excel.</li>
                <li>Cột bắt buộc Content: topic_title, lesson_title, skill_type, question_type, question_text + đáp án theo loại (trắc nghiệm: option_a..d + correct_option; loại khác: correct_answer).</li>
                <li>Audio mp3/wav/m4a/ogg trong thư mục `audio/`, mỗi file tối đa 20MB.</li>
                <li>Nhập lại (reimport): giữ cột `_course_id...` để cập nhật thay vì tạo mới.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <form
          className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 sm:flex-row sm:items-end"
          onSubmit={handleImportSubmit}
        >
          <Field className="flex-1">
            <FieldLabel htmlFor="teacher-course-import-file">File gói nén</FieldLabel>
            <Input
              id="teacher-course-import-file"
              className="bg-white file:mr-3 file:rounded-md file:border-0 file:bg-indigo-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-800"
              type="file"
              disabled={editingState.kind !== 'editable'}
              accept=".zip,.rar,.7z,application/zip,application/x-zip-compressed,application/vnd.rar,application/x-rar-compressed,application/x-7z-compressed"
              onChange={handleFileChange}
            />
            <p className="text-xs text-indigo-900/70">Chấp nhận file .zip, .rar, .7z tối đa 100MB. Bên trong phải có đúng 1 file .xlsm từ template và audio (mp3/wav/m4a/ogg, mỗi file tối đa 20MB) đặt trong thư mục audio/.</p>
          </Field>
          <Button type="submit" loading={action === 'import'} disabled={!selectedFile || action !== null || editingState.kind !== 'editable'}>
            <FileUp data-icon="inline-start" aria-hidden="true" />
            Import gói nén
          </Button>
        </form>

        {error ? (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Đã xảy ra lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {info ? (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800">{info}</p>
        ) : null}
        {importErrors.length > 0 ? (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">Import có cảnh báo:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {importErrors.map((item, index) => (
                <li key={`${item.rowNumber ?? 'row'}-${item.field ?? 'field'}-${index}`}>{formatImportError(item)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <AlertDialog open={confirmOpen && editingState.kind === 'editable'} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <FileArchive className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <AlertDialogTitle>Xác nhận import khóa học</AlertDialogTitle>
                <AlertDialogDescription>
                  Import file <span className="font-semibold text-gray-900">{selectedFile?.name ?? '(Chưa chọn file)'}</span> sẽ ghi đè bản nháp hiện tại, hoặc tạo bản nháp mới nếu khóa học đã xuất bản/đang chờ duyệt. Nội dung đã xuất bản không đổi cho đến khi được duyệt.
                  <span className="mt-2 block rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                    Hãy kiểm tra kỹ file gói nén trước khi tiếp tục.
                  </span>
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={action !== null}>
                Hủy
              </Button>
            </AlertDialogCancel>
            <Button loading={action === 'import'} disabled={action !== null} onClick={() => void handleImportCourse()}>
              <FileUp data-icon="inline-start" aria-hidden="true" />
              Xác nhận import
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
