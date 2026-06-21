import type { Module } from '@/types/document'
import type { ButtonModuleProps } from '@/types/document'
import { s } from './utils'

const sizeMap: Record<string, string> = {
  small: 'padding:8px 16px;font-size:14px',
  medium: 'padding:12px 24px;font-size:16px',
  large: 'padding:16px 32px;font-size:18px'
}

export function renderButton(module: Module): string {
  const p = module.props as ButtonModuleProps
  const st = module.styles
  const margin = s(st.margin) || '12px 0'
  const textAlign = st.textAlign || 'center'
  const size = p.size || 'medium'
  const bg = s(st.backgroundColor) || '#3b82f6'
  const color = s(st.color) || '#ffffff'
  const borderRadius = s(st.borderRadius) || '6px'
  const link = p.link || ''

  const sizeStyle = sizeMap[size] || sizeMap.medium
  const linkTarget = link ? ` target="_blank"` : ''

  return `<section style="margin:${margin};text-align:${textAlign}">
  <a href="${link}"${linkTarget} style="display:inline-block;${sizeStyle};background-color:${bg};color:${color};border-radius:${borderRadius};text-decoration:none;text-align:center">${p.text}</a>
</section>`
}
