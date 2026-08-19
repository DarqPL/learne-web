interface AvatarProps {
  name: string
  url?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-24 w-24 text-3xl',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

export function Avatar({ name, url, size = 'md' }: AvatarProps) {
  const base = `${sizes[size]} shrink-0 rounded-full object-cover`
  if (url) {
    return <img src={url} alt={name} className={base} />
  }
  return (
    <span
      aria-hidden="true"
      className={`${base} flex items-center justify-center bg-indigo-600 font-semibold text-white`}
    >
      {initials(name)}
    </span>
  )
}
