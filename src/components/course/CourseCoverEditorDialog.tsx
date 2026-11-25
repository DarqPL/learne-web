import { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/shadcn/ui/alert'
import { Button } from '@/components/shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/ui/dialog'

export const MAX_COURSE_COVER_BYTES = 5 * 1024 * 1024
const RECOMMENDED_WIDTH = 1280
const RECOMMENDED_HEIGHT = 720
const PREVIEW_WIDTH = 1280
const PREVIEW_HEIGHT = 720
const MIN_OUTPUT_WIDTH = 320
const JPEG_QUALITIES = [0.92, 0.82, 0.72, 0.62]
const NEUTRAL_BACKGROUND = '#e2e8f0'

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

interface EditorImageSession {
  sourceFile: File
  image: HTMLImageElement | null
  sourceUrl: string | null
  sourceDimensions: { width: number; height: number } | null
  zoom: number
  center: { x: number; y: number }
  error: string | null
}

interface CourseCoverEditorDialogProps {
  open: boolean
  sourceFile: File | null
  submitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (file: File) => Promise<void>
}

function sourceError(file: File): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'Chỉ chấp nhận JPEG, PNG hoặc WebP.'
  }
  if (file.size > MAX_COURSE_COVER_BYTES) {
    return 'Ảnh nguồn không được vượt quá 5 MiB.'
  }
  return null
}

function cropRectFor(
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  center: { x: number; y: number },
): CropRect {
  const aspect = 16 / 9
  const baseWidth = imageWidth / imageHeight > aspect ? imageHeight * aspect : imageWidth
  const baseHeight = baseWidth / aspect
  const width = baseWidth / zoom
  const height = baseHeight / zoom
  const centerX = Math.max(width / 2, Math.min(imageWidth - width / 2, center.x))
  const centerY = Math.max(height / 2, Math.min(imageHeight - height / 2, center.y))

  return { x: centerX - width / 2, y: centerY - height / 2, width, height }
}

function boundedCenter(
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  center: { x: number; y: number },
) {
  const crop = cropRectFor(imageWidth, imageHeight, zoom, center)
  return { x: crop.x + crop.width / 2, y: crop.y + crop.height / 2 }
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new Error('Không thể mã hóa ảnh bìa. Vui lòng thử lại.'))
        return
      }
      if (blob.type !== 'image/jpeg') {
        reject(new Error('Trình duyệt không thể tạo ảnh JPEG. Vui lòng thử trình duyệt khác.'))
        return
      }
      resolve(blob)
    }, 'image/jpeg', quality)
  })
}

async function encodeCrop(
  image: HTMLImageElement,
  crop: CropRect,
  sourceName: string,
): Promise<File> {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error('Không thể xử lý ảnh trong trình duyệt này.')
  }

  const initialWidth = Math.min(RECOMMENDED_WIDTH, Math.floor(crop.width))
  const minimumWidth = Math.min(MIN_OUTPUT_WIDTH, initialWidth)
  let width = Math.max(1, initialWidth)

  while (true) {
    const height = Math.max(1, Math.round(width * 9 / 16))
    canvas.width = width
    canvas.height = height
    context.fillStyle = NEUTRAL_BACKGROUND
    context.fillRect(0, 0, width, height)
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      width,
      height,
    )

    for (const quality of JPEG_QUALITIES) {
      const blob = await canvasBlob(canvas, quality)
      if (blob.size <= MAX_COURSE_COVER_BYTES) {
        const baseName = sourceName.replace(/\.[^.]+$/, '') || 'course-cover'
        return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
      }
    }

    if (width <= minimumWidth) break
    width = Math.max(minimumWidth, Math.floor(width * 0.8))
  }

  throw new Error('Ảnh đã cắt vẫn vượt quá 5 MiB. Hãy chọn ảnh khác hoặc giảm vùng ảnh.')
}

