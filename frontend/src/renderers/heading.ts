import type { Module } from '@/types/document'
import type { HeadingModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

const levelFontSize: Record<number, string> = { 1: '24px', 2: '20px', 3: '18px', 4: '16px', 5: '15px', 6: '14px' }

const levelColor: Record<number, string> = {
  1: '#3b82f6', 2: '#6366f1', 3: '#8b5cf6',
  4: '#06b6d4', 5: '#10b981', 6: '#f59e0b'
}

const chineseNumerals = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

function getNumberingPrefix(level: number): string {
  const map: Record<number, string> = {
    1: `${chineseNumerals[1]}、`,
    2: '1.',
    3: '(1)',
    4: '• ',
    5: '- ',
    6: '* '
  }
  return map[level] || ''
}

function getHeadingStyles(module: Module): string {
  const st = module.styles
  const level = (module.props as HeadingModuleProps).level || 1
  const fontSize = s(st.fontSize) || levelFontSize[level] || '24px'
  return inlineStyle({
    fontSize,
    color: st.color || '#111827',
    fontWeight: st.fontWeight || 'bold',
    lineHeight: st.lineHeight || '1.4',
    textAlign: st.textAlign || 'left'
  })
}

export function renderHeading(module: Module): string {
  const p = module.props as HeadingModuleProps
  const st = module.styles
  const level = p.level || 1
  const variant = p.variant || 'simple'
  const containerStyles = inlineStyle({
    padding: st.padding || '12px 0',
    backgroundColor: st.backgroundColor,
    borderRadius: st.borderRadius,
    border: st.border,
    margin: st.margin || '24px 0 16px 0',
    fontFamily: st.fontFamily
  })
  const headingStyle = getHeadingStyles(module)
  const barColor = levelColor[level] || '#3b82f6'
  const prefix = p.showNumbering ? getNumberingPrefix(level) : ''
  const prefixHtml = prefix ? `<span style="color:${barColor}">${prefix}</span>` : ''

  switch (variant) {
    case 'numbered': {
      return `<div style="${containerStyles}">
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="width:4px;background-color:${barColor};border-radius:2px;padding:0"></td>
      <td style="padding:0 0 0 12px">
        <div style="${headingStyle}">${prefixHtml}${p.text}</div>
      </td>
    </tr>
  </table>
</div>`
    }
    case 'left-bar': {
      return `<div style="${containerStyles}">
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="width:4px;background-color:${barColor};border-radius:2px;padding:0"></td>
      <td style="padding:0 0 0 12px">
        <div style="${headingStyle}">${p.text}</div>
      </td>
    </tr>
  </table>
</div>`
    }
    case 'center': {
      return `<div style="${containerStyles}">
  <div style="text-align:center">
    <div style="width:60px;height:2px;background:#e5e7eb;border-radius:1px;margin:0 auto 12px auto"></div>
    <div style="${headingStyle};text-align:center">${prefixHtml}${p.text}</div>
    <div style="width:60px;height:2px;background:#e5e7eb;border-radius:1px;margin:12px auto 0 auto"></div>
  </div>
</div>`
    }
    case 'simple':
    default: {
      return `<div style="${containerStyles}">
  <div style="${headingStyle}">${prefixHtml}${p.text}</div>
</div>`
    }
  }
}
