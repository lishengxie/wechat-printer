import type { Document } from '@/types/document'
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
  document: Document
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
  document: Document
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

function backendToFrontend(backend: BackendLayout): Layout {
  let document: Document
  try {
    document = JSON.parse(backend.content)
  } catch {
    document = {
      id: backend.id,
      title: backend.name,
      createdAt: backend.created_at,
      updatedAt: backend.updated_at,
      root: {
        id: 'root',
        type: 'container' as const,
        props: { layout: 'single' as const },
        children: [],
        styles: {}
      }
    }
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
        content: JSON.stringify(data.document),
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
  // Only uses supported tags: section, p, span, strong, img
  // Only uses supported inline styles: color, text-align, background-color,
  // font-size, font-weight, margin, padding, border-bottom, display (inline-block),
  // vertical-align, width

  function getInlineStyle(styles: any): string {
    return Object.entries(styles)
      .filter(([, value]) => value && value !== 'transparent')
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ')
  }

  function renderModule(module: any): string {
    const baseStyle = 'margin: 0 0 16px 0;' + getInlineStyle(module.styles)
    switch (module.type) {
      case 'text': {
        const iconHtml = module.props.icon
          ? `<p style="margin: 0 0 4px 0; font-size: 20px; line-height: 1;">${module.props.icon}</p>`
          : ''
        return `<section style="${baseStyle}">${iconHtml}<p style="margin: 0;">${module.props.content}</p></section>`
      }
      case 'image': {
        const img = `<section style="${baseStyle}text-align: center;"><img src="${module.props.src}" alt="${module.props.alt || ''}" style="max-width: 100%; height: auto;" /></section>`
        const caption = module.props.caption
          ? `<p style="margin: 8px 0 0 0; font-size: ${module.props.captionStyle?.fontSize || '13px'}; color: ${module.props.captionStyle?.color || '#9ca3af'}; font-style: ${module.props.captionStyle?.italic ? 'italic' : 'normal'}; text-align: ${module.props.captionStyle?.textAlign || 'center'};">${module.props.caption}</p>`
          : ''
        return img + caption
      }
      case 'divider':
        return `<section style="${baseStyle}text-align: center;"><p style="margin: 0; border-bottom: 2px solid ${module.props.color || '#e5e7eb'}; line-height: 0; font-size: 0;">&nbsp;</p></section>`
      case 'button':
        return `<section style="${baseStyle}text-align: ${module.styles.textAlign || 'center'};"><span style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: #ffffff;">${module.props.text}</span></section>`
      case 'container':
        return renderContainer(module, baseStyle)
      case 'header':
        return renderHeader(module)
      case 'footer':
        return renderFooter(module)
      case 'toc':
        return renderToc(module)
      case 'quote': {
        const iconHtml = module.props.icon
          ? `<p style="margin: 0 0 4px 0; font-size: 20px; line-height: 1;">${module.props.icon}</p>`
          : ''
        const authorHtml = module.props.author
          ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #9ca3af; text-align: right;">—— ${module.props.author}</p>`
          : ''
        return `<section style="${baseStyle}">${iconHtml}<p style="margin: 0; font-style: italic;">${module.props.content}</p>${authorHtml}</section>`
      }
      default:
        return ''
    }
  }

  function renderContainer(module: any, baseStyle: string): string {
    const layout = module.props.layout || 'single'
    const children = module.children?.map((c: any) => renderModule(c)).join('') || ''
    if (layout === 'single') {
      return `<section style="${baseStyle}">${children}</section>`
    }
    const colCount = layout === 'three-column' ? 3 : 2
    const childrenArr = module.children || []
    const cols = childrenArr.map((child: any) => {
      const html = renderModule(child)
      return `<td style="vertical-align: top; padding: 0 8px; width: ${100 / colCount}%;">${html}</td>`
    }).join('')
    return `<section style="${baseStyle}"><table style="width: 100%;"><tr>${cols}</tr></table></section>`
  }

  function renderHeader(module: any): string {
    const p = module.props
    const s = module.styles
    const align = s.textAlign || 'center'
    return `<section style="margin: 0 0 16px 0; padding: 24px 16px; background: #f8fafc; text-align: ${align};">
  <p style="color: ${s.color || '#1f2937'}; font-weight: bold; margin: 0 0 8px 0;">${p.title}</p>
  ${p.subtitle ? `<p style="color: #6b7280; margin: 0 0 16px 0;">${p.subtitle}</p>` : ''}
  <p style="color: #9ca3af; margin: 0;">
    ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
    ${p.showAuthor && p.author && p.showDate && p.date ? '&nbsp;&nbsp;' : ''}
    ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
  </p>
</section>`
  }

  function renderFooter(module: any): string {
    const p = module.props
    const s = module.styles
    let html = `<section style="margin: 0 0 16px 0; text-align: ${s.textAlign || 'center'}; padding: 16px;">`
    if (p.showDivider) {
      html += `<p style="margin: 0 0 16px 0; border-bottom: 1px solid #e5e7eb; line-height: 0; font-size: 0;">&nbsp;</p>`
    }
    if (p.text) {
      html += `<p style="color: ${s.color || '#6b7280'}; margin: 0 0 8px 0;">${p.text}</p>`
    }
    if (p.copyright) {
      html += `<p style="color: #9ca3af; margin: 0;">${p.copyright}</p>`
    }
    html += '</section>'
    return html
  }

  function renderToc(module: any): string {
    const p = module.props
    const items = (p.items || []).map((item: any) => {
      const pad = (item.level || 0) * 16
      const bulletColor = item.level === 0 ? '#3b82f6' : '#93c5fd'
      const fw = item.level === 0 ? 'bold' : 'normal'
      const color = item.level === 0 ? '#374151' : '#6b7280'
      return `<p style="margin: 6px 0; padding-left: ${pad}px;">
  <span style="display: inline-block; width: 6px; height: 6px; background: ${bulletColor}; margin-right: 8px; vertical-align: middle;"></span>
  <span style="font-weight: ${fw}; color: ${color};">${item.text}</span>
</p>`
    }).join('')
    return `<section style="margin: 0 0 16px 0; padding: 16px; background: #f8fafc; border: 1px solid #e5e7eb;">
  <p style="font-weight: bold; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">${p.title}</p>
  ${items}
</section>`
  }

  const bodyHtml = document.root.children?.map((child: any) => renderModule(child)).join('') || ''
  return `<section style="max-width: 640px; margin: 0 auto; color: #333;">
  <p style="font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">${document.title}</p>
  <p style="color: #9ca3af; margin: 0 0 20px 0; padding-bottom: 16px; border-bottom: 1px solid #eee;">${document.updatedAt || document.createdAt || ''}</p>
  ${bodyHtml}
</section>`
}

export interface AIChatRequest {
  prompt: string
  module: any
  mode?: 'style' | 'full'
}

export interface AIChatResponse {
  explanation: string
  updated_module: string
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
        module: JSON.stringify(data.module),
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
