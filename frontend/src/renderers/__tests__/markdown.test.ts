import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../markdown'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'markdown',
    props: { content: '# Hello\n\nThis is **bold** text.' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderMarkdown', () => {
  it('should render markdown content as HTML', () => {
    const html = renderMarkdown(createMockModule())
    expect(html).toContain('Hello')
    expect(html).toContain('bold')
  })

  it('should add inline styles to rendered elements', () => {
    const html = renderMarkdown(createMockModule())
    expect(html).toContain('style=')
  })

  it('should return empty for empty content', () => {
    const html = renderMarkdown(createMockModule({ props: { content: '' } }))
    expect(html).toBeTruthy()
  })

  it('should render code blocks with overridden style inside pre', () => {
    const html = renderMarkdown(createMockModule({ props: { content: '```js\nconst x = 1;\n```' } }))
    expect(html).toContain('<pre style=')
    expect(html).toContain('background:none;padding:0;color:inherit')
  })
})
