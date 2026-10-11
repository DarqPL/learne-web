import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { ScrollArea } from '@/components/shadcn/ui/scroll-area'
import { Separator } from '@/components/shadcn/ui/separator'
import { LessonAudioPlayer } from '../../../student/learning/LessonAudioPlayer'
import type { TeacherCourse, TeacherLesson, TeacherLessonRequest, TeacherTopic, TeacherTopicRequest } from '../../../../lib/api/types'
import { LessonForm } from '../LessonForm'
import { TeacherContentStatusBadge } from '../TeacherContentStatusBadge'
import { TopicForm } from '../TopicForm'
import { skillTypeLabels } from '../contentLabels'
import { cardSoftClassName, findLessonTopic, type DeleteTarget } from './builderModel'

interface BuilderContentStepProps {
  course: TeacherCourse
  action: string | null
  busy: boolean
  editable: boolean
  selectedTopic: TeacherTopic | null
  selectedLesson: TeacherLesson | null
  topicInitialValue: TeacherTopicRequest | null
  lessonInitialValue: TeacherLessonRequest | null
  onSelectTopic: (topicId: number) => void
  onSelectLesson: (lessonId: number) => void
  onAddTopic: () => void
  onAddLesson: (topicId: number) => void
  onUpdateTopic: (topic: TeacherTopic, payload: TeacherTopicRequest) => Promise<void>
  onUpdateLesson: (lesson: TeacherLesson, payload: TeacherLessonRequest) => Promise<void>
  onDeleteRequest: (target: DeleteTarget) => void
}

