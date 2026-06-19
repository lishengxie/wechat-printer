package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
	"wechat-layout/internal/model"
)

const systemPrompt = `你是一个微信公众号文章排版助手。你的任务是根据用户的请求，修改指定的模块(module)的样式和属性。

模块(module)的 JSON 结构如下:
{
  "id": "模块唯一标识",
  "type": "模块类型",
  "props": { /* 模块特有属性，见下方 */ },
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
2. 可以修改 styles、props、type 甚至 children（如果是 container 类型）
3. 如果用户要求替换组件类型（如把文本改为按钮），可以直接修改 type 和对应的 props
4. 返回的 JSON 必须是完整的 module 对象
5. 使用微信推文安全的样式（避免使用不支持的内联样式如 background-image、box-shadow 等）
6. 风格应适合微信公众号文章，不过度花哨

请用以下 JSON 格式返回:
{
  "explanation": "用中文说明你做了哪些修改",
  "updatedModule": { /* 完整的更新后的 module 对象 */ }
}

只返回 JSON，不要加其他说明文字。`

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

// LLMConfig holds configuration for the LLM API
type LLMConfig struct {
	APIKey  string
	APIBase string
	Model   string
}

// getLLMConfig reads configuration from env vars and DB config
func getLLMConfig(dbCfg *model.AIConfig) LLMConfig {
	// Env vars take precedence over DB config
	apiKey := os.Getenv("LLM_API_KEY")
	apiBase := os.Getenv("LLM_API_BASE")
	model := os.Getenv("LLM_MODEL")

	if apiKey == "" && dbCfg != nil {
		apiKey = dbCfg.APIKey
	}
	if apiBase == "" && dbCfg != nil && dbCfg.APIBase != "" {
		apiBase = dbCfg.APIBase
	}
	if model == "" && dbCfg != nil && dbCfg.Model != "" {
		model = dbCfg.Model
	}

	if apiBase == "" {
		apiBase = "https://api.openai.com/v1"
	}
	if model == "" {
		model = "gpt-4o"
	}

	return LLMConfig{
		APIKey:  apiKey,
		APIBase: strings.TrimRight(apiBase, "/"),
		Model:   model,
	}
}

// chatMessage represents a message in the chat completion request
type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
}

type chatChoice struct {
	Message chatMessage `json:"message"`
}

type chatResponse struct {
	Choices []chatChoice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// CallLLM sends a prompt to the LLM and returns the response
func CallLLM(systemPrompt, userPrompt string, dbCfg *model.AIConfig) (string, error) {
	cfg := getLLMConfig(dbCfg)
	if cfg.APIKey == "" {
		return "", fmt.Errorf("LLM_API_KEY 未配置，请在 AI 助手页面中设置 API Key")
	}

	reqBody := chatRequest{
		Model: cfg.Model,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: 0.7,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", cfg.APIBase+"/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("call LLM API: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	var chatResp chatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	if chatResp.Error != nil {
		return "", fmt.Errorf("LLM API error: %s", chatResp.Error.Message)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("LLM returned no choices")
	}

	return chatResp.Choices[0].Message.Content, nil
}

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

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
