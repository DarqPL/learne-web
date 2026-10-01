import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StudentGrammarCheckPage } from './StudentGrammarCheckPage'

vi.mock('../../../lib/api/grammarCheckApi', () => ({
  getGrammarCheck: vi.fn(),
  listGrammarChecks: vi.fn().mockResolvedValue({ data: { content: [], totalPages: 0 } }),
  submitGrammarCheck: vi.fn(),
}))

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/student/grammar-check']}>
      <Routes>
        <Route path="/student" element={<div>Student home route</div>} />
        <Route path="/student/grammar-check" element={<StudentGrammarCheckPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentGrammarCheckPage breadcrumb', () => {
  it('links Trang chủ breadcrumb to student home', async () => {
    renderPage()

    const homeLink = await screen.findByRole('link', { name: 'Trang chủ' })
    expect(homeLink).toHaveAttribute('href', '/student')
    expect(screen.getAllByText('Kiểm tra ngữ pháp').length).toBeGreaterThan(0)
  })
})
