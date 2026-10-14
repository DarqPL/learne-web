import { useEffect, useMemo, useRef } from 'react'
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/shadcn/ui/select'
import { Separator } from '@/components/shadcn/ui/separator'
import type { TeacherCourse, TeacherLesson, TeacherQuestion, TeacherQuestionRequest } from '../../../../lib/api/types'
import { QuestionForm } from '../QuestionForm'
import { TeacherContentStatusBadge } from '../TeacherContentStatusBadge'
import { questionTypeLabels } from '../contentLabels'
import { getQuestionInitialValue } from '../teacherContentMappers'
import { cardSoftClassName, findLesson, findQuestion, type DeleteTarget, type QuestionDialogState } from './builderModel'

interface BuilderQuestionsStepProps {
  course: TeacherCourse
  busy: boolean
  editable: boolean
  action: string | null
  formResetVersion: number
  activeLesson: TeacherLesson | null
  previewMode: boolean
  questionDialog: QuestionDialogState | null
  onLessonChange: (lessonId: number) => void
  onTogglePreview: () => void
  onAddQuestion: (lessonId: number) => void
  onEditQuestion: (questionId: number) => void
  onCancelQuestion: () => void
  onCreateQuestion: (lessonId: number, payload: TeacherQuestionRequest) => Promise<void>
  onUpdateQuestion: (question: TeacherQuestion, payload: TeacherQuestionRequest) => Promise<void>
  onDeleteRequest: (target: DeleteTarget) => void
}

