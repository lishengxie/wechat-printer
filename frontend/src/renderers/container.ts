import type { Module } from '@/types/document'
import type { ContainerModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'
import { renderText } from './text'
import { renderImage } from './image'
import { renderDivider } from './divider'
import { renderButton } from './button'
import { renderHeader } from './header'
import { renderFooter } from './footer'
import { renderHeading } from './heading'
import { renderToc } from './toc'
import { renderQuote } from './quote'
import { renderMarkdown } from './markdown'

function renderChildModule(child: Module): string {
  switch (child.type) {
    case 'text': return renderText(child)
    case 'image': return renderImage(child)
    case 'divider': return renderDivider(child)
    case 'button': return renderButton(child)
    case 'header': return renderHeader(child)
    case 'footer': return renderFooter(child)
    case 'heading': return renderHeading(child)
    case 'toc': return renderToc(child)
    case 'quote': return renderQuote(child)
    case 'markdown': return renderMarkdown(child)
    case 'container': return renderContainer(child)
    default: return ''
  }
}

export function renderContainer(module: Module): string {
  const p = module.props as ContainerModuleProps
  const st = module.styles
  const layout = p.layout || 'single'
  const children = module.children || []

  const containerStyles = inlineStyle({
    padding: st.padding || '24px 16px 16px',
    backgroundColor: st.backgroundColor,
    borderRadius: st.borderRadius,
    border: st.border,
    margin: st.margin || '8px 0',
    fontFamily: st.fontFamily
  })
  const containerStyle = containerStyles ? ` style="${containerStyles}"` : ''

  if (layout === 'single') {
    const childrenHtml = children.map(child => renderChildModule(child)).join('')
    return `<div${containerStyle}>${childrenHtml}</div>`
  }

  const colCount = layout === 'three-column' ? 3 : 2
  const colsHtml = children.map((child) => {
    const childHtml = renderChildModule(child)
    return `<td style="vertical-align:top;padding:0 8px;width:${100 / colCount}%">${childHtml}</td>`
  }).join('')

  return `<div${containerStyle}>
  <table style="width:100%;border-collapse:collapse">
    <tr>${colsHtml}</tr>
  </table>
</div>`
}
