import { describe, it, expect } from 'vitest'
import { renderText } from '../text'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'text',
    props: { content: '<p>Hello World</p>', icon: '' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderText', () => {
  it('should render content', () => {
    const html = renderText(createMockModule())
    expect(html).toContain('Hello World')
  })

  it('should render icon when provided', () => {
    const html = renderText(createMockModule({
      props: { content: '<p>Text</p>', icon: '🔥' }
    }))
    expect(html).toContain('🔥')
  })

  it('should apply styles', () => {
    const html = renderText(createMockModule({
      styles: { color: '#333', fontSize: '16px', margin: '0 0 16px 0' }
    }))
    expect(html).toContain('color:#333')
    expect(html).toContain('font-size:16px')
  })
})
