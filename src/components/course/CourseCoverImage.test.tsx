import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CourseCoverImage } from './CourseCoverImage'

describe('CourseCoverImage', () => {
  it('shows fallback when URL is absent or broken', () => {
    const { rerender } = render(<CourseCoverImage courseName="English B1" imageUrl={null} />)
    expect(screen.getByRole('img', { name: 'Ảnh bìa mặc định cho khóa học English B1' })).toBeInTheDocument()

    rerender(<CourseCoverImage courseName="English B1" imageUrl="https://example.test/broken.jpg" />)
    const image = screen.getByRole('img', { name: 'Ảnh bìa khóa học English B1' })
    fireEvent.error(image)
    expect(screen.getByRole('img', { name: 'Ảnh bìa mặc định cho khóa học English B1' })).toBeInTheDocument()
  })

  it('tries a changed URL after the previous URL failed', () => {
    const { rerender } = render(
      <CourseCoverImage courseName="English B1" imageUrl="https://example.test/old.jpg" />,
    )
    fireEvent.error(screen.getByRole('img', { name: 'Ảnh bìa khóa học English B1' }))
    expect(screen.getByRole('img', { name: 'Ảnh bìa mặc định cho khóa học English B1' })).toBeInTheDocument()

    rerender(<CourseCoverImage courseName="English B1" imageUrl="https://example.test/new.jpg" />)
    expect(screen.getByRole('img', { name: 'Ảnh bìa khóa học English B1' })).toHaveAttribute(
      'src',
      'https://example.test/new.jpg',
    )
  })
})
