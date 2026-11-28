import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('shared Button', () => {
  it('uses shadcn variants and sizes while retaining the loading contract', () => {
    render(<Button variant="danger" loading>Save changes</Button>)
    const button = screen.getByRole('button', { name: /Save changes/ })
    expect(button).toHaveAttribute('data-slot', 'button')
    expect(button).toHaveClass('bg-destructive')
    expect(button).toHaveClass('h-9')
    expect(button).toBeDisabled()
  })

  it('retains the wrapper className and native button attributes', () => {
    render(<Button className="w-full" aria-label="Submit form" name="submit">Submit</Button>)
    const button = screen.getByRole('button', { name: 'Submit form' })
    expect(button).toHaveClass('w-full')
    expect(button).toHaveAttribute('name', 'submit')
  })
})
