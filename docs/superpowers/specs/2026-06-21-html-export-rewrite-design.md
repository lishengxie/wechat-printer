# HTML 导出重构设计

## 概述

将前端 HTML 导出从 `api.ts` 中独立维护的模板字符串方式，重构为**共享渲染层**（`renderers/`），由统一纯函数负责所有模块的内联样式 HTML 输出。编辑器中的 Vue 组件预览模式和导出功能共用同一套渲染器，消除需要同步维护两套渲染的问题。

## 现状问题

- `generateHTMLFromDocument()` 在 `api.ts` 中独立维护了一套 HTML 渲染，与 Vue 组件的渲染完全解耦
- 所有 module variant（header 4种、footer 4种、heading 4种、toc 4种）在导出中被忽略，只用默认样式
- 图片 width/height/align 未生效；按钮 size 未生效
- Container 子元素 CSS 索引存在碰撞风险
- 每次修改 Vue 组件必须同步修改导出函数，容易遗漏

## 目标

1. 导出 HTML 与编辑器预览保持一致的渲染 fidelity
2. 所有 variant 在导出中正确渲染
3. 所有 prop（图片对齐、按钮尺寸等）在导出中正确使用
4. 导出时 100% 内联样式（WeChat 编辑器兼容），不再依赖 `<style>` 标签
5. 通过共享渲染层消除重复维护

## 架构

```
frontend/src/renderers/          ← 新增共享渲染层
  index.ts                       ← renderModule() 入口 dispatcher
  text.ts                        ← text 模块渲染
  image.ts                       ← image 模块渲染
  divider.ts                     ← divider 模块渲染
  button.ts                      ← button 模块渲染
  container.ts                   ← container 模块渲染（递归）
  header.ts                      ← header 模块，含 4 个 variant
  footer.ts                      ← footer 模块，含 4 个 variant
  heading.ts                     ← heading 模块，含 4 个 variant
  toc.ts                         ← toc 模块，含 4 个 variant
  quote.ts                       ← quote 模块渲染
  markdown.ts                    ← markdown 模块渲染
  utils.ts                       ← 工具函数（styles→内联字符串等）
```

## 渲染器契约

每个渲染器是纯函数：

```typescript
// 基础工具
function inlineStyle(styles: ModuleStyles): string
// { color: '#333', fontSize: '16px', textAlign: 'center' }
// → 'color:#333;font-size:16px;text-align:center'

// 每个模块一个导出函数，统一签名：接收 module，返回 inline-styled HTML string
export function renderText(module: Module): string
export function renderImage(module: Module): string
export function renderDivider(module: Module): string
export function renderButton(module: Module): string
export function renderContainer(module: Module): string
export function renderHeader(module: Module): string
export function renderFooter(module: Module): string
export function renderHeading(module: Module): string
export function renderToc(module: Module): string
export function renderQuote(module: Module): string
export function renderMarkdown(module: Module): string

// 统一入口
export function renderModule(module: Module): string
// 根据 module.type 分发到具体 renderer
```

## 各模块渲染细节

### text 模块

**输入**: `TextModuleProps { content: string, icon?: string }` + `ModuleStyles`

**输出**: 外层 div 上应用 `module.styles` 的 style（padding, bg, border, margin, fontFamily），内层 div 应用字体样式（fontSize, color, fontWeight, lineHeight, textAlign）。icon 存在时在内容上方渲染一个 `<p>`。

- `props.content` 已经是 TipTap 产生的 HTML，直接透出
- `paragraphSpacing` 通过 `--paragraph-spacing` 在 Vue 中用 CSS 处理；导出中将其应用于段落间距

### image 模块

**输入**: `ImageModuleProps { src, alt, width?, height?, align?, caption?, captionStyle? }` + `ModuleStyles`

**输出**:
- 外层 div：`margin` 从 styles 取，`text-align` 按 `props.align`（默认 'center'）
- img 标签：`src`, `alt`, `width`, `height` 从 props 取；`border-radius` 从 styles 取，`margin: 0 auto` 配合外层 text-align
- caption 存在时：下方 `<p>` 应用 `captionStyle` 中的 fontSize/color/italic/textAlign

### divider 模块

**输入**: `DividerModuleProps { style: 'solid'|'dashed'|'dotted', color: string }`

**输出**:
- `<hr>` 标签
- `border-top` 组合 `props.style`（solid/dashed/dotted）和 `props.color`
- `margin` 从 styles 取

### button 模块

**输入**: `ButtonModuleProps { text, link, size: 'small'|'medium'|'large' }` + `ModuleStyles`