export function CourseCoverEditorDialog({
  open,
  sourceFile,
  submitting = false,
  onOpenChange,
  onSubmit,
}: CourseCoverEditorDialogProps) {
  const [imageSession, setImageSession] = useState<EditorImageSession | null>(null)
  const currentSession = imageSession?.sourceFile === sourceFile ? imageSession : null
  const image = currentSession?.image ?? null
  const sourceUrl = currentSession?.sourceUrl ?? null
  const sourceDimensions = currentSession?.sourceDimensions ?? null
  const zoom = currentSession?.zoom ?? 1
  const center = currentSession?.center ?? { x: 0, y: 0 }
  const error = (sourceFile ? sourceError(sourceFile) : null)
    ?? currentSession?.error
    ?? (sourceDimensions && (sourceDimensions.width < RECOMMENDED_WIDTH || sourceDimensions.height < RECOMMENDED_HEIGHT)
      ? 'Ảnh có độ phân giải thấp hơn mức khuyến nghị 1280×720 px.'
      : null)
  const [encoding, setEncoding] = useState(false)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!open || !sourceFile) return
    if (sourceError(sourceFile)) return

    const url = URL.createObjectURL(sourceFile)
    const nextImage = new Image()
    let active = true
    nextImage.onload = () => {
      if (!active) return
      setImageSession({
        sourceFile,
        image: nextImage,
        sourceUrl: url,
        sourceDimensions: { width: nextImage.naturalWidth, height: nextImage.naturalHeight },
        zoom: 1,
        center: { x: nextImage.naturalWidth / 2, y: nextImage.naturalHeight / 2 },
        error: null,
      })
    }
    nextImage.onerror = () => {
      if (!active) return
      setImageSession({
        sourceFile,
        image: null,
        sourceUrl: null,
        sourceDimensions: null,
        zoom: 1,
        center: { x: 0, y: 0 },
        error: 'Không thể đọc ảnh này. Hãy chọn một ảnh hợp lệ.',
      })
    }
    nextImage.src = url

    return () => {
      active = false
      nextImage.onload = null
      nextImage.onerror = null
      URL.revokeObjectURL(url)
    }
  }, [open, sourceFile])

  const crop = image
    ? cropRectFor(image.naturalWidth, image.naturalHeight, zoom, center)
    : null

  useEffect(() => {
    const canvas = previewRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !image || !crop) return

    canvas.width = PREVIEW_WIDTH
    canvas.height = PREVIEW_HEIGHT
    context.fillStyle = NEUTRAL_BACKGROUND
    context.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      PREVIEW_WIDTH,
      PREVIEW_HEIGHT,
    )
  }, [image, crop])

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const previous = dragRef.current
    if (!previous || !crop || !image) return
    const imageWidth = image.naturalWidth
    const imageHeight = image.naturalHeight
    const bounds = event.currentTarget.getBoundingClientRect()
    const width = bounds.width || PREVIEW_WIDTH
    const height = bounds.height || PREVIEW_HEIGHT
    setImageSession((current) => {
      if (current?.sourceFile !== sourceFile || !current.image) return current
      return {
        ...current,
        center: boundedCenter(
          imageWidth,
          imageHeight,
          current.zoom,
          {
            x: current.center.x - (event.clientX - previous.x) * crop.width / width,
            y: current.center.y - (event.clientY - previous.y) * crop.height / height,
          },
        ),
      }
    })
    dragRef.current = { x: event.clientX, y: event.clientY }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!crop || !image) return
    const step = Math.max(1, crop.width * 0.02)
    const verticalStep = Math.max(1, crop.height * 0.02)
    const directions: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -verticalStep },
      ArrowDown: { x: 0, y: verticalStep },
    }
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault()
    setImageSession((current) => {
      if (current?.sourceFile !== sourceFile || !current.image) return current
      return {
        ...current,
        center: boundedCenter(
          current.image.naturalWidth,
          current.image.naturalHeight,
          current.zoom,
          { x: current.center.x + direction.x, y: current.center.y + direction.y },
        ),
      }
    })
  }

  const handleSubmit = async () => {
    if (!image || !crop || !sourceFile || encoding || submitting) return
    setEncoding(true)
    setImageSession((current) => current?.sourceFile === sourceFile ? { ...current, error: null } : current)
    try {
      await onSubmit(await encodeCrop(image, crop, sourceFile.name))
      onOpenChange(false)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Không thể lưu ảnh bìa. Vui lòng thử lại.'
      setImageSession((current) => current?.sourceFile === sourceFile ? { ...current, error: message } : current)
    } finally {
      setEncoding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa ảnh bìa khóa học</DialogTitle>
          <DialogDescription>
            Chọn vùng ảnh 16:9, kéo để căn chỉnh và phóng to nếu cần. Ảnh sẽ được lưu thành JPEG.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Chấp nhận JPEG, PNG hoặc WebP · tối đa 5 MiB · khuyến nghị tối thiểu 1280×720 px.
          </p>
          {error ? (
            <Alert variant={sourceDimensions && (sourceDimensions.width < RECOMMENDED_WIDTH || sourceDimensions.height < RECOMMENDED_HEIGHT) ? 'default' : 'destructive'}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {image && crop && sourceUrl ? (
            <>
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-slate-200">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
                  style={{ backgroundImage: `url("${sourceUrl}")` }}
                />
                <canvas
                  ref={previewRef}
                  role="img"
                  aria-label="Xem trước ảnh bìa đã cắt theo tỉ lệ 16:9"
                  tabIndex={0}
                  className="relative z-10 h-full w-full cursor-move touch-none"
                  onPointerDown={(event) => {
                    dragRef.current = { x: event.clientX, y: event.clientY }
                  }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={() => {
                    dragRef.current = null
                  }}
                  onPointerLeave={() => {
                    dragRef.current = null
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Phóng to
                <input
                  aria-label="Phóng to"
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => {
                    const nextZoom = Number(event.target.value)
                    setImageSession((current) => current?.sourceFile === sourceFile
                      ? { ...current, zoom: nextZoom }
                      : current)
                  }}
                  className="w-full accent-indigo-600"
                />
              </label>
            </>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={encoding || submitting} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled={!image || Boolean(error && !sourceDimensions) || encoding || submitting} onClick={() => void handleSubmit()}>
            {encoding || submitting ? 'Đang xử lý...' : 'Dùng ảnh bìa này'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
