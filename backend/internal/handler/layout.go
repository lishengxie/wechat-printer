package handler

import (
	"net/http"
	"wechat-layout/internal/model"
	"wechat-layout/internal/service"
	"wechat-layout/internal/store"

	"github.com/gin-gonic/gin"
)

// LayoutHandler 排版处理器
type LayoutHandler struct {
	db *store.SQLiteDB
}

// NewLayoutHandler 创建新的排版处理器
func NewLayoutHandler(db *store.SQLiteDB) *LayoutHandler {
	return &LayoutHandler{db: db}
}

// GetAll 获取所有排版
func (h *LayoutHandler) GetAll(c *gin.Context) {
	layouts, err := h.db.GetAllLayouts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": layouts})
}

// GetByID 根据 ID 获取排版
func (h *LayoutHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	layout, err := h.db.GetLayoutByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Layout not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": layout})
}

// Create 创建新排版
func (h *LayoutHandler) Create(c *gin.Context) {
	var req model.CreateLayoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	layout, err := h.db.CreateLayout(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": layout})
}

// Update 更新排版
func (h *LayoutHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req model.UpdateLayoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	layout, err := h.db.UpdateLayout(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": layout})
}

// Delete 删除排版
func (h *LayoutHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.DeleteLayout(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Layout deleted successfully"})
}

// GenerateHTML 生成公众号可用的 HTML
func (h *LayoutHandler) GenerateHTML(c *gin.Context) {
	id := c.Param("id")
	layout, err := h.db.GetLayoutByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Layout not found"})
		return
	}

	var req model.GenerateHTMLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.IncludeWrap = true
	}

	html := service.GenerateWeChatHTML(layout, req.CustomCSS, req.IncludeWrap)

	// 保存生成的 HTML
	if err := h.db.UpdateLayoutHTML(id, html); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": model.GenerateHTMLResponse{HTML: html}})
}
