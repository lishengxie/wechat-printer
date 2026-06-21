import juice from 'juice/client'
import type { Document, Module, ModuleStyles } from '@/types/document'
import { createModule, createEmptyDocument } from '@/types/document'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

export interface BackendLayout {
  id: string
  name: string
  description: string
  content: string
  css: string
  html: string
  is_preset: boolean
  created_at: string
  updated_at: string
}

export interface Layout {
  id: string
  name: string
  description?: string
  document: Document | null
  isPreset: boolean
  createdAt: string
  updatedAt: string
}

export interface Article {
  id: string
  user_id: string
  layout_id: string
  title: string
  author: string
  summary: string
  cover_image: string
  content: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface LayoutCreateInput {
  name: string
  description?: string
  document?: Document
}

export interface LayoutUpdateInput {
  name?: string
  description?: string
  document?: Document
}

export interface ArticleCreateInput {
  title: string
  layout_id?: string
  author?: string
  summary?: string
  cover_image?: string
  content?: string
}

export interface ArticleUpdateInput {
  title?: string
  layout_id?: string
  author?: string
  summary?: string
  cover_image?: string
  content?: string
  status?: 'draft' | 'published'
}

export interface ExportHTMLResponse {
  html: string
  success: boolean
}

const API_BASE = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const authStore = useAuthStore()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  }

  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`
  }

  const config: RequestInit = {
    ...options,
    headers
  }

  const response = await fetch(`${API_BASE}${url}`, config)

  if (response.status === 401) {
    authStore.clearAuth()
    router.push('/login')
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

// 上传图片：使用 FormData，不能复用 request()（它强行设置 JSON Content-Type）
export interface UploadedImage {
  url: string
  filename: string
  size: number
  mime: string
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const authStore = useAuthStore()
  const form = new FormData()
  form.append('file', file)

  const headers: Record<string, string> = {}
  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`
  }

  const response = await fetch(`${API_BASE}/uploads/image`, {
    method: 'POST',
    headers,
    body: form
  })

  if (response.status === 401) {
    authStore.clearAuth()
    router.push('/login')
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Upload failed: ${response.status}`)
  }

  const json = await response.json()
  return json.data as UploadedImage
}

function convertStyleDefsToDocument(styles: Record<string, ModuleStyles>): Document {
  const doc = createEmptyDocument('模板')
  for (const [type, style] of Object.entries(styles)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = createModule(type as any) as Module
    mod.styles = style
    doc.root.children!.push(mod)
  }
  return doc
}

function backendToFrontend(backend: BackendLayout): Layout {
  let document: Document | null = null
  try {
    const parsed = JSON.parse(backend.content)
    // Detect old format (keyed by module type strings) vs new format (has 'root')
    if (parsed && parsed.root) {
      document = parsed as Document
    } else if (parsed && typeof parsed === 'object') {
      // Old StyleDefinitions format — convert
      document = convertStyleDefsToDocument(parsed as Record<string, ModuleStyles>)
    }
  } catch {
    // Invalid JSON, leave as null
  }
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description,
    document,
    isPreset: !!backend.is_preset,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at
  }
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: { id: string; username: string; role: 'admin' | 'user' } }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },

  async register(username: string, password: string, role: string): Promise<{ data: { id: string; username: string; role: string } }> {
    return request('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role })
    })
  },

  async getUsers(): Promise<{ data: Array<{ id: string; username: string; role: string; created_at: string }> }> {
    return request('/admin/users', { method: 'GET' })
  },

  async deleteUser(id: string): Promise<void> {
    return request(`/admin/users/${id}`, { method: 'DELETE' })
  },

  // Layouts
  async listLayouts(): Promise<Layout[]> {
    const response = await request<{ data: BackendLayout[] }>('/layouts', { method: 'GET' })
    return response.data.map(backendToFrontend)
  },

  async getLayout(id: string): Promise<Layout> {
    const response = await request<{ data: BackendLayout }>(`/layouts/${id}`, { method: 'GET' })
    return backendToFrontend(response.data)
  },

  async createLayout(data: LayoutCreateInput): Promise<Layout> {
    const response = await request<{ data: BackendLayout }>('/layouts', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description || '',
        content: data.document ? JSON.stringify(data.document) : '',
        css: ''
      })
    })
    return backendToFrontend(response.data)
  },

  async updateLayout(id: string, data: LayoutUpdateInput): Promise<Layout> {
    const response = await request<{ data: BackendLayout }>(`/layouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        description: data.description || '',
        content: data.document ? JSON.stringify(data.document) : undefined,
        css: ''
      })
    })
    return backendToFrontend(response.data)
  },

  async deleteLayout(id: string): Promise<void> {
    return request(`/layouts/${id}`, { method: 'DELETE' })
  },

  async exportHTMLByLayoutId(layoutId: string): Promise<ExportHTMLResponse> {
    const response = await request<{ data: { html: string } }>(`/layouts/${layoutId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ include_wrap: true })
    })
    return { html: response.data.html, success: true }
  },

  async exportHTML(document: Document): Promise<ExportHTMLResponse> {
    const html = generateHTMLFromDocument(document)
    return Promise.resolve({ html, success: true })
  },

  // Articles
  async listArticles(): Promise<Article[]> {
    const response = await request<{ data: Article[] }>('/articles', { method: 'GET' })
    return response.data
  },

  async getArticle(id: string): Promise<Article> {
    const response = await request<{ data: Article }>(`/articles/${id}`, { method: 'GET' })
    return response.data
  },

  async createArticle(data: ArticleCreateInput): Promise<Article> {
    const response = await request<{ data: Article }>('/articles', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return response.data
  },

  async updateArticle(id: string, data: ArticleUpdateInput): Promise<Article> {
    const response = await request<{ data: Article }>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return response.data
  },

  async deleteArticle(id: string): Promise<void> {
    return request(`/articles/${id}`, { method: 'DELETE' })
  }
}

function generateHTMLFromDocument(document: Document): string {
  // WeChat-safe HTML generator
  // Uses juice to inline CSS into style attributes, ensuring styles survive
  // when pasted into WeChat's editor (which strips <style> tags but keeps inline styles).

  const s = (v: any) => v && v !== 'transparent' ? String(v) : ''

  function moduleCSS(i: number, m: any): string {
    const st = m.styles || {}
    const sel = `.m${i}`
    const rules: string[] = ['margin:0 0 16px 0']
    if (s(st.backgroundColor)) rules.push('background-color:' + st.backgroundColor)
    if (s(st.padding)) rules.push('padding:' + st.padding)
    if (s(st.textAlign)) rules.push('text-align:' + st.textAlign)
    if (s(st.color)) rules.push('color:' + st.color)
    if (s(st.fontSize)) rules.push('font-size:' + st.fontSize)
    if (s(st.fontFamily)) rules.push('font-family:' + st.fontFamily)
    if (s(st.lineHeight)) rules.push('line-height:' + st.lineHeight)

    let css = `${sel}{${rules.join(';')}}`

    // Inner content wrapper — inherit text styles
    if (s(st.color) || s(st.fontSize) || s(st.fontFamily) || s(st.lineHeight)) {
      const inner: string[] = ['margin:0']
      if (s(st.color)) inner.push('color:' + st.color)
      if (s(st.fontSize)) inner.push('font-size:' + st.fontSize)
      if (s(st.fontFamily)) inner.push('font-family:' + st.fontFamily)
      if (s(st.lineHeight)) inner.push('line-height:' + st.lineHeight)
      css += `\n.${sel}-inner{${inner.join(';')}}`
    }

    return css
  }

  function renderModule(i: number, m: any): string {
    const cls = `m${i}`
    const p = m.props || {}
    const st = m.styles || {}

    switch (m.type) {
      case 'text': {
        const icon = p.icon ? `<p style="margin:0 0 4px 0;font-size:20px;line-height:1">${p.icon}</p>` : ''
        return `<section class="${cls}">${icon}<section class="${cls}-inner">${p.content || ''}</section></section>`
      }
      case 'image': {
        const img = `<section class="${cls}" style="text-align:center"><img src="${p.src}" alt="${p.alt || ''}" style="max-width:100%;height:auto" /></section>`
        const cap = p.caption
          ? `<p style="margin:8px 0 0 0;font-size:${p.captionStyle?.fontSize || '13px'};color:${p.captionStyle?.color || '#9ca3af'};font-style:${p.captionStyle?.italic ? 'italic' : 'normal'};text-align:${p.captionStyle?.textAlign || 'center'}">${p.caption}</p>`
          : ''
        return img + cap
      }
      case 'divider':
        return `<section class="${cls}" style="text-align:center"><p style="margin:0;border-bottom:2px solid ${p.color || '#e5e7eb'};line-height:0;font-size:0">&nbsp;</p></section>`
      case 'button':
        return `<section class="${cls}" style="text-align:${st.textAlign || 'center'}"><span style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff">${p.text}</span></section>`
      case 'container':
        return renderContainer(i, m)
      case 'header':
        return renderHeader(m)
      case 'heading': {
        const fs = p.level === 1 ? '22px' : p.level === 2 ? '18px' : '16px'
        return `<section class="${cls}"><p style="margin:0;font-size:${fs};font-weight:bold">${p.text}</p></section>`
      }
      case 'markdown':
        return `<section class="${cls}">${p.content || ''}</section>`
      case 'footer':
        return renderFooter(m)
      case 'toc':
        return renderToc(m)
      case 'quote': {
        const icon = p.icon ? `<p style="margin:0 0 4px 0;font-size:20px;line-height:1">${p.icon}</p>` : ''
        const author = p.author ? `<p style="margin:8px 0 0 0;font-size:13px;color:#9ca3af;text-align:right">—— ${p.author}</p>` : ''
        return `<section class="${cls}">${icon}<p style="margin:0;font-style:italic">${p.content || ''}</p>${author}</section>`
      }
      default:
        return ''
    }
  }

  function renderContainer(i: number, m: any): string {
    const cls = `m${i}`
    const layout = m.props?.layout || 'single'
    const children = (m.children || []).map((c: any, ci: number) => renderModule(i * 100 + ci + 1, c)).join('')
    if (layout === 'single') {
      return `<section class="${cls}">${children}</section>`
    }
    const colCount = layout === 'three-column' ? 3 : 2
    const cols = (m.children || []).map((c: any, ci: number) => {
      const html = renderModule(i * 100 + ci + 1, c)
      return `<td style="vertical-align:top;padding:0 8px;width:${100 / colCount}%">${html}</td>`
    }).join('')
    return `<section class="${cls}"><table style="width:100%"><tr>${cols}</tr></table></section>`
  }

  function renderHeader(m: any): string {
    const p = m.props || {}
    const st = m.styles || {}
    const align = st.textAlign || 'center'
    const titleColor = s(st.color) || '#1f2937'
    const titleFont = s(st.fontFamily) ? `;font-family:${st.fontFamily}` : ''
    const titleSize = s(st.fontSize) ? `;font-size:${st.fontSize}` : ''
    return `<section style="margin:0 0 16px 0;padding:24px 16px;background:#f8fafc;text-align:${align};">
  <p style="margin:0 0 8px 0;font-weight:bold;color:${titleColor}${titleFont}${titleSize}">${p.title}</p>
  ${p.subtitle ? `<p style="margin:0 0 16px 0;color:#6b7280${titleFont}${titleSize}">${p.subtitle}</p>` : ''}
  <p style="margin:0;color:#9ca3af">
    ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
    ${p.showAuthor && p.author && p.showDate && p.date ? '&nbsp;&nbsp;' : ''}
    ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
  </p>
</section>`
  }

  function renderFooter(m: any): string {
    const p = m.props || {}
    const st = m.styles || {}
    let html = `<section style="margin:0 0 16px 0;text-align:${st.textAlign || 'center'};padding:16px">`
    if (p.showDivider) {
      html += `<p style="margin:0 0 16px 0;border-bottom:1px solid #e5e7eb;line-height:0;font-size:0">&nbsp;</p>`
    }
    const textColor = s(st.color) || '#6b7280'
    const textFont = s(st.fontFamily) ? `;font-family:${st.fontFamily}` : ''
    const textSize = s(st.fontSize) ? `;font-size:${st.fontSize}` : ''
    if (p.text) {
      html += `<p style="margin:0 0 8px 0;color:${textColor}${textFont}${textSize}">${p.text}</p>`
    }
    if (p.copyright) {
      html += `<p style="margin:0;color:#9ca3af${textFont}${textSize}">${p.copyright}</p>`
    }
    html += '</section>'
    return html
  }

  function renderToc(m: any): string {
    const p = m.props || {}
    const items = (p.items || []).map((item: any) => {
      const pad = (item.level || 0) * 16
      const bc = item.level === 0 ? '#3b82f6' : '#93c5fd'
      const fw = item.level === 0 ? 'bold' : 'normal'
      const c = item.level === 0 ? '#374151' : '#6b7280'
      return `<p style="margin:6px 0;padding-left:${pad}px">
  <span style="display:inline-block;width:6px;height:6px;background:${bc};margin-right:8px;vertical-align:middle"></span>
  <span style="font-weight:${fw};color:${c}">${item.text}</span>
</p>`
    }).join('')
    return `<section style="margin:0 0 16px 0;padding:16px;background:#f8fafc;border:1px solid #e5e7eb">
  <p style="font-weight:bold;color:#1f2937;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb">${p.title}</p>
  ${items}
</section>`
  }

  // Build all CSS and HTML
  let allCss = ''
  let allHtml = ''

  document.root.children?.forEach((child, i) => {
    allCss += moduleCSS(i, child) + '\n'
    allHtml += renderModule(i, child)
  })

  // Page-level styles
  const pageBg = document.pageStyles?.backgroundColor || '#ffffff'
  const pageTitleCss = s(document.pageStyles?.color) ? `color:${document.pageStyles.color}` : 'color:#333'
  const pageTitleFont = s(document.pageStyles?.fontFamily) ? `;font-family:${document.pageStyles.fontFamily}` : ''
  const fullHtml = `<html><head><style>
.page-wrap{max-width:640px;margin:0 auto;${pageTitleCss};background-color:${pageBg};padding:16px}
.page-title{font-weight:bold;color:#1f2937;margin:0 0 8px 0${pageTitleFont}}
.page-meta{color:#9ca3af;margin:0 0 20px 0;padding-bottom:16px;border-bottom:1px solid #eee${pageTitleFont}}
${allCss}</style></head><body><section class="page-wrap">
<section class="page-title">${document.title}</section>
<section class="page-meta">${document.updatedAt || document.createdAt || ''}</section>
${allHtml}
</section></body></html>`

  const inlined = juice(fullHtml)
  // Extract body content — juice preserves <body> tags
  const bodyMatch = inlined.match(/<body>([\s\S]*)<\/body>/i)
  return bodyMatch ? bodyMatch[1] : allHtml
}

export interface AIChatRequest {
  prompt: string
  module?: any       // 当前模块（模块编辑时传入，页面编辑时可为空）
  mode?: 'style' | 'full' | 'page'
}

export interface AIChatResponse {
  explanation: string
  updated_module: string
  updated_page_styles: string   // 页面样式 JSON（页面模式）
}

export interface AIConfigData {
  api_key: string
  api_base: string
  model: string
}

export const apiAI = {
  async chat(data: AIChatRequest): Promise<AIChatResponse> {
    const response = await request<{ data: AIChatResponse }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        prompt: data.prompt,
        module: data.module ? JSON.stringify(data.module) : '',
        mode: data.mode || 'full'
      })
    })
    return response.data
  },

  async getConfig(): Promise<AIConfigData> {
    const response = await request<{ data: AIConfigData }>('/ai/config', { method: 'GET' })
    return response.data
  },

  async updateConfig(data: AIConfigData): Promise<AIConfigData> {
    const response = await request<{ data: AIConfigData }>('/ai/config', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return response.data
  }
}

export default api
