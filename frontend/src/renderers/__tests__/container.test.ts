import { describe, it, expect } from 'vitest'
import { renderContainer } from '../container'
import type { Module } from '@/types/document'
import { createModule } from '@/types/document'

describe('renderContainer', () => {
  it('should render single layout with children', () => {
    const textModule = createModule('text')
    textModule.props.content = '<p>Child</p>'
    const container: Module = {
      id: 'c1', type: 'container',
      props: { layout: 'single' },
      children: [textModule],
      styles: {}
    }
    const html = renderContainer(container)
    expect(html).toContain('Child')
    expect(html).not.toContain('<table')
  })

  it('should render two-column layout with table', () => {
    const m1 = createModule('text'); m1.props.content = '<p>Left</p>'
    const m2 = createModule('text'); m2.props.content = '<p>Right</p>'
    const container: Module = {
      id: 'c1', type: 'container',
      props: { layout: 'two-column' },
      children: [m1, m2],
      styles: {}
    }
    const html = renderContainer(container)
    expect(html).toContain('<table')
    expect(html).toContain('<td')
    expect(html).toContain('width:50%')
    expect(html).toContain('Left')
    expect(html).toContain('Right')
  })

  it('should render three-column layout', () => {
    const items = ['A', 'B', 'C'].map(text => {
      const m = createModule('text')
      m.props.content = `<p>${text}</p>`
      return m
    })
    const container: Module = {
      id: 'c1', type: 'container',
      props: { layout: 'three-column' },
      children: items,
      styles: {}
    }
    const html = renderContainer(container)
    expect(html).toContain('width:33.333')
  })
})
