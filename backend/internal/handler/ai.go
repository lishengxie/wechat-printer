package handler

import (
	"net/http"
	"os"
	"wechat-layout/internal/model"
	"wechat-layout/internal/service"
	"wechat-layout/internal/store"

	"github.com/gin-gonic/gin"
)

// AIHandler handles AI chat and config requests
type AIHandler struct {
	db *store.SQLiteDB
}

// NewAIHandler creates a new AI handler
func NewAIHandler(db *store.SQLiteDB) *AIHandler {
	return &AIHandler{db: db}
}

// Chat handles the AI chat endpoint
func (h *AIHandler) Chat(c *gin.Context) {
	var req model.AIChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Load DB config for LLM call
	dbCfg, err := h.db.GetAIConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load AI config"})
		return
	}

	explanation, updatedModule, err := service.GenerateModuleSuggestion(req.Module, req.Prompt, dbCfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": model.AIChatResponse{
			Explanation:   explanation,
			UpdatedModule: updatedModule,
		},
	})
}

// GetConfig returns the saved AI configuration
func (h *AIHandler) GetConfig(c *gin.Context) {
	cfg, err := h.db.GetAIConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": cfg})
}

// UpdateConfig saves AI configuration
func (h *AIHandler) UpdateConfig(c *gin.Context) {
	var req model.AIConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.UpdateAIConfig(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": req})
}

// Health returns the AI service status
func (h *AIHandler) Health(c *gin.Context) {
	cfg, _ := h.db.GetAIConfig()
	configured := cfg.APIKey != "" || os.Getenv("LLM_API_KEY") != ""
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"configured": configured}})
}
