export type ModuleType = 'container' | 'text' | 'image' | 'divider' | 'button' | 'header' | 'footer' | 'toc' | 'heading' | 'quote'

export interface ModuleStyles {
  margin?: string
  padding?: string
  backgroundColor?: string
  border?: string
  borderLeft?: string
  borderRadius?: string
  textAlign?: 'left' | 'center' | 'right'
  fontSize?: string
  color?: string
  fontWeight?: string
  fontStyle?: string
  lineHeight?: string
  fontFamily?: string
}

export interface ContainerModuleProps {
  layout: 'single' | 'two-column' | 'three-column'
}

export interface TextModuleProps {
  content: string
  icon?: string
}

export interface ImageModuleProps {
  src: string
  alt: string
  width?: string
  height?: string
  caption?: string
  captionStyle?: {
    fontSize?: string
    color?: string
    italic?: boolean
    textAlign?: 'left' | 'center' | 'right'
  }
}

export interface DividerModuleProps {
  style: 'solid' | 'dashed' | 'dotted'
  color: string
}

export interface ButtonModuleProps {
  text: string
  link: string
  size: 'small' | 'medium' | 'large'
}

export type HeaderVariant = 'default' | 'magazine' | 'minimal' | 'card'

export interface HeaderModuleProps {
  title: string
  subtitle: string
  author: string
  date: string
  showDate: boolean
  showAuthor: boolean
  variant: HeaderVariant
}

export type FooterVariant = 'default' | 'simple' | 'branded' | 'cta'

export interface FooterModuleProps {
  text: string
  copyright: string
  showDivider: boolean
  variant: FooterVariant
}

export interface TocItem {
  text: string
  level: number
}

export type TocVariant = 'default' | 'numbered' | 'card' | 'minimal'

export interface TocModuleProps {
  title: string
  items: TocItem[]
  variant: TocVariant
}

export type HeadingVariant = 'numbered' | 'left-bar' | 'center' | 'simple'

export interface HeadingModuleProps {
  text: string
  level: number
  variant: HeadingVariant
  showNumbering: boolean
}

export interface QuoteModuleProps {
  content: string
  author?: string
}

export type ModuleSpecificProps =
  | ContainerModuleProps
  | TextModuleProps
  | ImageModuleProps
  | DividerModuleProps
  | ButtonModuleProps
  | HeaderModuleProps
  | FooterModuleProps
  | TocModuleProps
  | HeadingModuleProps
  | QuoteModuleProps

export interface Module {
  id: string
  type: ModuleType
  props: ModuleSpecificProps
  children?: Module[]
  styles: ModuleStyles
}

export interface Document {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  root: Module
}

// Type guards
export function isContainerModule(module: Module): boolean {
  return module.type === 'container'
}

export function canHaveChildren(moduleType: ModuleType): boolean {
  return moduleType === 'container'
}

// Helper to generate unique IDs
export function generateId(): string {
  return 'module_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9)
}

// Default styles
export function getDefaultStyles(): ModuleStyles {
  return {
    margin: '0 0 16px 0',
    padding: '0',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0',
    textAlign: 'left',
    fontSize: '16px',
    color: '#333333',
    fontWeight: 'normal',
    fontStyle: 'normal',
    lineHeight: '1.6'
  }
}

