import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import axios from 'axios'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Button } from '@/components/shadcn/ui/button'
import { getApiErrorMessage } from '../../../../lib/api/client'
import { deleteLessonAudio, getCourseAudioTargets, uploadLessonAudio } from '../../../../lib/api/teacherLessonAudioApi'
import type { LessonAudioFields, LessonAudioTarget, TeacherLesson } from '../../../../lib/api/types'
import { LessonAudioPlayer } from '../../../student/learning/LessonAudioPlayer'

const MAX_AUDIO_BYTES = 20 * 1024 * 1024
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg']
const ACCEPTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg']
const ACCEPT_ATTRIBUTE = '.mp3,.wav,.m4a,.ogg,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/ogg'
const UPLOAD_ERROR_FALLBACK = 'Không thể tải audio lên, vui lòng thử lại.'
const DELETE_ERROR_FALLBACK = 'Không thể xóa audio, vui lòng thử lại.'

interface LessonAudioEditorProps {
  courseId: number
  lesson: Pick<TeacherLesson, 'id' | 'title' | 'skillType'> & LessonAudioFields
  lessonIdNamespace: 'live' | 'revision'
  editable: boolean
  onAudioChanged?: (audio: LessonAudioFields) => void
}

type AudioStatus = 'loading' | 'ready' | 'locked' | 'error'

interface DiscoveryState {
  key: string
  target: LessonAudioTarget | null
  error: { status: number | null; message: string } | null
}

interface AudioOverride {
  key: string
  url: string | null
}

interface EditorMessage {
  key: string
  text: string
}

interface OperationState {
  key: string
  action: 'upload' | 'delete'
  progress: number
}

function getErrorStatus(error: unknown) {
  return axios.isAxiosError(error) ? (error.response?.status ?? null) : null
}

function findAudioTarget(lessons: LessonAudioTarget[], lessonId: number, namespace: 'live' | 'revision') {
  return namespace === 'revision'
    ? (lessons.find((item) => item.lessonRevisionId === lessonId) ?? null)
    : (lessons.find((item) => item.sourceLessonId === lessonId) ?? null)
}

async function fetchAudioTarget(courseId: number, lessonId: number, namespace: 'live' | 'revision') {
  const response = await getCourseAudioTargets(courseId)
  return findAudioTarget(response.data.lessons, lessonId, namespace)
}

function validateAudioFile(file: File) {
  if (file.size === 0) return 'Vui lòng chọn file audio.'
  if (file.size > MAX_AUDIO_BYTES) return 'File vượt quá 20MB cho phép.'
  const lowerName = file.name.toLowerCase()
  const hasAcceptedType = ACCEPTED_AUDIO_TYPES.includes(file.type)
  const hasAcceptedExtension = ACCEPTED_AUDIO_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  if (!hasAcceptedType && !hasAcceptedExtension) return 'Chỉ hỗ trợ file MP3, WAV, M4A hoặc OGG.'
  return null
}

function mutationErrorMessage(error: unknown, fallback: string) {
  const status = getErrorStatus(error)
  if (axios.isAxiosError(error) && !error.response) return 'Không thể kết nối máy chủ.'
  if (status === 409) return 'Nội dung đã thay đổi hoặc không còn cho sửa. Vui lòng tải lại trang.'
  if (status === 413) return 'File vượt quá 20MB cho phép.'
  if (status === 415) return 'Định dạng tải lên không hợp lệ.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 404) return 'Không tìm thấy bài học.'
  if (status === 502 || status === 500) return fallback
  return getApiErrorMessage(error, fallback)
}

