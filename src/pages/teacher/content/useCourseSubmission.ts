import { useEffect, useRef, useState } from 'react'
import { getCourseSubmission } from '../../../lib/api/teacherContentApi'
import type { CourseSubmission } from '../../../lib/api/types'

export function useCourseSubmission(courseId: number | null, summary: CourseSubmission | null | undefined, onTerminal: () => void | Promise<void>) {
  const [accepted, setAccepted] = useState<CourseSubmission | null>(null)
  const [observed, setObserved] = useState<CourseSubmission | null>(null)
  const callback = useRef(onTerminal)
  useEffect(() => { callback.current = onTerminal }, [onTerminal])
  const seed = summary?.courseId === courseId ? summary : accepted?.courseId === courseId ? accepted : null
  // A persisted terminal summary is authoritative even when an earlier poll for
  // the same attempt observed progress. Never keep that attempt active locally.
  const seedTerminal = seed?.status === 'SUCCEEDED' || seed?.status === 'FAILED'
  const submission = !seedTerminal && observed?.courseId === courseId && observed.id === seed?.id ? observed : seed
  const completed = useRef(new Set<string>())
  const seedId = seed?.id
  const seedStatus = seed?.status

  useEffect(() => {
    if (courseId === null || !seedId || (seedStatus !== 'QUEUED' && seedStatus !== 'PROCESSING')) return
    let disposed = false
    let controller: AbortController | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let delay = 5000
    let stopped = false
    const stopRequest = () => { clearTimeout(timer); controller?.abort(); controller = null }
    const poll = async () => {
      if (disposed || stopped || controller || document.visibilityState === 'hidden') return
      clearTimeout(timer)
      const request = new AbortController()
      controller = request
      try {
        const { data } = await getCourseSubmission(courseId, seedId, request.signal)
        if (disposed || request.signal.aborted || data.courseId !== courseId || data.id !== seedId) return
        setObserved(data)
        delay = 5000
        if (data.status === 'SUCCEEDED' || data.status === 'FAILED') {
          stopped = true
          if (!completed.current.has(data.id)) { completed.current.add(data.id); void Promise.resolve(callback.current()).catch(() => undefined) }
        }
      } catch (error) {
        if (request.signal.aborted || disposed) return
        const status = (error as { response?: { status?: number } }).response?.status
        if (status === 401 || status === 403 || status === 404) stopped = true
        delay = Math.min(delay * 2, 30000)
      } finally {
        if (controller === request) controller = null
        if (!disposed && !stopped && !request.signal.aborted && String(document.visibilityState) !== 'hidden') timer = setTimeout(() => void poll(), delay)
      }
    }
    const resume = () => { if (document.visibilityState === 'hidden') stopRequest(); else void poll() }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('focus', resume)
    void poll()
    return () => { disposed = true; stopRequest(); document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume) }
  }, [courseId, seedId, seedStatus])

  return { submission, acceptSubmission: setAccepted, active: submission?.status === 'QUEUED' || submission?.status === 'PROCESSING' }
}
