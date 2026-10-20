import type { AxiosProgressEvent } from 'axios'
import { http } from './client'
import type { CourseAudioTargets, TeacherLesson } from './types'

const base = '/api/teacher/content'

export function getCourseAudioTargets(courseId: number) {
  return http.get<CourseAudioTargets>(`${base}/courses/${courseId}/audio-targets`)
}

export function uploadLessonAudio(lessonRevisionId: number, file: File, onProgress?: (percent: number) => void) {
  const formData = new FormData()
  formData.append('file', file)

  return http.post<TeacherLesson>(`${base}/lesson-revisions/${lessonRevisionId}/audio`, formData, {
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (!onProgress || !event.total) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    },
  })
}

export function deleteLessonAudio(lessonRevisionId: number) {
  return http.delete<TeacherLesson>(`${base}/lesson-revisions/${lessonRevisionId}/audio`)
}
