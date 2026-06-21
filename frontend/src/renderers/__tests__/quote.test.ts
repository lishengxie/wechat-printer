import { describe, it, expect } from 'vitest'
import { renderQuote } from '../quote'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'quote',
    props: { content: '<p>Quote text</p>', author: '' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderQuote', () => {
  it('should render content', () => {
    const html = renderQuote(createMockModule())
    expect(html).toContain('Quote text')
    expect(html).toContain('border-left:4px solid #3b82f6')
  })

  it('should render author when provided', () => {
    const html = renderQuote(createMockModule({
      props: { content: '<p>Q</p>', author: 'Author Name' }
    }))
    expect(html).toContain('Author Name')
  })
})