**输出**:
- `<a>` 标签（即使 link 为空也渲染，WeChat 不支持链接跳转，但保留 a 标签作为结构）
- `style="display:inline-block"`
- 尺寸映射：`small → padding:8px 16px;font-size:14px`, `medium → padding:12px 24px;font-size:16px`, `large → padding:16px 32px;font-size:18px`
- 背景色从 `module.styles.backgroundColor` 取，默认 '#3b82f6'
- 文字颜色从 `module.styles.color` 取，默认 '#ffffff'
- 圆角从 `module.styles.borderRadius` 取
- 外层 text-align 控制居中

### container 模块

**输入**: `ContainerModuleProps { layout: 'single'|'two-column'|'three-column' }` + `children: Module[]`

**输出**:
- `single`：直接拼接子模块 HTML
- `two-column` / `three-column`：用 `<table><tr><td>` 布局（WeChat 兼容）
  - 每个 td width = `100/N %`，`padding:0 8px`，`vertical-align:top`
  - WeChat 编辑器中 grid 布局不支持，table 布局是标准写法
- 递归调用 `renderModule(child)` 渲染每个子模块

### header 模块 — 4 variants

**所有 variant 共享**: 外层 div 应用 `module.styles`（padding, bg, border, borderRadius, margin, textAlign, fontFamily）。title 和 subtitle 的 RichTextEditor 内容直接透出。

#### variant: default
- title（props.title）：富文本，fontSize 默认 24px，color 默认 '#1f2937'，fontWeight bold
- subtitle（props.subtitle，可选）：15px，'#6b7280'
- meta 栏：作者和日期，13px，'#9ca3af'，flex 布局（点分隔符由 CSS 实现，导出中用 span + 点分隔）

#### variant: magazine
- 顶部红色 accent bar：40x4px，#dc2626，圆角2px，居中
- subtitle（可选）：13px，500 weight，letterSpacing 2px，color '#dc2626'
- title：28px，800 weight，letterSpacing -0.5px
- 分隔线：60x3px，#e5e7eb，居中
- meta 栏：13px，'#9ca3af'，flex gap 16px

#### variant: minimal
- title：26px，700 weight，'#111827'，textAlign 默认 left
- meta 栏：日期和作者，13px，'#9ca3af'，flex gap 16px，textAlign 默认 left
- 无 subtitle

#### variant: card
- 内层 div（card-inner）：padding 32px 24px，bg 默认 '#1f2937'，圆角 12px
- title：白色 '#ffffff'
- subtitle（可选）：14px，rgba(255,255,255,0.75)
- meta 栏：12px，rgba(255,255,255,0.55)，flex gap 16px 居中

### footer 模块 — 4 variants

#### variant: default
- 可选分割线（showDivider）：border-top 1px solid #e5e7eb
- text（可选）：fontSize 默认 13px，color 默认 '#6b7280'
- copyright：12px，'#9ca3af'

#### variant: simple
- 上方装饰线：40x2px，#d1d5db，居中
- copyright：12px，'#9ca3af'
- 无 text

#### variant: branded
- 内层：padding 24px，圆角 12px，bg 默认 '#f8fafc'
- logo emoji：📰，28px
- text（可选）：14px，'#4b5563'
- copyright（可选）：12px，'#9ca3af'
- 三个社交圆点：8x8px，#d1d5db，flex gap 8px

#### variant: cta
- 内层：padding 24px，圆角 12px，bg 默认 '#fef2f2'，border 1px dashed '#fecaca'
- text（可选）：15px，500 weight，color 默认 '#991b1b'
- CTA 按钮：`<span>` 模拟按钮，padding 10px 24px，bg '#dc2626'，白色文字，圆角 24px，文字固定 "👍 点赞 · 💬 留言 · ⭐ 收藏"
- copyright（可选）：12px，'#9ca3af'

### heading 模块 — 4 variants

**所有 variant 共享**: 外层 div 应用 styles。headingStyle：fontSize 按 level 映射 `{1:'24px',2:'20px',3:'18px',4:'16px',5:'15px',6:'14px'}`，color 默认 '#111827'，fontWeight bold，lineHeight 1.4。

**编号前缀**（showNumbering=true 时）：level 映射 `{1:'一、',2:'1.',3:'(1)',4:'• ',5:'- ',6:'* '}`。按 level 颜色 `{1:'#3b82f6',2:'#6366f1',3:'#8b5cf6',4:'#06b6d4',5:'#10b981',6:'#f59e0b'}`。

#### variant: simple
- 直接输出 headingStyle + 可选编号前缀

