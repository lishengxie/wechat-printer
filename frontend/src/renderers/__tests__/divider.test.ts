import { describe, it, expect } from 'vitest'
import { renderDivider } from '../divider'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test',
    type: 'divider',
    props: { style: 'solid', color: '#e5e7eb' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderDivider', () => {
  it('should render default divider', () => {
    const html = renderDivider(createMockModule())
    expect(html).toContain('border-top:solid 1px #e5e7eb')
  })

  it('should render dashed divider', () => {
    const html = renderDivider(createMockModule({
      props: { style: 'dashed', color: '#999' }
    }))
    expect(html).toContain('border-top:dashed 1px #999')
  })

  it('should render with custom margin', () => {
    const html = renderDivider(createMockModule({
      styles: { margin: '24px 0' }
    }))
    expect(html).toContain('margin:24px 0')
  })
})
