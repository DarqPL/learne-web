import { Alert, AlertDescription } from '@/components/shadcn/ui/alert'
import { rateLimitMessage, type RateLimitInfo } from '@/lib/api/rateLimit'

interface RateLimitAlertProps {
  info: RateLimitInfo
  secondsLeft: number
}

export function RateLimitAlert({ info, secondsLeft }: RateLimitAlertProps) {
  const active = info.kind === 'limited' && secondsLeft > 0

  if (info.kind === 'unavailable') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{rateLimitMessage(info)}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert role="group" variant="warning" className="mb-4">
      <AlertDescription>
        <span role="status" className={active ? 'sr-only' : undefined}>
          {active
            ? 'Đã tạm khóa gửi yêu cầu.'
            : rateLimitMessage({ kind: 'limited', retryAfterSeconds: 0 })}
        </span>
        {active ? (
          <span role="timer" aria-live="off">
            {rateLimitMessage({ kind: 'limited', retryAfterSeconds: secondsLeft })}
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
