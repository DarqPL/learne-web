interface AvatarProps {
  name: string
  url?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes: Record<NonNullable<AvatarProps['size']>, { primitive: 'sm' | 'default' | 'lg'; className: string; fallback: string }> = {
  sm: { primitive: 'sm', className: '', fallback: 'text-sm' },
  md: { primitive: 'default', className: 'size-16', fallback: 'text-xl' },
  lg: { primitive: 'lg', className: 'size-24', fallback: 'text-3xl' },
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

export function Avatar({ name, url, size = 'md' }: AvatarProps) {
  return (
    <ShadcnAvatar size={sizes[size].primitive} className={`${sizes[size].className} shrink-0`}>
      {url ? <AvatarImage src={url} alt={`${name} avatar`} /> : null}
      <AvatarFallback className={`bg-primary font-semibold text-primary-foreground ${sizes[size].fallback}`}>{initials(name)}</AvatarFallback>
    </ShadcnAvatar>
  )
}
import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from '../shadcn/ui/avatar'
