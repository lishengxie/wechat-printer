import type { Module } from '@/types/document'
import type { TextModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

export function renderText(module: Module): string {
  const p = module.props as TextModuleProps
  const st = module.styles
  const margin = s(st.margin) || '0 0 16px 0'

  // 外层样式（容器相关）
  const containerStyles = inlineStyle({
    padding: st.padding,
    backgroundColor: st.backgroundColor,
    border: st.border,
    borderRadius: st.borderRadius,
    fontFamily: st.fontFamily
  })

  // 内层样式（字体相关）
  const innerStyles = inlineStyle({
    fontSize: st.fontSize,
    color: st.color,
    fontWeight: st.fontWeight,
    lineHeight: st.lineHeight,
    textAlign: st.textAlign
  })

  const iconHtml = p.icon
    ? `<p style="margin:0 0 4px 0;font-size:20px;line-height:1">${p.icon}</p>`
    : ''

  const fullContainer = containerStyles ? `margin:${margin};${containerStyles}` : `margin:${margin}`
  const fullInner = innerStyles || 'margin:0'

  return `<section style="${fullContainer}">
  ${iconHtml}
  <section style="${fullInner}">${p.content || ''}</section>
</section>`
}
