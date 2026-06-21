import { describe, it, expect } from 'vitest'
import { renderHeader } from '../header'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'header',
    props: {
      title: 'Article Title', subtitle: 'Subtitle',
      author: 'Author', date: '2024-01-01',
      showDate: true, showAuthor: true, variant: 'default'
    },
    styles: {},
    ...overrides
  } as Module
}

describe('renderHeader', () => {
  it('should render default variant', () => {
    const html = renderHeader(createMockModule())
    expect(html).toContain('Article Title')
    expect(html).toContain('Subtitle')
    expect(html).toContain('Author')
    expect(html).toContain('2024-01-01')
  })

  it('should render magazine variant with accent bar', () => {
    const html = renderHeader(createMockModule({
      props: { title: 'T', subtitle: 'S', author: 'A', date: 'D', showDate: true, showAuthor: true, variant: 'magazine' }
    }))
    expect(html).toContain('background:#dc2626')
    expect(html).toContain('40px')
  })

  it('should render minimal variant without subtitle', () => {
    const html = renderHeader(createMockModule({
      props: { title: 'T', subtitle: '', author: '', date: 'D', showDate: true, showAuthor: false, variant: 'minimal' }
    }))
    expect(html).toContain('font-weight:700')
    expect(html).not.toContain('Subtitle')
  })

  it('should render card variant with dark background', () => {
    const html = renderHeader(createMockModule({
      props: { title: 'T', subtitle: '', author: '', date: '', showDate: false, showAuthor: false, variant: 'card' }
    }))
    expect(html).toContain('background-color:#1f2937')
    expect(html).toContain('color:#ffffff')
  })
})
