import type { Module } from '@/types/document'
import { renderText } from './text'
import { renderImage } from './image'
import { renderDivider } from './divider'
import { renderButton } from './button'
import { renderContainer } from './container'
import { renderHeader } from './header'
import { renderFooter } from './footer'
import { renderHeading } from './heading'
import { renderToc } from './toc'
import { renderQuote } from './quote'
import { renderMarkdown } from './markdown'

export { renderText } from './text'
export { renderImage } from './image'
export { renderDivider } from './divider'
export { renderButton } from './button'
export { renderContainer } from './container'
export { renderHeader } from './header'
export { renderFooter } from './footer'
export { renderHeading } from './heading'
export { renderToc } from './toc'
export { renderQuote } from './quote'
export { renderMarkdown } from './markdown'

export function renderModule(module: Module): string {
  switch (module.type) {
    case 'text': return renderText(module)
    case 'image': return renderImage(module)
    case 'divider': return renderDivider(module)
    case 'button': return renderButton(module)
    case 'container': return renderContainer(module)
    case 'header': return renderHeader(module)
    case 'footer': return renderFooter(module)
    case 'heading': return renderHeading(module)
    case 'toc': return renderToc(module)
    case 'quote': return renderQuote(module)
    case 'markdown': return renderMarkdown(module)
    default: return ''
  }
}
