# HTML 导出重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 HTML 导出从 `api.ts` 中独立的模板字符串重构为共享渲染层，所有 module variant 和样式在导出中正确呈现。

**Architecture:** 新增 `frontend/src/renderers/` 目录，每个模块类型对应一个纯函数渲染器，输出 100% 内联样式 HTML。Vue 组件预览模式调用渲染器，导出函数也调用渲染器，消除两套渲染代码。

**Tech Stack:** TypeScript, Vite, vitest (新增), marked (已存在)

---

### Task 1: 添加 vitest 测试框架和 utils 工具函数

**Files:**
- Create: `frontend/vitest.config.ts`
- Modify: `frontend/package.json` (添加 vitest 脚本和依赖)
- Create: `frontend/src/renderers/utils.ts`
- Create: `frontend/src/renderers/__tests__/utils.test.ts`

- [ ] **Step 1: 安装 vitest 依赖**

Run:
```bash
cd frontend && npm install -D vitest @vue/test-utils jsdom
```

- [ ] **Step 2: 创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'node'
  }
})
```

- [ ] **Step 3: 在 package.json 中添加 test 脚本**

在 `scripts` 中添加：
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 创建 inlineStyle 工具函数**

`frontend/src/renderers/utils.ts`:
```typescript
import type { ModuleStyles } from '@/types/document'

/**
 * 将 ModuleStyles 对象转换为内联 style 字符串。
 * 过滤掉空值、transparent、none、0 等无意义值。
 */
export function inlineStyle(styles: Partial<ModuleStyles>): string {
  const s = (v: any) => v && v !== 'transparent' && v !== 'none' ? String(v) : ''
  const parts: string[] = []

  if (s(styles.padding)) parts.push('padding:' + styles.padding)
  if (s(styles.backgroundColor)) parts.push('background-color:' + styles.backgroundColor)
  if (s(styles.border)) parts.push('border:' + styles.border)
  if (s(styles.borderLeft)) parts.push('border-left:' + styles.borderLeft)
  if (s(styles.borderRadius)) parts.push('border-radius:' + styles.borderRadius)
  if (s(styles.textAlign)) parts.push('text-align:' + styles.textAlign)
  if (s(styles.fontSize)) parts.push('font-size:' + styles.fontSize)
  if (s(styles.color)) parts.push('color:' + styles.color)
  if (s(styles.fontWeight)) parts.push('font-weight:' + styles.fontWeight)
  if (s(styles.fontStyle)) parts.push('font-style:' + styles.fontStyle)
  if (s(styles.lineHeight)) parts.push('line-height:' + styles.lineHeight)
  if (s(styles.fontFamily)) parts.push('font-family:' + styles.fontFamily)
  if (s(styles.margin)) parts.push('margin:' + styles.margin)

  return parts.join(';')
}

export function s(v: any): string {
  return v && v !== 'transparent' && v !== 'none' ? String(v) : ''
}
```

- [ ] **Step 5: 编写 utils 测试**

`frontend/src/renderers/__tests__/utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { inlineStyle } from '../utils'

describe('inlineStyle', () => {
  it('should convert ModuleStyles to inline style string', () => {
    const result = inlineStyle({
      color: '#333',
      fontSize: '16px',
      textAlign: 'center'
    })
    expect(result).toBe('color:#333;font-size:16px;text-align:center')
  })

  it('should filter out empty/transparent/none values', () => {
    const result = inlineStyle({
      color: '',
      backgroundColor: 'transparent',
      border: 'none'
    })
    expect(result).toBe('')
  })

  it('should handle partial styles', () => {
    const result = inlineStyle({ margin: '0 0 16px 0' })
    expect(result).toBe('margin:0 0 16px 0')
  })
})
```

- [ ] **Step 6: 运行测试确认通过**

Run:
```bash
cd frontend && npx vitest run
```
Expected: 1 test file, tests passing.

- [ ] **Step 7: Commit**

```bash
cd frontend && git add vitest.config.ts package.json src/renderers/ && git commit -m "test: add vitest setup and inlineStyle utility"
```

---

### Task 2: divider 渲染器

**Files:**
- Create: `frontend/src/renderers/divider.ts`
- Create: `frontend/src/renderers/__tests__/divider.test.ts`

- [ ] **Step 1: 编写 divider 渲染器**

`frontend/src/renderers/divider.ts`:
```typescript
import type { Module } from '@/types/document'
import type { DividerModuleProps } from '@/types/document'

