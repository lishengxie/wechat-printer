import { marked } from 'marked'
import type { Tokens } from 'marked'
import { createModule, createEmptyDocument } from '@/types/document'
import type { Document, Module } from '@/types/document'
import api from './api'

export interface ImportResult {
  document: Document
  localImageCount: number
}

// Regex for ::: block:  :::type key="value"\ncontent\n:::
// Captures: type name, attribute string, content text
const MODULE_BLOCK_RE = /^:::(\w+)((?:\s+\w+="[^"]*")*)\s*\n?([\s\S]*?)\n:::/gm
const ATTR_RE = /(\w+)="([^"]*)"/g

function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  let match: RegExpExecArray | null
  ATTR_RE.lastIndex = 0
  while ((match = ATTR_RE.exec(attrStr)) !== null) {
    attrs[match[1]] = match[2]
  }
  return attrs
}

function createModuleFromBlock(
  type: string,
  attrs: Record<string, string>,
  content: string
): Module {
  switch (type) {
    case 'text': {
      const mod = createModule('text')
      mod.props.content = content || attrs.content || ''
      if (attrs.icon) mod.props.icon = attrs.icon
      return mod
    }
    case 'image': {
      const mod = createModule('image')
      mod.props.src = attrs.src || ''
      mod.props.alt = attrs.alt || ''
      if (attrs.caption) mod.props.caption = attrs.caption
      return mod
    }
    case 'divider': {
      const mod = createModule('divider')
      if (attrs.style && ['solid', 'dashed', 'dotted'].includes(attrs.style)) {
        mod.props.style = attrs.style as 'solid' | 'dashed' | 'dotted'
      }
      if (attrs.color) mod.props.color = attrs.color
      return mod
    }
    case 'button': {
      const mod = createModule('button')
      mod.props.text = attrs.text || '按钮'
      mod.props.link = attrs.link || ''
      if (attrs.size && ['small', 'medium', 'large'].includes(attrs.size)) {
        mod.props.size = attrs.size as 'small' | 'medium' | 'large'
      }
      return mod
    }
    case 'header': {
      const mod = createModule('header')
      if (attrs.title) mod.props.title = attrs.title
      if (attrs.subtitle) mod.props.subtitle = attrs.subtitle
      if (attrs.author) mod.props.author = attrs.author
      if (attrs.variant) {
        mod.props.variant = attrs.variant as typeof mod.props.variant
      }
      return mod
    }
    case 'footer': {
      const mod = createModule('footer')
      if (attrs.text) mod.props.text = attrs.text
      if (attrs.copyright) mod.props.copyright = attrs.copyright
      if (attrs.variant) {
        mod.props.variant = attrs.variant as typeof mod.props.variant
      }
      return mod
    }
    case 'heading': {
      const mod = createModule('heading')
      mod.props.text = attrs.text || content || '标题'
      if (attrs.level) mod.props.level = Math.min(Math.max(parseInt(attrs.level) || 1, 1), 6)
      if (attrs.variant) {
        mod.props.variant = attrs.variant as typeof mod.props.variant
      }
      if (attrs.showNumbering !== undefined) {
        mod.props.showNumbering = attrs.showNumbering === 'true'
      }
      return mod
    }
    case 'quote': {
      const mod = createModule('quote')
      mod.props.content = content || attrs.content || ''
      if (attrs.author) mod.props.author = attrs.author
      return mod
    }
    case 'toc': {
      const mod = createModule('toc')
      if (attrs.title) mod.props.title = attrs.title
      if (attrs.variant) {
        mod.props.variant = attrs.variant as typeof mod.props.variant
      }
      return mod
    }
    default: {
      const mod = createModule('text')
      mod.props.content = content || `[未知模块类型: ${type}]`
      return mod
    }
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function convertMarkedTokens(tokens: Tokens.Generic[]): Module[] {
  const modules: Module[] = []

  for (const token of tokens) {
    switch (token.type) {
      case 'paragraph': {
        const html = marked.parseInline((token as Tokens.Paragraph).text) as string
        const mod = createModule('text')
        mod.props.content = html
        modules.push(mod)
        break
      }
      case 'heading': {
        const hToken = token as Tokens.Heading
        const mod = createModule('heading')
        mod.props.text = hToken.text
        mod.props.level = hToken.depth
        mod.props.variant = 'simple'
        mod.props.showNumbering = false
        modules.push(mod)
        break
      }
      case 'blockquote': {
        const bqToken = token as Tokens.Blockquote
        const html = marked.parseInline(bqToken.text) as string
        const mod = createModule('quote')
        mod.props.content = html
        modules.push(mod)
        break
      }
      case 'hr': {
        modules.push(createModule('divider'))
        break
      }
      case 'code': {
        const cToken = token as Tokens.Code
        const mod = createModule('text')
        mod.props.content = `<pre><code>${escapeHtml(cToken.text)}</code></pre>`
        modules.push(mod)
        break
      }
      case 'list': {
        const lToken = token as Tokens.List
        let html = ''
        for (const item of lToken.items) {
          html += `• ${marked.parseInline(item.text) as string}<br/>`
        }
        const mod = createModule('text')
        mod.props.content = html
        modules.push(mod)
        break
      }
      case 'space':
        break
      default:
        break
    }
  }

  return modules
}

interface Segment {
  type: 'md' | 'module-block'
  content: string
  moduleType?: string
  attrs?: Record<string, string>
}

function splitSegments(content: string): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  MODULE_BLOCK_RE.lastIndex = 0

  while ((match = MODULE_BLOCK_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const mdPart = content.slice(lastIndex, match.index).trim()
      if (mdPart) {
        segments.push({ type: 'md', content: mdPart })
      }
    }

    const attrs = parseAttrs(match[2] || '')
    segments.push({
      type: 'module-block',
      content: (match[3] || '').trim(),
      moduleType: match[1],
      attrs
    })

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    const mdPart = content.slice(lastIndex).trim()
    if (mdPart) {
      segments.push({ type: 'md', content: mdPart })
    }
  }

  return segments
}

function countLocalImages(modules: Module[]): number {
  let count = 0
  for (const mod of modules) {
    if (mod.type === 'image') {
      const src = (mod.props as { src?: string }).src
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('blob:')) {
        count++
      }
    }
    if (mod.children) {
      count += countLocalImages(mod.children)
    }
  }
  return count
}

export async function importMarkdown(file: File): Promise<ImportResult> {
  const content = await file.text()

  if (!content.trim()) {
    throw new Error('文件内容为空')
  }

  const title = file.name.replace(/\.md$/i, '')

  const segments = splitSegments(content)
  const modules: Module[] = []

  for (const segment of segments) {
    if (segment.type === 'module-block') {
      const mod = createModuleFromBlock(
        segment.moduleType!,
        segment.attrs || {},
        segment.content
      )
      if (mod) modules.push(mod)
    } else {
      const tokens = marked.lexer(segment.content)
      const mdModules = convertMarkedTokens(tokens as Tokens.Generic[])
      modules.push(...mdModules)
    }
  }

  const doc = createEmptyDocument(title)
  doc.root.children = modules

  const localImageCount = countLocalImages(modules)

  return { document: doc, localImageCount }
}

export async function importAndCreateArticle(file: File): Promise<{ articleId: string; localImageCount: number }> {
  const { document: doc, localImageCount } = await importMarkdown(file)

  const article = await api.createArticle({
    title: doc.title,
    content: JSON.stringify(doc)
  })

  return { articleId: article.id, localImageCount }
}
