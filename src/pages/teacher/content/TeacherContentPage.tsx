import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { createTeacherCourse, listTeacherCourses } from '../../../lib/api/teacherContentApi'
import type { TeacherCourse, TeacherCourseRequest } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { CourseForm } from './CourseForm'
import { TeacherContentStatusBadge } from './TeacherContentStatusBadge'
import { courseTypeLabels } from './contentLabels'
import { countLessons, countQuestions } from './contentUtils'

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'

export function TeacherContentPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<TeacherCourse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [formResetVersion, setFormResetVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await listTeacherCourses()
        if (!cancelled) {
          setCourses(response.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Không thể tải thư viện khóa học.'))
          setCourses([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const refreshCourses = async () => {
    const response = await listTeacherCourses()
    setCourses(response.data)
  }

  const handleCreateCourse = async (payload: TeacherCourseRequest) => {
    setAction('create-course')
    setError(null)
    setInfo(null)
    try {
      const response = await createTeacherCourse(payload)
      setCourses((current) => (current ? [response.data, ...current.filter((course) => course.id !== response.data.id)] : [response.data]))
      setFormResetVersion((version) => version + 1)
      try {
        await refreshCourses()
        setInfo('Đã tạo khóa học. Mở builder để tiếp tục xây dựng nội dung.')
      } catch {
        setInfo('Đã tạo khóa học. Tải lại danh sách chưa thành công, vui lòng làm mới trang nếu thiếu dữ liệu.')
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo khóa học.'))
    } finally {
      setAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Nội dung học tập</h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Quản lý thư viện khóa học của bạn. Tạo khóa học mới, theo dõi trạng thái duyệt và mở builder để xây dựng chủ đề, bài học, câu hỏi.
        </p>
      </header>

      {error ? <Alert>{error}</Alert> : null}
      {info ? <Alert variant="success">{info}</Alert> : null}

      {courses === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          <section className={cardClassName}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tạo khóa học</h2>
              <p className="mt-1 text-sm text-gray-600">Khởi tạo khóa học trước khi thêm cấu trúc nội dung trong builder.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <CourseForm
                key={`create-course-${formResetVersion}`}
                loading={action === 'create-course'}
                disabled={action !== null && action !== 'create-course'}
                submitLabel="Tạo khóa học"
                onSubmit={handleCreateCourse}
              />
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Thư viện khóa học</h2>
                <p className="mt-1 text-sm text-gray-600">{courses.length} khóa học trong thư viện.</p>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className={cardClassName}>
                <p className="text-gray-600">Chưa có khóa học nào. Tạo khóa học đầu tiên để bắt đầu xây dựng nội dung.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <article key={course.id} className={`${cardClassName} flex flex-col`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {course.level} · {courseTypeLabels[course.type]}
                        </p>
                      </div>
                      <TeacherContentStatusBadge status={course.status} />
                    </div>

                    {course.rejectionReason ? (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        Lý do từ chối: {course.rejectionReason}
                      </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="font-semibold text-gray-900">{course.topics.length}</p>
                        <p className="text-xs text-gray-600">Chủ đề</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="font-semibold text-gray-900">{countLessons(course)}</p>
                        <p className="text-xs text-gray-600">Bài học</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="font-semibold text-gray-900">{countQuestions(course)}</p>
                        <p className="text-xs text-gray-600">Câu hỏi</p>
                      </div>
                    </div>

                    <Button className="mt-5 w-full" onClick={() => navigate(`/teacher/content/courses/${course.id}`)}>
                      Mở builder
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
