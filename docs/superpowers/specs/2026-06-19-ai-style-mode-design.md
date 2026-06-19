# AI 样式模式设计文档

## 概述

在现有 AI 聊天面板中增加"样式模式"切换开关，让用户可以选择让 AI 只修改模块的样式和内容，而不改变模块类型和结构。

## 需求

- 用户在编辑器中选择一个模块后，打开 AI 聊天面板
- 通过切换开关选择"样式模式"或"完整模式"
- 样式模式下，AI 可以修改模块的样式字段和 HTML 内容，但保持模块类型不变
- 完整模式下，AI 有完全的自由度（现有行为）

## 前端变更

### AIChatDialog.vue

**新增状态：**
- `mode: 'style' | 'full'` — 当前模式，默认 `'full'`

**UI 变更：**
- 输入框上方增加模式切换开关（两个 Tab 按钮："样式模式" / "完整模式"）
- 每条 AI 回复消息显示模式标签

**行为变更：**
- `sendMessage()` 发送请求时带入 `mode` 字段
- `applyChanges()` 在样式模式下强制保持 `module.type` 不变
- 切换模式不清空聊天记录（只有选中模块变更时重置）

### services/api.ts

```typescript
interface AIChatRequest {
  prompt: string
  module: any
  mode: 'style' | 'full'  // 新增
}
```

## 后端变更

### internal/service/ai.go

**新增：**
- `mode=style` 时的独立系统提示词，规则：
  - 可以修改：`ModuleStyles` 全部字段
  - 可以修改：模块的 `props` 中的内容和文本
  - 禁止修改：模块的 `type` 字段（必须与原始一致）
  - 禁止修改：模块的 `id` 字段
- 后端校验：LLM 返回后检查 `type` 是否一致，不一致则修正

## 数据流

```
用户切换模式 -> mode state 更新
用户输入提示 -> sendMessage({ prompt, module, mode })
  -> API POST /api/ai/chat { prompt, module, mode }
  -> 后端根据 mode 选择系统提示词
  -> LLM 返回 { explanation, updatedModule }
  -> 后端校验 type 一致性
  -> 前端收到响应，显示
  -> 用户点击"应用"
  -> applyChanges() 合并到 document（样式模式下保持 type）
```

## 错误处理

- LLM 返回的 JSON 解析失败：与现有逻辑一致，重试或报错
- LLM 修改了 type：后端自动修正 + 在 explanation 中提示用户
