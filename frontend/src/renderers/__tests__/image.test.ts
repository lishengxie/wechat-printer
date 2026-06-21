import { describe, it, expect } from 'vitest'
import { renderImage } from '../image'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'image',
    props: { src: 'https://example.com/img.jpg', alt: 'test', align: 'center' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderImage', () => {
  it('should render img tag with src and alt', () => {
    const html = renderImage(createMockModule())
    expect(html).toContain('src="https://example.com/img.jpg"')
    expect(html).toContain('alt="test"')
  })

  it('should render caption when provided', () => {
    const html = renderImage(createMockModule({
      props: { src: 'img.jpg', alt: '', caption: 'Photo caption', captionStyle: {} }
    }))
    expect(html).toContain('Photo caption')
  })

  it('should render with custom align', () => {
    const html = renderImage(createMockModule({
      props: { src: 'img.jpg', alt: '', align: 'left' }
    }))
    expect(html).toContain('text-align:left')
  })

  it('should render with custom width and height', () => {
    const html = renderImage(createMockModule({
      props: { src: 'img.jpg', alt: '', width: '300px', height: '200px' }
    }))
    expect(html).toContain('width:300px')
    expect(html).toContain('height:200px')
  })
})
