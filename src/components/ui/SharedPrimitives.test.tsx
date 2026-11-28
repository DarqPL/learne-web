import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Spinner } from './Spinner'
import { Avatar } from './Avatar'
import { Alert } from './Alert'
import { Field } from './Field'
import { PasswordInput } from './PasswordInput'

describe('shared primitive wrappers', () => {
  it('uses shared shadcn card and field control primitives', () => {
    const { container } = render(
      <Card><Input aria-label="Email" /><Textarea aria-label="Notes" /></Card>,
    )
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('data-slot', 'input')
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveClass('h-9')
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAttribute('data-slot', 'textarea')
  })

  it('uses the shared shadcn spinner primitive', () => {
    render(<Spinner />)
    expect(screen.getByRole('status', { name: 'Đang tải' })).toHaveClass('animate-spin')
  })

  it('renders avatar fallback through the shared avatar primitive', () => {
    const { container } = render(<Avatar name="Learne Student" />)
    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="avatar-fallback"]')).toHaveTextContent('LS')
  })

  it('keeps success and informational alert states semantic and themeable', () => {
    const { rerender } = render(<Alert variant="success">Saved</Alert>)
    const successAlert = screen.getByRole('status')
    expect(successAlert).toHaveClass('border-success/40')
    expect(successAlert).toHaveClass('bg-success-background')
    rerender(<Alert variant="info">Details</Alert>)
    const infoAlert = screen.getByRole('status')
    expect(infoAlert).toHaveClass('border-info/40')
    expect(infoAlert).toHaveClass('bg-info-background')
  })

  it('uses assertive semantics for errors and keeps the legacy error variant', () => {
    render(<Alert variant="error">Could not save</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save')
    expect(screen.getByRole('alert')).toHaveClass('text-destructive')
    expect(screen.getByRole('alert')).toHaveClass('bg-destructive/10')
  })

  it('allows callers to override alert role and pass styling props', () => {
    render(<Alert role="group" className="mb-4">Rate limited</Alert>)
    expect(screen.getByRole('group')).toHaveClass('mb-4')
  })

  it('connects field labels and validation messages to the control accessibly', () => {
    render(<Field label="Email" error="Invalid email"><Input type="email" /></Field>)
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
    expect(document.getElementById(input.getAttribute('aria-describedby')!)).toHaveTextContent('Invalid email')
  })

  it('does not assume a single child is always a form control', () => {
    render(<Field label="Account"><span>Member</span></Field>)
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  it('preserves a caller-provided control id for the label association', () => {
    render(<Field label="Email"><Input id="account-email" /></Field>)
    expect(screen.getByText('Email')).toHaveAttribute('for', 'account-email')
  })

  it('keeps the legacy large avatar dimensions and fallback scale', () => {
    const { container } = render(<Avatar name="Learne Student" size="lg" />)
    expect(container.querySelector('[data-slot="avatar"]')).toHaveClass('size-24')
    expect(container.querySelector('[data-slot="avatar-fallback"]')).toHaveClass('text-3xl')
  })

  it('renders the avatar fallback while an image source is pending', () => {
    const { container } = render(<Avatar name="Learne Student" url="/missing-avatar.png" />)
    expect(container.querySelector('[data-slot="avatar-image"]')).toBeNull()
    expect(container.querySelector('[data-slot="avatar-fallback"]')).toHaveTextContent('LS')
  })

  it('preserves password visibility toggle behavior with semantic focus styling', () => {
    render(<PasswordInput aria-label="Password" />)
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Hiện' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ẩn' })).toHaveClass('text-primary')
  })
})
