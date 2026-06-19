# AI Style Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "style mode" toggle to the AI chat panel so users can switch between full module editing and style-only editing.

**Architecture:** Frontend sends a `mode` field (`'style'` | `'full'`) alongside the prompt and module. Backend selects a different system prompt when `mode=style`, instructing LLM to keep the module type unchanged. Frontend also enforces type preservation when applying changes in style mode.

**Tech Stack:** Go (Gin), Vue 3 (Pinia), TypeScript

---

### Task 1: Add `mode` field to backend model

**Files:**
- Modify: `backend/internal/model/ai.go:4-7`

- [ ] **Step 1: Add Mode field to AIChatRequest**

  Add a `Mode` field to the request struct:

  ```go
  // AIChatRequest 发送给 AI 的聊天请求
  type AIChatRequest struct {
  	Prompt string `json:"prompt" binding:"required"`
  	Module string `json:"module" binding:"required"` // 当前模块的 JSON
  	Mode   string `json:"mode"`                       // "style" | "full", 默认 "full"
  }
  ```

- [ ] **Step 2: Build and verify**

  Run: `cd backend && go build ./...`
  Expected: no errors

- [ ] **Step 3: Commit**

  ```bash
  git add backend/internal/model/ai.go
  git commit -m "feat: add mode field to AIChatRequest model"
  ```

---

### Task 2: Add style mode system prompt to backend service

**Files:**
- Modify: `backend/internal/service/ai.go`

- [ ] **Step 1: Add `styleModePrompt` constant after existing `systemPrompt`**

  Add the following new constant (before `LLMConfig` struct):

  ```go
  const styleModePrompt = `你是一个微信公众号文章排版助手。你的任务是根据用户的请求，修改指定模块(module)的样式和内容，但保持模块类型(type)不变。

  模块(module)的 JSON 结构如下:
  {
    "id": "模块唯一标识",
    "type": "模块类型",
    "props": { /* 模块特有属性 */ },
    "children": [ /* 仅 container 类型有子模块数组 */ ],
    "styles": {
      "margin": "外边距, 如 '0 0 16px 0'",
      "padding": "内边距, 如 '16px'",
      "backgroundColor": "背景色",
      "border": "边框, 如 '1px solid #e5e7eb'",
      "borderRadius": "圆角, 如 '8px'",
      "textAlign": "文本对齐: 'left'|'center'|'right'",
      "fontSize": "字号, 如 '16px'",
      "color": "文字颜色",
      "fontWeight": "字重: 'normal'|'bold'",
      "lineHeight": "行高, 如 '1.6'"
    }
  }

  模块类型(type)及其特有属性(props):
  - header: { title, subtitle, author, date, showDate(bool), showAuthor(bool), variant('default'|'magazine'|'minimal'|'card') }
  - text: { content: "HTML文本内容，可包含 <strong>、<em>、<br/> 等标签" }
  - image: { src, alt, width?, height?, caption?, captionStyle{fontSize?, color?, italic?, textAlign?} }
  - divider: { style('solid'|'dashed'|'dotted'), color }
  - button: { text, link, size('small'|'medium'|'large') }
  - container: { layout('single'|'two-column'|'three-column') }, 有 children 数组
  - footer: { text, copyright, showDivider(bool), variant('default'|'simple'|'branded'|'cta') }
  - toc: { title, items[{text, level}], variant('default'|'numbered'|'card'|'minimal') }
  - heading: { text, level(1-6), variant('numbered'|'left-bar'|'center'|'simple'), showNumbering(bool) }

  重要规则:
  1. 保持 module 的 id 不变
  2. 保持 module 的 type 不变（绝对不能改变模块类型）
  3. 可以修改 styles 中的所有字段（颜色、边距、字体、背景等）
  4. 可以修改 props 中的内容和文本（如 text 的 content、header 的 title 等）
  5. 如果是 container 类型，可以修改 children（子模块）
  6. 返回的 JSON 必须是完整的 module 对象
  7. 使用微信推文安全的样式（避免使用不支持的内联样式如 background-image、box-shadow 等）
  8. 风格应适合微信公众号文章，不过度花哨

  请用以下 JSON 格式返回:
  {
    "explanation": "用中文说明你做了哪些修改",
    "updatedModule": { /* 完整的更新后的 module 对象 */ }
  }

  只返回 JSON，不要加其他说明文字。`
  ```

