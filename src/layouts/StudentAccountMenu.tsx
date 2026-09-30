import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Crown, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/shadcn/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/ui/dropdown-menu'
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

type StudentAccountMenuProps = {
  userName: string
  userEmail?: string
  onLogout: () => void
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase()
  }
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase()
}

export function StudentAccountMenu({ userName, userEmail, onLogout }: StudentAccountMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      {/* Uncontrolled Radix dropdown. modal={false} keeps page interactive. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Tài khoản"
            className={cn(
              'group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-100',
            )}
          >
            <Avatar size="sm">
              <AvatarFallback>{getInitials(userName)}</AvatarFallback>
            </Avatar>
            <span className={cn('hidden max-w-28 truncate sm:inline')}>{userName}</span>
            <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform data-[state=open]:rotate-180 group-data-[state=open]:rotate-180')} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={cn('w-56')}>
          <DropdownMenuLabel>
            <div className={cn('flex flex-col gap-1')}>
              <span className={cn('truncate text-sm font-medium')}>{userName}</span>
              {userEmail ? <span className={cn('truncate text-xs text-gray-500')}>{userEmail}</span> : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className={cn('cursor-pointer')}>
              <Link to="/student/subscription" className={cn('flex w-full items-center gap-2')}>
                <Crown data-icon="inline-start" aria-hidden="true" />
                Gói học
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setConfirmOpen(true)} className={cn('cursor-pointer')}>
              <span className={cn('flex w-full items-center gap-2')}>
                <LogOut data-icon="inline-start" aria-hidden="true" />
                Đăng xuất
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đăng xuất khỏi tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>Bạn sẽ cần đăng nhập lại để tiếp tục học.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn('cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100')}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onLogout}
              className={cn('cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700')}
            >
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
