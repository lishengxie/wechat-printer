# Markdown 导入使用说明

公众号编辑器支持把 `.md` 文件一键导入为可视化的模块化文章。除了标准 Markdown 写法，我们还提供 `:::type` 围栏语法来直接生成引用、按钮、分隔线等高级模块。

## 快速开始

1. 准备一个 `.md` 文件（UTF-8 编码，CRLF 或 LF 行结尾均可）。
2. 在"我的文章"页面点击 **📄 导入 Markdown**，选择文件。
3. 导入成功后会自动跳转到编辑器，可继续调整模块顺序与样式。

> 文件超过 1 MB 仍可导入，但解析会稍慢。本地图片（非 `http(s)://` / `data:` / `blob:`）不会被上传，需在编辑器中手动替换。

## 标准 Markdown 映射

| 你写的 | 解析为 |
| --- | --- |
| `# 标题` / `## 标题` … | heading 模块（level = #数量） |
| 普通段落 | text 模块（保留 `**粗体**` `*斜体*` `` `行内代码` `` 等内联格式） |
| `> 引用文字` | quote 模块 |
| 单独成段的 `![alt](src)` | image 模块 |
| `---` 或 `***` | divider 模块 |
| 代码块（三个反引号） | text 模块（包裹 `<pre><code>`） |
| 有序 / 无序列表 | text 模块（用 `•` 拼接行） |

段落里嵌图片不会被识别为独立 image 模块，会保留为段落里的 `<img>`。

## `:::` 自定义模块语法

通用格式：

```
:::type key="value" key2="value2"
可选的内容文本
:::
```

规则：

- 开围栏与闭围栏可以有任意前导空白（缩进的 `.md` 也能识别）。
- 属性值必须用**双引号**括起。
- 不识别的 `type` 会降级为 text 模块，内容为占位文字。
- 闭围栏 `:::` 必须独占一行。

## 支持的模块类型

### quote — 引用

属性：`author`（作者署名）。内容文本作为引文正文。

```
:::quote author="爱因斯坦"
想象力比知识更重要
:::
```

### image — 图片

属性：`src`（必填）、`alt`、`caption`。

```
:::image src="https://picsum.photos/640/360" alt="风景" caption="示例图"
:::
```

### divider — 分隔线

属性：`style`（`solid` / `dashed` / `dotted`）、`color`。

```
:::divider style="dashed"
:::
```

### button — 按钮

属性：`text`（按钮文字）、`link`（跳转链接）、`size`（`small` / `medium` / `large`）。

```
:::button text="立即购买" link="https://example.com" size="large"
:::
```

### heading — 标题

属性：`text`（也可写在内容里）、`level`（1-6）、`variant`、`showNumbering`（`true` / `false`）。

```
:::heading text="第一章" level="2"
:::
```

### header — 文章页眉

属性：`title`、`subtitle`、`author`、`variant`。

```
:::header title="本周精选" subtitle="编辑推荐" author="编辑部"
:::
```

### footer — 文章页脚

属性：`text`、`copyright`、`variant`。

```
:::footer text="感谢阅读" copyright="© 2026 公众号"
:::
```

### toc — 目录

属性：`title`、`variant`。

```
:::toc title="目录"
:::
```

## 常见问题

**为什么我的 `:::xxx` 没识别？**
- 检查闭围栏 `:::` 是否独占一行。
- 检查属性值是否用双引号括起（`key="value"`，不是 `key='value'` 也不是 `key=value`）。
- 不在支持列表里的 `type` 会被当成 text 模块，并显示 `[未知模块类型: xxx]` 占位。

**为什么图片显示是占位？**
导入服务只把 `http(s)://`、`data:`、`blob:` 视为有效的远程图片地址。本地路径（如 `./img/cover.png`）只统计数量并提示，不会上传，需在编辑器中替换为已上传图片的 URL。

**Windows 保存的 .md 也能导入吗？**
可以。导入服务会自动把 `\r\n` 归一化为 `\n`。

## 完整示例

把下面这段保存为 `demo.md` 并导入，体验所有模块类型：

```markdown
# 欢迎阅读

这是一段**粗体**和*斜体*的文字，还有`行内代码`。

:::quote author="爱因斯坦"
想象力比知识更重要
:::

:::image src="https://picsum.photos/640/360" alt="风景"
:::

:::divider style="dashed"
:::

## 第一章

普通段落内容。

:::button text="立即购买" link="https://example.com" size="large"
:::
```
