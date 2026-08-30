# Phase 4 Question Form Backlog Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine Teacher `QuestionForm` so each question type shows only the relevant answer inputs and the wording matches the Phase 4 backlog feedback.

**Architecture:** Keep the fix local to Teacher Content UI. Reuse the existing backend DTO contract, `QuestionType` union, and `QuestionForm` submit shape; only adjust conditional rendering, validation, and labels/helper text.

**Tech Stack:** React, TypeScript, existing Teacher Content API types, Tailwind CSS, existing `Button`, frontend lint/build, optional Playwright smoke verification.

---

## Context

- Feedback source: `docs/Docs_Capstone/Project_Plan_Trello_Kanban.md`, Phase 4 `Phạm Vi Còn Lại Và Backlog UX Sau Phase 4`.
- Current `QuestionForm` already supports:
  - `MULTIPLE_CHOICE` options with one correct radio.
  - `TRUE_FALSE` radio `Đúng` / `Sai`.
- Remaining UX issue: text input `Đáp án đúng` is still shown for all question types, including `MULTIPLE_CHOICE` and `TRUE_FALSE`, which conflicts with the backlog requirement that each type only show relevant fields.
- Do not add a new `SINGLE_CHOICE` enum. Backend currently uses `MULTIPLE_CHOICE` with one correct option.
- Course `level` select `A1-C2` was already fixed in `CourseForm.tsx` by commit `c636480`.

## File Structure

- `src/pages/teacher/content/contentLabels.ts`: keep or confirm `MULTIPLE_CHOICE` label is clear as `Trắc nghiệm một đáp án`.
- `src/pages/teacher/content/QuestionForm.tsx`: update conditional answer rendering and validation.
- `C:\Users\Admin\AppData\Local\Temp\opencode\test_phase4_question_form_backlog.py`: temporary Playwright smoke script.
- `docs/superpowers/plans/2026-08-30-phase4-question-form-backlog.md`: mark checklist complete during final task.

---

### Task 1: Update Question Form Conditional Answer UI

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\content\QuestionForm.tsx`

- [x] **Step 1: Add type predicates and dynamic answer label**

Add these constants/helpers near the existing `nonNegativeIntegerPattern`.

```ts
const textAnswerQuestionTypes: TeacherQuestionRequest['type'][] = ['FILL_BLANK', 'WORD_ORDER', 'TRANSLATION', 'SHORT_ANSWER']

function usesTextAnswer(type: TeacherQuestionRequest['type']) {
  return textAnswerQuestionTypes.includes(type) || type === 'PRONUNCIATION'
}

function getCorrectAnswerLabel(type: TeacherQuestionRequest['type']) {
  return type === 'PRONUNCIATION' ? 'Mẫu phát âm / target text' : 'Đáp án đúng'
}
```

- [x] **Step 2: Hide text answer input for MULTIPLE_CHOICE and TRUE_FALSE**

Replace the always-rendered `Đáp án đúng` label block with this conditional block.

```tsx
{usesTextAnswer(form.type) ? (
  <label className="block text-sm font-medium text-gray-700">
    {getCorrectAnswerLabel(form.type)}
    <input
      className={fieldClassName}
      value={form.correctAnswer}
      onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))}
    />
  </label>
) : null}
```

- [x] **Step 3: Clarify MULTIPLE_CHOICE helper text**

Replace the current multiple-choice helper text with this exact text.

```tsx
<p className="text-sm text-gray-600">Trắc nghiệm nhiều lựa chọn, hiện chỉ hỗ trợ một đáp án đúng.</p>
```

- [x] **Step 4: Require text answer when relevant**

Inside `handleSubmit`, after common `questionText`, `orderIndex`, and `xpReward` checks, add this validation.

```ts
if (usesTextAnswer(form.type) && !form.correctAnswer.trim()) {
  nextValidationMessages.push(
    form.type === 'PRONUNCIATION' ? 'Vui lòng nhập mẫu phát âm.' : 'Vui lòng nhập đáp án đúng.',
  )
}
```

- [x] **Step 5: Clear irrelevant correctAnswer on type change**

Replace the question type `onChange` handler with a small inline transition that clears irrelevant answer data when switching type.

```tsx
onChange={(event) => {
  const nextType = event.target.value as TeacherQuestionRequest['type']
  setForm((current) => ({
    ...current,
    type: nextType,
    correctAnswer: usesTextAnswer(nextType) ? current.correctAnswer : '',
  }))
}}
```

Keep existing `trueFalseAnswer` state and option state. The submit handler already maps `TRUE_FALSE` to `correctAnswer` and generated options.

- [x] **Step 6: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/pages/teacher/content/QuestionForm.tsx
git commit -m "fix: tailor teacher question answer fields"
```

