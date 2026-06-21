import type { Module } from '@/types/document'
import type { TocModuleProps, TocItem } from '@/types/document'

function renderDefault(items: TocItem[], title: string): string {
  const itemsHtml = items.map((item) => {
    const level = item.level || 0
    const pad = level * 16
    const bc = level === 0 ? '#3b82f6' : '#93c5fd'
    const fw = level === 0 ? '500' : 'normal'
    const c = level === 0 ? '#374151' : '#6b7280'
    const fs = level === 0 ? '14px' : '13px'
    return `<section style="margin:6px 0;padding-left:${pad}px">
  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:${bc};margin-right:8px;vertical-align:middle"></span>
  <span style="font-size:${fs};font-weight:${fw};color:${c};line-height:1.5;vertical-align:middle">${item.text}</span>
</section>`
  }).join('')

  return `<section style="margin:0 0 16px 0;padding:16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px">
  <section style="font-size:16px;font-weight:bold;color:#1f2937;margin:0 0 12px 0;padding:0 0 8px 0;border-bottom:2px solid #e5e7eb">${title}</section>
  ${itemsHtml}
</section>`
}

function renderNumbered(items: TocItem[], title: string): string {
  const itemsHtml = items.map((item, index) => {
    const level = item.level || 0
    const pad = level * 20
    const isLevel0 = level === 0
    const numColor = isLevel0 ? '#3b82f6' : '#d1d5db'
    const num = String(index + 1).padStart(2, '0')
    return `<section style="margin:8px 0;padding-left:${pad}px">
  <span style="font-size:11px;font-weight:600;color:${numColor};min-width:22px;display:inline-block;vertical-align:middle">${num}</span>
  <span style="font-size:${isLevel0 ? '14px' : '13px'};font-weight:${isLevel0 ? '500' : 'normal'};color:${isLevel0 ? '#374151' : '#6b7280'};vertical-align:middle">${item.text}</span>
</section>`
  }).join('')

  return `<section style="margin:0 0 16px 0;padding:16px;background:#fff;border-radius:8px">
  <section style="font-size:16px;font-weight:600;color:#1f2937;margin:0 0 14px 0">
    <span style="font-size:18px;display:inline-block;vertical-align:middle;margin-right:8px">📑</span>
    <span style="display:inline-block;vertical-align:middle">${title}</span>
  </section>
  ${itemsHtml}
</section>`
}

function renderCard(items: TocItem[], title: string): string {
  const itemsHtml = items.map((item, index) => {
    const pad = (item.level || 0) * 16
    const numColor = '#d1d5db'
    const num = String(index + 1).padStart(2, '0')
    const isLast = index === items.length - 1
    const borderBottom = isLast ? '' : 'border-bottom:1px solid #f3f4f6'
    return `<section style="margin:0;padding:8px 0;${borderBottom};padding-left:${pad}px">
  <span style="font-size:11px;font-weight:600;color:${numColor};min-width:22px;display:inline-block;vertical-align:middle">${num}</span>
  <span style="font-size:13px;color:#4b5563;vertical-align:middle">${item.text}</span>
</section>`
  }).join('')

  return `<section style="margin:0 0 16px 0;padding:20px;border:1px solid #e5e7eb;border-radius:10px">
  <section style="font-size:15px;font-weight:600;color:#1f2937;margin:0 0 14px 0">
    <span style="display:inline-block;width:4px;height:16px;background:#3b82f6;border-radius:2px;vertical-align:middle;margin-right:8px"></span>
    <span style="display:inline-block;vertical-align:middle">${title}</span>
  </section>
  ${itemsHtml}
</section>`
}

function renderMinimal(items: TocItem[], title: string): string {
  const itemsHtml = items.map((item) => {
    const pad = (item.level || 0) * 12
    return `<section style="margin:5px 0;padding-left:${pad}px">
  <span style="display:inline-block;width:12px;height:1px;background:#d1d5db;vertical-align:middle;margin-right:8px"></span>
  <span style="font-size:13px;color:#6b7280;line-height:1.5;vertical-align:middle">${item.text}</span>
</section>`
  }).join('')

  return `<section style="margin:0 0 16px 0">
  <section style="font-size:14px;font-weight:600;color:#374151;margin:0 0 10px 0">${title}</section>
  ${itemsHtml}
</section>`
}

export function renderToc(module: Module): string {
  const p = module.props as TocModuleProps
  const variant = p.variant || 'default'
  const items = p.items || []
  const title = p.title || ''

  switch (variant) {
    case 'numbered': return renderNumbered(items, title)
    case 'card': return renderCard(items, title)
    case 'minimal': return renderMinimal(items, title)
    case 'default':
    default: return renderDefault(items, title)
  }
}
