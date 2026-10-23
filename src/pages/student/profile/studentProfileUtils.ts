import type { StudentCurrentLevel, StudentPreferredSkill, StudentProfile, UpdateStudentProfileRequest } from '@/lib/api/types'

export const levelOptions: StudentCurrentLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export const skillOptions: Array<{ value: StudentPreferredSkill; label: string }> = [
  { value: 'VOCABULARY', label: 'Từ vựng' },
  { value: 'GRAMMAR', label: 'Ngữ pháp' },
  { value: 'READING', label: 'Đọc' },
  { value: 'WRITING', label: 'Viết' },
  { value: 'LISTENING', label: 'Nghe' },
  { value: 'SPEAKING', label: 'Nói' },
]

export type ProfileDraft = UpdateStudentProfileRequest
export type ProfileErrors = Partial<Record<keyof ProfileDraft | 'avatar', string>>

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase()
}

export function toDraft(profile: StudentProfile): ProfileDraft {
  return {
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber,
    dateOfBirth: profile.dateOfBirth,
    bio: profile.bio,
    learningGoal: profile.learningGoal,
    currentLevel: profile.currentLevel,
    dailyLearningMinutes: profile.dailyLearningMinutes,
    preferredSkills: profile.preferredSkills ?? [],
    publicProfileEnabled: profile.publicProfileEnabled,
    showEmail: profile.showEmail,
    showPhoneNumber: profile.showPhoneNumber,
    showDateOfBirth: profile.showDateOfBirth,
  }
}

export function normalizeOptionalText(value: string | null) {
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export function normalizeDraft(draft: ProfileDraft): ProfileDraft {
  return {
    ...draft,
    fullName: draft.fullName.trim(),
    phoneNumber: normalizeOptionalText(draft.phoneNumber),
    bio: normalizeOptionalText(draft.bio),
    learningGoal: normalizeOptionalText(draft.learningGoal),
    preferredSkills: Array.from(new Set(draft.preferredSkills)),
  }
}

export function mergeDraft(profile: StudentProfile, draft: Partial<ProfileDraft>): ProfileDraft {
  return normalizeDraft({ ...toDraft(profile), ...draft })
}

function isFutureDate(value: string) {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return value > `${yyyy}-${mm}-${dd}`
}

export function validateProfileDraft(draft: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {}
  const name = draft.fullName.trim()

  if (!name) errors.fullName = 'Vui lòng nhập họ và tên.'
  if (name.length > 255) errors.fullName = 'Họ và tên tối đa 255 ký tự.'
  if (draft.phoneNumber && !/^[0-9+()\- ]*$/.test(draft.phoneNumber)) {
    errors.phoneNumber = 'Số điện thoại chỉ gồm số và ký tự + ( ) - khoảng trắng.'
  }
  if (draft.phoneNumber && draft.phoneNumber.length > 30) errors.phoneNumber = 'Số điện thoại tối đa 30 ký tự.'
  if (draft.dateOfBirth && isFutureDate(draft.dateOfBirth)) errors.dateOfBirth = 'Ngày sinh không được ở tương lai.'
  if (draft.dailyLearningMinutes !== null && (draft.dailyLearningMinutes < 0 || draft.dailyLearningMinutes > 1440)) {
    errors.dailyLearningMinutes = 'Thời lượng học mỗi ngày phải từ 0 đến 1440 phút.'
  }
  if (new Set(draft.preferredSkills).size !== draft.preferredSkills.length) {
    errors.preferredSkills = 'Kỹ năng luyện tập không được trùng.'
  }

  return errors
}

export function validateAvatarFile(file: File) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(file.type)) return 'Chỉ hỗ trợ ảnh PNG, JPG hoặc WebP.'
  if (file.size > 5 * 1024 * 1024) return 'Ảnh đại diện tối đa 5 MiB.'
  return null
}
