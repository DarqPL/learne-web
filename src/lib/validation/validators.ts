export type Validator = (value: string, values: Record<string, string>) => string | null

export function required(message = 'Trường này là bắt buộc.'): Validator {
  return (value) => (value.trim().length === 0 ? message : null)
}

export function email(message = 'Email không hợp lệ.'): Validator {
  return (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message)
}

export function fullName(message = 'Vui lòng nhập họ và tên.'): Validator {
  return (value) => (value.trim().length === 0 ? message : null)
}

export function passwordPolicy(
  message = 'Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.',
): Validator {
  return (value) =>
    value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value) ? null : message
}

export function confirmPassword(
  referenceKey: string,
  message = 'Mật khẩu xác nhận không khớp.',
): Validator {
  return (value, values) => (value === values[referenceKey] ? null : message)
}

export function otp(message = 'Mã OTP phải gồm đúng 6 chữ số.'): Validator {
  return (value) => (/^\d{6}$/.test(value) ? null : message)
}
