import type { Validator } from './validators'

export function validateForm(
  values: Record<string, string>,
  rules: Record<string, Validator[]>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const message = validator(values[field] ?? '', values)
      if (message !== null) {
        errors[field] = message
        break
      }
    }
  }
  return errors
}