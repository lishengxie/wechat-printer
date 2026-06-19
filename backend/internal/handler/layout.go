package handler

import (
	"net/http"
	"wechat-layout/internal/model"
	"wechat-layout/internal/service"
	"wechat-layout/internal/store"

	"github.com/gin-gonic/gin"
)

// LayoutHandler handles layout CRUD
type LayoutHandler struct {
	db *store.SQLiteDB
}

// NewLayoutHandler creates a new layout handler
func NewLayoutHandler(db *store.SQLiteDB) *LayoutHandler {
	return &LayoutHandler{db: db}
}

// GetAll returns layouts for the current user (or all for admin)
func (h *LayoutHandler) GetAll(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var uid string
	if role != "admin" {
		uid = userID.(string)
	}

	layouts, err := h.db.GetAllLayouts(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": layouts})
}

// GetByID returns a single layout
func (h *LayoutHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	layout, err := h.db.GetLayoutByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "layout not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": layout})
}

// Create creates a new layout bound to the current user
func (h *LayoutHandler) Create(c *gin.Context) {
	var req model.CreateLayoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	layout, err := h.db.CreateLayout(&req, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": layout})
}

// Update updates a layout
func (h *LayoutHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req model.UpdateLayoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ownership check
	ownerID, err := h.db.GetLayoutOwner(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "layout not found"})
		return
	}
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	if role != "admin" && ownerID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	layout, err := h.db.UpdateLayout(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": layout})
}

// Delete soft-deletes a layout
func (h *LayoutHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// ownership check
	ownerID, err := h.db.GetLayoutOwner(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "layout not found"})
		return
	}
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	if role != "admin" && ownerID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if err := h.db.DeleteLayout(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "layout deleted successfully"})
}

// GenerateHTML generates WeChat-compatible HTML
func (h *LayoutHandler) GenerateHTML(c *gin.Context) {
	id := c.Param("id")
	layout, err := h.db.GetLayoutByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "layout not found"})
		return
	}

	var req model.GenerateHTMLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.IncludeWrap = true
	}

	html := service.GenerateWeChatHTML(layout, req.CustomCSS, req.IncludeWrap)
	if err := h.db.UpdateLayoutHTML(id, html); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": model.GenerateHTMLResponse{HTML: html}})
}
