import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface CourseCoverImageProps {
  courseName: string
  imageUrl?: string | null
  imageAlt?: string
  className?: string
}

export function CourseCoverImage({ courseName, imageUrl, imageAlt, className }: CourseCoverImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)

  const showFallback = !imageUrl || failedSource === imageUrl

  return (
    <div className={`aspect-[16/9] overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 via-sky-50 to-violet-100 ${className ?? ''}`}>
      {showFallback ? (
        <div
          role="img"
          aria-label={`Ảnh bìa mặc định cho khóa học ${courseName}`}
          className="flex h-full w-full items-center justify-center"
        >
          <div className="flex flex-col items-center gap-2 text-indigo-500">
            <ImageOff aria-hidden="true" className="size-8" />
            <span className="text-xs font-semibold">Chưa có ảnh bìa</span>
          </div>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={imageAlt ?? `Ảnh bìa khóa học ${courseName}`}
          className="h-full w-full object-cover"
          onError={() => setFailedSource(imageUrl)}
        />
      )}
    </div>
  )
}