// Create new module factory
export function createModule(type: 'text'): Module & { props: TextModuleProps }
export function createModule(type: 'image'): Module & { props: ImageModuleProps }
export function createModule(type: 'divider'): Module & { props: DividerModuleProps }
export function createModule(type: 'button'): Module & { props: ButtonModuleProps }
export function createModule(type: 'container'): Module & { props: ContainerModuleProps; children: Module[] }
export function createModule(type: 'header'): Module & { props: HeaderModuleProps }
export function createModule(type: 'footer'): Module & { props: FooterModuleProps }
export function createModule(type: 'toc'): Module & { props: TocModuleProps }
export function createModule(type: 'heading'): Module & { props: HeadingModuleProps }
export function createModule(type: 'quote'): Module & { props: QuoteModuleProps }
export function createModule(type: ModuleType): Module {
  const id = generateId()

  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        props: { content: '点击编辑文字', icon: '' } as TextModuleProps,
        styles: getDefaultStyles()
      }
    case 'image':
      return {
        id,
        type: 'image',
        props: { src: '', alt: '图片', caption: '', captionStyle: { fontSize: '13px', color: '#9ca3af', italic: false, textAlign: 'center' } } as ImageModuleProps,
        styles: getDefaultStyles()
      }
    case 'divider':
      return {
        id,
        type: 'divider',
        props: { style: 'solid' as const, color: '#e5e7eb' } as DividerModuleProps,
        styles: { ...getDefaultStyles(), margin: '16px 0' }
      }
    case 'button':
      return {
        id,
        type: 'button',
        props: { text: '按钮文字', link: '', size: 'medium' as const } as ButtonModuleProps,
        styles: { ...getDefaultStyles(), textAlign: 'center' }
      }
    case 'container':
      return {
        id,
        type: 'container',
        props: { layout: 'two-column' as const } as ContainerModuleProps,
        children: [],
        styles: getDefaultStyles()
      }
    case 'header':
      return {
        id,
        type: 'header',
        props: {
          title: '文章标题',
          subtitle: '副标题或摘要描述',
          author: '作者名称',
          date: new Date().toISOString().split('T')[0],
          showDate: true,
          showAuthor: true,
          variant: 'default'
        } as HeaderModuleProps,
        styles: {
          ...getDefaultStyles(),
          textAlign: 'center',
          padding: '24px 16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }
      }
    case 'footer':
      return {
        id,
        type: 'footer',
        props: {
          text: '感谢您的阅读，如果对你有帮助，欢迎点赞、在看、转发',
          copyright: '© 2024 版权所有',
          showDivider: true,
          variant: 'default'
        } as FooterModuleProps,
        styles: {
          ...getDefaultStyles(),
          textAlign: 'center',
          padding: '16px',
          fontSize: '13px',
          color: '#9ca3af'
        }
      }
    case 'toc':
      return {
        id,
        type: 'toc',
        props: {
          title: '文章目录',
          items: [
            { text: '第一章：引言', level: 0 },
            { text: '1.1 背景介绍', level: 1 },
            { text: '1.2 核心观点', level: 1 },
            { text: '第二章：详细分析', level: 0 },
            { text: '2.1 方法一', level: 1 },
            { text: '2.2 方法二', level: 1 },
            { text: '第三章：总结', level: 0 }
          ],
          variant: 'default'
        } as TocModuleProps,
        styles: {
          ...getDefaultStyles(),
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }
      }
    case 'heading':
      return {
        id,
        type: 'heading',
        props: {
          text: '章节标题',
          level: 1,
          variant: 'numbered',
          showNumbering: true
        } as HeadingModuleProps,
        styles: {
          ...getDefaultStyles(),
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#111827',
          padding: '12px 0',
          margin: '24px 0 16px 0',
          lineHeight: '1.4'
        }
      }
    case 'quote':
      return {
        id,
        type: 'quote',
        props: {
          content: '这是一段引用文字',
          author: ''
        } as QuoteModuleProps,
        styles: {
          ...getDefaultStyles(),
          padding: '16px 20px',
          backgroundColor: '#f8fafc',
          borderLeft: '4px solid #3b82f6',
          borderRadius: '0 8px 8px 0',
          fontStyle: 'italic',
          margin: '0 0 16px 0'
        }
      }
    default:
      throw new Error(`Unknown module type: ${type}`)
  }
}

// Create empty document
export function createEmptyDocument(title: string = '未命名排版'): Document {
  const root = createModule('container')
  root.props.layout = 'single'
  return {
    id: generateId(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    root
  }
}
