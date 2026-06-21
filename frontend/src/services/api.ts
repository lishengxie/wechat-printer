import type { Document, Module, ModuleStyles } from '@/types/document'
import { createModule, createEmptyDocument } from '@/types/document'
import { renderModule } from '@/renderers'
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
  const pageBg = document.pageStyles?.backgroundColor || '#ffffff'

  const children = document.root.children || []
  const bodyHtml = children.map(child => renderModule(child)).join('')

  return `<section style="max-width:640px;margin:0 auto;background-color:${pageBg};padding:16px;color:#333">
  <section style="font-weight:bold;color:#1f2937;margin:0 0 8px 0">
    ${document.title}
  </section>
  <section style="color:#9ca3af;margin:0 0 20px 0;padding-bottom:16px;border-bottom:1px solid #eee">
    ${document.updatedAt || document.createdAt || ''}
  </section>
  ${bodyHtml}
</section>`
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
