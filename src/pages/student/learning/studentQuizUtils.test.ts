import { describe, expect, it } from 'vitest'
import { getResultTone } from './studentQuizUtils'

describe('getResultTone', () => {
  it('uses semantic success styling for a passed quiz', () => {
    expect(getResultTone(true)).toMatchObject({ label: 'Đạt', className: 'bg-success-background text-success-foreground' })
  })

  it('uses semantic warning styling for a failed quiz', () => {
    expect(getResultTone(false)).toMatchObject({ label: 'Chưa đạt', className: 'bg-warning-background text-warning-foreground' })
  })
})
