package main

import (
	"log"
	"wechat-layout/internal/handler"
	"wechat-layout/internal/store"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化数据库
	db, err := store.NewSQLiteDB("layouts.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// 创建处理器
	layoutHandler := handler.NewLayoutHandler(db)

	// 设置 Gin 路由
	r := gin.Default()

	// CORS 中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// API 路由
	api := r.Group("/api")
	{
		api.GET("/layouts", layoutHandler.GetAll)
		api.GET("/layouts/:id", layoutHandler.GetByID)
		api.POST("/layouts", layoutHandler.Create)
		api.PUT("/layouts/:id", layoutHandler.Update)
		api.DELETE("/layouts/:id", layoutHandler.Delete)
		api.POST("/layouts/:id/generate", layoutHandler.GenerateHTML)
	}

	log.Println("Server starting on :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
