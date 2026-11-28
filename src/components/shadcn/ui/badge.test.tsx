import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './badge'

describe('Badge semantic variants', () => {
  it('provides theme-token-backed taxonomy variants for categorical labels', () => {
    render(<Badge variant="taxonomy1">Grammar</Badge>)
    expect(screen.getByText('Grammar')).toHaveClass('bg-taxonomy-1', 'text-taxonomy-1-foreground')
  })
})
