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
  created_at: string
  updated_at: string
}

export interface Layout {
  id: string
  name: string
  description?: string
  document: Document
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
  layout_id: string
  author?: string
  summary?: string
  cover_image?: string
}

export interface ArticleUpdateInput {
  title?: string
  layout_id?: string
  author?: string
  summary?: string
  cover_image?: string
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
  const styles = `
    <style>
      .wechat-layout { max-width: 640px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .wechat-module { margin: 0 0 16px 0; }
      .wechat-text { font-size: 16px; line-height: 1.6; color: #333; }
      .wechat-image img { max-width: 100%; height: auto; display: block; }
      .wechat-divider { border: none; border-top: 2px solid #e5e7eb; margin: 16px 0; }
      .wechat-button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px; text-align: center; }
      .wechat-container { display: flex; gap: 16px; }
      .wechat-container.single { flex-direction: column; }
      .wechat-container.two-column > * { flex: 1; }
      .wechat-container.three-column > * { flex: 1; }
      .wechat-header { text-align: center; padding: 24px 16px; background: #f8fafc; border-radius: 8px; }
      .wechat-header h1 { font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0; }
      .wechat-header .subtitle { font-size: 15px; color: #6b7280; margin: 0 0 16px 0; }
      .wechat-footer { text-align: center; padding: 16px; font-size: 13px; color: #9ca3af; }
      .wechat-toc { padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb; }
      .wechat-toc h3 { font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
      .wechat-toc ul { list-style: none; padding: 0; margin: 0; }
      .wechat-toc li { display: flex; align-items: center; margin: 6px 0; }
      .wechat-toc .bullet { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 8px; }
    </style>
  `

  function renderModule(module: any): string {
    switch (module.type) {
      case 'text':
        return `<div class="wechat-module wechat-text" style="${getStyleString(module.styles)}">${module.props.content}</div>`
      case 'image':
        return `<div class="wechat-module wechat-image" style="${getStyleString(module.styles)}"><img src="${module.props.src}" alt="${module.props.alt}"></div>`
      case 'divider':
        return `<hr class="wechat-module wechat-divider" style="border-top-color: ${module.props.color || '#e5e7eb'}; border-top-style: ${module.props.style || 'solid'};">`
      case 'button':
        return `<div class="wechat-module" style="text-align: ${module.styles.textAlign || 'center'};"><a href="${module.props.link}" class="wechat-button">${module.props.text}</a></div>`
      case 'container':
        return `<div class="wechat-module wechat-container ${module.props.layout}" style="${getStyleString(module.styles)}">${module.children?.map((c: any) => renderModule(c)).join('') || ''}</div>`
      case 'header':
        return renderHeaderModule(module)
      case 'footer':
        return renderFooterModule(module)
      case 'toc':
        return renderTocModule(module)
      default:
        return ''
    }
  }

  function getStyleString(styles: any): string {
    return Object.entries(styles)
      .filter(([, value]) => value && value !== 'transparent')
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ')
  }

  function renderHeaderModule(module: any): string {
    const p = module.props
    const s = module.styles
    return `<div class="wechat-module wechat-header" style="${getStyleString(s)}; text-align: ${s.textAlign || 'center'};">
  <h1 style="font-size: ${s.fontSize || '24px'}; color: ${s.color || '#1f2937'}; font-weight: ${s.fontWeight || 'bold'}; margin: 0 0 8px 0; line-height: 1.4;">${p.title}</h1>
  ${p.subtitle ? `<p style="font-size: 15px; color: #6b7280; margin: 0 0 16px 0; line-height: 1.6;">${p.subtitle}</p>` : ''}
  <div style="font-size: 13px; color: #9ca3af; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
    ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
    ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
  </div>
</div>`
  }

  function renderFooterModule(module: any): string {
    const p = module.props
    const s = module.styles
    return `<div class="wechat-module wechat-footer" style="${getStyleString(s)}; text-align: ${s.textAlign || 'center'};">
  ${p.showDivider ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 16px 0;" />` : ''}
  ${p.text ? `<p style="font-size: ${s.fontSize || '13px'}; color: ${s.color || '#6b7280'}; margin: 0 0 8px 0; line-height: 1.6;">${p.text}</p>` : ''}
  ${p.copyright ? `<p style="font-size: 12px; color: #9ca3af; margin: 0;">${p.copyright}</p>` : ''}
</div>`
  }

  function renderTocModule(module: any): string {
    const p = module.props
    const items = p.items.map((item: any) => `
      <li style="display: flex; align-items: center; margin: 6px 0; padding-left: ${item.level * 16}px;">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${item.level === 0 ? '#3b82f6' : '#93c5fd'}; margin-right: 8px;"></span>
        <span style="font-size: ${item.level === 0 ? '14px' : '13px'}; font-weight: ${item.level === 0 ? '500' : 'normal'}; color: ${item.level === 0 ? '#374151' : '#6b7280'}; line-height: 1.5;">${item.text}</span>
      </li>`
    ).join('')

    return `<div class="wechat-module wechat-toc" style="${getStyleString(module.styles)}">
  <h3>${p.title}</h3>
  <ul>${items}</ul>
</div>`
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title}</title>
  ${styles}
</head>
<body>
  <div class="wechat-layout">
    <h1>${document.title}</h1>
    <p style="color: #666; font-size: 14px;">创建时间: ${document.createdAt}</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <div class="wechat-content">${document.root.children?.map((child: any) => renderModule(child)).join('') || ''}</div>
  </div>
</body>
</html>`
}

export default api
