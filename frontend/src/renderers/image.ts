import type { Module } from '@/types/document'
import type { ImageModuleProps } from '@/types/document'
import { s } from './utils'

export function renderImage(module: Module): string {
  const p = module.props as ImageModuleProps
  const st = module.styles
  const align = p.align || 'center'
  const margin = s(st.margin) || '12px 0'

  const imgMargin = align === 'center' ? 'margin:0 auto' : align === 'right' ? 'margin:0 0 0 auto' : 'margin:0 auto 0 0'
  const containerAlign = `text-align:${align}`

  const width = p.width ? `width:${p.width};` : 'width:100%;'
  const height = p.height ? `height:${p.height};` : 'height:auto;'

  const borderRadius = s(st.borderRadius) ? `border-radius:${st.borderRadius};` : ''

  const img = p.src
    ? `<img src="${p.src}" alt="${p.alt || ''}" style="${width}${height}max-width:100%;display:block;${imgMargin};${borderRadius}" />`
    : ''

  const captionStyle = p.captionStyle || {}
  const captionHtml = p.caption
    ? `<p style="margin:8px 0 0 0;font-size:${captionStyle.fontSize || '13px'};color:${captionStyle.color || '#9ca3af'};font-style:${captionStyle.italic ? 'italic' : 'normal'};text-align:${captionStyle.textAlign || 'center'};line-height:1.6">${p.caption}</p>`
    : ''

  return `<section style="margin:${margin};${containerAlign}">
  ${img}
  ${captionHtml}
</section>`
}
