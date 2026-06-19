package handler

import (
	"net/http"
	"wechat-layout/internal/model"
	"wechat-layout/internal/store"

	"github.com/gin-gonic/gin"
)

// ArticleHandler handles article CRUD
type ArticleHandler struct {
	db *store.SQLiteDB
}

// NewArticleHandler creates a new article handler
func NewArticleHandler(db *store.SQLiteDB) *ArticleHandler {
	return &ArticleHandler{db: db}
}

// GetAll returns articles for the current user (or all for admin)
func (h *ArticleHandler) GetAll(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var uid string
	if role != "admin" {
		uid = userID.(string)
	}

	articles, err := h.db.GetArticlesByUser(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": articles})
}

// GetByID returns a single article
func (h *ArticleHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	article, err := h.db.GetArticleByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}

	// ownership check
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	if role != "admin" && article.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": article})
}

// Create creates a new article
func (h *ArticleHandler) Create(c *gin.Context) {
	var req model.CreateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	article, err := h.db.CreateArticle(&req, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": article})
}

// Update updates an article
func (h *ArticleHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req model.UpdateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ownership check
	article, err := h.db.GetArticleByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	if role != "admin" && article.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	updated, err := h.db.UpdateArticle(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

// Delete soft-deletes an article
func (h *ArticleHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// ownership check
	article, err := h.db.GetArticleByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	if role != "admin" && article.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if err := h.db.SoftDeleteArticle(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "article deleted"})
}
