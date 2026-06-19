package model

// AIChatRequest 发送给 AI 的聊天请求
type AIChatRequest struct {
	Prompt string `json:"prompt" binding:"required"`
	Module string `json:"module" binding:"required"` // 当前模块的 JSON
	Mode   string `json:"mode"`                       // "style" | "full", 默认 "full"
}

// AIChatResponse AI 返回的响应
type AIChatResponse struct {
	Explanation   string `json:"explanation"`
	UpdatedModule string `json:"updated_module"` // 更新后的模块 JSON
}

// AIConfig AI 配置
type AIConfig struct {
	APIKey  string `json:"api_key"`
	APIBase string `json:"api_base"`
	Model   string `json:"model"`
}
