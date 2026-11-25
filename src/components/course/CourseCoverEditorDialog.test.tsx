import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CourseCoverEditorDialog } from './CourseCoverEditorDialog'

const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
const originalGetContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')
const originalToBlob = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'toBlob')

function installImage(width: number, height: number) {
  class MockImage {
    naturalWidth = width
    naturalHeight = height
    onload: ((event: Event) => void) | null = null
    onerror: ((event: Event) => void) | null = null

    set src(_url: string) {
      queueMicrotask(() => this.onload?.(new Event('load')))
    }
  }

  vi.stubGlobal('Image', MockImage as unknown as typeof Image)
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:cover-source') })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
}

function installCanvas(blobForAttempt: (attempt: number, width: number) => Blob = () =>
  new Blob(['jpeg crop'], { type: 'image/jpeg' })) {
  const fillStyles: string[] = []
  const context = {
    fillStyle: '',
    fillRect: vi.fn(function (this: { fillStyle: string }) {
      fillStyles.push(this.fillStyle)
    }),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D
  const canvasWidths: number[] = []
  let attempts = 0

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn(() => context),
  })
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    configurable: true,
    value: vi.fn(function (
      this: HTMLCanvasElement,
      callback: BlobCallback,
    ) {
      attempts += 1
      canvasWidths.push(this.width)
      callback(blobForAttempt(attempts, this.width))
    }),
  })

  return { context, fillStyles, canvasWidths }
}

function renderEditor(sourceFile: File, onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const onOpenChange = vi.fn()
  render(
    <CourseCoverEditorDialog
      open
      sourceFile={sourceFile}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
    />,
  )
  return { onOpenChange, onSubmit }
}

afterEach(() => {
  vi.unstubAllGlobals()
  const restore = (target: object, key: PropertyKey, descriptor: PropertyDescriptor | undefined) => {
    if (descriptor) Object.defineProperty(target, key, descriptor)
    else Reflect.deleteProperty(target, key)
  }
  restore(URL, 'createObjectURL', originalCreateObjectUrl)
  restore(URL, 'revokeObjectURL', originalRevokeObjectUrl)
  restore(HTMLCanvasElement.prototype, 'getContext', originalGetContext)
  restore(HTMLCanvasElement.prototype, 'toBlob', originalToBlob)
})

describe('CourseCoverEditorDialog', () => {
  it.each([
    ['image/jpeg', 'cover.jpg'],
    ['image/png', 'cover.png'],
    ['image/webp', 'cover.webp'],
  ])('accepts %s source files', async (type, name) => {
    installImage(1600, 900)
    installCanvas()

    renderEditor(new File(['source'], name, { type }))

    expect(await screen.findByRole('img', { name: 'Xem trước ảnh bìa đã cắt theo tỉ lệ 16:9' })).toBeInTheDocument()
    expect(screen.getByText(/JPEG, PNG hoặc WebP/)).toBeInTheDocument()
  })

  it('rejects source files larger than 5 MiB before decoding', () => {
    const tooLarge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })

    renderEditor(tooLarge)

    expect(screen.getByText('Ảnh nguồn không được vượt quá 5 MiB.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dùng ảnh bìa này' })).toBeDisabled()
  })

  it('warns about source dimensions below the recommendation without blocking use', async () => {
    installImage(800, 600)
    installCanvas()

    renderEditor(new File(['source'], 'small.png', { type: 'image/png' }))

    expect(await screen.findByText(/độ phân giải thấp hơn mức khuyến nghị 1280×720 px/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dùng ảnh bìa này' })).toBeEnabled()
  })

  it('exports the zoomed and panned 16:9 crop as a JPEG over the neutral background', async () => {
    installImage(1600, 900)
    const { context, fillStyles } = installCanvas()
    const { onOpenChange, onSubmit } = renderEditor(new File(['source'], 'cover.png', { type: 'image/png' }))

    const preview = await screen.findByRole('img', { name: 'Xem trước ảnh bìa đã cắt theo tỉ lệ 16:9' })
    expect(preview).toHaveAttribute('width', '1280')
    expect(preview).toHaveAttribute('height', '720')

    const previewBounds = { x: 0, y: 0, width: 320, height: 180, top: 0, right: 320, bottom: 180, left: 0, toJSON: () => ({}) }
    vi.spyOn(preview, 'getBoundingClientRect').mockReturnValue(previewBounds as DOMRect)
    fireEvent.pointerDown(preview, { clientX: 100, clientY: 90 })
    fireEvent.pointerMove(preview, { clientX: 125, clientY: 90 })
    fireEvent.change(screen.getByRole('slider', { name: 'Phóng to' }), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Dùng ảnh bìa này' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const uploadedFile = vi.mocked(onSubmit).mock.calls[0][0]
    expect(uploadedFile).toBeInstanceOf(File)
    expect(uploadedFile.name).toBe('cover.jpg')
    expect(uploadedFile.type).toBe('image/jpeg')
    expect(uploadedFile.size).toBeLessThanOrEqual(5 * 1024 * 1024)
    const outputDraw = vi.mocked(context.drawImage).mock.calls.at(-1)
    expect(outputDraw?.slice(1, 5)).toEqual([400, 225, 800, 450])
    expect(fillStyles).toContain('#e2e8f0')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('reduces output dimensions when the JPEG exceeds 5 MiB', async () => {
    installImage(1600, 900)
    const { canvasWidths } = installCanvas((_attempt, width) => new Blob(
      [new Uint8Array(width > 1024 ? 5 * 1024 * 1024 + 1 : 64)],
      { type: 'image/jpeg' },
    ))
    const { onSubmit } = renderEditor(new File(['source'], 'cover.png', { type: 'image/png' }))

    await screen.findByRole('img', { name: 'Xem trước ảnh bìa đã cắt theo tỉ lệ 16:9' })
    fireEvent.click(screen.getByRole('button', { name: 'Dùng ảnh bìa này' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(canvasWidths).toContain(1280)
    expect(canvasWidths).toContain(1024)
    expect(vi.mocked(onSubmit).mock.calls[0][0].size).toBeLessThanOrEqual(5 * 1024 * 1024)
  })

  it('reports an error and does not submit if output remains over the size cap', async () => {
    installImage(1600, 900)
    installCanvas(() => new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/jpeg' }))
    const { onSubmit } = renderEditor(new File(['source'], 'cover.png', { type: 'image/png' }))

    await screen.findByRole('img', { name: 'Xem trước ảnh bìa đã cắt theo tỉ lệ 16:9' })
    fireEvent.click(screen.getByRole('button', { name: 'Dùng ảnh bìa này' }))

    expect(await screen.findByText(/Ảnh đã cắt vẫn vượt quá 5 MiB/)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('cancels without submitting the selected source', async () => {
    installImage(1600, 900)
    installCanvas()
    const { onOpenChange, onSubmit } = renderEditor(new File(['source'], 'cover.png', { type: 'image/png' }))

    await screen.findByRole('img', { name: 'Xem trước ảnh bìa đã cắt theo tỉ lệ 16:9' })
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