#### variant: numbered
- flex 容器，左侧 4px 竖条（圆角2px，颜色按 level）+ 右侧文字
- 编号前缀显示在文字前
- 不使用 CSS flex — 改用 table 或 inline-block 实现（WeChat 兼容）

#### variant: left-bar
- 同 numbered 布局，无编号前缀

#### variant: center
- 居中 flex column 布局，上下各一条 60x2px 装饰线（#e5e7eb）
- 编号前缀显示在文字前
- 同上，不使用 CSS flex — 外层 text-align:center + block 元素处理

### toc 模块 — 4 variants

#### variant: default
- 标题：16px bold，底部 border-bottom 2px solid #e5e7eb
- 列表项：li 水平 flex，paddingLeft = level*16px
- 圆点：6px 圆，level 0 → '#3b82f6' bold 14px，其余 '#93c5fd' normal 13px

#### variant: numbered
- 标题：16px 600 weight，带 📑 图标
- 列表项：ol 模拟（手动编号 counter），level 0 字体 14px 500 weight，其余 13px
- 序号颜色 'theme' 色，默认 'level 0 → #3b82f6，其余 #d1d5db'
- paddingLeft = level*20px

#### variant: card
- 内层：padding 20px，borderRadius 10px，border 默认 1px solid #e5e7eb，box-shadow 0 1px 3px rgba(0,0,0,0.05)
- 标题：15px 600 weight，左侧 4x16px 蓝色竖条
- 列表项：flex 行，padding 8px 0，底部 border-bottom 1px solid #f3f4f6，最后一项无 border
- 序号：11px 600 weight '#d1d5db'，第一项序号颜色 '#3b82f6'
- 文字：13px '#4b5563'

#### variant: minimal
- 标题：14px 600 weight，letterSpacing 1px
- 列表项：padding 5px 0，paddingLeft = level*12px
- 装饰横线：12x1px '#d1d5db'
- 文字：13px '#6b7280'

### quote 模块

**输入**: `QuoteModuleProps { content: string, author?: string }` + `ModuleStyles`

**输出**:
- 外层 div：padding 默认 '16px 20px'，borderLeft 默认 '4px solid #3b82f6'，borderRadius 默认 '0 8px 8px 0'
- 内容区：fontSize 默认 15px，color 默认 '#4b5563'，fontStyle 默认 italic，lineHeight 1.8
- author 存在时：右对齐 13px '#9ca3af'，前缀 "—— "

### markdown 模块

**输入**: `MarkdownModuleProps { content: string }` + `ModuleStyles`

**输出**:
- 外层 div 应用 styles
- 内层用 `marked.parse(props.content)` 渲染成 HTML
- 渲染结果需要后处理：给所有生成的 `<p>`, `<h1-4>`, `<ul>`, `<ol>`, `<blockquote>`, `<pre>`, `<code>`, `<table>` 等元素添加内联样式
- 样式规则对齐 MarkdownModule.vue 中的 :deep 样式

## 复用策略 — Vue 组件改造

每个 `*Module.vue` 的**预览模式**调用对应 renderer：

```typescript
// HeaderModule.vue 预览时
import { renderHeader } from '@/renderers/header'
const exportHtml = computed(() => renderHeader(props.module))
```

具体改造方式：
1. 每个 Vue 组件新增一个 `exportHtml` computed，保持现有编辑模式逻辑不变
2. 预览模式下（`isPreviewMode` 为 true），用 `v-html` 渲染 `exportHtml` 替代当前的手写模板
3. 这样预览和导出使用同一份渲染代码

**注意**: 编辑模式下继续使用 TipTap RichTextEditor，不受影响。

## 导出函数改造

### 新 `generateHTMLFromDocument()`

```typescript
import { renderModule } from '@/renderers'

function generateHTMLFromDocument(document: Document): string {
  const children = document.root.children || []
  const bodyHtml = children.map(child => renderModule(child)).join('')

  // 页面级包装：直接内联样式，不再需要 <style> 标签
  const pageBg = document.pageStyles?.backgroundColor || '#ffffff'
  const pageTitleColor = '#1f2937'
  const pageMetaColor = '#9ca3af'

  return `
<section style="max-width:640px;margin:0 auto;background-color:${pageBg};padding:16px;color:#333">
  <section style="font-weight:bold;color:${pageTitleColor};margin:0 0 8px 0">
    ${document.title}
  </section>
  <section style="color:${pageMetaColor};margin:0 0 20px 0;padding-bottom:16px;border-bottom:1px solid #eee">
    ${document.updatedAt || document.createdAt || ''}
  </section>
  ${bodyHtml}
