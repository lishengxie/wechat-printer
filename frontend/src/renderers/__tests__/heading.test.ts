import { describe, it, expect } from 'vitest'
import { renderHeading } from '../heading'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'heading',
    props: { text: 'Section Title', level: 1, variant: 'simple', showNumbering: false },
    styles: {},
    ...overrides
  } as Module
}

describe('renderHeading', () => {
  it('should render simple variant', () => {
    const html = renderHeading(createMockModule())
    expect(html).toContain('Section Title')
  })

  it('should render numbered variant with prefix', () => {
    const html = renderHeading(createMockModule({
      props: { text: 'Title', level: 1, variant: 'numbered', showNumbering: true }
    }))
    expect(html).toContain('一、')
  })

  it('should render left-bar variant', () => {
    const html = renderHeading(createMockModule({
      props: { text: 'Title', level: 1, variant: 'left-bar', showNumbering: false }
    }))
    expect(html).toContain('background-color:#3b82f6')
  })

  it('should render center variant', () => {
    const html = renderHeading(createMockModule({
      props: { text: 'Title', level: 2, variant: 'center', showNumbering: false }
    }))
    expect(html).toContain('text-align:center')
    expect(html).toContain('width:60px')
  })
})
