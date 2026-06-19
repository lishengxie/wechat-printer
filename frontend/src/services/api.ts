import type { Document } from '@/types/document'

// 后端返回的 Layout 结构
export interface BackendLayout {
  id: string
  name: string
  description: string
  content: string  // JSON 字符串
  css: string
  html: string
  created_at: string
  updated_at: string
}

// 前端使用的 Layout 结构
export interface Layout {
  id: string
  name: string
  description?: string
  document: Document
  createdAt: string
  updatedAt: string
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

export interface ExportHTMLResponse {
  html: string
  success: boolean
}

// API 基础配置
const API_BASE = '/api'

// request 函数封装 fetch
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json'
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, config)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// 将后端 Layout 转换为前端 Layout
function backendToFrontend(backend: BackendLayout): Layout {
  let document: Document
  try {
    document = JSON.parse(backend.content)
  } catch {
    // 如果解析失败，创建一个空文档
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

// 提取响应中的 data 字段
function extractData<T>(response: { data: T }): T {
  return response.data
}

// API 对象
export const api = {
  // 获取排版列表
  async listLayouts(): Promise<Layout[]> {
    const response = await request<{ data: BackendLayout[] }>('/layouts', {
      method: 'GET'
    })
    return response.data.map(backendToFrontend)
  },

  // 获取单个排版
  async getLayout(id: string): Promise<Layout> {
    const response = await request<{ data: BackendLayout }>(`/layouts/${id}`, {
      method: 'GET'
    })
    return backendToFrontend(response.data)
  },

  // 创建排版
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

  // 更新排版
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

  // 删除排版
  async deleteLayout(id: string): Promise<void> {
    return request<void>(`/layouts/${id}`, {
      method: 'DELETE'
    })
  },

  // 通过布局 ID 导出 HTML（后端生成）
  async exportHTMLByLayoutId(layoutId: string): Promise<ExportHTMLResponse> {
    const response = await request<{ data: { html: string } }>(`/layouts/${layoutId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ include_wrap: true })
    })
    return {
      html: response.data.html,
      success: true
    }
  },

  // 导出 HTML（前端生成）
  async exportHTML(document: Document): Promise<ExportHTMLResponse> {
    const html = generateHTMLFromDocument(document)
    return Promise.resolve({ html, success: true })
  }
}

// Mock API (用于开发) - 当后端未就绪时使用
export const mockApi = {
  layouts: [] as Layout[],

  async listLayouts(): Promise<Layout[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.layouts), 100)
    })
  },

  async getLayout(id: string): Promise<Layout> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const layout = this.layouts.find(l => l.id === id)
        layout ? resolve(layout) : reject(new Error('Layout not found'))
      }, 100)
    })
  },

  async createLayout(data: LayoutCreateInput): Promise<Layout> {
    return new Promise(resolve => {
      const now = new Date().toISOString()
      const newLayout: Layout = {
        id: 'layout_' + Date.now().toString(36),
        name: data.name,
        description: data.description,
        document: data.document,
        createdAt: now,
        updatedAt: now
      }
      this.layouts.push(newLayout)
      setTimeout(() => resolve(newLayout), 100)
    })
  },

  async updateLayout(id: string, data: LayoutUpdateInput): Promise<Layout> {
    return new Promise((resolve, reject) => {
      const index = this.layouts.findIndex(l => l.id === id)
      if (index === -1) {
        reject(new Error('Layout not found'))
        return
      }
      this.layouts[index] = {
        ...this.layouts[index],
        ...data,
        updatedAt: new Date().toISOString()
      }
      setTimeout(() => resolve(this.layouts[index]), 100)
    })
  },

  async deleteLayout(id: string): Promise<void> {
    return new Promise(resolve => {
      this.layouts = this.layouts.filter(l => l.id !== id)
      setTimeout(resolve, 100)
    })
  },

  async exportHTML(document: Document): Promise<ExportHTMLResponse> {
    return new Promise(resolve => {
      const html = generateHTMLFromDocument(document)
      setTimeout(() => resolve({ html, success: true }), 100)
    })
  }
}

// 简单的 HTML 生成器
function generateHTMLFromDocument(document: Document): string {
  const styles = `
    <style>
      .wechat-layout {
        max-width: 640px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .wechat-module {
        margin: 0 0 16px 0;
      }
      .wechat-text {
        font-size: 16px;
        line-height: 1.6;
        color: #333;
      }
      .wechat-image img {
        max-width: 100%;
        height: auto;
        display: block;
      }
      .wechat-divider {
        border: none;
        border-top: 2px solid #e5e7eb;
        margin: 16px 0;
      }
      .wechat-button {
        display: inline-block;
        padding: 12px 24px;
        background: #3b82f6;
        color: #fff;
        text-decoration: none;
        border-radius: 8px;
        text-align: center;
      }
      .wechat-container {
        display: flex;
        gap: 16px;
      }
      .wechat-container.single {
        flex-direction: column;
      }
      .wechat-container.two-column > * {
        flex: 1;
      }
      .wechat-container.three-column > * {
        flex: 1;
      }
      .wechat-header {
        text-align: center;
        padding: 24px 16px;
        background: #f8fafc;
        border-radius: 8px;
      }
      .wechat-header h1 {
        font-size: 24px;
        font-weight: bold;
        color: #1f2937;
        margin: 0 0 8px 0;
      }
      .wechat-header .subtitle {
        font-size: 15px;
        color: #6b7280;
        margin: 0 0 16px 0;
      }
      .wechat-header .meta {
        font-size: 13px;
        color: #9ca3af;
      }
      .wechat-footer {
        text-align: center;
        padding: 16px;
        font-size: 13px;
        color: #9ca3af;
      }
      .wechat-footer .copyright {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 8px;
      }
      .wechat-toc {
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }
      .wechat-toc h3 {
        font-size: 16px;
        font-weight: bold;
        color: #1f2937;
        margin: 0 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid #e5e7eb;
      }
      .wechat-toc ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .wechat-toc li {
        display: flex;
        align-items: center;
        margin: 6px 0;
      }
      .wechat-toc .bullet {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 8px;
      }
    </style>
  `

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
    <!-- 内容区域 -->
    <div class="wechat-content">
      ${document.root.children?.map(child => renderModule(child)).join('') || ''}
    </div>
  </div>
</body>
</html>
  `
}

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
  const variant = p.variant || 'default'
  const baseStyle = getStyleString(s)

  if (variant === 'magazine') {
    return `<div class="wechat-module" style="${baseStyle}; text-align: ${s.textAlign || 'center'}; padding: 24px 16px;">
  <div style="width: 40px; height: 4px; background: #dc2626; border-radius: 2px; margin: 0 auto 16px auto;"></div>
  ${p.subtitle ? `<p style="font-size: 13px; color: #dc2626; font-weight: 500; letter-spacing: 2px; margin: 0 0 8px 0;">${p.subtitle}</p>` : ''}
  <h1 style="font-size: 28px; font-weight: 800; line-height: 1.3; color: ${s.color || '#1f2937'}; margin: 0; letter-spacing: -0.5px;">${p.title}</h1>
  <div style="width: 60px; height: 3px; background: #e5e7eb; border-radius: 2px; margin: 16px auto 12px auto;"></div>
  <div style="font-size: 13px; color: #9ca3af; display: flex; justify-content: center; gap: 16px;">
    ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
    ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
  </div>
</div>`
  }

  if (variant === 'minimal') {
    return `<div class="wechat-module" style="${baseStyle}; text-align: ${s.textAlign || 'left'}; padding: 16px 0;">
  <h1 style="font-size: 26px; font-weight: 700; line-height: 1.35; color: ${s.color || '#111827'}; margin: 0 0 12px 0; letter-spacing: -0.3px;">${p.title}</h1>
  <div style="font-size: 13px; color: #9ca3af; display: flex; gap: 16px;">
    ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
    ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
  </div>
</div>`
  }

  if (variant === 'card') {
    return `<div class="wechat-module" style="${baseStyle}; text-align: ${s.textAlign || 'center'};">
  <div style="padding: 32px 24px; background: ${s.backgroundColor || '#1f2937'}; border-radius: 12px;">
    <h1 style="font-size: 24px; font-weight: 700; line-height: 1.4; color: ${s.color || '#ffffff'}; margin: 0 0 8px 0;">${p.title}</h1>
    ${p.subtitle ? `<p style="font-size: 14px; color: rgba(255,255,255,0.75); margin: 0 0 16px 0; line-height: 1.5;">${p.subtitle}</p>` : ''}
    <div style="font-size: 12px; color: rgba(255,255,255,0.55); display: flex; justify-content: center; gap: 16px;">
      ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
      ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
    </div>
  </div>
</div>`
  }

  // default
  return `<div class="wechat-module wechat-header" style="${baseStyle}; text-align: ${s.textAlign || 'center'};">
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
  const variant = p.variant || 'default'
  const baseStyle = getStyleString(s)

  if (variant === 'simple') {
    return `<div class="wechat-module" style="${baseStyle}; text-align: ${s.textAlign || 'center'}; padding: 8px 0;">
  <div style="width: 40px; height: 2px; background: #d1d5db; border-radius: 1px; margin: 0 auto 12px auto;"></div>
  ${p.copyright ? `<p style="font-size: 12px; color: #9ca3af; margin: 0;">${p.copyright}</p>` : ''}
</div>`
  }

  if (variant === 'branded') {
    return `<div class="wechat-module" style="${baseStyle}; text-align: ${s.textAlign || 'center'};">
  <div style="padding: 24px; background: ${s.backgroundColor || '#f8fafc'}; border-radius: 12px;">
    <div style="font-size: 28px; margin-bottom: 12px;">📰</div>
    ${p.text ? `<p style="font-size: 14px; color: #4b5563; margin: 0 0 8px 0; line-height: 1.6;">${p.text}</p>` : ''}
    ${p.copyright ? `<p style="font-size: 12px; color: #9ca3af; margin: 0 0 16px 0;">${p.copyright}</p>` : ''}
    <div style="display: flex; justify-content: center; gap: 8px;">
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #d1d5db;"></span>
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #d1d5db;"></span>
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #d1d5db;"></span>
    </div>
  </div>
</div>`
  }

  if (variant === 'cta') {
    return `<div class="wechat-module" style="${baseStyle}; text-align: ${s.textAlign || 'center'};">
  <div style="padding: 24px; background: ${s.backgroundColor || '#fef2f2'}; border-radius: 12px; border: 1px dashed #fecaca;">
    ${p.text ? `<p style="font-size: 15px; font-weight: 500; color: ${s.color || '#991b1b'}; margin: 0 0 16px 0; line-height: 1.6;">${p.text}</p>` : ''}
    <div style="display: inline-block; padding: 10px 24px; font-size: 14px; color: #ffffff; background: #dc2626; border-radius: 24px; margin-bottom: 16px;">👍 点赞 · 💬 留言 · ⭐ 收藏</div>
    ${p.copyright ? `<p style="font-size: 12px; color: #9ca3af; margin: 0;">${p.copyright}</p>` : ''}
  </div>
</div>`
  }

  // default
  return `<div class="wechat-module wechat-footer" style="${baseStyle}; text-align: ${s.textAlign || 'center'};">
  ${p.showDivider ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 16px 0;" />` : ''}
  ${p.text ? `<p style="font-size: ${s.fontSize || '13px'}; color: ${s.color || '#6b7280'}; margin: 0 0 8px 0; line-height: 1.6;">${p.text}</p>` : ''}
  ${p.copyright ? `<p style="font-size: 12px; color: #9ca3af; margin: 0;">${p.copyright}</p>` : ''}
</div>`
}

function renderTocModule(module: any): string {
  const p = module.props
  const s = module.styles
  const variant = p.variant || 'default'
  const baseStyle = getStyleString(s)

  if (variant === 'numbered') {
    const items = p.items.map((item: any, index: number) => {
      const isLevel0 = item.level === 0
      return `<li style="margin: 8px 0; display: flex; align-items: baseline; gap: 8px; padding-left: ${item.level * 20}px; font-size: ${isLevel0 ? '14px' : '13px'}; font-weight: ${isLevel0 ? '500' : 'normal'}; color: ${isLevel0 ? '#374151' : '#6b7280'};">
        <span style="font-size: 11px; font-weight: 600; color: ${isLevel0 ? '#3b82f6' : '#d1d5db'}; min-width: 22px;">${String(index + 1).padStart(2, '0')}</span>
        <span>${item.text}</span>
      </li>`
    }).join('')
    return `<div class="wechat-module" style="${baseStyle}">
  <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">
    <span style="font-size: 18px;">📑</span> ${p.title}
  </h3>
  <ol style="list-style: none; padding: 0; margin: 0; counter-reset: toc;">${items}</ol>
</div>`
  }

  if (variant === 'card') {
    const items = p.items.map((item: any, index: number) => {
      const isActive = index === 0
      return `<li style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; padding-left: ${item.level * 16}px; font-size: 13px; color: #4b5563;">
        <span style="font-size: 11px; font-weight: 600; color: ${isActive ? '#3b82f6' : '#d1d5db'}; min-width: 22px;">${String(index + 1).padStart(2, '0')}</span>
        <span>${item.text}</span>
      </li>`
    }).join('')
    return `<div class="wechat-module" style="${baseStyle}">
  <div style="padding: 20px; background: ${s.backgroundColor || '#ffffff'}; border-radius: 10px; border: ${s.border || '1px solid #e5e7eb'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <h3 style="font-size: 15px; font-weight: 600; color: #1f2937; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">
      <span style="display: inline-block; width: 4px; height: 16px; background: #3b82f6; border-radius: 2px;"></span>
      ${p.title}
    </h3>
    <ul style="list-style: none; padding: 0; margin: 0;">${items}</ul>
  </div>
</div>`
  }

  if (variant === 'minimal') {
    const items = p.items.map((item: any) => `<li style="display: flex; align-items: center; gap: 8px; padding: 5px 0; padding-left: ${item.level * 12}px; font-size: 13px; color: #6b7280;">
      <span style="display: inline-block; width: 12px; height: 1px; background: #d1d5db; flex-shrink: 0;"></span>
      <span style="line-height: 1.5;">${item.text}</span>
    </li>`
    ).join('')
    return `<div class="wechat-module" style="${baseStyle}">
  <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 10px 0; letter-spacing: 1px;">${p.title}</h3>
  <ul style="list-style: none; padding: 0; margin: 0;">${items}</ul>
</div>`
  }

  // default
  const items = p.items.map((item: any) => `
    <li style="display: flex; align-items: center; margin: 6px 0; padding-left: ${item.level * 16}px;">
      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${item.level === 0 ? '#3b82f6' : '#93c5fd'}; margin-right: 8px;"></span>
      <span style="font-size: ${item.level === 0 ? '14px' : '13px'}; font-weight: ${item.level === 0 ? '500' : 'normal'}; color: ${item.level === 0 ? '#374151' : '#6b7280'}; line-height: 1.5;">${item.text}</span>
    </li>`
  ).join('')

  return `<div class="wechat-module wechat-toc" style="${baseStyle}">
  <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">${p.title}</h3>
  <ul style="list-style: none; padding: 0; margin: 0;">${items}</ul>
</div>`
}

// 默认导出使用真实 api
export default api
