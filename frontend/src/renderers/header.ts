import type { Module } from '@/types/document'
import type { HeaderModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

function metaHtml(parts: string[], align: string): string {
  if (parts.length === 0) return ''
  const items = parts.map((part, i) => {
    if (i > 0) {
      return `<span style="margin:0 6px;color:#d1d5db"> · </span><span style="margin:0 6px">${part}</span>`
    }
    return `<span style="margin:0 6px">${part}</span>`
  }).join('')
  return `<section style="text-align:${align};font-size:13px;color:#9ca3af">${items}</section>`
}

function renderDefault(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'center'
  const fontSize = s(st.fontSize) || '24px'
  const color = s(st.color) || '#1f2937'
  const lineHeight = s(st.lineHeight) || '1.4'

  const metaParts: string[] = []
  if (p.showAuthor && p.author) metaParts.push(p.author)
  if (p.showDate && p.date) metaParts.push(p.date)
  const mh = metaHtml(metaParts, align)

  return `<section style="padding:24px 16px;text-align:${align}">
  <section style="font-size:${fontSize};color:${color};font-weight:bold;line-height:${lineHeight};margin:0 0 8px 0">${p.title}</section>
  ${p.subtitle ? `<section style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 16px 0">${p.subtitle}</section>` : ''}
  ${mh}
</section>`
}

function renderMagazine(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'center'
  const accentMargin = align === 'left'
    ? 'margin:0 auto 16px 0'
    : 'margin:0 auto 16px auto'
  const lineMargin = align === 'left'
    ? 'margin:0 0 12px 0'
    : 'margin:0 auto 12px auto'

  const metaParts: string[] = []
  if (p.showAuthor && p.author) metaParts.push(p.author)
  if (p.showDate && p.date) metaParts.push(p.date)
  const mh = metaHtml(metaParts, align)

  return `<section style="padding:24px 16px;text-align:${align}">
  <section style="width:40px;height:4px;background:#dc2626;border-radius:2px;${accentMargin}"></section>
  ${p.subtitle ? `<section style="font-size:13px;font-weight:500;color:${s(st.color) || '#dc2626'};text-transform:uppercase;margin:0 0 8px 0">${p.subtitle}</section>` : ''}
  <section style="font-size:28px;font-weight:800;color:#1f2937;line-height:1.3;margin:0 0 12px 0">${p.title}</section>
  <section style="width:60px;height:3px;background:#e5e7eb;border-radius:2px;${lineMargin}"></section>
  ${mh}
</section>`
}

function renderMinimal(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'left'

  const metaParts: string[] = []
  if (p.showDate && p.date) metaParts.push(p.date)
  if (p.showAuthor && p.author) metaParts.push(p.author)
  const mh = metaHtml(metaParts, align)

  return `<section style="padding:24px 16px">
  <section style="font-size:${s(st.fontSize) || '26px'};font-weight:700;color:#111827;line-height:1.35;text-align:${align}">${p.title}</section>
  ${mh ? `<section style="margin-top:8px">${mh}</section>` : ''}
</section>`
}

function renderCard(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'center'

  const metaParts: string[] = []
  if (p.showAuthor && p.author) metaParts.push(p.author)
  if (p.showDate && p.date) metaParts.push(p.date)
  const mh = metaHtml(metaParts, align)

  return `<section style="padding:24px 16px;text-align:${align}">
  <section style="padding:32px 24px;background-color:${s(st.backgroundColor) || '#1f2937'};border-radius:12px">
    <section style="color:#ffffff;font-size:${s(st.fontSize) || '24px'};font-weight:bold;line-height:1.4">${p.title}</section>
    ${p.subtitle ? `<section style="font-size:14px;color:#9ca3af;margin:8px 0 16px 0;line-height:1.5">${p.subtitle}</section>` : ''}
    ${mh}
  </section>
</section>`
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

  return `<section${outerStyle}>${inner}</section>`
}