export function BuilderContentStep({
  course,
  action,
  busy,
  editable,
  selectedTopic,
  selectedLesson,
  topicInitialValue,
  lessonInitialValue,
  onSelectTopic,
  onSelectLesson,
  onAddTopic,
  onAddLesson,
  onUpdateTopic,
  onUpdateLesson,
  onDeleteRequest,
}: BuilderContentStepProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className={`${cardSoftClassName} min-w-0 self-start xl:sticky xl:top-24`}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Cấu trúc nội dung</CardTitle>
              <CardDescription>Chọn chủ đề hoặc bài học để chỉnh sửa.</CardDescription>
            </div>
            {editable ? (
              <Button size="sm" variant="outline" className="border-indigo-200" disabled={busy} onClick={onAddTopic}>
                <Plus data-icon="inline-start" aria-hidden="true" />
                Chủ đề
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {course.topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có chủ đề nào. Thêm chủ đề đầu tiên để bắt đầu.</p>
          ) : (
            <ScrollArea className="h-[420px] min-w-0 pr-3 xl:h-[calc(100vh-22rem)]">
              <Accordion type="multiple" defaultValue={course.topics[0] ? [`topic-${course.topics[0].id}`] : []} className="flex flex-col gap-2">
                {course.topics.map((topic) => {
                  const isTopicSelected = selectedTopic?.id === topic.id && !selectedLesson
                  return (
                    <AccordionItem key={topic.id} value={`topic-${topic.id}`} className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-3">
                      <AccordionTrigger className="py-3 hover:no-underline" onClick={() => onSelectTopic(topic.id)}>
                        <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                          <span className={`min-w-0 flex-1 truncate font-medium ${isTopicSelected ? 'text-indigo-900' : ''}`}>
                            {topic.name || '(Chưa đặt tên)'}
                          </span>
                          <Badge variant="outline" className="shrink-0 border-violet-200 bg-violet-50 text-violet-700">
                            {topic.lessons.length} bài
                          </Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex min-w-0 flex-col gap-2 pb-1">
                          {topic.lessons.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-indigo-200 px-3 py-2 text-sm text-muted-foreground">
                              Chưa có bài học nào trong chủ đề này.
                            </p>
                          ) : (
                            topic.lessons.map((lesson) => {
                              const isSelected = selectedLesson?.id === lesson.id
                              return (
                                <button
                                  key={lesson.id}
                                  type="button"
                                  onClick={() => onSelectLesson(lesson.id)}
                                  aria-current={isSelected ? 'true' : undefined}
                                  className={`flex w-full min-w-0 flex-col gap-0.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                    isSelected
                                      ? 'border-indigo-300 bg-indigo-100/70 font-medium'
                                      : 'border-indigo-100 bg-white/80 font-normal hover:border-indigo-200 hover:bg-indigo-50/60'
                                  }`}
                                >
                                  <span className={`min-w-0 flex-1 truncate text-left ${isSelected ? 'font-medium' : 'font-normal'}`}>{lesson.title || '(Chưa đặt tiêu đề)'}</span>
                                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="truncate">{skillTypeLabels[lesson.skillType]}</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="shrink-0">{lesson.questions.length} câu</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="shrink-0">{lesson.xpReward} XP</span>
                                  </span>
                                </button>
                              )
                            })
                          )}
                          {editable ? (
                            <Button size="sm" variant="ghost" className="justify-start text-indigo-600 hover:text-indigo-800" disabled={busy} onClick={() => onAddLesson(topic.id)}>
                              <Plus data-icon="inline-start" aria-hidden="true" />
                              Thêm bài học
                            </Button>
                          ) : null}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-6">
        {selectedLesson && lessonInitialValue ? (
          <Card className={cardSoftClassName}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardDescription>{findLessonTopic(course, selectedLesson.id)?.name}</CardDescription>
                  <CardTitle className="mt-1">{selectedLesson.title || '(Chưa đặt tiêu đề)'}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                      {skillTypeLabels[selectedLesson.skillType]}
                    </Badge>
                    <TeacherContentStatusBadge status={selectedLesson.status} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/teacher/content/courses/${course.id}/lessons/${selectedLesson.id}?step=cau-hoi`}>
                      <Pencil data-icon="inline-start" aria-hidden="true" />
                      Mở trang bài học
                    </Link>
                  </Button>
                  {editable ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={busy}
                      onClick={() => onDeleteRequest({ kind: 'lesson', id: selectedLesson.id, name: selectedLesson.title })}
                    >
                      <Trash2 data-icon="inline-start" aria-hidden="true" />
                      Xóa
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedLesson.rejectionReason ? (
                <Alert variant="destructive" className="mb-4">
                  <TriangleAlert aria-hidden="true" />
                  <AlertTitle>Lý do từ chối</AlertTitle>
                  <AlertDescription>{selectedLesson.rejectionReason}</AlertDescription>
                </Alert>
              ) : null}
              <LessonAudioPlayer audioUrl={selectedLesson.audioUrl} />
              {editable ? (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <LessonForm
                    initialValue={lessonInitialValue}
                    loading={action === `update-lesson-${selectedLesson.id}`}
                    disabled={action !== null && action !== `update-lesson-${selectedLesson.id}`}
                    submitLabel="Lưu bài học"
                    onSubmit={(payload) => void onUpdateLesson(selectedLesson, payload)}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3 text-sm">
                  <p className="whitespace-pre-wrap text-muted-foreground">{selectedLesson.description || 'Chưa có mô tả bài học.'}</p>
                  <Separator className="bg-indigo-100" />
                  <p className="whitespace-pre-wrap">{selectedLesson.content || 'Chưa có nội dung bài học.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : selectedTopic && topicInitialValue ? (
          <Card className={cardSoftClassName}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle>{selectedTopic.name || '(Chưa đặt tên)'}</CardTitle>
                  <CardDescription className="mt-1">{selectedTopic.description || 'Chưa có mô tả chủ đề.'}</CardDescription>
                </div>
                {editable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="border-indigo-200" disabled={busy} onClick={() => onAddLesson(selectedTopic.id)}>
                      <Plus data-icon="inline-start" aria-hidden="true" />
                      Thêm bài học
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={busy}
                      onClick={() => onDeleteRequest({ kind: 'topic', id: selectedTopic.id, name: selectedTopic.name })}
                    >
                      <Trash2 data-icon="inline-start" aria-hidden="true" />
                      Xóa
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {editable ? (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <TopicForm
                    initialValue={topicInitialValue}
                    loading={action === `update-topic-${selectedTopic.id}`}
                    disabled={action !== null && action !== `update-topic-${selectedTopic.id}`}
                    submitLabel="Lưu chủ đề"
                    onSubmit={(payload) => void onUpdateTopic(selectedTopic, payload)}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{selectedTopic.lessons.length} bài học trong chủ đề này.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className={cardSoftClassName}>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Chọn một chủ đề hoặc bài học ở cột bên trái để chỉnh sửa. {editable ? 'Bạn cũng có thể thêm chủ đề mới.' : ''}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
