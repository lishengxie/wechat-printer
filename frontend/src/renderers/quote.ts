import type { Module } from '@/types/document'
import type { QuoteModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

export function renderQuote(module: Module): string {
  const p = module.props as QuoteModuleProps
  const st = module.styles

  const containerStyles = inlineStyle({
    padding: st.padding || '16px 20px',
    backgroundColor: st.backgroundColor,
    borderLeft: st.borderLeft || '4px solid #3b82f6',
    borderRadius: st.borderRadius || '0 8px 8px 0',
    margin: st.margin || '0 0 16px 0',
    fontFamily: st.fontFamily
  })

  const contentStyles = inlineStyle({
    fontSize: st.fontSize || '15px',
    color: st.color || '#4b5563',
    fontWeight: st.fontWeight,
    fontStyle: st.fontStyle || 'italic',
    lineHeight: st.lineHeight || '1.8',
    textAlign: st.textAlign
  })

  const authorHtml = p.author
    ? `<p style="margin:8px 0 0 0;font-size:13px;color:#9ca3af;text-align:right">—— ${p.author}</p>`
    : ''

  return `<section style="${containerStyles}">
  <section style="${contentStyles}">${p.content || ''}</section>
  ${authorHtml}
</section>`
}
