import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, Info, Pencil, Plus, Search, Send, Trash2, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/shadcn/ui/empty'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/ui/select'
import { Skeleton } from '@/components/shadcn/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/ui/table'
import { getApiErrorMessage } from '../../../lib/api/client'
import { createTeacherCourse, deleteTeacherCourse, listTeacherCourses, submitTeacherCourse } from '../../../lib/api/teacherContentApi'
import type { ContentStatus, TeacherCourse, TeacherCourseRequest } from '../../../lib/api/types'
import { CourseForm } from './CourseForm'
import { CourseImportExportPanel } from './CourseImportExportPanel'
import { TeacherContentStatusBadge } from './TeacherContentStatusBadge'
import { contentStatusLabels, coursePriceStatusLabels, coursePricingTypeLabels, courseTypeLabels, formatVndAmount } from './contentLabels'
import { canSubmitCourse, countLessons, countQuestions } from './contentUtils'

type StatusFilter = ContentStatus | 'ALL'

const cardSoftClassName = 'border-indigo-100 bg-white/95 shadow-sm shadow-indigo-100/60'

const statusFilterOptions = Object.keys(contentStatusLabels) as ContentStatus[]

const skeletonRows = [0, 1, 2]

const PAGE_SIZE = 10

function formatCourseContent(course: TeacherCourse) {
  return `${course.topics.length} chủ đề · ${countLessons(course)} bài học · ${countQuestions(course)} câu hỏi`
}

