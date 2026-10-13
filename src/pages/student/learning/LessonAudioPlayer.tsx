interface LessonAudioPlayerProps {
  audioUrl: string | null
  title?: string
}

export function LessonAudioPlayer({ audioUrl, title = 'Audio bài nghe' }: LessonAudioPlayerProps) {
  if (!audioUrl) return null

  return (
    <section className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Luyện nghe</p>
          <h2 className="mt-1 text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">Nghe đoạn audio trước khi đọc nội dung hoặc trả lời câu hỏi.</p>
        </div>
      </div>
      <audio aria-label={title} className="mt-4 w-full" controls preload="metadata" src={audioUrl}>
        Trình duyệt của bạn chưa hỗ trợ phát audio trực tiếp.
      </audio>
    </section>
  )
}