- [ ] **Step 2: Build and verify**

  Run: `cd backend && go build ./...`
  Expected: no errors

- [ ] **Step 3: Commit**

  ```bash
  git add backend/internal/service/ai.go
  git commit -m "feat: add style mode system prompt for AI service"
  ```

---

### Task 3: Update `GenerateModuleSuggestion` to accept mode parameter

**Files:**
- Modify: `backend/internal/service/ai.go:182-225`

- [ ] **Step 1: Change function signature and add prompt selection**

  Replace `GenerateModuleSuggestion` function:

  ```go
  // GenerateModuleSuggestion sends module data + prompt to LLM and returns suggestion
  func GenerateModuleSuggestion(moduleJSON, prompt, mode string, dbCfg *model.AIConfig) (explanation, updatedModule string, err error) {
  	userPrompt := fmt.Sprintf("Current module:\n%s\n\nUser request: %s", moduleJSON, prompt)

  	selectedPrompt := systemPrompt
  	if mode == "style" {
  		selectedPrompt = styleModePrompt
  	}

  	content, err := CallLLM(selectedPrompt, userPrompt, dbCfg)
  	if err != nil {
  		return "", "", err
  	}

  	// Parse LLM response as JSON
  	var result struct {
  		Explanation   string `json:"explanation"`
  		UpdatedModule string `json:"updatedModule"`
  	}

  	// The LLM may return JSON wrapped in markdown code blocks
  	cleaned := content
  	if idx := strings.Index(cleaned, "```"); idx >= 0 {
  		cleaned = cleaned[idx:]
  		// Remove opening ```json or ```
  		if end := strings.Index(cleaned, "\n"); end >= 0 {
  			cleaned = cleaned[end+1:]
  		}
  		if end := strings.LastIndex(cleaned, "```"); end >= 0 {
  			cleaned = cleaned[:end]
  		}
  	}
  	cleaned = strings.TrimSpace(cleaned)

  	if err := json.Unmarshal([]byte(cleaned), &result); err != nil {
  		// Try parsing with updated_module field name
  		var altResult struct {
  			Explanation   string          `json:"explanation"`
  			UpdatedModule json.RawMessage `json:"updatedModule"`
  		}
  		if err2 := json.Unmarshal([]byte(cleaned), &altResult); err2 != nil {
  			return "", "", fmt.Errorf("parse LLM response: %w (raw: %s)", err, cleaned[:min(200, len(cleaned))])
  		}
  		moduleBytes, _ := json.Marshal(altResult.UpdatedModule)
  		return altResult.Explanation, string(moduleBytes), nil
  	}

  	return result.Explanation, result.UpdatedModule, nil
  }
  ```

  The only change from the original: added `mode string` parameter, and uses `styleModePrompt` when `mode == "style"`.

- [ ] **Step 2: Build and verify**

  Run: `cd backend && go build ./...`
  Expected: no errors

- [ ] **Step 3: Commit**

  ```bash
  git add backend/internal/service/ai.go
  git commit -m "refactor: add mode parameter to GenerateModuleSuggestion"
  ```

---

### Task 4: Update AI handler to pass mode

**Files:**
- Modify: `backend/internal/handler/ai.go:38`

- [ ] **Step 1: Pass mode from request to service**

  Change line 38 from:
  ```go
  explanation, updatedModule, err := service.GenerateModuleSuggestion(req.Module, req.Prompt, dbCfg)
  ```
  to:
  ```go
  mode := "full"
  if req.Mode == "style" {
  	mode = "style"
  }
  explanation, updatedModule, err := service.GenerateModuleSuggestion(req.Module, req.Prompt, mode, dbCfg)
  ```

- [ ] **Step 2: Build and verify**

  Run: `cd backend && go build ./...`
  Expected: no errors

- [ ] **Step 3: Commit**

  ```bash
  git add backend/internal/handler/ai.go
  git commit -m "feat: pass mode from request to AI service"
  ```

---

### Task 5: Add `mode` to frontend API types

**Files:**
- Modify: `frontend/src/services/api.ts:367-375`

- [ ] **Step 1: Add `mode` field to AIChatRequest and apiAI.chat**

  Update the interface:
  ```typescript
  export interface AIChatRequest {
    prompt: string
    module: any
    mode?: 'style' | 'full'
  }
  ```

  Update `apiAI.chat` to pass mode (line 384-392):
  ```typescript
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add frontend/src/services/api.ts
  git commit -m "feat: add mode field to frontend AI chat API"
  ```

---

### Task 6: Update AIChatDialog with mode toggle UI

**Files:**
- Modify: `frontend/src/components/AIChatDialog.vue`

- [ ] **Step 1: Add mode state and mode toggle UI**

  Add a `mode` ref after the existing state declarations (after `const messagesRef`):

  ```typescript
  const mode = ref<'style' | 'full'>('full')
  ```

- [ ] **Step 2: Pass mode in sendMessage**

  Update the `apiAI.chat` call inside `sendMessage()` (line 74-77):

  ```typescript
  const result = await apiAI.chat({
    prompt: text,
    module: props.selectedModule,
    mode: mode.value
  })
  ```

- [ ] **Step 3: Update applyChanges to preserve type in style mode**

  Replace `applyChanges` function:

  ```typescript
  function applyChanges(suggestedModule: Module) {
    if (!suggestedModule) return
    const selected = props.selectedModule
    if (!selected) return
    // 样式模式下强制保持模块类型不变
    const merged = {
      ...suggestedModule,
      id: selected.id,
      ...(mode.value === 'style' ? { type: selected.type } : {})
    }
    documentStore.replaceModule(merged)
  }
  ```

- [ ] **Step 4: Add mode toggle tabs to template**

  Add the mode toggle HTML between the toggle bar and the messages area. Insert after the `<Transition name="panel-slide">` div's opening and before the messages div:

  ```html
  <!-- Mode Tabs -->
  <div class="ai-mode-tabs">
    <button
      class="ai-mode-tab"
      :class="{ active: mode === 'full' }"
      @click="mode = 'full'"
    >
      <span class="tab-label">完整模式</span>
      <span class="tab-desc">可修改任意内容</span>
    </button>
    <button
      class="ai-mode-tab"
      :class="{ active: mode === 'style' }"
      @click="mode = 'style'"
    >
      <span class="tab-label">样式模式</span>
      <span class="tab-desc">仅修改样式和内容</span>
    </button>
  </div>
  ```

- [ ] **Step 5: Add mode tab styles**

  Add the following CSS before `.ai-input-row` styles (at around line 368):

  ```css
  .ai-mode-tabs {
    display: flex;
    gap: 4px;
    padding: 8px 16px 0;
    background: #fafafa;
    flex-shrink: 0;
  }

  .ai-mode-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .ai-mode-tab:hover {
    border-color: #c4b5fd;
  }

  .ai-mode-tab.active {
    border-color: #7c3aed;
    background: #f5f3ff;
  }

  .tab-label {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
  }

  .ai-mode-tab.active .tab-label {
    color: #7c3aed;
  }

  .tab-desc {
    font-size: 10px;
    color: #9ca3af;
  }

  .ai-mode-tab.active .tab-desc {
    color: #a78bfa;
  }
  ```

- [ ] **Step 6: Add mode label to assistant messages**

  Update the assistant message template to show mode label. Find the section for assistant message body and add:

  ```html
  <div v-if="msg.role === 'assistant' && msg.mode" class="msg-mode-label">
    {{ msg.mode === 'style' ? '🎨 样式模式' : '🔧 完整模式' }}
  </div>
  ```

  Also add `mode` to the `ChatMessage` interface:
  ```typescript
  interface ChatMessage {
    role: 'user' | 'assistant'
    text: string
    suggestedModule?: Module
    mode?: string
  }
  ```

  And save the mode when pushing assistant messages:
  ```typescript
  messages.value.push({
    role: 'assistant',
    text: result.explanation,
    suggestedModule: updatedModule,
    mode: mode.value
  })
  ```

- [ ] **Step 7: Add mode label CSS**

  ```css
  .msg-mode-label {
    font-size: 10px;
    color: #9ca3af;
    margin-bottom: 4px;
  }
  ```

- [ ] **Step 8: Commit**

  ```bash
  git add frontend/src/components/AIChatDialog.vue
  git commit -m "feat: add style mode toggle to AI chat dialog"
  ```

---

### Task 7: Build and verify the full project

**Files:**
- Both backend and frontend

- [ ] **Step 1: Build backend**

  Run: `cd backend && go build ./...`
  Expected: no errors

- [ ] **Step 2: Build frontend**

  Run: `cd frontend && npm run build`
  Expected: no errors

- [ ] **Step 3: Commit any remaining changes**

  ```bash
  git status
  git add -A
  git commit -m "chore: final build verification"
  ```
