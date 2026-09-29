import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Trash2, TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/ui/alert-dialog'
import { Button } from '@/components/shadcn/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import type {
  TeacherCourse,
  TeacherCourseRequest,
  TeacherLesson,
  TeacherLessonRequest,
  TeacherQuestion,
  TeacherQuestionRequest,
  TeacherTopic,
  TeacherTopicRequest,
} from '../../../lib/api/types'
import { LessonForm } from './LessonForm'
import { QuestionForm } from './QuestionForm'
import { TopicForm } from './TopicForm'
import { countLessons, countQuestions } from './contentUtils'
import { getCourseInitialValue, getLessonInitialValue, getQuestionInitialValue, getTopicInitialValue } from './teacherContentMappers'
import { BuilderContentStep } from './workspace/BuilderContentStep'
import { BuilderInfoStep } from './workspace/BuilderInfoStep'
import { BuilderQuestionsStep } from './workspace/BuilderQuestionsStep'
import { BuilderReviewStep } from './workspace/BuilderReviewStep'
import { BuilderStepper } from './workspace/BuilderStepper'
import {
  computeReviewIssues,
  findLesson,
  findLessonTopic,
  findQuestion,
  findTopic,
  parsePositiveInteger,
  stepDefinitions,
  type BuilderStep,
  type DeleteTarget,
  type QuestionDialogState,
  type ReviewIssue,
} from './workspace/builderModel'

export type { BuilderStep }

export interface CourseBuilderWorkspaceProps {
  course: TeacherCourse
  action: string | null
  editable: boolean
  canSubmit: boolean
  formResetVersion: number
  importExportPanel: ReactNode
  onUpdateCourse: (payload: TeacherCourseRequest) => Promise<void>
  onSubmitCourse: () => Promise<void>
  onCreateTopic: (payload: TeacherTopicRequest) => Promise<void>
  onUpdateTopic: (topic: TeacherTopic, payload: TeacherTopicRequest) => Promise<void>
  onDeleteTopic: (topic: TeacherTopic) => Promise<void>
  onCreateLesson: (topic: TeacherTopic, payload: TeacherLessonRequest) => Promise<void>
  onUpdateLesson: (lesson: TeacherLesson, payload: TeacherLessonRequest) => Promise<void>
  onDeleteLesson: (lesson: TeacherLesson) => Promise<void>
  onCreateQuestion: (lessonId: number, payload: TeacherQuestionRequest) => Promise<void>
  onUpdateQuestion: (question: TeacherQuestion, payload: TeacherQuestionRequest) => Promise<void>
  onDeleteQuestion: (question: TeacherQuestion) => Promise<void>
}

