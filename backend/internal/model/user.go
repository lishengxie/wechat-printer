package model

import "time"

// User represents an account
type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"` // never serialize
	Role         string    `json:"role"`
	Deleted      int       `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

// LoginRequest login payload
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse login response
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// RegisterRequest admin-only user creation
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=admin user"`
}

// UpdateUserRequest admin-only user update
type UpdateUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password" binding:"omitempty,min=6"`
}
