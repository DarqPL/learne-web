import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, XCircle } from 'lucide-react'
import { adminCreateTeacher } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { Alert, AlertDescription, AlertTitle } from '../../components/shadcn/ui/alert'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '../../components/shadcn/ui/breadcrumb'
import { Button } from '../../components/shadcn/ui/button'
import { Card, CardContent } from '../../components/shadcn/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '../../components/shadcn/ui/field'
import { Input } from '../../components/shadcn/ui/input'
import { validateForm } from '../../lib/validation/validateForm'
import { email as emailValidator, fullName as fullNameValidator, required } from '../../lib/validation/validators'

export function CreateTeacherPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateForm(
      { email, fullName },
      {
        fullName: [fullNameValidator()],
        email: [required(), emailValidator()],
      },
    )
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      const response = await adminCreateTeacher({ email, fullName })
      setInfo(
        `Đã tạo tài khoản giảng viên ${response.data.fullName} (${response.data.email}). Yêu cầu gửi email cấp tài khoản đã được tiếp nhận. Có thể theo dõi trạng thái trong danh sách giảng viên.`,
      )
      setEmail('')
      setFullName('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo tài khoản giảng viên.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Tạo tài khoản giảng viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">Tạo tài khoản giảng viên</h1>
          <p className="text-sm text-gray-600">Nhập họ tên và email để tạo tài khoản giảng viên mới.</p>
        </div>
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/teachers">
              <ChevronLeft aria-hidden="true" />
              <span>Quay lại</span>
            </Link>
          </Button>
        </div>
      </section>

      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription className="text-emerald-700">{info}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Không thể tạo tài khoản giảng viên</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <Field data-invalid={fieldErrors.fullName ? true : undefined}>
                <FieldLabel htmlFor="create-teacher-fullName">Họ và tên</FieldLabel>
                <Input
                  id="create-teacher-fullName"
                  value={fullName}
                  disabled={submitting}
                  aria-invalid={fieldErrors.fullName ? true : undefined}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="off"
                  required
                />
                {fieldErrors.fullName ? <FieldError>{fieldErrors.fullName}</FieldError> : null}
              </Field>
              <Field data-invalid={fieldErrors.email ? true : undefined}>
                <FieldLabel htmlFor="create-teacher-email">Email</FieldLabel>
                <Input
                  id="create-teacher-email"
                  type="email"
                  value={email}
                  disabled={submitting}
                  aria-invalid={fieldErrors.email ? true : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="off"
                  placeholder="giangvien@example.com"
                  required
                />
                {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
              </Field>
              <Button type="submit" loading={submitting} className="w-full">
                Tạo tài khoản
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