export function LessonAudioEditor({ courseId, lesson, lessonIdNamespace, editable, onAudioChanged }: LessonAudioEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const requestKey = `${courseId}:${lesson.id}:${lessonIdNamespace}:${lesson.skillType}:${editable ? 'editable' : 'readonly'}`
  const requestKeyRef = useRef(requestKey)
  useLayoutEffect(() => {
    requestKeyRef.current = requestKey
  }, [requestKey])
  const [discovery, setDiscovery] = useState<DiscoveryState | null>(null)
  const [audioOverride, setAudioOverride] = useState<AudioOverride | null>(null)
  const [operation, setOperation] = useState<OperationState | null>(null)
  const [message, setMessage] = useState<EditorMessage | null>(null)

  useEffect(() => {
    if (lesson.skillType !== 'LISTENING') return

    let cancelled = false

    void (async () => {
      try {
        const found = await fetchAudioTarget(courseId, lesson.id, lessonIdNamespace)
        if (cancelled) return
        setDiscovery({ key: requestKey, target: found, error: null })
        setAudioOverride(null)
      } catch (error) {
        if (cancelled) return
        const errorStatus = getErrorStatus(error)
        setDiscovery({
          key: requestKey,
          target: null,
          error: {
            status: errorStatus,
            message: getApiErrorMessage(error, 'Không thể tải thông tin audio.'),
          },
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [courseId, lesson.id, lessonIdNamespace, lesson.skillType, requestKey])

  if (lesson.skillType !== 'LISTENING') return null

  const currentDiscovery = discovery?.key === requestKey ? discovery : null
  const target = currentDiscovery?.target ?? null
  const status: AudioStatus = currentDiscovery
    ? currentDiscovery.error
      ? currentDiscovery.error.status === 409 || currentDiscovery.error.status === 404
        ? 'locked'
        : 'error'
      : target
        ? editable
          ? 'ready'
          : 'locked'
        : 'locked'
    : 'loading'
  const baseAudioUrl = target ? target.audioUrl : lesson.audioUrl
  const audioUrl = audioOverride?.key === requestKey ? audioOverride.url : baseAudioUrl
  const messageText = message?.key === requestKey ? message.text : null
  const currentOperation = operation?.key === requestKey ? operation : null
  const busy = currentOperation !== null
  const statusText =
    currentOperation?.action === 'upload'
      ? `Đang tải lên ${currentOperation.progress}%`
      : currentOperation?.action === 'delete'
        ? 'Đang xóa audio...'
        : null

  async function resolveTarget(capturedKey: string) {
    try {
      const found = await fetchAudioTarget(courseId, lesson.id, lessonIdNamespace)
      if (requestKeyRef.current !== capturedKey) return null
      setDiscovery({ key: capturedKey, target: found, error: null })
      setAudioOverride(null)
      return found
    } catch (error) {
      if (requestKeyRef.current !== capturedKey) return null
      const errorStatus = getErrorStatus(error)
      setDiscovery({
        key: capturedKey,
        target: null,
        error: {
          status: errorStatus,
          message: getApiErrorMessage(error, 'Không thể tải thông tin audio.'),
        },
      })
      return null
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    const capturedKey = requestKey
    event.target.value = ''
    if (!file || busy) return

    const validation = validateAudioFile(file)
    if (validation) {
      setMessage({ key: capturedKey, text: validation })
      return
    }

    setMessage(null)
    setOperation({ key: capturedKey, action: 'upload', progress: 0 })
    let nextAudio: LessonAudioFields | null = null
    try {
      const freshTarget = await resolveTarget(capturedKey)
      if (requestKeyRef.current !== capturedKey) return
      if (!freshTarget) return
      const response = await uploadLessonAudio(freshTarget.lessonRevisionId, file, (percent) => {
        if (requestKeyRef.current !== capturedKey) return
        setOperation((current) =>
          current?.key === capturedKey && current.action === 'upload' ? { ...current, progress: percent } : current,
        )
      })
      if (requestKeyRef.current !== capturedKey) return
      nextAudio = { audioUrl: response.data.audioUrl, audioPublicId: response.data.audioPublicId }
      setAudioOverride({ key: capturedKey, url: nextAudio.audioUrl })
    } catch (error) {
      if (requestKeyRef.current !== capturedKey) return
      setMessage({ key: capturedKey, text: mutationErrorMessage(error, UPLOAD_ERROR_FALLBACK) })
      const errorStatus = getErrorStatus(error)
      if (errorStatus === 404 || errorStatus === 409) {
        await resolveTarget(capturedKey)
      }
    } finally {
      setOperation((current) => (current?.key === capturedKey ? null : current))
    }

    if (nextAudio && requestKeyRef.current === capturedKey) {
      onAudioChanged?.(nextAudio)
    }
  }

  async function handleDelete() {
    const capturedKey = requestKey
    if (busy) return
    if (!window.confirm('Bạn có chắc muốn xóa audio của bài học này?')) return

    setMessage(null)
    setOperation({ key: capturedKey, action: 'delete', progress: 0 })
    let deleted = false
    try {
      const freshTarget = await resolveTarget(capturedKey)
      if (requestKeyRef.current !== capturedKey) return
      if (!freshTarget) return
      await deleteLessonAudio(freshTarget.lessonRevisionId)
      if (requestKeyRef.current !== capturedKey) return
      setAudioOverride({ key: capturedKey, url: null })
      deleted = true
    } catch (error) {
      if (requestKeyRef.current !== capturedKey) return
      setMessage({ key: capturedKey, text: mutationErrorMessage(error, DELETE_ERROR_FALLBACK) })
      const errorStatus = getErrorStatus(error)
      if (errorStatus === 404 || errorStatus === 409) {
        await resolveTarget(capturedKey)
      }
    } finally {
      setOperation((current) => (current?.key === capturedKey ? null : current))
    }

    if (deleted && requestKeyRef.current === capturedKey) {
      onAudioChanged?.({ audioUrl: null, audioPublicId: null })
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm" aria-label="Quản lý audio bài học">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Audio bài học</h3>
        {status === 'loading' ? (
          <span role="status" className="text-xs text-muted-foreground">
            Đang tải audio...
          </span>
        ) : null}
      </div>

      {audioUrl ? (
        <LessonAudioPlayer audioUrl={audioUrl} />
      ) : status === 'loading' ? null : (
        <p className="mt-3 text-sm text-muted-foreground">Chưa có audio.</p>
      )}

      {status === 'error' ? (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle>Không tải được audio</AlertTitle>
          <AlertDescription>{currentDiscovery?.error?.message}</AlertDescription>
        </Alert>
      ) : null}

      {status === 'locked' ? (
        <p className="mt-3 text-sm text-muted-foreground">Tạo bản nháp chỉnh sửa để thay audio.</p>
      ) : null}

      {messageText ? (
        <p role="status" className="mt-3 text-sm text-red-600">
          {messageText}
        </p>
      ) : null}

      {status === 'ready' ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            aria-label="Chọn file audio"
            disabled={busy}
            onChange={handleFileChange}
          />
          <Button size="sm" variant="outline" disabled={busy} onClick={() => fileInputRef.current?.click()}>
            {audioUrl ? 'Thay audio' : 'Tải audio lên'}
          </Button>
          {audioUrl ? (
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={busy}
              onClick={handleDelete}
            >
              Xóa audio
            </Button>
          ) : null}
          {statusText ? (
            <span role="status" className="text-xs text-muted-foreground">
              {statusText}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