export function BuilderQuestionsStep({
  course,
  busy,
  editable,
  action,
  formResetVersion,
  activeLesson,
  previewMode,
  questionDialog,
  onLessonChange,
  onTogglePreview,
  onAddQuestion,
  onEditQuestion,
  onCancelQuestion,
  onCreateQuestion,
  onUpdateQuestion,
  onDeleteRequest,
}: BuilderQuestionsStepProps) {
  const hasLessons = course.topics.some((topic) => topic.lessons.length > 0)
  const dialogCreateLesson = questionDialog?.mode === 'create' ? findLesson(course, questionDialog.lessonId) : null
  const dialogQuestion = questionDialog?.mode === 'edit' ? findQuestion(course, questionDialog.questionId) : null
  const questionInitialValue = useMemo(
    () => (dialogQuestion ? getQuestionInitialValue(dialogQuestion) : null),
    [dialogQuestion],
  )
  const editorOpen =
    (questionDialog?.mode === 'create' && dialogCreateLesson !== null) ||
    (questionDialog?.mode === 'edit' && dialogQuestion !== null && questionInitialValue !== null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (questionDialog && editorOpen) {
      editorRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [questionDialog, editorOpen])

  return (
    <div className="flex flex-col gap-6">
      <Card className={cardSoftClassName}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Ngân hàng câu hỏi</CardTitle>
              <CardDescription>Chọn bài học để quản lý câu hỏi, hoặc bật xem trước giao diện học viên.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-indigo-200" onClick={onTogglePreview}>
              {previewMode ? <EyeOff data-icon="inline-start" aria-hidden="true" /> : <Eye data-icon="inline-start" aria-hidden="true" />}
              {previewMode ? 'Tắt xem trước' : 'Xem trước học viên'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!hasLessons ? (
            <p className="text-sm text-muted-foreground">Chưa có bài học nào. Hãy thêm bài học ở bước Nội dung trước.</p>
          ) : (
            <label className="flex max-w-md flex-col gap-1.5 text-sm font-medium">
              Bài học
              <Select value={activeLesson ? String(activeLesson.id) : ''} onValueChange={(value) => onLessonChange(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn bài học" />
                </SelectTrigger>
                <SelectContent>
                  {course.topics.map((topic) => (
                    <SelectGroup key={topic.id}>
                      <SelectLabel>{topic.name}</SelectLabel>
                      {topic.lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={String(lesson.id)}>
                          {lesson.title} ({lesson.questions.length} câu)
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </label>
          )}
        </CardContent>
      </Card>

      {activeLesson ? (
        previewMode ? (
          <Card className={cardSoftClassName}>
            <CardHeader>
              <CardDescription>Xem trước giao diện học viên — không hiển thị đáp án</CardDescription>
              <CardTitle className="mt-1">{activeLesson.title}</CardTitle>
              <CardDescription className="mt-1">{activeLesson.description || 'Chưa có mô tả bài học.'}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="whitespace-pre-wrap text-sm">{activeLesson.content || 'Chưa có nội dung bài học.'}</p>
              <Separator className="bg-indigo-100" />
              {activeLesson.questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bài học này chưa có câu hỏi.</p>
              ) : (
                activeLesson.questions.map((question, index) => (
                  <div key={question.id} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                    <p className="text-sm font-medium">
                      Câu {index + 1}: {question.questionText}
                    </p>
                    {question.options.length > 0 ? (
                      <div className="mt-2 flex flex-col gap-2">
                        {question.options.map((option) => (
                          <p key={option.id} className="rounded-lg border border-indigo-100 bg-white/90 px-3 py-2 text-sm">
                            {option.optionText}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {editable ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button disabled={busy} onClick={() => onAddQuestion(activeLesson.id)}>
                  <Plus data-icon="inline-start" aria-hidden="true" />
                  Thêm câu hỏi
                </Button>
              </div>
            ) : null}
            {activeLesson.questions.length === 0 ? (
              <Card className={cardSoftClassName}>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Chưa có câu hỏi nào trong bài học này.</p>
                </CardContent>
              </Card>
            ) : (
              activeLesson.questions.map((question) => (
                <Card key={question.id} className={cardSoftClassName}>
                  <CardContent>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{question.questionText || '(Chưa có nội dung)'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {questionTypeLabels[question.type]} · {question.xpReward} XP
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <TeacherContentStatusBadge status={question.status} />
                        {editable ? (
                          <>
                            <Button variant="outline" size="sm" disabled={busy} onClick={() => onEditQuestion(question.id)}>
                              <Pencil data-icon="inline-start" aria-hidden="true" />
                              Sửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={busy}
                              onClick={() => onDeleteRequest({ kind: 'question', id: question.id, name: question.questionText })}
                            >
                              <Trash2 data-icon="inline-start" aria-hidden="true" />
                              Xóa
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            {editorOpen ? (
              <Card ref={editorRef} className={cardSoftClassName}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>
                        {questionDialog?.mode === 'edit' ? 'Sửa câu hỏi' : `Thêm câu hỏi vào ${dialogCreateLesson?.title ?? ''}`}
                      </CardTitle>
                      <CardDescription>
                        {questionDialog?.mode === 'edit'
                          ? 'Cập nhật nội dung và đáp án của câu hỏi này.'
                          : dialogCreateLesson
                            ? `Tạo câu hỏi mới trong bài học "${dialogCreateLesson.title}".`
                            : null}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label="Đóng trình sửa câu hỏi"
                      disabled={busy}
                      onClick={onCancelQuestion}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {questionDialog?.mode === 'create' && dialogCreateLesson ? (
                    <QuestionForm
                      key={`create-question-${dialogCreateLesson.id}-${formResetVersion}`}
                      loading={action === `create-question-${dialogCreateLesson.id}`}
                      disabled={action !== null && action !== `create-question-${dialogCreateLesson.id}`}
                      submitLabel="Tạo câu hỏi"
                      onSubmit={(payload) => void onCreateQuestion(dialogCreateLesson.id, payload).then(() => onCancelQuestion())}
                    />
                  ) : null}
                  {questionDialog?.mode === 'edit' && dialogQuestion && questionInitialValue ? (
                    <QuestionForm
                      initialValue={questionInitialValue}
                      loading={action === `update-question-${dialogQuestion.id}`}
                      disabled={action !== null && action !== `update-question-${dialogQuestion.id}`}
                      submitLabel="Lưu câu hỏi"
                      onSubmit={(payload) => void onUpdateQuestion(dialogQuestion, payload).then(() => onCancelQuestion())}
                    />
                  ) : null}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" disabled={busy} onClick={onCancelQuestion}>
                    Hủy
                  </Button>
                </CardFooter>
              </Card>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  )
}