</section>`
}
```

不再依赖 `juice` 库。所有样式直接以内联属性形式嵌入。

如果 juice 已被用作安全网（处理某些内联样式中由 Markdown 渲染产生的 class），可保留但不作为主路径依赖。

## 文件改动清单

### 新增文件
| 文件 | 内容 |
|---|---|
| `frontend/src/renderers/index.ts` | `renderModule()` 入口 dispatcher |
| `frontend/src/renderers/utils.ts` | `inlineStyle()` 等工具函数 |
| `frontend/src/renderers/text.ts` | `renderText()` |
| `frontend/src/renderers/image.ts` | `renderImage()` |
| `frontend/src/renderers/divider.ts` | `renderDivider()` |
| `frontend/src/renderers/button.ts` | `renderButton()` |
| `frontend/src/renderers/container.ts` | `renderContainer()` |
| `frontend/src/renderers/header.ts` | `renderHeader()` + 4 variants |
| `frontend/src/renderers/footer.ts` | `renderFooter()` + 4 variants |
| `frontend/src/renderers/heading.ts` | `renderHeading()` + 4 variants |
| `frontend/src/renderers/toc.ts` | `renderToc()` + 4 variants |
| `frontend/src/renderers/quote.ts` | `renderQuote()` |
| `frontend/src/renderers/markdown.ts` | `renderMarkdown()` |

### 修改文件
| 文件 | 改动 |
|---|---|
| `frontend/src/services/api.ts` | 重写 `generateHTMLFromDocument()`，调用 renderers 替代独立模板 |
| `frontend/src/components/modules/TextModule.vue` | 预览模式使用 `renderText()` v-html |
| `frontend/src/components/modules/ImageModule.vue` | 同上 |
| `frontend/src/components/modules/DividerModule.vue` | 同上 |
| `frontend/src/components/modules/ButtonModule.vue` | 同上 |
| `frontend/src/components/modules/ContainerModule.vue` | 预览模式递归使用 renderers |
| `frontend/src/components/modules/HeaderModule.vue` | 预览模式使用 `renderHeader()` |
| `frontend/src/components/modules/FooterModule.vue` | 预览模式使用 `renderFooter()` |
| `frontend/src/components/modules/HeadingModule.vue` | 预览模式使用 `renderHeading()` |
| `frontend/src/components/modules/TocModule.vue` | 预览模式使用 `renderToc()` |
| `frontend/src/components/modules/QuoteModule.vue` | 预览模式使用 `renderQuote()` |
| `frontend/src/components/modules/MarkdownModule.vue` | 预览模式使用 `renderMarkdown()` |

### 可选删除
| 文件 | 原因 |
|---|---|
| `frontend/package.json` 中 `juice` 依赖 | 不再依赖（可保留备用，不主动删除） |

## 测试策略

每个 renderer 是纯函数，可以直接单元测试：

```typescript
// renderText 测试示例
test('renderText with icon and content', () => {
  const module = createModule('text')
  module.props.content = '<p>Hello</p>'
  module.props.icon = '🔥'
  const html = renderText(module)
  expect(html).toContain('🔥')
  expect(html).toContain('Hello')
  expect(html).toContain('style=')
})

// 每个 variant 至少一个测试用例
test('renderHeader magazine variant', () => {
  const module = createModule('header')
  module.props.variant = 'magazine'
  module.props.title = 'Title'
  module.props.subtitle = 'Subtitle'
  const html = renderHeader(module)
  expect(html).toContain('Title')
  // 验证 variant 专属元素
  expect(html).toContain('Magazine')
})
```

不需要 DOM 环境，纯字符串匹配即可。

## 实施顺序

1. 创建 `renderers/utils.ts`（`inlineStyle` 等工具函数）
2. 逐个实现渲染器（从简单到复杂：divider → text → quote → image → button → heading → markdown → container → toc → footer → header）
3. 创建 `renderers/index.ts`（入口 dispatcher）
4. 重写 `generateHTMLFromDocument()` 使用 renderers
5. 逐个改造 Vue 组件（预览模式切换使用 renderers）
6. 验证：导出 HTML 粘贴到 WeChat 编辑器检查渲染效果

## 非目标

- 不改变编辑模式下的 TipTap 富文本编辑器行为
- 不改变模块的数据结构（`Module`, `Document` 等接口）
- 不删除 `juice` 依赖（保留作为备用，但不再主路径使用）
- 不涉及后端导出修改（`backend/internal/service/html_generator.go` 保持不变）
