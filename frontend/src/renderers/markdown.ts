import type { Module } from '@/types/document'
import type { MarkdownModuleProps } from '@/types/document'
import { marked } from 'marked'
import { inlineStyle, s } from './utils'

function styleMarkdownHtml(raw: string): string {
  let result = raw.replace(/<p>/g, '<p style="margin:0 0 8px 0;word-break:break-word">')
  result = result.replace(/<h1 /g, '<h1 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.5em" ')
  result = result.replace(/<h2 /g, '<h2 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.35em" ')
  result = result.replace(/<h3 /g, '<h3 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.2em" ')
  result = result.replace(/<h1>/g, '<h1 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.5em">')
  result = result.replace(/<h2>/g, '<h2 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.35em">')
  result = result.replace(/<h3>/g, '<h3 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.2em">')
  result = result.replace(/<pre>/g, '<pre style="background:#f3f4f6;border-radius:6px;padding:12px;overflow-x:auto;margin:8px 0">')
  result = result.replace(/<code>/g, '<code style="background:#f3f4f6;border-radius:4px;padding:2px 6px;font-size:0.9em;color:#dc2626">')
  // Override <code> style when inside <pre> (code blocks) - suppress background/padding/color
  result = result.replace(/(<pre[^>]*>)<code[^>]*>/g, '$1<code style="background:none;padding:0;color:inherit">')
  result = result.replace(/<blockquote>/g, '<blockquote style="border-left:4px solid #3b82f6;margin:8px 0;padding:4px 16px;color:#4b5563;font-style:italic">')
  result = result.replace(/<table>/g, '<table style="border-collapse:collapse;width:100%;margin:8px 0">')
  result = result.replace(/<th>/g, '<th style="border:1px solid #d1d5db;padding:6px 10px;text-align:left;font-size:14px;background:#f9fafb;font-weight:600">')
  result = result.replace(/<td>/g, '<td style="border:1px solid #d1d5db;padding:6px 10px;text-align:left;font-size:14px">')
  result = result.replace(/<ul>/g, '<ul style="margin:6px 0;padding-left:24px">')
  result = result.replace(/<ol>/g, '<ol style="margin:6px 0;padding-left:24px">')
  result = result.replace(/<li>/g, '<li style="margin:3px 0">')
  result = result.replace(/<hr>/g, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">')
  result = result.replace(/<a /g, '<a style="color:#3b82f6;text-decoration:underline" ')
  result = result.replace(/<img /g, '<img style="max-width:100%;border-radius:4px;margin:8px 0" ')

  return result
}

export function renderMarkdown(module: Module): string {
  const p = module.props as MarkdownModuleProps
  const st = module.styles
  const margin = s(st.margin) || '0 0 16px 0'

  const containerStyles = inlineStyle({
    padding: st.padding,
    backgroundColor: st.backgroundColor,
    borderRadius: st.borderRadius,
    border: st.border,
    fontFamily: st.fontFamily
  })

  const contentStyles = inlineStyle({
    fontSize: st.fontSize,
    color: st.color,
    fontWeight: st.fontWeight,
    lineHeight: st.lineHeight,
    textAlign: st.textAlign
  })

  let mdHtml = ''
  if (p.content) {
    mdHtml = marked.parse(p.content) as string
    mdHtml = styleMarkdownHtml(mdHtml)
  }

  const combinedContainer = containerStyles
    ? `margin:${margin};${containerStyles}`
    : `margin:${margin}`

  return `<section style="${combinedContainer}">
  <section style="${contentStyles || ''}">${mdHtml}</section>
</section>`
}
