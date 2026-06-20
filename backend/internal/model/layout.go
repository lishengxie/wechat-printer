package model

import "time"

// Layout 表示一个公众号排版模板
type Layout struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Content     string    `json:"content"`    // 排版内容（JSON格式的组件配置）
	CSS         string    `json:"css"`        // 自定义样式
	HTML        string    `json:"html"`       // 生成的 HTML
	IsPreset    bool      `json:"is_preset"`  // 是否为预设模板
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateLayoutRequest 创建排版的请求
type CreateLayoutRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Content     string `json:"content"`
	CSS         string `json:"css"`
}

// UpdateLayoutRequest 更新排版的请求
type UpdateLayoutRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Content     string `json:"content"`
	CSS         string `json:"css"`
}

// GenerateHTMLRequest 生成 HTML 的请求
type GenerateHTMLRequest struct {
	CustomCSS   string `json:"custom_css"`
	IncludeWrap bool   `json:"include_wrap"`
}

// GenerateHTMLResponse 生成 HTML 的响应
type GenerateHTMLResponse struct {
	HTML string `json:"html"`
}
