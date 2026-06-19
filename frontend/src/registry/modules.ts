import type { Component } from 'vue'
import type { ModuleType, ModuleStyles } from '@/types/document'

export interface ModuleVariant {
  name: string
  variant: string
  description: string
  icon: string
}

export interface ModuleRegistration {
  type: ModuleType
  name: string
  group: string
  icon: string
  description: string
  component: () => Promise<{ default: Component }>
  propertyPanel: () => Promise<{ default: Component }>
  defaultProps: Record<string, any>
  defaultStyles: ModuleStyles
  variants?: ModuleVariant[]
}

export const moduleRegistry: Record<ModuleType, ModuleRegistration> = {
  text: {
    type: 'text',
    name: '文字',
    group: '基础组件',
    icon: '📝',
    description: '添加文本内容，支持富文本编辑',
    component: () => import('@/components/modules/TextModule.vue'),
    propertyPanel: () => import('@/components/property-editors/TextProperty.vue'),
    defaultProps: { content: '点击编辑文字', icon: '' },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  image: {
    type: 'image',
    name: '图片',
    group: '基础组件',
    icon: '🖼️',
    description: '上传并展示图片内容',
    component: () => import('@/components/modules/ImageModule.vue'),
    propertyPanel: () => import('@/components/property-editors/ImageProperty.vue'),
    defaultProps: { src: '', alt: '图片', caption: '', captionStyle: { fontSize: '13px', color: '#9ca3af', italic: false, textAlign: 'center' } },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  divider: {
    type: 'divider',
    name: '分割线',
    group: '基础组件',
    icon: '➖',
    description: '添加水平分割线分隔内容',
    component: () => import('@/components/modules/DividerModule.vue'),
    propertyPanel: () => import('@/components/property-editors/DividerProperty.vue'),
    defaultProps: { style: 'solid', color: '#e5e7eb' },
    defaultStyles: {
      margin: '16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  button: {
    type: 'button',
    name: '按钮',
    group: '基础组件',
    icon: '🔘',
    description: '添加可点击的按钮组件',
    component: () => import('@/components/modules/ButtonModule.vue'),
    propertyPanel: () => import('@/components/property-editors/ButtonProperty.vue'),
    defaultProps: { text: '按钮文字', link: '', size: 'medium' },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'center', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  container: {
    type: 'container',
    name: '容器',
    group: '基础组件',
    icon: '📦',
    description: '添加容器用于包裹其他组件',
    component: () => import('@/components/modules/ContainerModule.vue'),
    propertyPanel: () => import('@/components/property-editors/ContainerProperty.vue'),
    defaultProps: { layout: 'two-column' },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  header: {
    type: 'header',
    name: '页首',
    group: '页首',
    icon: '📰',
    description: '页首预设模块',
    component: () => import('@/components/modules/HeaderModule.vue'),
    propertyPanel: () => import('@/components/property-editors/HeaderProperty.vue'),
    defaultProps: {
      title: '文章标题', subtitle: '副标题或摘要描述', author: '作者名称',
      date: new Date().toISOString().split('T')[0],
      showDate: true, showAuthor: true, variant: 'default'
    },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '24px 16px', backgroundColor: '#f8fafc',
      border: 'none', borderRadius: '8px', textAlign: 'center', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    },
    variants: [
      { name: '页首 · 经典', variant: 'default', description: '居中对齐的标题、副标题和元信息', icon: '📰' },
      { name: '页首 · 杂志', variant: 'magazine', description: '大字标题配红色装饰线，杂志封面感', icon: '🗞️' },
      { name: '页首 · 极简', variant: 'minimal', description: '左对齐无装饰，干净利落', icon: '📄' },
      { name: '页首 · 卡片', variant: 'card', description: '深色背景卡片，视觉冲击力强', icon: '🎴' }
    ]
  },
  footer: {
    type: 'footer',
    name: '页尾',
    group: '页尾',
    icon: '🏁',
    description: '页尾预设模块',
    component: () => import('@/components/modules/FooterModule.vue'),
    propertyPanel: () => import('@/components/property-editors/FooterProperty.vue'),
    defaultProps: {
      text: '感谢您的阅读，如果对你有帮助，欢迎点赞、在看、转发',
      copyright: '© 2024 版权所有', showDivider: true, variant: 'default'
    },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '16px', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'center', fontSize: '13px',
      color: '#9ca3af', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    },
    variants: [
      { name: '页尾 · 经典', variant: 'default', description: '分割线加感谢语和版权信息', icon: '🏁' },
      { name: '页尾 · 简约', variant: 'simple', description: '仅保留版权和简洁分隔线', icon: '📍' },
      { name: '页尾 · 品牌', variant: 'branded', description: 'Logo、社交点和品牌感设计', icon: '🏢' },
      { name: '页尾 · 互动', variant: 'cta', description: '引导点赞留言收藏的CTA设计', icon: '👍' }
    ]
  },
  toc: {
    type: 'toc',
    name: '目录',
    group: '目录',
    icon: '📑',
    description: '目录预设模块',
    component: () => import('@/components/modules/TocModule.vue'),
    propertyPanel: () => import('@/components/property-editors/TocProperty.vue'),
    defaultProps: {
      title: '文章目录',
      items: [
        { text: '第一章：引言', level: 0 }, { text: '1.1 背景介绍', level: 1 },
        { text: '1.2 核心观点', level: 1 }, { text: '第二章：详细分析', level: 0 },
        { text: '2.1 方法一', level: 1 }, { text: '2.2 方法二', level: 1 },
        { text: '第三章：总结', level: 0 }
      ],
      variant: 'default'
    },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '16px', backgroundColor: '#f8fafc',
      border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    },
    variants: [
      { name: '目录 · 经典', variant: 'default', description: '带圆点层级缩进的目录列表', icon: '📑' },
      { name: '目录 · 编号', variant: 'numbered', description: '自动编号的有序目录列表', icon: '🔢' },
      { name: '目录 · 卡片', variant: 'card', description: '卡片容器包裹，带序号高亮', icon: '🃏' },
      { name: '目录 · 极简', variant: 'minimal', description: '细线分隔的极简目录', icon: '📋' }
    ]
  },
  heading: {
    type: 'heading',
    name: '章节标题',
    group: '章节标题',
    icon: '📌',
    description: '章节标题预设模块',
    component: () => import('@/components/modules/HeadingModule.vue'),
    propertyPanel: () => import('@/components/property-editors/HeadingProperty.vue'),
    defaultProps: { text: '章节标题', level: 1, variant: 'numbered', showNumbering: true },
    defaultStyles: {
      margin: '24px 0 16px 0', padding: '12px 0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '22px',
      color: '#111827', fontWeight: 'bold', fontStyle: 'normal', lineHeight: '1.4'
    },
    variants: [
      { name: '标题 · 编号风', variant: 'numbered', description: '左侧彩色竖条 + 编号前缀', icon: '📌' },
      { name: '标题 · 左侧竖条', variant: 'left-bar', description: '彩色竖条装饰，无编号', icon: '📍' },
      { name: '标题 · 居中装饰', variant: 'center', description: '居中大标题配上下装饰线', icon: '🎯' },
      { name: '标题 · 极简', variant: 'simple', description: '仅加大加粗文字', icon: '🔤' }
    ]
  },
  quote: {
    type: 'quote',
    name: '引用',
    group: '基础组件',
    icon: '💬',
    description: '添加引用文字块，适合引述观点',
    component: () => import('@/components/modules/QuoteModule.vue'),
    propertyPanel: () => import('@/components/property-editors/QuoteProperty.vue'),
    defaultProps: { content: '这是一段引用文字', author: '' },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '16px 20px', backgroundColor: '#f8fafc',
      border: 'none', borderLeft: '4px solid #3b82f6', borderRadius: '0 8px 8px 0',
      textAlign: 'left', fontSize: '16px', color: '#333333', fontWeight: 'normal',
      fontStyle: 'italic', lineHeight: '1.6'
    }
  }
}

export function getModulesByGroup(): Map<string, ModuleRegistration[]> {
  const groups = new Map<string, ModuleRegistration[]>()
  const order = ['页首', '目录', '章节标题', '基础组件', '页尾']

  for (const groupName of order) {
    const items = Object.values(moduleRegistry).filter(m => m.group === groupName)
    if (items.length > 0) groups.set(groupName, items)
  }

  // Add any remaining groups not in the order
  for (const reg of Object.values(moduleRegistry)) {
    if (!order.includes(reg.group) && !groups.has(reg.group)) {
      groups.set(reg.group, [reg])
    }
  }

  return groups
}
