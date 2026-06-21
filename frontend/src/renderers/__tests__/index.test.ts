import { describe, it, expect } from 'vitest'
import { renderModule } from '../index'
import { createModule } from '@/types/document'

describe('renderModule dispatcher', () => {
  it('should dispatch text modules', () => {
    const m = createModule('text')
    const html = renderModule(m)
    expect(html).toContain('点击编辑文字')
  })

  it('should dispatch divider modules', () => {
    const m = createModule('divider')
    const html = renderModule(m)
    expect(html).toContain('border-top')
  })

  it('should dispatch header modules', () => {
    const m = createModule('header')
    const html = renderModule(m)
    expect(html).toContain('文章标题')
  })

  it('should return empty string for unknown type', () => {
    const m = { ...createModule('text'), type: 'unknown' } as any
    expect(renderModule(m)).toBe('')
  })
})
