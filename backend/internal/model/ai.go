package model

// AIChatRequest 发送给 AI 的聊天请求
type AIChatRequest struct {
	Prompt string `json:"prompt" binding:"required"`
	Module string `json:"module"`   // 当前模块的 JSON（模块编辑时传入，页面编辑时可为空）
	Mode   string `json:"mode"`     // "style" | "full" | "page", 默认 "full"
}

// AIChatResponse AI 返回的响应
type AIChatResponse struct {
	Explanation       string `json:"explanation"`
	UpdatedModule     string `json:"updated_module"`     // 更新后的模块 JSON（模块模式）
	UpdatedPageStyles string `json:"updated_page_styles"` // 更新后的页面样式 JSON（页面模式）
}

// AIConfig AI 配置
type AIConfig struct {
	APIKey  string `json:"api_key"`
	APIBase string `json:"api_base"`
	Model   string `json:"model"`
}