---

### Task 2: Confirm Multiple Choice Label Wording

**Files:**
- Modify if needed: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\content\contentLabels.ts`

- [x] **Step 1: Check MULTIPLE_CHOICE label**

Ensure the `MULTIPLE_CHOICE` entry remains this clear wording.

```ts
MULTIPLE_CHOICE: 'Trắc nghiệm một đáp án',
```

If the file already has exactly that value, do not commit a no-op change.

- [x] **Step 2: Verify and commit only if changed**

If changed, run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit only if `contentLabels.ts` changed:

```bash
git add src/pages/teacher/content/contentLabels.ts
git commit -m "fix: clarify multiple choice wording"
```

---

### Task 3: Playwright Smoke Verification

**Files:**
- Test: `C:\Users\Admin\AppData\Local\Temp\opencode\test_phase4_question_form_backlog.py`

- [x] **Step 1: Ensure dev stack is running**

From `C:\baobao\KLTN\learne-platform\infra`, run if needed:

```powershell
docker compose -f docker-compose.dev.yml up -d --build
```

Expected services: frontend 5173, backend 8080, Mailpit 8025, PostgreSQL healthy.

- [x] **Step 2: Create smoke script**

Create `C:\Users\Admin\AppData\Local\Temp\opencode\test_phase4_question_form_backlog.py`.

Script must:

1. Login as Teacher through UI, using an existing teacher or creating one through Admin API if needed.
2. Open `/teacher/content`.
3. Ensure a draft course, topic, and lesson exist, using UI or Teacher API.
4. Open the create-question form.
5. Select `MULTIPLE_CHOICE` and assert:
   - helper text `Trắc nghiệm nhiều lựa chọn, hiện chỉ hỗ trợ một đáp án đúng.` is visible.
   - text input label `Đáp án đúng` is not visible.
   - option inputs and correct radio are visible.
6. Select `TRUE_FALSE` and assert:
   - radio labels `Đúng` and `Sai` are visible.
   - text input label `Đáp án đúng` is not visible.
   - manual option inputs are not visible.
7. Select `SHORT_ANSWER` and assert:
   - label `Đáp án đúng` is visible.
   - option controls are not visible.
8. Select `PRONUNCIATION` and assert:
   - label `Mẫu phát âm / target text` is visible.

- [x] **Step 3: Run smoke script**

Run from temp directory:

```powershell
python test_phase4_question_form_backlog.py
```

Expected: all checks PASS. If selectors need adjustment, update only the temp script. If app behavior fails, fix app code and rerun lint/build before committing.

---

### Task 4: Final Verification And Push

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\docs\superpowers\plans\2026-08-30-phase4-question-form-backlog.md`

- [x] **Step 1: Run final frontend verification**

Run from frontend:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

- [x] **Step 2: Run final Playwright smoke**

Run from temp directory:

```powershell
python test_phase4_question_form_backlog.py
```

Expected: all checks PASS.

- [x] **Step 3: Review diff scope**

Run in frontend:

```bash
git diff origin/main..HEAD --stat
git log --oneline origin/main..HEAD
```

Expected changes include Phase 6 work plus this Phase 4 backlog fix if still on `feature/student-learning-ui`. If creating a separate branch, expected changes should be limited to `QuestionForm`, optional labels, spec and plan.

- [x] **Step 4: Mark plan complete**

Change every task checkbox in this file from `- [ ]` to `- [x]`, except the literal checkbox example in the header sentence.

Commit:

```bash
git add docs/superpowers/plans/2026-08-30-phase4-question-form-backlog.md
git commit -m "docs: mark phase 4 question form backlog plan complete"
```

- [x] **Step 5: Push frontend branch**

Run:

```bash
git push
```

Expected: current frontend branch updates on origin.

---

## Self-Review Notes

- **Spec coverage:** Task 1 implements type-specific answer fields and validation. Task 2 confirms `MULTIPLE_CHOICE` wording. Task 3 verifies UI behavior. Task 4 completes final checks.
- **Scope control:** No backend/schema changes, no `SINGLE_CHOICE`, no lesson media, no Student quiz flow.
- **Backend alignment:** `QuestionForm` continues submitting the existing `TeacherQuestionRequest` shape with `correctAnswer` and `options`.
- **Level feedback:** Course level select was already addressed separately in `CourseForm.tsx` with `A1-C2` options matching Student filters.
