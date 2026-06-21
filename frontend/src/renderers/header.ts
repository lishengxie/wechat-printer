import type { Module } from '@/types/document'
import type { HeaderModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

function renderDefault(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'center'
  const fontSize = s(st.fontSize) || '24px'
  const color = s(st.color) || '#1f2937'
  const lineHeight = s(st.lineHeight) || '1.4'

  const metaParts: string[] = []
  if (p.showAuthor && p.author) metaParts.push(`<span>${p.author}</span>`)
  if (p.showDate && p.date) metaParts.push(`<span>${p.date}</span>`)
  const metaHtml = metaParts.length
    ? `<div style="text-align:${align};font-size:13px;color:#9ca3af;display:flex;justify-content:${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'};gap:12px;flex-wrap:wrap">${metaParts.join('<span style="color:#d1d5db"> · </span>')}</div>`
    : ''

  return `<div style="padding:24px 16px;text-align:${align}">
  <div style="font-size:${fontSize};color:${color};font-weight:bold;line-height:${lineHeight};margin:0 0 8px 0">${p.title}</div>
  ${p.subtitle ? `<div style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 16px 0">${p.subtitle}</div>` : ''}
  ${metaHtml}
</div>`
}

function renderMagazine(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'center'
  return `<div style="padding:24px 16px;text-align:${align}">
  <div style="width:40px;height:4px;background:#dc2626;border-radius:2px;margin:0 ${align === 'left' ? '0 16px 0 0' : 'auto'} 16px ${align === 'left' ? '0' : 'auto'}"></div>
  ${p.subtitle ? `<div style="font-size:13px;font-weight:500;color:${s(st.color) || '#dc2626'};letter-spacing:2px;text-transform:uppercase;margin:0 0 8px 0">${p.subtitle}</div>` : ''}
  <div style="font-size:28px;font-weight:800;color:#1f2937;line-height:1.3;letter-spacing:-0.5px;margin:0 0 12px 0">${p.title}</div>
  <div style="width:60px;height:3px;background:#e5e7eb;border-radius:2px;margin:0 ${align === 'left' ? '0' : 'auto'} 12px ${align === 'left' ? '0' : 'auto'}"></div>
  <div style="text-align:${align};font-size:13px;color:#9ca3af;display:flex;justify-content:${align === 'left' ? 'flex-start' : 'center'};gap:16px">
    ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
    ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
  </div>
</div>`
}

function renderMinimal(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'left'
  return `<div style="padding:24px 16px">
  <div style="font-size:${s(st.fontSize) || '26px'};font-weight:700;color:#111827;line-height:1.35;text-align:${align}">${p.title}</div>
  <div style="text-align:${align};font-size:13px;color:#9ca3af;display:flex;gap:16px;margin-top:8px">
    ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
    ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
  </div>
</div>`
}

function renderCard(p: HeaderModuleProps, st: any): string {
  return `<div style="padding:24px 16px;text-align:${st.textAlign || 'center'}">
  <div style="padding:32px 24px;background-color:${s(st.backgroundColor) || '#1f2937'};border-radius:12px">
    <div style="color:#ffffff;font-size:${s(st.fontSize) || '24px'};font-weight:bold;line-height:1.4">${p.title}</div>
    ${p.subtitle ? `<p style="font-size:14px;color:rgba(255,255,255,0.75);margin:8px 0 16px 0;line-height:1.5">${p.subtitle}</p>` : ''}
    <div style="font-size:12px;color:rgba(255,255,255,0.55);display:flex;justify-content:center;gap:16px">
      ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
      ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
    </div>
  </div>
</div>`
}

export function renderHeader(module: Module): string {
  const p = module.props as HeaderModuleProps
  const st = module.styles
  const variant = p.variant || 'default'

  const outerStyles = inlineStyle({
    padding: st.padding,
    backgroundColor: st.backgroundColor,
    borderRadius: st.borderRadius,
    border: st.border,
    margin: st.margin || '0 0 16px 0',
    fontFamily: st.fontFamily
  })
  const outerStyle = outerStyles ? ` style="${outerStyles}"` : ''

  let inner: string
  switch (variant) {
    case 'magazine': inner = renderMagazine(p, st); break
    case 'minimal': inner = renderMinimal(p, st); break
    case 'card': inner = renderCard(p, st); break
    case 'default':
    default: inner = renderDefault(p, st); break
  }

  return `<div${outerStyle}>${inner}</div>`
}
