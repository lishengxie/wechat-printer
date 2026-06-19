package main

import (
	"log"
	"os"
	"wechat-layout/internal/handler"
	"wechat-layout/internal/middleware"
	"wechat-layout/internal/store"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	db, err := store.NewSQLiteDB("layouts.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Create handlers
	authHandler := handler.NewAuthHandler(db)
	layoutHandler := handler.NewLayoutHandler(db)
	articleHandler := handler.NewArticleHandler(db)

	// Setup Gin
	r := gin.Default()

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Public routes
	api := r.Group("/api")
	{
		api.POST("/auth/login", authHandler.Login)
	}

	// Protected routes
	authorized := api.Group("/")
	authorized.Use(middleware.AuthRequired())
	{
		// Layouts
		authorized.GET("/layouts", layoutHandler.GetAll)
		authorized.GET("/layouts/:id", layoutHandler.GetByID)
		authorized.POST("/layouts", layoutHandler.Create)
		authorized.PUT("/layouts/:id", layoutHandler.Update)
		authorized.DELETE("/layouts/:id", layoutHandler.Delete)
		authorized.POST("/layouts/:id/generate", layoutHandler.GenerateHTML)

		// Articles
		authorized.GET("/articles", articleHandler.GetAll)
		authorized.GET("/articles/:id", articleHandler.GetByID)
		authorized.POST("/articles", articleHandler.Create)
		authorized.PUT("/articles/:id", articleHandler.Update)
		authorized.DELETE("/articles/:id", articleHandler.Delete)

		// Admin only
		admin := authorized.Group("/admin")
		admin.Use(middleware.AdminRequired())
		{
			admin.POST("/users", authHandler.Register)
			admin.GET("/users", authHandler.GetUsers)
			admin.DELETE("/users/:id", authHandler.DeleteUser)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on :%s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
