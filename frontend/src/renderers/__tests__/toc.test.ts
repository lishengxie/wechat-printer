import { describe, it, expect } from 'vitest'
import { renderToc } from '../toc'
import type { Module } from '@/types/document'

const defaultItems = [
  { text: 'Chapter 1', level: 0 },
  { text: 'Section 1.1', level: 1 }
]

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'toc',
    props: { title: 'Contents', items: defaultItems, variant: 'default' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderToc', () => {
  it('should render default variant', () => {
    const html = renderToc(createMockModule())
    expect(html).toContain('Contents')
    expect(html).toContain('Chapter 1')
    expect(html).toContain('Section 1.1')
  })

  it('should render numbered variant', () => {
    const html = renderToc(createMockModule({ props: { title: 'TOC', items: defaultItems, variant: 'numbered' } }))
    expect(html).toContain('📑')
    expect(html).toContain('01')
  })

  it('should render card variant', () => {
    const html = renderToc(createMockModule({ props: { title: 'TOC', items: defaultItems, variant: 'card' } }))
    expect(html).toContain('box-shadow')
  })

  it('should render minimal variant', () => {
    const html = renderToc(createMockModule({ props: { title: 'TOC', items: defaultItems, variant: 'minimal' } }))
    expect(html).toContain('letter-spacing')
  })
})