export function CourseBuilderWorkspace({
  course,
  action,
  editable,
  canSubmit,
  formResetVersion,
  importExportPanel,
  onUpdateCourse,
  onSubmitCourse,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onCreateQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}: CourseBuilderWorkspaceProps) {
  const busy = action !== null
  const [searchParams, setSearchParams] = useSearchParams()
  const [step, setStep] = useState<BuilderStep>(() => {
    const requested = searchParams.get('step')
    return stepDefinitions.some((item) => item.id === requested) ? (requested as BuilderStep) : 'thong-tin'
  })
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(() => parsePositiveInteger(searchParams.get('lesson')))
  const [questionLessonId, setQuestionLessonId] = useState<number | null>(() => parsePositiveInteger(searchParams.get('lesson')))
  const [previewMode, setPreviewMode] = useState(false)
  const [topicDialogOpen, setTopicDialogOpen] = useState(false)
  const [lessonDialogTopicId, setLessonDialogTopicId] = useState<number | null>(null)
  const [questionDialog, setQuestionDialog] = useState<QuestionDialogState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)

  const writeBuilderParams = (nextStep?: BuilderStep, nextLessonId?: number | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (nextStep !== undefined && next.get('step') !== nextStep) next.set('step', nextStep)
        if (nextLessonId !== undefined) {
          if (nextLessonId === null) next.delete('lesson')
          else if (next.get('lesson') !== String(nextLessonId)) next.set('lesson', String(nextLessonId))
        }
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    const requestedStep = searchParams.get('step')
    if (
      requestedStep !== null &&
      requestedStep !== step &&
      stepDefinitions.some((item) => item.id === requestedStep)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(requestedStep as BuilderStep)
    }
    const requestedLesson = parsePositiveInteger(searchParams.get('lesson'))
    if (requestedLesson !== null && findLesson(course, requestedLesson) !== null) {
      if (requestedLesson !== selectedLessonId) setSelectedLessonId(requestedLesson)
      if (requestedLesson !== questionLessonId) setQuestionLessonId(requestedLesson)
    }
  }, [searchParams, course, step, selectedLessonId, questionLessonId])

  const issues = useMemo(() => computeReviewIssues(course), [course])
  const lessonCount = countLessons(course)
  const questionCount = countQuestions(course)
  const infoDone = course.name.trim() !== '' && course.level.trim() !== ''
  const reviewClean = issues.length === 0
  const stepDone: Record<BuilderStep, boolean> = {
    'thong-tin': infoDone,
    'noi-dung': lessonCount > 0,
    'cau-hoi': questionCount > 0,
    'kiem-tra': reviewClean && lessonCount > 0 && questionCount > 0,
  }
  const submitDisabled = !editable || !canSubmit || !reviewClean || busy
  const submitReason = !editable
    ? 'Khóa học đang ở trạng thái chỉ đọc, không thể gửi duyệt.'
    : !reviewClean
      ? `Còn ${issues.length} vấn đề cần xử lý trước khi gửi duyệt.`
      : !canSubmit
        ? 'Cần có ít nhất 1 chủ đề, 1 bài học và 1 câu hỏi để gửi duyệt.'
        : null

  const selectedLesson = findLesson(course, selectedLessonId)
  const selectedTopic = findTopic(course, selectedLesson ? (findLessonTopic(course, selectedLesson.id)?.id ?? selectedTopicId) : selectedTopicId)
  const lessonDialogTopic = findTopic(course, lessonDialogTopicId)
  const allLessons = course.topics.flatMap((topic) => topic.lessons)
  const activeQuestionLesson = findLesson(course, questionLessonId) ?? allLessons[0] ?? null
  const dialogQuestion = questionDialog?.mode === 'edit' ? findQuestion(course, questionDialog.questionId) : null
  const dialogCreateLesson = questionDialog?.mode === 'create' ? findLesson(course, questionDialog.lessonId) : null

  const courseInitialValue = useMemo(() => getCourseInitialValue(course), [course])
  const topicInitialValue = useMemo(() => (selectedTopic && !selectedLesson ? getTopicInitialValue(selectedTopic) : null), [selectedTopic, selectedLesson])
  const lessonInitialValue = useMemo(() => (selectedLesson ? getLessonInitialValue(selectedLesson) : null), [selectedLesson])
  const questionInitialValue = useMemo(() => (dialogQuestion ? getQuestionInitialValue(dialogQuestion) : null), [dialogQuestion])

  const handleStepChange = (nextStep: BuilderStep) => {
    setStep(nextStep)
    writeBuilderParams(nextStep, undefined)
  }

  const selectTopic = (topicId: number) => {
    setSelectedTopicId(topicId)
    setSelectedLessonId(null)
    writeBuilderParams(undefined, null)
  }

  const selectLesson = (lessonId: number) => {
    setSelectedTopicId(findLessonTopic(course, lessonId)?.id ?? null)
    setSelectedLessonId(lessonId)
    writeBuilderParams(undefined, lessonId)
  }

  const handleQuestionLessonChange = (lessonId: number) => {
    setQuestionLessonId(lessonId)
    writeBuilderParams(undefined, lessonId)
  }

  const jumpToIssue = (issue: ReviewIssue) => {
    setStep(issue.step)
    if (issue.lessonId !== undefined) {
      setSelectedTopicId(findLessonTopic(course, issue.lessonId)?.id ?? null)
      setSelectedLessonId(issue.lessonId)
      setQuestionLessonId(issue.lessonId)
      writeBuilderParams(issue.step, issue.lessonId)
    } else if (issue.topicId !== undefined) {
      setSelectedTopicId(issue.topicId)
      setSelectedLessonId(null)
      writeBuilderParams(issue.step, null)
    } else {
      writeBuilderParams(issue.step, undefined)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.kind === 'topic') {
      const topic = findTopic(course, deleteTarget.id)
      if (!topic) {
        setDeleteTarget(null)
        return
      }
      await onDeleteTopic(topic)
      if (selectedTopicId === topic.id) setSelectedTopicId(null)
      if (selectedLessonId !== null && findLessonTopic(course, selectedLessonId)?.id === topic.id) setSelectedLessonId(null)
    } else if (deleteTarget.kind === 'lesson') {
      const lesson = findLesson(course, deleteTarget.id)
      if (!lesson) {
        setDeleteTarget(null)
        return
      }
      await onDeleteLesson(lesson)
      if (selectedLessonId === lesson.id) setSelectedLessonId(null)
      if (questionLessonId === lesson.id) setQuestionLessonId(null)
    } else {
      const question = findQuestion(course, deleteTarget.id)
      if (!question) {
        setDeleteTarget(null)
        return
      }
      await onDeleteQuestion(question)
    }
    setDeleteTarget(null)
  }

  const handleConfirmSubmit = async () => {
    await onSubmitCourse()
    setSubmitDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <BuilderStepper step={step} done={stepDone} onStepChange={handleStepChange} />

      {step === 'thong-tin' ? (
        <BuilderInfoStep
          course={course}
          courseInitialValue={courseInitialValue}
          action={action}
          editable={editable}
          lessonCount={lessonCount}
          questionCount={questionCount}
          submitDisabled={submitDisabled}
          submitReason={submitReason}
          importExportPanel={importExportPanel}
          onUpdateCourse={onUpdateCourse}
          onOpenSubmit={() => setSubmitDialogOpen(true)}
          onGoReview={() => handleStepChange('kiem-tra')}
        />
      ) : null}

      {step === 'noi-dung' ? (
        <BuilderContentStep
          course={course}
          action={action}
          busy={busy}
          editable={editable}
          selectedTopic={selectedTopic}
          selectedLesson={selectedLesson}
          topicInitialValue={topicInitialValue}
          lessonInitialValue={lessonInitialValue}
          onSelectTopic={selectTopic}
          onSelectLesson={selectLesson}
          onAddTopic={() => setTopicDialogOpen(true)}
          onAddLesson={(topicId) => setLessonDialogTopicId(topicId)}
          onUpdateTopic={onUpdateTopic}
          onUpdateLesson={onUpdateLesson}
          onDeleteRequest={setDeleteTarget}
        />
      ) : null}

      {step === 'cau-hoi' ? (
        <BuilderQuestionsStep
          course={course}
          busy={busy}
          editable={editable}
          activeLesson={activeQuestionLesson}
          previewMode={previewMode}
          onLessonChange={handleQuestionLessonChange}
          onTogglePreview={() => setPreviewMode((value) => !value)}
          onAddQuestion={(lessonId) => {
            setPreviewMode(false)
            setQuestionDialog({ mode: 'create', lessonId })
          }}
          onEditQuestion={(questionId) => setQuestionDialog({ mode: 'edit', questionId })}
          onDeleteRequest={setDeleteTarget}
        />
      ) : null}

      {step === 'kiem-tra' ? (
        <BuilderReviewStep
          course={course}
          action={action}
          lessonCount={lessonCount}
          questionCount={questionCount}
          issues={issues}
          submitDisabled={submitDisabled}
          submitReason={submitReason}
          onJump={jumpToIssue}
          onOpenSubmit={() => setSubmitDialogOpen(true)}
        />
      ) : null}

      <Dialog
        open={topicDialogOpen}
        onOpenChange={(open) => {
          if (!open && busy) return
          setTopicDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[480px]" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>Thêm chủ đề</DialogTitle>
            <DialogDescription>Tạo chủ đề mới cho khóa học này.</DialogDescription>
          </DialogHeader>
          <TopicForm
            key={`create-topic-${formResetVersion}`}
            loading={action === 'create-topic'}
            disabled={action !== null && action !== 'create-topic'}
            submitLabel="Tạo chủ đề"
            onSubmit={(payload) => void onCreateTopic(payload).then(() => setTopicDialogOpen(false))}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={lessonDialogTopic !== null}
        onOpenChange={(open) => {
          if (!open && busy) return
          if (!open) setLessonDialogTopicId(null)
        }}
      >
        <DialogContent className="sm:max-w-[480px]" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>Thêm bài học</DialogTitle>
            <DialogDescription>
              {lessonDialogTopic ? `Tạo bài học mới trong chủ đề "${lessonDialogTopic.name}".` : 'Tạo bài học mới.'}
            </DialogDescription>
          </DialogHeader>
          {lessonDialogTopic ? (
            <LessonForm
              key={`create-lesson-${lessonDialogTopic.id}-${formResetVersion}`}
              loading={action === `create-lesson-${lessonDialogTopic.id}`}
              disabled={action !== null && action !== `create-lesson-${lessonDialogTopic.id}`}
              submitLabel="Tạo bài học"
              onSubmit={(payload) => void onCreateLesson(lessonDialogTopic, payload).then(() => setLessonDialogTopicId(null))}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={questionDialog !== null}
        onOpenChange={(open) => {
          if (!open && busy) return
          if (!open) setQuestionDialog(null)
        }}
      >
        <DialogContent className="sm:max-w-[480px]" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>{questionDialog?.mode === 'edit' ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}</DialogTitle>
            <DialogDescription>
              {dialogCreateLesson ? `Tạo câu hỏi mới trong bài học "${dialogCreateLesson.title}".` : null}
              {dialogQuestion ? 'Cập nhật nội dung, đáp án và XP của câu hỏi này.' : null}
            </DialogDescription>
          </DialogHeader>
          {questionDialog?.mode === 'create' && dialogCreateLesson ? (
            <QuestionForm
              key={`create-question-${dialogCreateLesson.id}-${formResetVersion}`}
              loading={action === `create-question-${dialogCreateLesson.id}`}
              disabled={action !== null && action !== `create-question-${dialogCreateLesson.id}`}
              submitLabel="Tạo câu hỏi"
              onSubmit={(payload) => void onCreateQuestion(dialogCreateLesson.id, payload).then(() => setQuestionDialog(null))}
            />
          ) : null}
          {questionDialog?.mode === 'edit' && dialogQuestion && questionInitialValue ? (
            <QuestionForm
              initialValue={questionInitialValue}
              loading={action === `update-question-${dialogQuestion.id}`}
              disabled={action !== null && action !== `update-question-${dialogQuestion.id}`}
              submitLabel="Lưu câu hỏi"
              onSubmit={(payload) => void onUpdateQuestion(dialogQuestion, payload).then(() => setQuestionDialog(null))}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && busy) return
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <TriangleAlert className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <AlertDialogTitle>
                  {deleteTarget?.kind === 'topic' ? 'Xóa chủ đề' : deleteTarget?.kind === 'lesson' ? 'Xóa bài học' : 'Xóa câu hỏi'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteTarget ? (
                    <>
                      Xóa vĩnh viễn <span className="font-semibold text-gray-900">{deleteTarget.name || '(Chưa đặt tên)'}</span>
                      {deleteTarget.kind === 'topic'
                        ? ' cùng toàn bộ bài học và câu hỏi bên trong?'
                        : deleteTarget.kind === 'lesson'
                          ? ' cùng toàn bộ câu hỏi bên trong?'
                          : '?'}
                    </>
                  ) : (
                    'Không xác định.'
                  )}
                  <span className="mt-2 block rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    Hành động này không thể hoàn tác.
                  </span>
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={busy}>
                Hủy
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteTarget !== null && action === `delete-${deleteTarget.kind}-${deleteTarget.id}`}
              disabled={busy}
              onClick={() => void handleConfirmDelete()}
            >
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              Xóa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={submitDialogOpen}
        onOpenChange={(open) => {
          if (!open && busy) return
          setSubmitDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[480px]" showCloseButton={!busy}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Send className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <DialogTitle>Gửi duyệt khóa học</DialogTitle>
                <DialogDescription>
                  Gửi khóa học <span className="font-semibold text-gray-900">{course.name}</span> để duyệt? Sau khi gửi, nội dung sẽ chuyển sang trạng thái chờ duyệt và chỉ đọc.
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
            <Button loading={action === 'submit-course'} disabled={busy} onClick={() => void handleConfirmSubmit()}>
              <Send data-icon="inline-start" aria-hidden="true" />
              Gửi duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
