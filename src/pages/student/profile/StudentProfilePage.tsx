import { useEffect, useState, type ChangeEvent } from 'react'
import {
  CalendarDays,
  Camera,
  Clock3,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shadcn/ui/avatar'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Checkbox } from '@/components/shadcn/ui/checkbox'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/ui/select'
import { Spinner } from '@/components/shadcn/ui/spinner'
import { Switch } from '@/components/shadcn/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs'
import { Textarea } from '@/components/shadcn/ui/textarea'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  deleteStudentAvatar,
  getStudentProfile,
  updateStudentProfile,
  uploadStudentAvatar,
} from '@/lib/api/studentProfileApi'
import type { StudentProfile } from '@/lib/api/types'
import {
  getInitials,
  levelOptions,
  mergeDraft,
  skillOptions,
  toDraft,
  validateAvatarFile,
  validateProfileDraft,
  type ProfileDraft,
  type ProfileErrors,
} from './studentProfileUtils'

export function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [activeTab, setActiveTab] = useState('info')
  const [editingTab, setEditingTab] = useState<string | null>(null)
  const [pendingTab, setPendingTab] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mediaAction, setMediaAction] = useState<'avatar' | 'delete-avatar' | null>(null)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await getStudentProfile()
        if (cancelled) return
        setProfile(response.data)
        setDraft(toDraft(response.data))
      } catch (err) {
        if (!cancelled) setApiError(getApiErrorMessage(err, 'Không thể tải hồ sơ học viên.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function startEdit(tab: string) {
    if (!profile) return
    setEditingTab(tab)
    setDraft(toDraft(profile))
    setErrors({})
    setApiError(null)
  }

  function cancelEdit() {
    if (!profile) return
    setDraft(toDraft(profile))
    setEditingTab(null)
    setErrors({})
    setApiError(null)
  }

  function requestTabChange(value: string) {
    if (editingTab && value !== activeTab) {
      setPendingTab(value)
      setDiscardOpen(true)
      return
    }
    setActiveTab(value)
  }

  function confirmDiscard() {
    if (!profile || !pendingTab) return
    setDraft(toDraft(profile))
    setEditingTab(null)
    setActiveTab(pendingTab)
    setPendingTab(null)
    setDiscardOpen(false)
    setErrors({})
    setApiError(null)
  }

  async function saveDraft() {
    if (!profile || !draft) return
    const validation = validateProfileDraft(draft)
    // Surface avatar errors separately; do not block save on stale avatar error.
    const draftErrors: ProfileErrors = { ...validation }
    delete draftErrors.avatar
    if (Object.keys(draftErrors).length > 0) {
      setErrors(draftErrors)
      return
    }
    setErrors({})
    setApiError(null)
    setSaving(true)
    try {
      const response = await updateStudentProfile(mergeDraft(profile, draft))
      setProfile(response.data)
      setDraft(toDraft(response.data))
      setEditingTab(null)
      setMessage('Hồ sơ đã được lưu.')
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Không thể lưu hồ sơ.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateAvatarFile(file)
    if (validationError) {
      setErrors((prev) => ({ ...prev, avatar: validationError }))
      return
    }
    setMediaAction('avatar')
    setApiError(null)
    try {
      const response = await uploadStudentAvatar(file)
      setProfile(response.data)
      setDraft(toDraft(response.data))
      setErrors((prev) => {
        if (!prev.avatar) return prev
        const next = { ...prev }
        delete next.avatar
        return next
      })
      setMessage('Ảnh đại diện đã được cập nhật.')
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Không thể tải ảnh đại diện.'))
    } finally {
      setMediaAction(null)
    }
  }

  async function handleAvatarDelete() {
    setApiError(null)
    setMediaAction('delete-avatar')
    try {
      const response = await deleteStudentAvatar()
      setProfile(response.data)
      setDraft(toDraft(response.data))
      setErrors((prev) => {
        if (!prev.avatar) return prev
        const next = { ...prev }
        delete next.avatar
        return next
      })
      setMessage('Ảnh đại diện đã được xóa.')
      setDeleteOpen(false)
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Không thể xóa ảnh đại diện.'))
    } finally {
      setMediaAction(null)
    }
  }

  function renderTabActions(tab: 'info' | 'learning' | 'privacy', label: string) {
    if (editingTab !== tab) {
      return (
        <Button type="button" onClick={() => startEdit(tab)}>
          Chỉnh sửa {label}
        </Button>
      )
    }
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" loading={saving} onClick={() => void saveDraft()}>
          Lưu {label}
        </Button>
        <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
          Hủy
        </Button>
      </div>
    )
  }

  if (loading || !profile || !draft) {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Hồ sơ học viên</h1>
        <Alert variant="destructive">
          <AlertTitle>Không thể tải hồ sơ</AlertTitle>
          <AlertDescription>{apiError ?? 'Không thể tải hồ sơ học viên.'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isEditingInfo = editingTab === 'info'
  const isEditingLearning = editingTab === 'learning'
  const isEditingPrivacy = editingTab === 'privacy'
  // Disable avatar operations while any tab has unsaved edits so the
  // server-response draft reset in handleAvatarUpload/Delete cannot wipe them.
  const avatarDisabled = editingTab !== null || mediaAction !== null

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Hồ sơ học viên</h1>
      {message ? (
        <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {apiError ? (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertTitle>Đã xảy ra lỗi</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {errors.avatar ? (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertTitle>Ảnh đại diện không hợp lệ</AlertTitle>
            <AlertDescription>{errors.avatar}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <Card className="gap-0 overflow-hidden border-indigo-100 py-0 shadow-lg shadow-indigo-100/60">
        <CardHeader className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 py-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <Avatar className="size-16 shadow-lg ring-4 ring-white/80">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={`Ảnh đại diện của ${profile.fullName}`} />
              ) : null}
              <AvatarFallback className="bg-white/20 text-white">{getInitials(profile.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-xl text-white">{profile.fullName}</CardTitle>
              <p className="mt-0.5 truncate text-sm text-indigo-100">{profile.email}</p>
              <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                <GraduationCap aria-hidden="true" className="size-3" />
                {profile.currentLevel ?? 'Chưa xác định'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <label
                className={`inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-indigo-700 transition-colors duration-200 hover:bg-indigo-50 ${avatarDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <Camera aria-hidden="true" className="size-4" />
                {mediaAction === 'avatar' ? 'Đang tải...' : 'Đổi ảnh'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  aria-label="Đổi ảnh"
                  disabled={avatarDisabled}
                  onChange={(event) => void handleAvatarUpload(event)}
                />
              </label>
              {profile.avatarUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/60 bg-transparent text-white transition-colors duration-200 hover:bg-white/10 hover:text-white"
                  disabled={avatarDisabled}
                  loading={mediaAction === 'delete-avatar' && !deleteOpen}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Xóa ảnh
                </Button>
              ) : null}
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-indigo-100" />
              <div className="min-w-0">
                <dt className="text-[11px] font-medium tracking-wide text-indigo-100 uppercase">
                  Trình độ hiện tại
                </dt>
                <dd className="truncate text-sm font-semibold text-white">
                  {profile.currentLevel ?? 'Chưa xác định'}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <Clock3 aria-hidden="true" className="size-4 shrink-0 text-indigo-100" />
              <div className="min-w-0">
                <dt className="text-[11px] font-medium tracking-wide text-indigo-100 uppercase">
                  Phút học/ngày
                </dt>
                <dd className="truncate text-sm font-semibold text-white">
                  {profile.dailyLearningMinutes ?? '—'}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <Sparkles aria-hidden="true" className="size-4 shrink-0 text-indigo-100" />
              <div className="min-w-0">
                <dt className="text-[11px] font-medium tracking-wide text-indigo-100 uppercase">
                  Số kỹ năng
                </dt>
                <dd className="truncate text-sm font-semibold text-white">
                  {(profile.preferredSkills ?? []).length}
                </dd>
              </div>
            </div>
          </dl>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          {/* Controlled Tabs value + onClick on triggers only (no onValueChange):
              Radix onValueChange does not fire under fireEvent in tests, while
              onClick works in both browser and tests. Kept as single path to
              avoid double requestTabChange calls. */}
          <Tabs value={activeTab}>
            <TabsList className="gap-2">
              <TabsTrigger
                value="info"
                title="Xem và sửa thông tin cá nhân"
                className="cursor-pointer text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-indigo-600 data-[state=active]:font-medium data-[state=active]:text-white data-[state=active]:shadow-sm"
                onClick={() => requestTabChange('info')}
              >
                <UserRound data-icon="inline-start" aria-hidden="true" className="size-4" />
                Thông tin
              </TabsTrigger>
              <TabsTrigger
                value="learning"
                title="Xem và sửa trình độ, mục tiêu và kỹ năng học tập"
                className="cursor-pointer text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-indigo-600 data-[state=active]:font-medium data-[state=active]:text-white data-[state=active]:shadow-sm"
                onClick={() => requestTabChange('learning')}
              >
                <GraduationCap data-icon="inline-start" aria-hidden="true" className="size-4" />
                Học tập
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                title="Quản lý quyền hiển thị hồ sơ công khai"
                className="cursor-pointer text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-indigo-600 data-[state=active]:font-medium data-[state=active]:text-white data-[state=active]:shadow-sm"
                onClick={() => requestTabChange('privacy')}
              >
                <ShieldCheck data-icon="inline-start" aria-hidden="true" className="size-4" />
                Riêng tư
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName" className="flex items-center gap-1.5">
                  <UserRound aria-hidden="true" className="size-3.5 text-indigo-600" />
                  Họ và tên
                </Label>
                <Input
                  id="fullName"
                  value={draft.fullName}
                  disabled={!isEditingInfo}
                  aria-invalid={errors.fullName ? true : undefined}
                  onChange={(event) => setDraft({ ...draft, fullName: event.target.value })}
                />
                {errors.fullName ? <p className="text-sm text-destructive">{errors.fullName}</p> : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phoneNumber" className="flex items-center gap-1.5">
                  <Phone aria-hidden="true" className="size-3.5 text-indigo-600" />
                  Số điện thoại
                </Label>
                <Input
                  id="phoneNumber"
                  value={draft.phoneNumber ?? ''}
                  disabled={!isEditingInfo}
                  aria-invalid={errors.phoneNumber ? true : undefined}
                  onChange={(event) => setDraft({ ...draft, phoneNumber: event.target.value })}
                />
                {errors.phoneNumber ? <p className="text-sm text-destructive">{errors.phoneNumber}</p> : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="size-3.5 text-indigo-600" />
                  Ngày sinh
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={draft.dateOfBirth ?? ''}
                  disabled={!isEditingInfo}
                  aria-invalid={errors.dateOfBirth ? true : undefined}
                  onChange={(event) => setDraft({ ...draft, dateOfBirth: event.target.value || null })}
                />
                {errors.dateOfBirth ? <p className="text-sm text-destructive">{errors.dateOfBirth}</p> : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio" className="flex items-center gap-1.5">
                  <FileText aria-hidden="true" className="size-3.5 text-indigo-600" />
                  Tiểu sử
                </Label>
                <Textarea
                  id="bio"
                  value={draft.bio ?? ''}
                  disabled={!isEditingInfo}
                  onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                />
              </div>
              <div>{renderTabActions('info', 'thông tin')}</div>
            </TabsContent>

            <TabsContent value="learning" className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currentLevel" className="flex items-center gap-1.5">
                  <GraduationCap aria-hidden="true" className="size-3.5 text-indigo-600" />
                  Trình độ hiện tại
                </Label>
                <Select
                  value={draft.currentLevel ?? 'none'}
                  disabled={!isEditingLearning}
                  onValueChange={(value) =>
                    setDraft({ ...draft, currentLevel: value === 'none' ? null : (value as ProfileDraft['currentLevel']) })
                  }
                >
                  <SelectTrigger id="currentLevel">
                    <SelectValue placeholder="Chọn trình độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Chưa xác định</SelectItem>
                    {levelOptions.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dailyLearningMinutes" className="flex items-center gap-1.5">
                  <Clock3 aria-hidden="true" className="size-3.5 text-indigo-600" />
                  Thời lượng học mỗi ngày (phút)
                </Label>
                <Input
                  id="dailyLearningMinutes"
                  type="number"
                  min={0}
                  max={1440}
                  value={draft.dailyLearningMinutes ?? ''}
                  disabled={!isEditingLearning}
                  aria-invalid={errors.dailyLearningMinutes ? true : undefined}
                  onChange={(event) => {
                    const raw = event.target.value
                    setDraft({ ...draft, dailyLearningMinutes: raw === '' ? null : Number(raw) })
                  }}
                />
                {errors.dailyLearningMinutes ? (
                  <p className="text-sm text-destructive">{errors.dailyLearningMinutes}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="learningGoal" className="flex items-center gap-1.5">
                  <Target aria-hidden="true" className="size-3.5 text-indigo-600" />
                  Mục tiêu học tập
                </Label>
                <Textarea
                  id="learningGoal"
                  value={draft.learningGoal ?? ''}
                  disabled={!isEditingLearning}
                  onChange={(event) => setDraft({ ...draft, learningGoal: event.target.value })}
                />
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles aria-hidden="true" className="size-3.5 text-indigo-600" />
                  Kỹ năng luyện tập
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {skillOptions.map((skill) => {
                    const checked = draft.preferredSkills.includes(skill.value)
                    return (
                      <div
                        key={skill.value}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors duration-200 ${checked ? 'border-indigo-500 bg-indigo-50 font-medium text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-700'} ${isEditingLearning ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                      >
                        <Checkbox
                          id={`skill-${skill.value}`}
                          checked={checked}
                          disabled={!isEditingLearning}
                          onCheckedChange={(checkedState) => {
                            const next =
                              checkedState === true
                                ? [...draft.preferredSkills, skill.value]
                                : draft.preferredSkills.filter((item) => item !== skill.value)
                            setDraft({ ...draft, preferredSkills: next })
                          }}
                        />
                        <Label htmlFor={`skill-${skill.value}`} className="cursor-pointer">
                          {skill.label}
                        </Label>
                      </div>
                    )
                  })}
                </div>
                {errors.preferredSkills ? (
                  <p className="text-sm text-destructive">{errors.preferredSkills}</p>
                ) : null}
              </fieldset>
              <div>{renderTabActions('learning', 'học tập')}</div>
            </TabsContent>

            <TabsContent value="privacy" className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Globe aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <Label htmlFor="publicProfileEnabled">Hồ sơ công khai</Label>
                    <p className="text-sm text-muted-foreground">Cho phép người khác xem hồ sơ của bạn.</p>
                  </div>
                </div>
                <Switch
                  id="publicProfileEnabled"
                  checked={draft.publicProfileEnabled}
                  disabled={!isEditingPrivacy}
                  onCheckedChange={(checked) => setDraft({ ...draft, publicProfileEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Mail aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <Label htmlFor="showEmail">Hiển thị email</Label>
                    <p className="text-sm text-muted-foreground">
                      {draft.publicProfileEnabled
                        ? 'Email sẽ hiển thị trên hồ sơ công khai của bạn.'
                        : 'Hồ sơ công khai đang tắt nên email sẽ không hiển thị.'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="showEmail"
                  checked={draft.showEmail}
                  disabled={!isEditingPrivacy}
                  onCheckedChange={(checked) => setDraft({ ...draft, showEmail: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Phone aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <Label htmlFor="showPhoneNumber">Hiển thị số điện thoại</Label>
                    <p className="text-sm text-muted-foreground">
                      {draft.publicProfileEnabled
                        ? 'Số điện thoại sẽ hiển thị trên hồ sơ công khai của bạn.'
                        : 'Hồ sơ công khai đang tắt nên số điện thoại sẽ không hiển thị.'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="showPhoneNumber"
                  checked={draft.showPhoneNumber}
                  disabled={!isEditingPrivacy}
                  onCheckedChange={(checked) => setDraft({ ...draft, showPhoneNumber: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <CalendarDays aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <Label htmlFor="showDateOfBirth">Hiển thị ngày sinh</Label>
                    <p className="text-sm text-muted-foreground">
                      {draft.publicProfileEnabled
                        ? 'Ngày sinh sẽ hiển thị trên hồ sơ công khai của bạn.'
                        : 'Hồ sơ công khai đang tắt nên ngày sinh sẽ không hiển thị.'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="showDateOfBirth"
                  checked={draft.showDateOfBirth}
                  disabled={!isEditingPrivacy}
                  onCheckedChange={(checked) => setDraft({ ...draft, showDateOfBirth: checked })}
                />
              </div>
              <div>{renderTabActions('privacy', 'riêng tư')}</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ảnh đại diện</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa ảnh đại diện hiện tại?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mediaAction !== null}>Ở lại</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                loading={mediaAction === 'delete-avatar'}
                onClick={() => void handleAvatarDelete()}
              >
                Xóa ảnh
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ thay đổi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có thay đổi chưa lưu. Bạn có muốn bỏ thay đổi và chuyển tab?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDiscardOpen(false)
                setPendingTab(null)
              }}
            >
              Ở lại
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" onClick={confirmDiscard}>
                Tiếp tục bỏ
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
