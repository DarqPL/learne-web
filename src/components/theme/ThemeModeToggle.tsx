import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '../shadcn/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '../shadcn/ui/dropdown-menu'
import { useTheme } from '../../lib/theme/ThemeProvider'

const labels = { system: 'System Default', light: 'Light', dark: 'Dark' } as const

export function ThemeModeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label="Theme" title="Theme">
          {theme === 'system' ? <Monitor aria-hidden="true" /> : theme === 'light' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="Choose theme">
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as keyof typeof labels)}>
          {(Object.entries(labels) as [keyof typeof labels, string][]).map(([value, label]) => (
            <DropdownMenuRadioItem key={value} value={value}>{label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
