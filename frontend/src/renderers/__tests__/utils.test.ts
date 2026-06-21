import { describe, it, expect } from 'vitest'
import { inlineStyle } from '../utils'

describe('inlineStyle', () => {
  it('should convert ModuleStyles to inline style string', () => {
    const result = inlineStyle({
      color: '#333',
      fontSize: '16px',
      textAlign: 'center'
    })
    expect(result).toBe('text-align:center;font-size:16px;color:#333')
  })

  it('should filter out empty/transparent/none values', () => {
    const result = inlineStyle({
      color: '',
      backgroundColor: 'transparent',
      border: 'none'
    })
    expect(result).toBe('')
  })

  it('should handle partial styles', () => {
    const result = inlineStyle({ margin: '0 0 16px 0' })
    expect(result).toBe('margin:0 0 16px 0')
  })
})
