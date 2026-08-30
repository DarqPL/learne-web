# Phase 4 Question Form Backlog Fix Design

## Context

Phase 4 backlog trong `Project_Plan_Trello_Kanban.md` yêu cầu cải thiện UX `QuestionForm` để từng loại câu hỏi chỉ hiển thị đúng nhóm trường cần nhập. Code hiện tại đã có nền tảng tốt: `MULTIPLE_CHOICE` hiển thị danh sách lựa chọn với radio chọn đúng một đáp án, và `TRUE_FALSE` hiển thị radio `Đúng` / `Sai`. Tuy nhiên field `Đáp án đúng` vẫn hiển thị cho mọi loại câu hỏi, nên Teacher có thể hiểu nhầm rằng cần nhập cả `correctAnswer` lẫn chọn radio/options.

Phase 4 cũng có yêu cầu giảng viên chọn cấp độ khóa học. Phần này đã được sửa trong `CourseForm.tsx` bằng select `A1`, `A2`, `B1`, `B2`, `C1`, `C2` để khớp bộ lọc Student Phase 6.

## Goal

Hoàn thiện backlog UX Phase 4 ở mức nhỏ gọn: `QuestionForm` hiển thị đúng input theo từng `QuestionType`, làm rõ wording `MULTIPLE_CHOICE` là nhiều lựa chọn nhưng chỉ một đáp án đúng, và không thay đổi backend contract.

## Non-Goals

- Không thêm enum `SINGLE_CHOICE`.
- Không thay đổi backend API hoặc database schema.
- Không triển khai lesson media upload.
- Không tách lớn `TeacherContentPage` trong đợt fix này.
- Không triển khai quiz/student answering flow.

## Desired Behavior

### MULTIPLE_CHOICE

- Không hiển thị input `Đáp án đúng` dạng text.
- Hiển thị helper text: `Trắc nghiệm nhiều lựa chọn, hiện chỉ hỗ trợ một đáp án đúng.`
- Hiển thị danh sách options như hiện tại.
- Teacher chọn đúng một option bằng radio.
- Submit gửi `options` gồm các lựa chọn không rỗng và giữ `correctAnswer` là giá trị hiện có hoặc chuỗi rỗng; backend dùng option `correct` để xác định đáp án đúng.

### TRUE_FALSE

- Không hiển thị input `Đáp án đúng` dạng text.
- Hiển thị radio `Đúng` / `Sai` như hiện tại.
- Submit tự tạo hai option `Đúng` và `Sai`, đánh dấu option đúng theo radio.
- `correctAnswer` được set theo radio để giữ dữ liệu dễ đọc.

### Text Answer Types

Áp dụng cho:

- `FILL_BLANK`
- `WORD_ORDER`
- `TRANSLATION`
- `SHORT_ANSWER`

Behavior:

- Hiển thị input `Đáp án đúng`.
- Không hiển thị options.
- Submit gửi `correctAnswer` từ input và `options: []`.

### PRONUNCIATION

- Hiển thị input `Mẫu phát âm / target text` thay vì wording chung `Đáp án đúng`.
- Không hiển thị options.
- Submit vẫn gửi vào field backend `correctAnswer` vì backend hiện dùng field này để lưu target text.

## Validation

- `questionText` bắt buộc cho mọi loại.
- `orderIndex` và `xpReward` phải là số nguyên không âm.
- `MULTIPLE_CHOICE` cần ít nhất 2 option không rỗng và đúng 1 option được đánh dấu đúng.
- `TRUE_FALSE` luôn có radio mặc định nên không cần option input thủ công.
- Text answer types và `PRONUNCIATION` nên yêu cầu `correctAnswer` không rỗng để tránh câu hỏi không có đáp án/target text.

## UI Copy

- Label trong `contentLabels.ts` cho `MULTIPLE_CHOICE` giữ hoặc đổi thành `Trắc nghiệm một đáp án đúng`.
- Helper text trong form làm rõ: `Trắc nghiệm nhiều lựa chọn, hiện chỉ hỗ trợ một đáp án đúng.`
- Label cho `PRONUNCIATION`: `Mẫu phát âm / target text`.
- Label cho text answer types: `Đáp án đúng`.

## Verification

- Chạy `npm.cmd run lint; if ($?) { npm.cmd run build }`.
- Playwright smoke test Teacher tạo course/topic/lesson và tạo câu hỏi:
  - `MULTIPLE_CHOICE`: thấy options/radio, không thấy input `Đáp án đúng` text.
  - `TRUE_FALSE`: thấy radio Đúng/Sai, không thấy options thủ công.
  - `SHORT_ANSWER` hoặc `TRANSLATION`: thấy input `Đáp án đúng`, không thấy options.
  - `PRONUNCIATION`: thấy label `Mẫu phát âm / target text`.
