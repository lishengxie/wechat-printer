import type { Module } from '@/types/document'
import type { FooterModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

function renderDefault(p: FooterModuleProps, st: any): string {
  const color = s(st.color) || '#6b7280'
  const fontSize = s(st.fontSize) || '13px'
  return `<section style="padding:16px;text-align:${st.textAlign || 'center'}">
  ${p.showDivider ? '<hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px 0" />' : ''}
  ${p.text ? `<section style="font-size:${fontSize};color:${color};margin:0 0 8px 0;line-height:1.6">${p.text}</section>` : ''}
  ${p.copyright ? `<section style="font-size:12px;color:#9ca3af;margin:0">${p.copyright}</section>` : ''}
</section>`
}

function renderSimple(p: FooterModuleProps, st: any): string {
  return `<section style="padding:8px 0;text-align:${st.textAlign || 'center'}">
  <section style="width:40px;height:2px;background:#d1d5db;border-radius:1px;margin:0 auto 12px auto"></section>
  ${p.copyright ? `<section style="font-size:12px;color:#9ca3af;margin:0">${p.copyright}</section>` : ''}
</section>`
}

function renderBranded(p: FooterModuleProps, st: any): string {
  return `<section style="padding:24px;background-color:${s(st.backgroundColor) || '#f8fafc'};border-radius:12px;text-align:${st.textAlign || 'center'};margin:0 0 16px 0">
  <section style="font-size:28px;margin-bottom:12px">📰</section>
  ${p.text ? `<section style="font-size:14px;color:#4b5563;margin:0 0 8px 0;line-height:1.6">${p.text}</section>` : ''}
  ${p.copyright ? `<section style="font-size:12px;color:#9ca3af;margin:0 0 16px 0">${p.copyright}</section>` : ''}
  <section style="text-align:center">
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#d1d5db;margin:0 4px"></span>
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#d1d5db;margin:0 4px"></span>
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#d1d5db;margin:0 4px"></span>
  </section>
</section>`
}

function renderCta(p: FooterModuleProps, st: any): string {
  return `<section style="padding:24px;background-color:${s(st.backgroundColor) || '#fef2f2'};border-radius:12px;border:1px dashed #fecaca;text-align:${st.textAlign || 'center'};margin:0 0 16px 0">
  ${p.text ? `<section style="font-size:15px;font-weight:500;color:${s(st.color) || '#991b1b'};margin:0 0 16px 0;line-height:1.6">${p.text}</section>` : ''}
  <span style="display:inline-block;padding:10px 24px;font-size:14px;color:#ffffff;background:#dc2626;border-radius:24px;margin-bottom:16px">👍 点赞 · 💬 留言 · ⭐ 收藏</span>
  ${p.copyright ? `<section style="font-size:12px;color:#9ca3af;margin:0">${p.copyright}</section>` : ''}
</section>`
}

export function renderFooter(module: Module): string {
  const p = module.props as FooterModuleProps
  const st = module.styles
  const variant = p.variant || 'default'

  const outerStyles = inlineStyle({
    margin: st.margin || '0 0 16px 0',
    fontFamily: st.fontFamily
  })
  const outerStyle = outerStyles ? ` style="${outerStyles}"` : ''

  let inner: string
  switch (variant) {
    case 'simple': inner = renderSimple(p, st); break
    case 'branded': inner = renderBranded(p, st); break
    case 'cta': inner = renderCta(p, st); break
    case 'default':
    default: inner = renderDefault(p, st); break
  }

  return `<section${outerStyle}>${inner}</section>`
}
