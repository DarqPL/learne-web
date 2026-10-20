import { useRef, useState } from 'react'
import type { TeacherInvitationDelivery as Delivery } from '../../lib/api/types'
import { getApiErrorMessage } from '../../lib/api/client'
import { Badge } from '../../components/shadcn/ui/badge'
import { Button } from '../../components/shadcn/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/shadcn/ui/dialog'

const labels: Record<Delivery['status'], string> = {
  NOT_REQUESTED: 'Chưa yêu cầu gửi',
  HISTORY_UNAVAILABLE: 'Không có lịch sử gửi',
  QUEUED: 'Đang chờ gửi',
  SENDING: 'Đang gửi',
  RETRYING: 'Đang thử gửi lại',
  SENT: 'Máy chủ SMTP đã tiếp nhận',
  FAILED: 'Gửi thất bại',
  SKIPPED: 'Đã bỏ qua',
}

export function TeacherInvitationDelivery({ delivery, onResend }: {
  delivery?: Delivery | null
  onResend: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  async function confirm() {
    if (inFlight.current || !delivery?.canResend) return
    inFlight.current = true
    setPending(true)
    setError(null)
    try {
      await onResend()
      setOpen(false)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể yêu cầu gửi lại email. Hãy làm mới danh sách để kiểm tra trạng thái.'))
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Badge variant="outline">{delivery ? labels[delivery.status] : 'Chưa có thông tin gửi'}</Badge>
      {delivery?.canResend ? (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => { setError(null); setOpen(true) }}>
          Gửi lại email cấp tài khoản
        </Button>
      ) : null}
      <Dialog open={open} onOpenChange={(value) => { if (!inFlight.current) setOpen(value) }}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>Gửi lại email cấp tài khoản?</DialogTitle>
            <DialogDescription>Mật khẩu tạm mới sẽ vô hiệu hóa mật khẩu tạm cũ. Xác nhận yêu cầu gửi lại email cấp tài khoản cho giảng viên này?</DialogDescription>
          </DialogHeader>
          {error ? <p role="alert" className="text-sm text-red-700">{error} Bạn có thể đóng hộp thoại và chọn Làm mới danh sách để kiểm tra trạng thái.</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Hủy</Button>
            <Button loading={pending} disabled={pending || !delivery?.canResend} onClick={() => void confirm()}>Xác nhận gửi lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