export function TeacherContentPage() {
  const [courses, setCourses] = useState<TeacherCourse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [formResetVersion, setFormResetVersion] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [deleteTarget, setDeleteTarget] = useState<TeacherCourse | null>(null)
  const [page, setPage] = useState(0)
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const requestVersion = useRef(0)

  useEffect(() => {
    const version = ++requestVersion.current
    let cancelled = false
    void (async () => {
      try {
        const response = await listTeacherCourses({
          ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
          ...(searchQuery.trim() ? { q: searchQuery.trim() } : {}),
          size: PAGE_SIZE,
        })
        if (!cancelled && version === requestVersion.current) {
          setCourses(response.data.content)
          setNextCursor(response.data.nextCursor)
          setHasNext(response.data.hasNext)
          setPage(0)
          setCursorStack([undefined])
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
  }, [searchQuery, statusFilter])

  const refreshCourses = async () => {
    const response = await listTeacherCourses({
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(searchQuery.trim() ? { q: searchQuery.trim() } : {}),
      size: PAGE_SIZE,
    })
    setCourses(response.data.content)
    setNextCursor(response.data.nextCursor)
    setHasNext(response.data.hasNext)
    setPage(0)
    setCursorStack([undefined])
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

  const handleImportCourse = async () => {
    try {
      await refreshCourses()
      setInfo('Đã import khóa học. Danh sách khóa học đã được cập nhật.')
    } catch {
      setInfo('Đã import khóa học. Tải lại danh sách chưa thành công, vui lòng làm mới trang nếu thiếu dữ liệu.')
    }
  }

  const handleSubmitCourse = async (course: TeacherCourse) => {
    setAction(`submit-${course.id}`)
    setError(null)
    setInfo(null)
    try {
      const response = await submitTeacherCourse(course.id)
      setCourses((current) => current?.map((item) => (item.id === course.id ? response.data : item)) ?? current)
      setInfo(`Đã gửi khóa học "${course.name}" để duyệt.`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi duyệt khóa học.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteCourse = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setAction(`delete-${target.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherCourse(target.id)
      setCourses((current) => current?.filter((item) => item.id !== target.id) ?? current)
      setDeleteTarget(null)
      setInfo(`Đã xóa khóa học "${target.name}".`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa khóa học.'))
    } finally {
      setAction(null)
    }
  }

  const filteredCourses = courses ?? []
  const pagedCourses = filteredCourses

  async function loadTeacherPage(cursor: string | undefined, targetPage: number) {
    const version = requestVersion.current
    const response = await listTeacherCourses({
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(searchQuery.trim() ? { q: searchQuery.trim() } : {}),
      size: PAGE_SIZE,
      ...(cursor ? { cursor } : {}),
    })
    if (version === requestVersion.current) {
      setCourses(response.data.content)
      setNextCursor(response.data.nextCursor)
      setHasNext(response.data.hasNext)
      setPage(targetPage)
    }
  }

  const hasActiveFilter = searchQuery.trim().length > 0 || statusFilter !== 'ALL'

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
  }

  const busy = action !== null
  const deleteActionKey = deleteTarget ? `delete-${deleteTarget.id}` : null

  return (
    <div className="flex flex-col gap-6">
      <Card className={cardSoftClassName}>
        <CardHeader>
          <CardTitle className="text-2xl">Nội dung học tập</CardTitle>
          <CardDescription>
            Quản lý thư viện khóa học của bạn. Tạo khóa học mới, theo dõi trạng thái duyệt và mở builder để xây dựng chủ đề, bài học, câu hỏi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="#tao-khoa-hoc">
              <Plus data-icon="inline-start" aria-hidden="true" />
              Tạo khóa học
            </a>
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert>
          <Info aria-hidden="true" />
          <AlertTitle>Thông báo</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      <CourseImportExportPanel onImported={handleImportCourse} />

      <Card id="tao-khoa-hoc" className={cardSoftClassName}>
        <CardHeader>
          <CardTitle>Tạo khóa học</CardTitle>
          <CardDescription>Khởi tạo khóa học trước khi thêm cấu trúc nội dung trong builder.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <CourseForm
              key={`create-course-${formResetVersion}`}
              loading={action === 'create-course'}
              disabled={action !== null && action !== 'create-course'}
              submitLabel="Tạo khóa học"
              onSubmit={handleCreateCourse}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={cardSoftClassName}>
        <CardHeader>
          <CardTitle>Thư viện khóa học</CardTitle>
          <CardDescription>
            {courses === null ? 'Đang tải thư viện khóa học.' : `${filteredCourses.length} / ${courses.length} khóa học trong thư viện.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="teacher-content-search">Tìm kiếm khóa học</Label>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="teacher-content-search"
                  type="search"
                  placeholder="Nhập tên khóa học..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="teacher-content-status">Trạng thái</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger id="teacher-content-status" className="w-full lg:w-56">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    {statusFilterOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {contentStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilter ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
            ) : null}
          </div>
          {courses === null ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên khóa học</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trình độ</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skeletonRows.map((row) => (
                  <TableRow key={row}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-44" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="size-8" />
                        <Skeleton className="size-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredCourses.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>{courses.length === 0 ? 'Chưa có khóa học nào' : 'Không tìm thấy khóa học'}</EmptyTitle>
                <EmptyDescription>
                  {courses.length === 0
                    ? 'Tạo khóa học đầu tiên để bắt đầu xây dựng nội dung.'
                    : 'Không có khóa học nào phù hợp với tìm kiếm và bộ lọc hiện tại.'}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button asChild>
                    <a href="#tao-khoa-hoc">
                      <Plus data-icon="inline-start" aria-hidden="true" />
                      Tạo khóa học
                    </a>
                  </Button>
                  {hasActiveFilter && courses.length > 0 ? (
                    <Button variant="outline" onClick={handleClearFilters}>
                      Xóa bộ lọc
                    </Button>
                  ) : null}
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="rounded-xl border border-indigo-100 [&>[data-slot=table-container]]:max-h-[60vh] [&>[data-slot=table-container]]:overflow-y-auto">
            <Table className="[&_tr]:border-indigo-100/70">
              <TableHeader className="sticky top-0 z-10 [&_th]:bg-indigo-50">
                <TableRow>
                  <TableHead>Tên khóa học</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trình độ</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedCourses.map((course) => {
                  const submittable = canSubmitCourse(course)
                  return (
                    <TableRow key={course.id}>
                      <TableCell className="whitespace-normal">
                        <div className="flex min-w-44 flex-col gap-1">
                          <span className="font-medium">{course.name}</span>
                          {course.description ? <span className="line-clamp-2 text-xs text-muted-foreground">{course.description}</span> : null}
                          {course.rejectionReason ? (
                            <span className="text-xs text-red-600">Lý do từ chối: {course.rejectionReason}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                          {courseTypeLabels[course.type]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">{course.level}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-32 flex-col items-start gap-1">
                          <Badge variant={course.pricingType === 'PAID' ? 'default' : 'secondary'}>
                            {coursePricingTypeLabels[course.pricingType]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {course.pricingType === 'FREE'
                              ? 'Không thu phí'
                              : formatVndAmount(course.priceAmountVnd ?? course.proposedPriceAmountVnd)}
                          </span>
                          <span className="text-xs text-muted-foreground">{coursePriceStatusLabels[course.priceStatus]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TeacherContentStatusBadge status={course.status} />
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <span className="text-sm text-muted-foreground">{formatCourseContent(course)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="icon" variant="outline" title="Mở builder" className="size-8">
                            <Link to={`/teacher/content/courses/${course.id}`} aria-label={`Mở builder khóa học ${course.name}`}>
                              <Pencil aria-hidden="true" />
                            </Link>
                          </Button>
                          {submittable ? (
                            <Button
                              size="icon"
                              variant="outline"
                              title="Gửi duyệt"
                              aria-label={`Gửi duyệt khóa học ${course.name}`}
                              disabled={busy}
                              loading={action === `submit-${course.id}`}
                              onClick={() => void handleSubmitCourse(course)}
                              className="size-8"
                            >
                              <Send aria-hidden="true" />
                            </Button>
                          ) : null}
                          <Button
                            size="icon"
                            variant="destructive"
                            title="Xóa"
                            aria-label={`Xóa khóa học ${course.name}`}
                            disabled={busy}
                            onClick={() => setDeleteTarget(course)}
                            className="size-8"
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}
          {filteredCourses.length > 0 ? (
            <nav aria-label="Phân trang khóa học" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className="text-sm text-muted-foreground">
                Trang {page + 1} · {filteredCourses.length} khóa học
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Trang trước"
                  disabled={page === 0}
                  onClick={() => void loadTeacherPage(cursorStack[page - 1], page - 1)}
                >
                  <ChevronLeft aria-hidden="true" />
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground" aria-live="polite">
                  {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Trang tiếp"
                  disabled={!hasNext || !nextCursor}
                  onClick={() => {
                    if (!nextCursor) return
                    setCursorStack((current) => [...current.slice(0, page + 1), nextCursor])
                    void loadTeacherPage(nextCursor, page + 1)
                  }}
                >
                  Tiếp
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </nav>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && busy) return
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-[480px]" showCloseButton={!busy}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <TriangleAlert className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <DialogTitle>Xóa khóa học</DialogTitle>
                <DialogDescription>
                  {deleteTarget ? (
                    <>
                      Xóa vĩnh viễn khóa học <span className="font-semibold text-gray-900">{deleteTarget.name}</span> cùng toàn bộ chủ đề, bài học và câu hỏi?
                    </>
                  ) : null}
                  <span className="mt-2 block rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Hành động này không thể hoàn tác.</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={busy}>
                Hủy
              </Button>
            </DialogClose>
            <Button variant="destructive" loading={deleteActionKey !== null && action === deleteActionKey} onClick={() => void handleDeleteCourse()}>
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              Xóa khóa học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
