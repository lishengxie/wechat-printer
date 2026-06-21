import type { Module } from '@/types/document'
import type { DividerModuleProps } from '@/types/document'

export function renderDivider(module: Module): string {
  const p = module.props as DividerModuleProps
  const margin = module.styles.margin || '16px 0'
  const style = p.style || 'solid'
  const color = p.color || '#e5e7eb'

  return `<section style="margin:${margin}">
  <hr style="border:none;border-top:${style === 'none' ? 'solid' : style} 1px ${color};margin:0" />
</section>`
}
