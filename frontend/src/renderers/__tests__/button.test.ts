import { describe, it, expect } from 'vitest'
import { renderButton } from '../button'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'button',
    props: { text: 'Click Me', link: '', size: 'medium' },
    styles: { textAlign: 'center' },
    ...overrides
  } as Module
}

describe('renderButton', () => {
  it('should render button text', () => {
    const html = renderButton(createMockModule())
    expect(html).toContain('Click Me')
  })

  it('should respect size prop', () => {
    const smallHtml = renderButton(createMockModule({ props: { text: 'S', link: '', size: 'small' } }))
    expect(smallHtml).toContain('padding:8px 16px')

    const largeHtml = renderButton(createMockModule({ props: { text: 'L', link: '', size: 'large' } }))
    expect(largeHtml).toContain('padding:16px 32px')
  })

  it('should render link when provided', () => {
    const html = renderButton(createMockModule({
      props: { text: 'Link', link: 'https://example.com', size: 'medium' }
    }))
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
  })
})
