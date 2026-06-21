import { describe, it, expect } from 'vitest'
import { renderFooter } from '../footer'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'footer',
    props: { text: 'Thank you', copyright: '© 2024', showDivider: true, variant: 'default' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderFooter', () => {
  it('should render default variant', () => {
    const html = renderFooter(createMockModule())
    expect(html).toContain('Thank you')
    expect(html).toContain('© 2024')
    expect(html).toContain('<hr')
  })

  it('should render simple variant', () => {
    const html = renderFooter(createMockModule({ props: { text: '', copyright: '© 2024', showDivider: false, variant: 'simple' } }))
    expect(html).toContain('width:40px;height:2px')
  })

  it('should render branded variant', () => {
    const html = renderFooter(createMockModule({ props: { text: 'Brand', copyright: '', showDivider: false, variant: 'branded' } }))
    expect(html).toContain('📰')
  })

  it('should render cta variant', () => {
    const html = renderFooter(createMockModule({ props: { text: 'CTA', copyright: '', showDivider: false, variant: 'cta' } }))
    expect(html).toContain('👍')
    expect(html).toContain('background:#dc2626')
  })
})
