package model

import "time"

// Article represents a publishable article referencing a layout
type Article struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	LayoutID   string    `json:"layout_id"`
	Title      string    `json:"title"`
	Author     string    `json:"author"`
	Summary    string    `json:"summary"`
	CoverImage string    `json:"cover_image"`
	Status     string    `json:"status"`
	Deleted    int       `json:"-"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// CreateArticleRequest payload for creating an article
type CreateArticleRequest struct {
	Title      string `json:"title" binding:"required"`
	LayoutID   string `json:"layout_id" binding:"required"`
	Author     string `json:"author"`
	Summary    string `json:"summary"`
	CoverImage string `json:"cover_image"`
}

// UpdateArticleRequest payload for updating an article
type UpdateArticleRequest struct {
	Title      string `json:"title"`
	LayoutID   string `json:"layout_id"`
	Author     string `json:"author"`
	Summary    string `json:"summary"`
	CoverImage string `json:"cover_image"`
	Status     string `json:"status" binding:"omitempty,oneof=draft published"`
}
