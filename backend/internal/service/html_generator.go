package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"wechat-layout/internal/model"
)

// Component 表示排版组件
type Component struct {
	Type    string                 `json:"type"`
	Content string                 `json:"content"`
	Styles  map[string]interface{} `json:"styles"`
}

// GenerateWeChatHTML 生成公众号兼容的 HTML
func GenerateWeChatHTML(layout *model.Layout, customCSS string, includeWrap bool) string {
	// 解析组件配置
	var components []Component
	if err := json.Unmarshal([]byte(layout.Content), &components); err != nil {
		// 如果解析失败，直接返回内容作为简单 HTML
		return fmt.Sprintf("<div>%s</div>", layout.Content)
	}

	// 生成每个组件的 HTML
	var htmlParts []string
	for _, comp := range components {
		htmlParts = append(htmlParts, renderComponent(comp))
	}
	contentHTML := strings.Join(htmlParts, "")

	// 合并 CSS
	finalCSS := layout.CSS
	if customCSS != "" {
		finalCSS += "\n" + customCSS
	}

	// 公众号安全包裹层
	if includeWrap {
		return fmt.Sprintf(`<section style="max-width: 100%%; box-sizing: border-box !important; word-wrap: break-word !important;">
<style type="text/css">
%s
</style>
%s
</section>`, escapeCSS(finalCSS), contentHTML)
	}

	return fmt.Sprintf(`<style type="text/css">%s</style>%s`, escapeCSS(finalCSS), contentHTML)
}

// renderComponent 渲染单个组件
func renderComponent(comp Component) string {
	styles := buildStyleString(comp.Styles)

	switch strings.ToLower(comp.Type) {
	case "title":
		return fmt.Sprintf(`<h2 style="%s">%s</h2>`, styles, comp.Content)
	case "subtitle":
		return fmt.Sprintf(`<h3 style="%s">%s</h3>`, styles, comp.Content)
	case "paragraph":
		return fmt.Sprintf(`<p style="%s">%s</p>`, styles, comp.Content)
	case "divider":
		return fmt.Sprintf(`<hr style="%s" />`, styles)
	case "quote":
		return fmt.Sprintf(`<blockquote style="%s">%s</blockquote>`, styles, comp.Content)
	case "image":
		return fmt.Sprintf(`<img src="%s" style="%s" alt="" />`, comp.Content, styles)
	case "list":
		return fmt.Sprintf(`<ul style="%s">%s</ul>`, styles, renderListItems(comp.Content))
	case "section", "container":
		return fmt.Sprintf(`<section style="%s">%s</section>`, styles, comp.Content)
	default:
		return fmt.Sprintf(`<div style="%s">%s</div>`, styles, comp.Content)
	}
}

// buildStyleString 构建内联样式字符串
func buildStyleString(styles map[string]interface{}) string {
	if len(styles) == 0 {
		return ""
	}

	var parts []string
	for key, value := range styles {
		cssKey := camelToKebab(key)
		parts = append(parts, fmt.Sprintf("%s: %v", cssKey, value))
	}
	return strings.Join(parts, "; ")
}

// camelToKebab 驼峰命名转短横线命名
func camelToKebab(s string) string {
	var result []rune
	for i, r := range s {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result = append(result, '-')
		}
		result = append(result, r)
	}
	return strings.ToLower(string(result))
}

// renderListItems 渲染列表项
func renderListItems(content string) string {
	items := strings.Split(content, "\n")
	var htmlItems []string
	for _, item := range items {
		if strings.TrimSpace(item) != "" {
			htmlItems = append(htmlItems, fmt.Sprintf("<li>%s</li>", item))
		}
	}
	return strings.Join(htmlItems, "")
}

// escapeCSS 转义 CSS 中的特殊字符
func escapeCSS(css string) string {
	// 移除可能导致公众号问题的字符
	css = strings.ReplaceAll(css, "/*", "")
	css = strings.ReplaceAll(css, "*/", "")
	return css
}