export function renderDivider(module: Module): string {
  const p = module.props as DividerModuleProps
  const margin = module.styles.margin || '16px 0'
  const style = p.style || 'solid'
  const color = p.color || '#e5e7eb'

  return `<div style="margin:${margin}">
  <hr style="border:none;border-top:${style === 'none' ? 'solid' : style} 1px ${color};margin:0" />
</div>`
}
```

- [ ] **Step 2: 编写 divider 测试**

`frontend/src/renderers/__tests__/divider.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderDivider } from '../divider'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test',
    type: 'divider',
    props: { style: 'solid', color: '#e5e7eb' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderDivider', () => {
  it('should render default divider', () => {
    const html = renderDivider(createMockModule())
    expect(html).toContain('border-top:solid 1px #e5e7eb')
  })

  it('should render dashed divider', () => {
    const html = renderDivider(createMockModule({
      props: { style: 'dashed', color: '#999' }
    }))
    expect(html).toContain('border-top:dashed 1px #999')
  })

  it('should render with custom margin', () => {
    const html = renderDivider(createMockModule({
      styles: { margin: '24px 0' }
    }))
    expect(html).toContain('margin:24px 0')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/divider.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/divider.ts src/renderers/__tests__/divider.test.ts && git commit -m "feat: add divider renderer"
```

---

### Task 3: text 渲染器

**Files:**
- Create: `frontend/src/renderers/text.ts`
- Create: `frontend/src/renderers/__tests__/text.test.ts`

- [ ] **Step 1: 编写 text 渲染器**

`frontend/src/renderers/text.ts`:
```typescript
import type { Module } from '@/types/document'
import type { TextModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

export function renderText(module: Module): string {
  const p = module.props as TextModuleProps
  const st = module.styles
  const margin = s(st.margin) || '0 0 16px 0'

  // 外层样式（容器相关）
  const containerStyles = inlineStyle({
    padding: st.padding,
    backgroundColor: st.backgroundColor,
    border: st.border,
    borderRadius: st.borderRadius,
    fontFamily: st.fontFamily
  })

  // 内层样式（字体相关）
  const innerStyles = inlineStyle({
    fontSize: st.fontSize,
    color: st.color,
    fontWeight: st.fontWeight,
    lineHeight: st.lineHeight,
    textAlign: st.textAlign
  })

  const iconHtml = p.icon
    ? `<p style="margin:0 0 4px 0;font-size:20px;line-height:1">${p.icon}</p>`
    : ''

  const fullContainer = containerStyles ? `margin:${margin};${containerStyles}` : `margin:${margin}`
  const fullInner = innerStyles || 'margin:0'

  return `<div style="${fullContainer}">
  ${iconHtml}
  <div style="${fullInner}">${p.content || ''}</div>
</div>`
}
```

- [ ] **Step 2: 编写 text 测试**

`frontend/src/renderers/__tests__/text.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderText } from '../text'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'text',
    props: { content: '<p>Hello World</p>', icon: '' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderText', () => {
  it('should render content', () => {
    const html = renderText(createMockModule())
    expect(html).toContain('Hello World')
  })

  it('should render icon when provided', () => {
    const html = renderText(createMockModule({
      props: { content: '<p>Text</p>', icon: '🔥' }
    }))
    expect(html).toContain('🔥')
  })

  it('should apply styles', () => {
    const html = renderText(createMockModule({
      styles: { color: '#333', fontSize: '16px', margin: '0 0 16px 0' }
    }))
    expect(html).toContain('color:#333')
    expect(html).toContain('font-size:16px')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/text.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/text.ts src/renderers/__tests__/text.test.ts && git commit -m "feat: add text renderer"
```

---

### Task 4: quote 渲染器

**Files:**
- Create: `frontend/src/renderers/quote.ts`
- Create: `frontend/src/renderers/__tests__/quote.test.ts`

- [ ] **Step 1: 编写 quote 渲染器**

`frontend/src/renderers/quote.ts`:
```typescript
import type { Module } from '@/types/document'
import type { QuoteModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

export function renderQuote(module: Module): string {
  const p = module.props as QuoteModuleProps
  const st = module.styles

  const containerStyles = inlineStyle({
    padding: st.padding || '16px 20px',
    backgroundColor: st.backgroundColor,
    borderLeft: st.borderLeft || '4px solid #3b82f6',
    borderRadius: st.borderRadius || '0 8px 8px 0',
    margin: st.margin || '0 0 16px 0',
    fontFamily: st.fontFamily
  })

  const contentStyles = inlineStyle({
    fontSize: st.fontSize || '15px',
    color: st.color || '#4b5563',
    fontWeight: st.fontWeight,
    fontStyle: st.fontStyle || 'italic',
    lineHeight: st.lineHeight || '1.8',
    textAlign: st.textAlign
  })

  const authorHtml = p.author
    ? `<p style="margin:8px 0 0 0;font-size:13px;color:#9ca3af;text-align:right">—— ${p.author}</p>`
    : ''

  return `<div style="${containerStyles}">
  <div style="${contentStyles}">${p.content || ''}</div>
  ${authorHtml}
</div>`
}
```

- [ ] **Step 2: 编写 quote 测试**

`frontend/src/renderers/__tests__/quote.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderQuote } from '../quote'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'quote',
    props: { content: '<p>Quote text</p>', author: '' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderQuote', () => {
  it('should render content', () => {
    const html = renderQuote(createMockModule())
    expect(html).toContain('Quote text')
    expect(html).toContain('border-left:4px solid #3b82f6')
  })

  it('should render author when provided', () => {
    const html = renderQuote(createMockModule({
      props: { content: '<p>Q</p>', author: 'Author Name' }
    }))
    expect(html).toContain('Author Name')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/quote.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/quote.ts src/renderers/__tests__/quote.test.ts && git commit -m "feat: add quote renderer"
```

---

### Task 5: image 渲染器

**Files:**
- Create: `frontend/src/renderers/image.ts`
- Create: `frontend/src/renderers/__tests__/image.test.ts`

- [ ] **Step 1: 编写 image 渲染器**

`frontend/src/renderers/image.ts`:
```typescript
import type { Module } from '@/types/document'
import type { ImageModuleProps } from '@/types/document'
import { s } from './utils'

export function renderImage(module: Module): string {
  const p = module.props as ImageModuleProps
  const st = module.styles
  const align = p.align || 'center'
  const margin = s(st.margin) || '12px 0'

  // 图片对齐用外层 text-align + img margin auto
  const imgMargin = align === 'center' ? 'margin:0 auto' : align === 'right' ? 'margin:0 0 0 auto' : 'margin:0 auto 0 0'
  const containerAlign = `text-align:${align}`

  const width = p.width ? `width:${p.width};` : 'width:100%;'
  const height = p.height ? `height:${p.height};` : 'height:auto;'

  const borderRadius = s(st.borderRadius) ? `border-radius:${st.borderRadius};` : ''

  const img = p.src
    ? `<img src="${p.src}" alt="${p.alt || ''}" style="${width}${height}max-width:100%;display:block;${imgMargin};${borderRadius}" />`
    : ''

  const captionStyle = p.captionStyle || {}
  const captionHtml = p.caption
    ? `<p style="margin:8px 0 0 0;font-size:${captionStyle.fontSize || '13px'};color:${captionStyle.color || '#9ca3af'};font-style:${captionStyle.italic ? 'italic' : 'normal'};text-align:${captionStyle.textAlign || 'center'};line-height:1.6">${p.caption}</p>`
    : ''

  return `<div style="margin:${margin};${containerAlign}">
  ${img}
  ${captionHtml}
</div>`
}
```

- [ ] **Step 2: 编写 image 测试**

`frontend/src/renderers/__tests__/image.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderImage } from '../image'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'image',
    props: { src: 'https://example.com/img.jpg', alt: 'test', align: 'center' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderImage', () => {
  it('should render img tag with src and alt', () => {
    const html = renderImage(createMockModule())
    expect(html).toContain('src="https://example.com/img.jpg"')
    expect(html).toContain('alt="test"')
  })

  it('should render caption when provided', () => {
    const html = renderImage(createMockModule({
      props: { src: 'img.jpg', alt: '', caption: 'Photo caption', captionStyle: {} }
    }))
    expect(html).toContain('Photo caption')
  })

  it('should render with custom align', () => {
    const html = renderImage(createMockModule({
      props: { src: 'img.jpg', alt: '', align: 'left' }
    }))
    expect(html).toContain('text-align:left')
  })

  it('should render with custom width and height', () => {
    const html = renderImage(createMockModule({
      props: { src: 'img.jpg', alt: '', width: '300px', height: '200px' }
    }))
    expect(html).toContain('width:300px')
    expect(html).toContain('height:200px')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/image.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/image.ts src/renderers/__tests__/image.test.ts && git commit -m "feat: add image renderer"
```

---

### Task 6: button 渲染器

**Files:**
- Create: `frontend/src/renderers/button.ts`
- Create: `frontend/src/renderers/__tests__/button.test.ts`

- [ ] **Step 1: 编写 button 渲染器**

`frontend/src/renderers/button.ts`:
```typescript
import type { Module } from '@/types/document'
import type { ButtonModuleProps } from '@/types/document'
import { s } from './utils'

const sizeMap: Record<string, string> = {
  small: 'padding:8px 16px;font-size:14px',
  medium: 'padding:12px 24px;font-size:16px',
  large: 'padding:16px 32px;font-size:18px'
}

export function renderButton(module: Module): string {
  const p = module.props as ButtonModuleProps
  const st = module.styles
  const margin = s(st.margin) || '12px 0'
  const textAlign = st.textAlign || 'center'
  const size = p.size || 'medium'
  const bg = s(st.backgroundColor) || '#3b82f6'
  const color = s(st.color) || '#ffffff'
  const borderRadius = s(st.borderRadius) || '6px'
  const link = p.link || ''

  const sizeStyle = sizeMap[size] || sizeMap.medium
  const linkTarget = link ? ` target="_blank"` : ''

  return `<div style="margin:${margin};text-align:${textAlign}">
  <a href="${link}"${linkTarget} style="display:inline-block;${sizeStyle};background-color:${bg};color:${color};border-radius:${borderRadius};text-decoration:none;text-align:center">${p.text}</a>
</div>`
}
```

- [ ] **Step 2: 编写 button 测试**

`frontend/src/renderers/__tests__/button.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderButton } from '../button'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'button',
    props: { text: 'Click Me', link: '', size: 'medium' },
    styles: { textAlign: 'center' },
    ...overrides
  } as Module
}

describe('renderButton', () => {
  it('should render button text', () => {
    const html = renderButton(createMockModule())
    expect(html).toContain('Click Me')
  })

  it('should respect size prop', () => {
    const smallHtml = renderButton(createMockModule({ props: { text: 'S', link: '', size: 'small' } }))
    expect(smallHtml).toContain('padding:8px 16px')

    const largeHtml = renderButton(createMockModule({ props: { text: 'L', link: '', size: 'large' } }))
    expect(largeHtml).toContain('padding:16px 32px')
  })

  it('should render link when provided', () => {
    const html = renderButton(createMockModule({
      props: { text: 'Link', link: 'https://example.com', size: 'medium' }
    }))
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/button.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/button.ts src/renderers/__tests__/button.test.ts && git commit -m "feat: add button renderer"
```

---

### Task 7: heading 渲染器（4 variants）

**Files:**
- Create: `frontend/src/renderers/heading.ts`
- Create: `frontend/src/renderers/__tests__/heading.test.ts`

- [ ] **Step 1: 编写 heading 渲染器**

`frontend/src/renderers/heading.ts`:
```typescript
import type { Module } from '@/types/document'
import type { HeadingModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

const levelFontSize: Record<number, string> = { 1: '24px', 2: '20px', 3: '18px', 4: '16px', 5: '15px', 6: '14px' }

const levelColor: Record<number, string> = {
  1: '#3b82f6', 2: '#6366f1', 3: '#8b5cf6',
  4: '#06b6d4', 5: '#10b981', 6: '#f59e0b'
}

const chineseNumerals = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

function getNumberingPrefix(level: number): string {
  const map: Record<number, string> = {
    1: `${chineseNumerals[1]}、`,
    2: '1.',
    3: '(1)',
    4: '• ',
    5: '- ',
    6: '* '
  }
  return map[level] || ''
}

function getHeadingStyles(module: Module): string {
  const st = module.styles
  const level = (module.props as HeadingModuleProps).level || 1
  const fontSize = s(st.fontSize) || levelFontSize[level] || '24px'
  return inlineStyle({
    fontSize,
    color: st.color || '#111827',
    fontWeight: st.fontWeight || 'bold',
    lineHeight: st.lineHeight || '1.4',
    textAlign: st.textAlign || 'left'
  })
}

export function renderHeading(module: Module): string {
  const p = module.props as HeadingModuleProps
  const st = module.styles
  const level = p.level || 1
  const variant = p.variant || 'simple'
  const containerStyles = inlineStyle({
    padding: st.padding || '12px 0',
    backgroundColor: st.backgroundColor,
    borderRadius: st.borderRadius,
    border: st.border,
    margin: st.margin || '24px 0 16px 0',
    fontFamily: st.fontFamily
  })
  const headingStyle = getHeadingStyles(module)
  const barColor = levelColor[level] || '#3b82f6'
  const prefix = p.showNumbering ? getNumberingPrefix(level) : ''
  const prefixHtml = prefix ? `<span style="color:${barColor}">${prefix}</span>` : ''

  switch (variant) {
    case 'numbered': {
      return `<div style="${containerStyles}">
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="width:4px;background-color:${barColor};border-radius:2px;padding:0"></td>
      <td style="padding:0 0 0 12px">
        <div style="${headingStyle}">${prefixHtml}${p.text}</div>
      </td>
    </tr>
  </table>
</div>`
    }
    case 'left-bar': {
      return `<div style="${containerStyles}">
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="width:4px;background-color:${barColor};border-radius:2px;padding:0"></td>
      <td style="padding:0 0 0 12px">
        <div style="${headingStyle}">${p.text}</div>
      </td>
    </tr>
  </table>
</div>`
    }
    case 'center': {
      return `<div style="${containerStyles}">
  <div style="text-align:center">
    <div style="width:60px;height:2px;background:#e5e7eb;border-radius:1px;margin:0 auto 12px auto"></div>
    <div style="${headingStyle};text-align:center">${prefixHtml}${p.text}</div>
    <div style="width:60px;height:2px;background:#e5e7eb;border-radius:1px;margin:12px auto 0 auto"></div>
  </div>
</div>`
    }
    case 'simple':
    default: {
      return `<div style="${containerStyles}">
  <div style="${headingStyle}">${prefixHtml}${p.text}</div>
</div>`
    }
  }
}
```

- [ ] **Step 2: 编写 heading 测试**

`frontend/src/renderers/__tests__/heading.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderHeading } from '../heading'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'heading',
    props: { text: 'Section Title', level: 1, variant: 'simple', showNumbering: false },
    styles: {},
    ...overrides
  } as Module
}

describe('renderHeading', () => {
  it('should render simple variant', () => {
    const html = renderHeading(createMockModule())
    expect(html).toContain('Section Title')
  })

  it('should render numbered variant with prefix', () => {
    const html = renderHeading(createMockModule({
      props: { text: 'Title', level: 1, variant: 'numbered', showNumbering: true }
    }))
    expect(html).toContain('一、')
  })

  it('should render left-bar variant', () => {
    const html = renderHeading(createMockModule({
      props: { text: 'Title', level: 1, variant: 'left-bar', showNumbering: false }
    }))
    expect(html).toContain('background-color:#3b82f6')
  })

  it('should render center variant', () => {
    const html = renderHeading(createMockModule({
      props: { text: 'Title', level: 2, variant: 'center', showNumbering: false }
    }))
    expect(html).toContain('text-align:center')
    expect(html).toContain('width:60px')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/heading.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/heading.ts src/renderers/__tests__/heading.test.ts && git commit -m "feat: add heading renderer with 4 variants"
```

---

### Task 8: markdown 渲染器

**Files:**
- Create: `frontend/src/renderers/markdown.ts`
- Create: `frontend/src/renderers/__tests__/markdown.test.ts`

- [ ] **Step 1: 编写 markdown 渲染器**

`frontend/src/renderers/markdown.ts`:
```typescript
import type { Module } from '@/types/document'
import type { MarkdownModuleProps } from '@/types/document'
import { marked } from 'marked'
import { inlineStyle, s } from './utils'

/**
 * 给 marked 生成的 HTML 添加内联样式。
 * 使用简单字符串替换给常见元素加 style。
 */
function styleMarkdownHtml(raw: string): string {
  // p 标签
  let result = raw.replace(/<p>/g, '<p style="margin:0 0 8px 0;word-break:break-word">')
  // h1-h4
  result = result.replace(/<h1 /g, '<h1 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.5em" ')
  result = result.replace(/<h2 /g, '<h2 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.35em" ')
  result = result.replace(/<h3 /g, '<h3 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.2em" ')
  // 没有属性的 h tags
  result = result.replace(/<h1>/g, '<h1 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.5em">')
  result = result.replace(/<h2>/g, '<h2 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.35em">')
  result = result.replace(/<h3>/g, '<h3 style="margin:12px 0 6px 0;font-weight:bold;color:#111827;font-size:1.2em">')
  // pre/code
  result = result.replace(/<pre>/g, '<pre style="background:#f3f4f6;border-radius:6px;padding:12px;overflow-x:auto;margin:8px 0">')
  result = result.replace(/<code>/g, '<code style="background:#f3f4f6;border-radius:4px;padding:2px 6px;font-size:0.9em;color:#dc2626">')
  result = result.replace(/<pre><code style="([^"]+)">/g, '<pre style="background:#f3f4f6;border-radius:6px;padding:12px;overflow-x:auto;margin:8px 0"><code style="$1;background:none;padding:0;color:inherit">')
  // blockquote
  result = result.replace(/<blockquote>/g, '<blockquote style="border-left:4px solid #3b82f6;margin:8px 0;padding:4px 16px;color:#4b5563;font-style:italic">')
  // table
  result = result.replace(/<table>/g, '<table style="border-collapse:collapse;width:100%;margin:8px 0">')
  result = result.replace(/<th>/g, '<th style="border:1px solid #d1d5db;padding:6px 10px;text-align:left;font-size:14px;background:#f9fafb;font-weight:600">')
  result = result.replace(/<td>/g, '<td style="border:1px solid #d1d5db;padding:6px 10px;text-align:left;font-size:14px">')
  // ul/ol
  result = result.replace(/<ul>/g, '<ul style="margin:6px 0;padding-left:24px">')
  result = result.replace(/<ol>/g, '<ol style="margin:6px 0;padding-left:24px">')
  result = result.replace(/<li>/g, '<li style="margin:3px 0">')
  // hr
  result = result.replace(/<hr>/g, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">')
  // a
  result = result.replace(/<a /g, '<a style="color:#3b82f6;text-decoration:underline" ')
  // img
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
    mdHtml = marked.parse(p.content, { async: false }) as string
    mdHtml = styleMarkdownHtml(mdHtml)
  }

  const combinedContainer = containerStyles
    ? `margin:${margin};${containerStyles}`
    : `margin:${margin}`

  return `<div style="${combinedContainer}">
  <div style="${contentStyles || ''}">${mdHtml}</div>
</div>`
}
```

- [ ] **Step 2: 编写 markdown 测试**

`frontend/src/renderers/__tests__/markdown.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../markdown'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'markdown',
    props: { content: '# Hello\n\nThis is **bold** text.' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderMarkdown', () => {
  it('should render markdown content as HTML', () => {
    const html = renderMarkdown(createMockModule())
    expect(html).toContain('Hello')
    expect(html).toContain('bold')
  })

  it('should add inline styles to rendered elements', () => {
    const html = renderMarkdown(createMockModule())
    expect(html).toContain('style=')
  })

  it('should return empty for empty content', () => {
    const html = renderMarkdown(createMockModule({ props: { content: '' } }))
    expect(html).toBeTruthy()
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/markdown.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/markdown.ts src/renderers/__tests__/markdown.test.ts && git commit -m "feat: add markdown renderer with inline styles"
```

---

### Task 9: toc 渲染器（4 variants）

**Files:**
- Create: `frontend/src/renderers/toc.ts`
- Create: `frontend/src/renderers/__tests__/toc.test.ts`

- [ ] **Step 1: 编写 toc 渲染器**

`frontend/src/renderers/toc.ts`:
```typescript
import type { Module } from '@/types/document'
import type { TocModuleProps, TocItem } from '@/types/document'
import { s } from './utils'

function renderDefault(items: TocItem[], title: string): string {
  const itemsHtml = items.map((item) => {
    const level = item.level || 0
    const pad = level * 16
    const bc = level === 0 ? '#3b82f6' : '#93c5fd'
    const fw = level === 0 ? '500' : 'normal'
    const c = level === 0 ? '#374151' : '#6b7280'
    const fs = level === 0 ? '14px' : '13px'
    return `<div style="display:flex;align-items:center;margin:6px 0;padding-left:${pad}px">
  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:${bc};margin-right:8px;flex-shrink:0"></span>
  <span style="font-size:${fs};font-weight:${fw};color:${c};line-height:1.5">${item.text}</span>
</div>`
  }).join('')

  return `<div style="margin:0 0 16px 0;padding:16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px">
  <div style="font-size:16px;font-weight:bold;color:#1f2937;margin:0 0 12px 0;padding:0 0 8px 0;border-bottom:2px solid #e5e7eb">${title}</div>
  ${itemsHtml}
</div>`
}

function renderNumbered(items: TocItem[], title: string): string {
  const itemsHtml = items.map((item, index) => {
    const level = item.level || 0
    const pad = level * 20
    const isLevel0 = level === 0
    const numColor = isLevel0 ? '#3b82f6' : '#d1d5db'
    const num = String(index + 1).padStart(2, '0')
    return `<div style="display:flex;align-items:baseline;gap:8px;margin:8px 0;padding-left:${pad}px">
  <span style="font-size:11px;font-weight:600;color:${numColor};min-width:22px;flex-shrink:0">${num}</span>
  <span style="font-size:${isLevel0 ? '14px' : '13px'};font-weight:${isLevel0 ? '500' : 'normal'};color:${isLevel0 ? '#374151' : '#6b7280'}">${item.text}</span>
</div>`
  }).join('')

  return `<div style="margin:0 0 16px 0;padding:16px;background:#fff;border-radius:8px">
  <div style="font-size:16px;font-weight:600;color:#1f2937;margin:0 0 14px 0;display:flex;align-items:center;gap:8px">
    <span style="font-size:18px">📑</span>
    ${title}
  </div>
  ${itemsHtml}
</div>`
}

function renderCard(items: TocItem[], title: string): string {
  const itemsHtml = items.map((item, index) => {
    const pad = (item.level || 0) * 16
    const isActive = index === 0
    const numColor = isActive ? '#3b82f6' : '#d1d5db'
    const num = String(index + 1).padStart(2, '0')
    const isLast = index === items.length - 1
    const borderBottom = isLast ? '' : 'border-bottom:1px solid #f3f4f6'
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;${borderBottom};padding-left:${pad}px">
  <span style="font-size:11px;font-weight:600;color:${numColor};min-width:22px;flex-shrink:0">${num}</span>
  <span style="font-size:13px;color:#4b5563">${item.text}</span>
</div>`
  }).join('')

  return `<div style="margin:0 0 16px 0;padding:20px;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
  <div style="font-size:15px;font-weight:600;color:#1f2937;margin:0 0 14px 0;display:flex;align-items:center;gap:8px">
    <span style="display:inline-block;width:4px;height:16px;background:#3b82f6;border-radius:2px;flex-shrink:0"></span>
    ${title}
  </div>
  ${itemsHtml}
</div>`
}

function renderMinimal(items: TocItem[], title: string): string {
  const itemsHtml = items.map((item) => {
    const pad = (item.level || 0) * 12
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;padding-left:${pad}px">
  <span style="display:inline-block;width:12px;height:1px;background:#d1d5db;flex-shrink:0"></span>
  <span style="font-size:13px;color:#6b7280;line-height:1.5">${item.text}</span>
</div>`
  }).join('')

  return `<div style="margin:0 0 16px 0">
  <div style="font-size:14px;font-weight:600;color:#374151;margin:0 0 10px 0;letter-spacing:1px">${title}</div>
  ${itemsHtml}
</div>`
}

export function renderToc(module: Module): string {
  const p = module.props as TocModuleProps
  const variant = p.variant || 'default'
  const items = p.items || []
  const title = p.title || ''

  switch (variant) {
    case 'numbered': return renderNumbered(items, title)
    case 'card': return renderCard(items, title)
    case 'minimal': return renderMinimal(items, title)
    case 'default':
    default: return renderDefault(items, title)
  }
}
```

- [ ] **Step 2: 编写 toc 测试**

`frontend/src/renderers/__tests__/toc.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderToc } from '../toc'
import type { Module } from '@/types/document'

const defaultItems = [
  { text: 'Chapter 1', level: 0 },
  { text: 'Section 1.1', level: 1 }
]

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'toc',
    props: { title: 'Contents', items: defaultItems, variant: 'default' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderToc', () => {
  it('should render default variant', () => {
    const html = renderToc(createMockModule())
    expect(html).toContain('Contents')
    expect(html).toContain('Chapter 1')
    expect(html).toContain('Section 1.1')
  })

  it('should render numbered variant', () => {
    const html = renderToc(createMockModule({ props: { title: 'TOC', items: defaultItems, variant: 'numbered' } }))
    expect(html).toContain('📑')
    expect(html).toContain('01')
  })

  it('should render card variant', () => {
    const html = renderToc(createMockModule({ props: { title: 'TOC', items: defaultItems, variant: 'card' } }))
    expect(html).toContain('box-shadow')
  })

  it('should render minimal variant', () => {
    const html = renderToc(createMockModule({ props: { title: 'TOC', items: defaultItems, variant: 'minimal' } }))
    expect(html).toContain('letter-spacing')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/toc.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/toc.ts src/renderers/__tests__/toc.test.ts && git commit -m "feat: add toc renderer with 4 variants"
```

---

### Task 10: footer 渲染器（4 variants）

**Files:**
- Create: `frontend/src/renderers/footer.ts`
- Create: `frontend/src/renderers/__tests__/footer.test.ts`

- [ ] **Step 1: 编写 footer 渲染器**

`frontend/src/renderers/footer.ts`:
```typescript
import type { Module } from '@/types/document'
import type { FooterModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

function renderDefault(p: FooterModuleProps, st: any): string {
  const color = s(st.color) || '#6b7280'
  const fontSize = s(st.fontSize) || '13px'
  return `<div style="padding:16px;text-align:${st.textAlign || 'center'}">
  ${p.showDivider ? '<hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px 0" />' : ''}
  ${p.text ? `<div style="font-size:${fontSize};color:${color};margin:0 0 8px 0;line-height:1.6">${p.text}</div>` : ''}
  ${p.copyright ? `<div style="font-size:12px;color:#9ca3af;margin:0">${p.copyright}</div>` : ''}
</div>`
}

function renderSimple(p: FooterModuleProps, st: any): string {
  return `<div style="padding:8px 0;text-align:${st.textAlign || 'center'}">
  <div style="width:40px;height:2px;background:#d1d5db;border-radius:1px;margin:0 auto 12px auto"></div>
  ${p.copyright ? `<div style="font-size:12px;color:#9ca3af;margin:0">${p.copyright}</div>` : ''}
</div>`
}

function renderBranded(p: FooterModuleProps, st: any): string {
  return `<div style="padding:24px;background-color:${s(st.backgroundColor) || '#f8fafc'};border-radius:12px;text-align:${st.textAlign || 'center'};margin:0 0 16px 0">
  <div style="font-size:28px;margin-bottom:12px">📰</div>
  ${p.text ? `<div style="font-size:14px;color:#4b5563;margin:0 0 8px 0;line-height:1.6">${p.text}</div>` : ''}
  ${p.copyright ? `<div style="font-size:12px;color:#9ca3af;margin:0 0 16px 0">${p.copyright}</div>` : ''}
  <div style="display:flex;justify-content:center;gap:8px">
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#d1d5db"></span>
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#d1d5db"></span>
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#d1d5db"></span>
  </div>
</div>`
}

function renderCta(p: FooterModuleProps, st: any): string {
  return `<div style="padding:24px;background-color:${s(st.backgroundColor) || '#fef2f2'};border-radius:12px;border:1px dashed #fecaca;text-align:${st.textAlign || 'center'};margin:0 0 16px 0">
  ${p.text ? `<div style="font-size:15px;font-weight:500;color:${s(st.color) || '#991b1b'};margin:0 0 16px 0;line-height:1.6">${p.text}</div>` : ''}
  <span style="display:inline-block;padding:10px 24px;font-size:14px;color:#ffffff;background:#dc2626;border-radius:24px;margin-bottom:16px">👍 点赞 · 💬 留言 · ⭐ 收藏</span>
  ${p.copyright ? `<div style="font-size:12px;color:#9ca3af;margin:0">${p.copyright}</div>` : ''}
</div>`
}

export function renderFooter(module: Module): string {
  const p = module.props as FooterModuleProps
  const st = module.styles
  const variant = p.variant || 'default'

  const outerStyles = inlineStyle({
    margin: st.margin || '0 0 16px 0',
    fontFamily: st.fontFamily
  })
  const outerStyle = outerStyles ? ` style="${outerStyles}"` : ''

  let inner: string
  switch (variant) {
    case 'simple': inner = renderSimple(p, st); break
    case 'branded': inner = renderBranded(p, st); break
    case 'cta': inner = renderCta(p, st); break
    case 'default':
    default: inner = renderDefault(p, st); break
  }

  return `<div${outerStyle}>${inner}</div>`
}
```

- [ ] **Step 2: 编写 footer 测试**

`frontend/src/renderers/__tests__/footer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderFooter } from '../footer'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'footer',
    props: { text: 'Thank you', copyright: '© 2024', showDivider: true, variant: 'default' },
    styles: {},
    ...overrides
  } as Module
}

describe('renderFooter', () => {
  it('should render default variant', () => {
    const html = renderFooter(createMockModule())
    expect(html).toContain('Thank you')
    expect(html).toContain('© 2024')
    expect(html).toContain('<hr')
  })

  it('should render simple variant', () => {
    const html = renderFooter(createMockModule({ props: { text: '', copyright: '© 2024', showDivider: false, variant: 'simple' } }))
    expect(html).toContain('width:40px;height:2px')
  })

  it('should render branded variant', () => {
    const html = renderFooter(createMockModule({ props: { text: 'Brand', copyright: '', showDivider: false, variant: 'branded' } }))
    expect(html).toContain('📰')
  })

  it('should render cta variant', () => {
    const html = renderFooter(createMockModule({ props: { text: 'CTA', copyright: '', showDivider: false, variant: 'cta' } }))
    expect(html).toContain('👍')
    expect(html).toContain('background:#dc2626')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/footer.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/footer.ts src/renderers/__tests__/footer.test.ts && git commit -m "feat: add footer renderer with 4 variants"
```

---

### Task 11: header 渲染器（4 variants）

**Files:**
- Create: `frontend/src/renderers/header.ts`
- Create: `frontend/src/renderers/__tests__/header.test.ts`

- [ ] **Step 1: 编写 header 渲染器**

`frontend/src/renderers/header.ts`:
```typescript
import type { Module } from '@/types/document'
import type { HeaderModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'

function renderDefault(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'center'
  const fontSize = s(st.fontSize) || '24px'
  const color = s(st.color) || '#1f2937'
  const lineHeight = s(st.lineHeight) || '1.4'

  const metaParts: string[] = []
  if (p.showAuthor && p.author) metaParts.push(`<span>${p.author}</span>`)
  if (p.showDate && p.date) metaParts.push(`<span>${p.date}</span>`)
  const metaHtml = metaParts.length
    ? `<div style="text-align:${align};font-size:13px;color:#9ca3af;display:flex;justify-content:${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'};gap:12px;flex-wrap:wrap">${metaParts.join('<span style="color:#d1d5db"> · </span>')}</div>`
    : ''

  return `<div style="padding:24px 16px;text-align:${align}">
  <div style="font-size:${fontSize};color:${color};font-weight:bold;line-height:${lineHeight};margin:0 0 8px 0">${p.title}</div>
  ${p.subtitle ? `<div style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 16px 0">${p.subtitle}</div>` : ''}
  ${metaHtml}
</div>`
}

function renderMagazine(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'center'
  return `<div style="padding:24px 16px;text-align:${align}">
  <div style="width:40px;height:4px;background:#dc2626;border-radius:2px;margin:0 ${align === 'left' ? '0 16px 0 0' : 'auto'} 16px ${align === 'left' ? '0' : 'auto'}"></div>
  ${p.subtitle ? `<div style="font-size:13px;font-weight:500;color:${s(st.color) || '#dc2626'};letter-spacing:2px;margin:0 0 8px 0">${p.subtitle}</div>` : ''}
  <div style="font-size:28px;font-weight:800;color:#1f2937;line-height:1.3;letter-spacing:-0.5px;margin:0 0 12px 0">${p.title}</div>
  <div style="width:60px;height:3px;background:#e5e7eb;border-radius:2px;margin:0 ${align === 'left' ? '0' : 'auto'} 12px ${align === 'left' ? '0' : 'auto'}"></div>
  <div style="text-align:${align};font-size:13px;color:#9ca3af;display:flex;justify-content:${align === 'left' ? 'flex-start' : 'center'};gap:16px">
    ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
    ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
  </div>
</div>`
}

function renderMinimal(p: HeaderModuleProps, st: any): string {
  const align = st.textAlign || 'left'
  return `<div style="padding:24px 16px">
  <div style="font-size:${s(st.fontSize) || '26px'};font-weight:700;color:#111827;line-height:1.35;text-align:${align}">${p.title}</div>
  <div style="text-align:${align};font-size:13px;color:#9ca3af;display:flex;gap:16px;margin-top:8px">
    ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
    ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
  </div>
</div>`
}

function renderCard(p: HeaderModuleProps, st: any): string {
  return `<div style="padding:24px 16px;text-align:${st.textAlign || 'center'}">
  <div style="padding:32px 24px;background-color:${s(st.backgroundColor) || '#1f2937'};border-radius:12px">
    <div style="color:#ffffff;font-size:${s(st.fontSize) || '24px'};font-weight:bold;line-height:1.4">${p.title}</div>
    ${p.subtitle ? `<p style="font-size:14px;color:rgba(255,255,255,0.75);margin:8px 0 16px 0;line-height:1.5">${p.subtitle}</p>` : ''}
    <div style="font-size:12px;color:rgba(255,255,255,0.55);display:flex;justify-content:center;gap:16px">
      ${p.showAuthor && p.author ? `<span>${p.author}</span>` : ''}
      ${p.showDate && p.date ? `<span>${p.date}</span>` : ''}
    </div>
  </div>
</div>`
}

export function renderHeader(module: Module): string {
  const p = module.props as HeaderModuleProps
  const st = module.styles
  const variant = p.variant || 'default'

  const outerStyles = inlineStyle({
    padding: st.padding,
    backgroundColor: st.backgroundColor,
    borderRadius: st.borderRadius,
    border: st.border,
    margin: st.margin || '0 0 16px 0',
    fontFamily: st.fontFamily
  })
  const outerStyle = outerStyles ? ` style="${outerStyles}"` : ''

  let inner: string
  switch (variant) {
    case 'magazine': inner = renderMagazine(p, st); break
    case 'minimal': inner = renderMinimal(p, st); break
    case 'card': inner = renderCard(p, st); break
    case 'default':
    default: inner = renderDefault(p, st); break
  }

  return `<div${outerStyle}>${inner}</div>`
}
```

- [ ] **Step 2: 编写 header 测试**

`frontend/src/renderers/__tests__/header.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderHeader } from '../header'
import type { Module } from '@/types/document'

function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'test', type: 'header',
    props: {
      title: 'Article Title', subtitle: 'Subtitle',
      author: 'Author', date: '2024-01-01',
      showDate: true, showAuthor: true, variant: 'default'
    },
    styles: {},
    ...overrides
  } as Module
}

describe('renderHeader', () => {
  it('should render default variant', () => {
    const html = renderHeader(createMockModule())
    expect(html).toContain('Article Title')
    expect(html).toContain('Subtitle')
    expect(html).toContain('Author')
    expect(html).toContain('2024-01-01')
  })

  it('should render magazine variant with accent bar', () => {
    const html = renderHeader(createMockModule({
      props: { title: 'T', subtitle: 'S', author: 'A', date: 'D', showDate: true, showAuthor: true, variant: 'magazine' }
    }))
    expect(html).toContain('background:#dc2626')
    expect(html).toContain('40px')
  })

  it('should render minimal variant without subtitle', () => {
    const html = renderHeader(createMockModule({
      props: { title: 'T', subtitle: '', author: '', date: 'D', showDate: true, showAuthor: false, variant: 'minimal' }
    }))
    expect(html).toContain('font-weight:700')
    expect(html).not.toContain('Subtitle')
  })

  it('should render card variant with dark background', () => {
    const html = renderHeader(createMockModule({
      props: { title: 'T', subtitle: '', author: '', date: '', showDate: false, showAuthor: false, variant: 'card' }
    }))
    expect(html).toContain('background-color:#1f2937')
    expect(html).toContain('color:#ffffff')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/header.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/header.ts src/renderers/__tests__/header.test.ts && git commit -m "feat: add header renderer with 4 variants"
```

---

### Task 12: container 渲染器

**Files:**
- Create: `frontend/src/renderers/container.ts`
- Create: `frontend/src/renderers/__tests__/container.test.ts`

- [ ] **Step 1: 编写 container 渲染器**

`frontend/src/renderers/container.ts`:
```typescript
import type { Module } from '@/types/document'
import type { ContainerModuleProps } from '@/types/document'
import { inlineStyle, s } from './utils'
import { renderText } from './text'
import { renderImage } from './image'
import { renderDivider } from './divider'
import { renderButton } from './button'
import { renderHeader } from './header'
import { renderFooter } from './footer'
import { renderHeading } from './heading'
import { renderToc } from './toc'
import { renderQuote } from './quote'
import { renderMarkdown } from './markdown'

/** 递归渲染子模块，避免循环依赖（container → index → container） */
function renderChildModule(child: Module): string {
  switch (child.type) {
    case 'text': return renderText(child)
    case 'image': return renderImage(child)
    case 'divider': return renderDivider(child)
    case 'button': return renderButton(child)
    case 'header': return renderHeader(child)
    case 'footer': return renderFooter(child)
    case 'heading': return renderHeading(child)
    case 'toc': return renderToc(child)
    case 'quote': return renderQuote(child)
    case 'markdown': return renderMarkdown(child)
    case 'container': return renderContainer(child)
    default: return ''
  }
}

export function renderContainer(module: Module): string {
  const p = module.props as ContainerModuleProps
  const st = module.styles
  const layout = p.layout || 'single'
  const children = module.children || []

  const containerStyles = inlineStyle({
    padding: st.padding || '24px 16px 16px',
    backgroundColor: st.backgroundColor,
    borderRadius: st.borderRadius,
    border: st.border,
    margin: st.margin || '8px 0',
    fontFamily: st.fontFamily
  })
  const containerStyle = containerStyles ? ` style="${containerStyles}"` : ''

  if (layout === 'single') {
    const childrenHtml = children.map(child => renderChildModule(child)).join('')
    return `<div${containerStyle}>${childrenHtml}</div>`
  }

  const colCount = layout === 'three-column' ? 3 : 2
  const colsHtml = children.map((child) => {
    const childHtml = renderChildModule(child)
    return `<td style="vertical-align:top;padding:0 8px;width:${100 / colCount}%">${childHtml}</td>`
  }).join('')

  return `<div${containerStyle}>
  <table style="width:100%;border-collapse:collapse">
    <tr>${colsHtml}</tr>
  </table>
</div>`
}
```

- [ ] **Step 2: 编写 container 测试**

`frontend/src/renderers/__tests__/container.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderContainer } from '../container'
import type { Module } from '@/types/document'
import { createModule } from '@/types/document'

describe('renderContainer', () => {
  it('should render single layout with children', () => {
    const textModule = createModule('text')
    textModule.props.content = '<p>Child</p>'
    const container: Module = {
      id: 'c1', type: 'container',
      props: { layout: 'single' },
      children: [textModule],
      styles: {}
    }
    const html = renderContainer(container)
    expect(html).toContain('Child')
    expect(html).not.toContain('<table')
  })

  it('should render two-column layout with table', () => {
    const m1 = createModule('text'); m1.props.content = '<p>Left</p>'
    const m2 = createModule('text'); m2.props.content = '<p>Right</p>'
    const container: Module = {
      id: 'c1', type: 'container',
      props: { layout: 'two-column' },
      children: [m1, m2],
      styles: {}
    }
    const html = renderContainer(container)
    expect(html).toContain('<table')
    expect(html).toContain('<td')
    expect(html).toContain('width:50%')
    expect(html).toContain('Left')
    expect(html).toContain('Right')
  })

  it('should render three-column layout', () => {
    const items = ['A', 'B', 'C'].map(text => {
      const m = createModule('text')
      m.props.content = `<p>${text}</p>`
      return m
    })
    const container: Module = {
      id: 'c1', type: 'container',
      props: { layout: 'three-column' },
      children: items,
      styles: {}
    }
    const html = renderContainer(container)
    expect(html).toContain('width:33.333%')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/container.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/container.ts src/renderers/__tests__/container.test.ts && git commit -m "feat: add container renderer"
```

---

### Task 13: renderers/index.ts 入口

**Files:**
- Create: `frontend/src/renderers/index.ts`

- [ ] **Step 1: 创建 index.ts dispatcher**

`frontend/src/renderers/index.ts`:
```typescript
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
```

- [ ] **Step 2: 编写 index 测试**

`frontend/src/renderers/__tests__/index.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderModule } from '../index'
import { createModule } from '@/types/document'

describe('renderModule dispatcher', () => {
  it('should dispatch text modules', () => {
    const m = createModule('text')
    const html = renderModule(m)
    expect(html).toContain('点击编辑文字')
  })

  it('should dispatch divider modules', () => {
    const m = createModule('divider')
    const html = renderModule(m)
    expect(html).toContain('border-top')
  })

  it('should dispatch header modules', () => {
    const m = createModule('header')
    const html = renderModule(m)
    expect(html).toContain('文章标题')
  })

  it('should return empty string for unknown type', () => {
    const m = { ...createModule('text'), type: 'unknown' } as any
    expect(renderModule(m)).toBe('')
  })
})
```

- [ ] **Step 3: 运行测试**

Run:
```bash
cd frontend && npx vitest run src/renderers/__tests__/index.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/renderers/index.ts src/renderers/__tests__/index.test.ts && git commit -m "feat: add renderModule dispatcher"
```

---

### Task 14: 重写 generateHTMLFromDocument

**Files:**
- Modify: `frontend/src/services/api.ts` (重写 298-475 行的 `generateHTMLFromDocument` 函数)

- [ ] **Step 1: 重写导出函数**

将 `frontend/src/services/api.ts` 中第 298 行开始的 `generateHTMLFromDocument` 函数整体替换为：

```typescript
import { renderModule } from '@/renderers'

// ... 在 api.ts 中原位置

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
```

同时删除以下不再使用的函数（原 298-475 行中的所有内容）：
- `moduleCSS()`
- `renderModule()` (原位的, 将被 renderers 中的替换)
- `renderContainer()`
- `renderHeader()`
- `renderFooter()`
- `renderToc()`
- 以及 `juice` 的 import（如果不再使用）

- [ ] **Step 2: 运行测试确保不破坏已有渲染器测试**

Run:
```bash
cd frontend && npx vitest run
```

Expected: all existing renderer tests pass

- [ ] **Step 3: Commit**

```bash
cd frontend && git add src/services/api.ts && git commit -m "refactor: rewrite generateHTMLFromDocument to use shared renderers"
```

---

### Task 15: 改造 Vue 组件预览模式（简单组件）

**Files:**
- Modify: `frontend/src/components/modules/DividerModule.vue`
- Modify: `frontend/src/components/modules/TextModule.vue`
- Modify: `frontend/src/components/modules/QuoteModule.vue`
- Modify: `frontend/src/components/modules/ButtonModule.vue`

每个组件做同样的改造：预览模式下用 v-html 调用 renderer 替代手写模板。

#### DividerModule.vue

- [ ] **Step 1: 改造 DividerModule.vue**

```vue
<script setup lang="ts">
import type { Module, DividerModuleProps } from '@/types/document'
import { renderDivider } from '@/renderers/divider'
import { inject, ref, computed } from 'vue'

interface Props {
  module: Module & { props: DividerModuleProps }
}

const props = defineProps<Props>()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderDivider(props.module))
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml"></div>
  <div v-else class="divider-module">
    <hr
      class="border-none h-px"
      :style="{
        backgroundColor: module.props.color || '#e5e7eb',
        borderStyle: module.props.style
      }"
    />
  </div>
</template>

<style scoped>
.divider-module {
  margin: 16px 0;
}
</style>
```

#### TextModule.vue

- [ ] **Step 2: 改造 TextModule.vue**

```vue
<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, TextModuleProps } from '@/types/document'
import { renderText } from '@/renderers/text'

interface Props {
  module: Module & { props: TextModuleProps }
}

const props = defineProps<Props>()
const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderText(props.module))

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '0',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '0',
  border: props.module.styles.border || 'none',
  margin: props.module.styles.margin || '0 0 16px 0',
  fontFamily: props.module.styles.fontFamily || undefined
}))

const editorStyle = computed(() => ({
  fontSize: props.module.styles.fontSize || '16px',
  color: props.module.styles.color || '#333333',
  fontWeight: props.module.styles.fontWeight || 'normal',
  lineHeight: props.module.styles.lineHeight || '1.6',
  textAlign: props.module.styles.textAlign || ('left' as any)
}))

function onContentUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { content })
}
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="text-module"></div>
  <div v-else class="text-module" :style="containerStyle">
    <div v-if="module.props.icon" class="text-icon-row">
      <span class="text-icon">{{ module.props.icon }}</span>
    </div>
    <div class="editor-wrapper" :style="{
      ...editorStyle,
      '--paragraph-spacing': props.module.styles.paragraphSpacing || '0'
    }">
      <RichTextEditor
        :content="module.props.content"
        :editable="!isPreviewMode"
        @update:content="onContentUpdate"
      />
    </div>
  </div>
</template>

<style scoped>
.text-module { min-height: 24px; position: relative; }
.text-icon-row { margin-bottom: 4px; }
.text-icon { font-size: 20px; line-height: 1; }
.editor-wrapper { position: relative; }
</style>
```

#### QuoteModule.vue

- [ ] **Step 3: 改造 QuoteModule.vue**

```vue
<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, QuoteModuleProps } from '@/types/document'
import { renderQuote } from '@/renderers/quote'

interface Props {
  module: Module & { props: QuoteModuleProps }
}

const props = defineProps<Props>()
const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderQuote(props.module))

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '16px 20px',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderLeft: props.module.styles.borderLeft || '4px solid #3b82f6',
  borderRadius: props.module.styles.borderRadius || '0 8px 8px 0',
  margin: props.module.styles.margin || '0 0 16px 0',
  fontFamily: props.module.styles.fontFamily || undefined
}))

const editorStyle = computed(() => ({
  fontSize: props.module.styles.fontSize || '15px',
  color: props.module.styles.color || '#4b5563',
  fontWeight: props.module.styles.fontWeight || 'normal',
  fontStyle: (props.module.styles.fontStyle || 'italic') as any,
  lineHeight: props.module.styles.lineHeight || '1.8',
  textAlign: props.module.styles.textAlign || ('left' as any)
}))

const authorStyle = computed(() => ({
  fontSize: '13px', color: '#9ca3af', margin: '8px 0 0 0', textAlign: 'right' as any
}))

function onContentUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { content })
}
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml"></div>
  <div v-else class="quote-module" :style="containerStyle">
    <div class="editor-wrapper" :style="editorStyle">
      <RichTextEditor
        :content="module.props.content"
        :editable="!isPreviewMode"
        @update:content="onContentUpdate"
      />
    </div>
    <p v-if="module.props.author" :style="authorStyle">—— {{ module.props.author }}</p>
  </div>
</template>

<style scoped>
.quote-module { min-height: 24px; }
.editor-wrapper { position: relative; }
</style>
```

#### ButtonModule.vue

- [ ] **Step 4: 改造 ButtonModule.vue**

```vue
<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, ButtonModuleProps } from '@/types/document'
import { renderButton } from '@/renderers/button'

interface Props {
  module: Module & { props: ButtonModuleProps }
}

const props = defineProps<Props>()
const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderButton(props.module))

const containerStyle = computed(() => ({
  textAlign: (props.module.styles.textAlign || 'center') as any,
  padding: props.module.styles.padding || '0',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '0',
  border: props.module.styles.border || 'none',
  margin: props.module.styles.margin || '12px 0'
}))

const linkStyle = computed(() => ({
  backgroundColor: props.module.styles.backgroundColor || '#3b82f6',
  color: props.module.styles.color || '#ffffff',
  borderRadius: props.module.styles.borderRadius || '6px',
  fontSize: props.module.styles.fontSize || undefined
}))

const sizeClasses: Record<string, string> = {
  small: 'px-4 py-1 text-sm',
  medium: 'px-6 py-2',
  large: 'px-8 py-3 text-lg'
}

function onTextUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { text: content })
}
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml"></div>
  <div v-else class="button-module" :style="containerStyle">
    <a
      :href="module.props.link"
      class="inline-block rounded text-center no-underline transition-opacity hover:opacity-90"
      :class="sizeClasses[module.props.size]"
      :style="linkStyle"
    >
      <RichTextEditor
        :content="module.props.text"
        :editable="!isPreviewMode"
        @update:content="onTextUpdate"
      />
    </a>
  </div>
</template>
```

- [ ] **Step 5: 运行 build 检查类型**

Run:
```bash
cd frontend && npx vite build 2>&1 | head -30
```
Expected: Build succeeds (possible vue-tsc issues are known)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/components/modules/DividerModule.vue src/components/modules/TextModule.vue src/components/modules/QuoteModule.vue src/components/modules/ButtonModule.vue && git commit -m "feat: use shared renderers in text/quote/button/divider preview"
```

---

### Task 16: 改造 Vue 组件预览模式（variant 组件）

**Files:**
- Modify: `frontend/src/components/modules/HeadingModule.vue`
- Modify: `frontend/src/components/modules/TocModule.vue`
- Modify: `frontend/src/components/modules/FooterModule.vue`
- Modify: `frontend/src/components/modules/HeaderModule.vue`
- Modify: `frontend/src/components/modules/MarkdownModule.vue`

- [ ] **Step 1: 改造 HeadingModule.vue**

在 script setup 中增加：
```typescript
import { renderHeading } from '@/renderers/heading'
const previewHtml = computed(() => renderHeading(props.module))
```

在 template 中，预览模式分支（所有 variant 外面包一层）：
```vue
<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="heading-module"></div>
  <div v-else class="heading-module" :class="`variant-${module.props.variant}`" :style="containerStyle">
    <!-- 原有的编辑模式内容保持不变 -->
    ...
  </div>
</template>
```

- [ ] **Step 2: 改造 TocModule.vue**

```typescript
import { renderToc } from '@/renderers/toc'
const previewHtml = computed(() => renderToc(props.module))
```

template 首层：
```vue
<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="toc-module"></div>
  <div v-else class="toc-module" :class="`variant-${module.props.variant}`">
    <!-- 原有编辑模式 -->
    ...
  </div>
</template>
```

- [ ] **Step 3: 改造 FooterModule.vue**

```typescript
import { renderFooter } from '@/renderers/footer'
const previewHtml = computed(() => renderFooter(props.module))
```

template 首层：
```vue
<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="footer-module"></div>
  <div v-else class="footer-module" :class="`variant-${module.props.variant}`" :style="containerStyle">
    <!-- 原有编辑模式 -->
    ...
  </div>
</template>
```

- [ ] **Step 4: 改造 HeaderModule.vue**

```typescript
import { renderHeader } from '@/renderers/header'
const previewHtml = computed(() => renderHeader(props.module))
```

template 首层：
```vue
<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="header-module"></div>
  <div v-else class="header-module" :class="`variant-${module.props.variant}`" :style="containerStyle">
    <!-- 原有编辑模式 -->
    ...
  </div>
</template>
```

- [ ] **Step 5: 改造 MarkdownModule.vue**

```typescript
import { renderMarkdown } from '@/renderers/markdown'
const previewHtml = computed(() => renderMarkdown(props.module))
```

template 首层：
```vue
<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="md-module"></div>
  <template v-else>
    <!-- 原有编辑模式 -->
    ...
  </template>
</template>
```

- [ ] **Step 6: 运行 build 检查**

Run:
```bash
cd frontend && npx vite build 2>&1 | head -30
```
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
cd frontend && git add src/components/modules/HeadingModule.vue src/components/modules/TocModule.vue src/components/modules/FooterModule.vue src/components/modules/HeaderModule.vue src/components/modules/MarkdownModule.vue && git commit -m "feat: use shared renderers in variant module previews"
```

---

### Task 17: 改造 ImageModule.vue 和 ContainerModule.vue 预览模式

**Files:**
- Modify: `frontend/src/components/modules/ImageModule.vue`
- Modify: `frontend/src/components/modules/ContainerModule.vue`

- [ ] **Step 1: 改造 ImageModule.vue**

```typescript
import { renderImage } from '@/renderers/image'
const previewHtml = computed(() => renderImage(props.module))
```

template 首层：
```vue
<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="image-module"></div>
  <div v-else ...>
    <!-- 原有编辑模式 -->
    ...
  </div>
</template>
```

- [ ] **Step 2: 改造 ContainerModule.vue**

Container 比较特殊，它的 preview 模式渲染子模块用的是 renderers 链。把预览模式改为使用 `renderContainer`：

```typescript
import { renderContainer } from '@/renderers/container'
const previewHtml = computed(() => renderContainer(props.module))
```

template：
```vue
<template>
  <div class="container-module">
    <template v-if="!isPreviewMode">
      <!-- 原有的编辑模式 VueDraggable 结构 -->
      ...
    </template>
    <template v-else>
      <div v-html="previewHtml"></div>
    </template>
  </div>
</template>
```

删除预览模式中原有的 `<ModuleItem>` 递归渲染。

- [ ] **Step 3: 运行 build 检查**

Run:
```bash
cd frontend && npx vite build 2>&1 | head -30
```
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd frontend && git add src/components/modules/ImageModule.vue src/components/modules/ContainerModule.vue && git commit -m "feat: use shared renderers in image and container preview"
```

---

### Task 18: 运行全部测试和最终验证

**Files:**
- Run: 所有测试

- [ ] **Step 1: 运行所有 vitest 测试**

Run:
```bash
cd frontend && npx vitest run
```

Expected: All tests passing (should be ~15+ test suites)

- [ ] **Step 2: 运行 build 确认无编译错误**

Run:
```bash
cd frontend && npx vite build 2>&1
```

Expected: Build succeeds

- [ ] **Step 3: 最终 commit**

```bash
cd frontend && git add -A && git commit -m "refactor: complete HTML export rewrite with shared render layer"
```
