# Login and Article Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local JWT-based authentication and an article archive system to the existing WeChat layout editor, with user-scoped data, soft deletes, and admin user management.

**Architecture:** Backend adds JWT middleware, user/article models, and soft-delete logic to existing SQLite store. Frontend adds vue-router, Pinia auth store, token-intercepted API client, and new pages for login, article management, layout library, and admin user management.

**Tech Stack:** Vue 3 + Vite + Pinia + vue-router (frontend); Go + Gin + SQLite + golang-jwt/jwt/v5 + bcrypt (backend).

---

## File Map

### Backend — New Files
- `backend/.env` — JWT secret and config
- `backend/internal/model/user.go` — User structs
- `backend/internal/model/article.go` — Article structs
- `backend/pkg/jwt/jwt.go` — Token generation and validation
- `backend/internal/middleware/auth.go` — Gin JWT middleware
- `backend/internal/handler/auth.go` — Login and register handlers
- `backend/internal/handler/article.go` — Article CRUD handlers

### Backend — Modified Files
- `backend/internal/store/sqlite.go` — Add user/article methods, soft delete, user_id filtering for layouts
- `backend/internal/handler/layout.go` — Add ownership checks, soft delete
- `backend/cmd/api/main.go` — Wire auth middleware and new routes
- `backend/go.mod` — Add `github.com/golang-jwt/jwt/v5`

### Frontend — New Files
- `frontend/src/router/index.ts` — Vue Router setup
- `frontend/src/stores/auth.ts` — Pinia auth store
- `frontend/src/pages/LoginPage.vue` — Login UI
- `frontend/src/pages/ArticleListPage.vue` — Article list
- `frontend/src/pages/ArticleEditorPage.vue` — Article create/edit
- `frontend/src/pages/LayoutListPage.vue` — Layout library
- `frontend/src/pages/UserManagementPage.vue` — Admin user management
- `frontend/src/components/AppShell.vue` — Navigation shell

### Frontend — Modified Files
- `frontend/package.json` — Add `vue-router`
- `frontend/src/main.ts` — Install router
- `frontend/src/App.vue` — Switch to router-view
- `frontend/src/services/api.ts` — Attach `Authorization` header, add article endpoints

---

## Task 1: Add Backend Dependencies

**Files:**
- Modify: `backend/go.mod`
- Modify: `backend/.env` (create)

- [ ] **Step 1: Add JWT library**

Run in `backend/` directory:
```bash
go get github.com/golang-jwt/jwt/v5
```
Expected: module added to `go.mod` and `go.sum`.

- [ ] **Step 2: Create environment file**

Create `backend/.env`:
```
JWT_SECRET=change-me-in-production-32-char-min
```

- [ ] **Step 3: Commit**

```bash
cd backend
git add go.mod go.sum .env
git commit -m "deps: add golang-jwt and env config"
```

---

## Task 2: JWT Utilities

**Files:**
- Create: `backend/pkg/jwt/jwt.go`

- [ ] **Step 1: Write JWT package**

Create `backend/pkg/jwt/jwt.go`:
```go
package jwt

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var secretKey = []byte(getSecret())

func getSecret() string {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		return "default-dev-secret-change-me"
	}
	return s
}

// Claims defines the custom JWT claims
type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken creates a new JWT for a user
func GenerateToken(userID, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

// ParseToken validates a token string and returns claims
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secretKey, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}
```

- [ ] **Step 2: Commit**

```bash
git add pkg/jwt/jwt.go
git commit -m "feat: add JWT generation and validation utilities"
```

---

## Task 3: User and Article Models

**Files:**
- Create: `backend/internal/model/user.go`
- Create: `backend/internal/model/article.go`

- [ ] **Step 1: Write user models**

Create `backend/internal/model/user.go`:
```go
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
```

- [ ] **Step 2: Write article models**

Create `backend/internal/model/article.go`:
```go
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
```

- [ ] **Step 3: Commit**

```bash
git add internal/model/user.go internal/model/article.go
git commit -m "feat: add user and article models"
```

---

## Task 4: Database Migration and Store Methods

**Files:**
- Modify: `backend/internal/store/sqlite.go`

- [ ] **Step 1: Add imports and extend SQLiteDB**

At the top of `backend/internal/store/sqlite.go`, add to imports:
```go
"golang.org/x/crypto/bcrypt"
```

- [ ] **Step 2: Rewrite initTables**

Replace the existing `initTables` method with:
```go
func (s *SQLiteDB) initTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'user',
			deleted INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS layouts (
			id TEXT PRIMARY KEY,
			user_id TEXT,
			name TEXT NOT NULL,
			description TEXT,
			content TEXT NOT NULL,
			css TEXT,
			html TEXT,
			deleted INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS articles (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			layout_id TEXT NOT NULL,
			title TEXT NOT NULL,
			author TEXT,
			summary TEXT,
			cover_image TEXT,
			status TEXT NOT NULL DEFAULT 'draft',
			deleted INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
	}
	for _, q := range queries {
		if _, err := s.db.Exec(q); err != nil {
			return err
		}
	}
	return s.seedDefaultAdmin()
}
```

- [ ] **Step 3: Add seedDefaultAdmin**

Add this method to `backend/internal/store/sqlite.go`:
```go
func (s *SQLiteDB) seedDefaultAdmin() error {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM users WHERE deleted = 0").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(
		"INSERT INTO users (id, username, password_hash, role, deleted) VALUES (?, ?, ?, ?, ?)",
		"user_admin_default", "admin", string(hash), "admin", 0,
	)
	return err
}
```

- [ ] **Step 4: Commit**

```bash
git add internal/store/sqlite.go
git commit -m "feat: migrate DB schema with users, articles, soft delete; seed default admin"
```

---

## Task 5: User Store Methods

**Files:**
- Modify: `backend/internal/store/sqlite.go`

- [ ] **Step 1: Add user CRUD methods**

Append to `backend/internal/store/sqlite.go`:
```go
// CreateUser creates a new user (admin only)
func (s *SQLiteDB) CreateUser(username, password, role string) (*model.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &model.User{
		ID:           uuid.New().String(),
		Username:     username,
		PasswordHash: string(hash),
		Role:         role,
		Deleted:      0,
		CreatedAt:    time.Now(),
	}
	_, err = s.db.Exec(
		"INSERT INTO users (id, username, password_hash, role, deleted, created_at) VALUES (?, ?, ?, ?, ?, ?)",
		user.ID, user.Username, user.PasswordHash, user.Role, user.Deleted, user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByUsername looks up a user by username
func (s *SQLiteDB) GetUserByUsername(username string) (*model.User, error) {
	user := &model.User{}
	query := `SELECT id, username, password_hash, role, deleted, created_at FROM users WHERE username = ? AND deleted = 0`
	err := s.db.QueryRow(query, username).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.Deleted, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return user, nil
}

// GetUserByID looks up a user by ID
func (s *SQLiteDB) GetUserByID(id string) (*model.User, error) {
	user := &model.User{}
	query := `SELECT id, username, password_hash, role, deleted, created_at FROM users WHERE id = ? AND deleted = 0`
	err := s.db.QueryRow(query, id).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.Deleted, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return user, nil
}

// GetAllUsers returns all non-deleted users
func (s *SQLiteDB) GetAllUsers() ([]*model.User, error) {
	rows, err := s.db.Query(`SELECT id, username, password_hash, role, deleted, created_at FROM users WHERE deleted = 0 ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		u := &model.User{}
		if err := rows.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.Deleted, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// SoftDeleteUser marks a user as deleted
func (s *SQLiteDB) SoftDeleteUser(id string) error {
	_, err := s.db.Exec("UPDATE users SET deleted = 1 WHERE id = ?", id)
	return err
}

// VerifyPassword checks a plaintext password against the hash
func (s *SQLiteDB) VerifyPassword(user *model.User, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	return err == nil
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/store/sqlite.go
git commit -m "feat: add user store methods with bcrypt"
```

---

## Task 6: Article Store Methods

**Files:**
- Modify: `backend/internal/store/sqlite.go`

- [ ] **Step 1: Add article CRUD methods**

Append to `backend/internal/store/sqlite.go`:
```go
// CreateArticle creates a new article
func (s *SQLiteDB) CreateArticle(req *model.CreateArticleRequest, userID string) (*model.Article, error) {
	now := time.Now()
	article := &model.Article{
		ID:         uuid.New().String(),
		UserID:     userID,
		LayoutID:   req.LayoutID,
		Title:      req.Title,
		Author:     req.Author,
		Summary:    req.Summary,
		CoverImage: req.CoverImage,
		Status:     "draft",
		Deleted:    0,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	_, err := s.db.Exec(
		`INSERT INTO articles (id, user_id, layout_id, title, author, summary, cover_image, status, deleted, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		article.ID, article.UserID, article.LayoutID, article.Title, article.Author,
		article.Summary, article.CoverImage, article.Status, article.Deleted, article.CreatedAt, article.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return article, nil
}

// GetArticleByID returns an article by ID (checking deleted = 0)
func (s *SQLiteDB) GetArticleByID(id string) (*model.Article, error) {
	article := &model.Article{}
	query := `SELECT id, user_id, layout_id, title, author, summary, cover_image, status, deleted, created_at, updated_at
			  FROM articles WHERE id = ? AND deleted = 0`
	err := s.db.QueryRow(query, id).Scan(
		&article.ID, &article.UserID, &article.LayoutID, &article.Title, &article.Author,
		&article.Summary, &article.CoverImage, &article.Status, &article.Deleted,
		&article.CreatedAt, &article.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("article not found")
		}
		return nil, err
	}
	return article, nil
}

// GetArticlesByUser returns articles for a user; admin can pass empty userID for all
func (s *SQLiteDB) GetArticlesByUser(userID string) ([]*model.Article, error) {
	var rows *sql.Rows
	var err error
	if userID != "" {
		rows, err = s.db.Query(
			`SELECT id, user_id, layout_id, title, author, summary, cover_image, status, deleted, created_at, updated_at
			 FROM articles WHERE user_id = ? AND deleted = 0 ORDER BY updated_at DESC`, userID)
	} else {
		rows, err = s.db.Query(
			`SELECT id, user_id, layout_id, title, author, summary, cover_image, status, deleted, created_at, updated_at
			 FROM articles WHERE deleted = 0 ORDER BY updated_at DESC`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var articles []*model.Article
	for rows.Next() {
		a := &model.Article{}
		if err := rows.Scan(
			&a.ID, &a.UserID, &a.LayoutID, &a.Title, &a.Author,
			&a.Summary, &a.CoverImage, &a.Status, &a.Deleted,
			&a.CreatedAt, &a.UpdatedAt,
		); err != nil {
			return nil, err
		}
		articles = append(articles, a)
	}
	return articles, nil
}

// UpdateArticle updates article metadata
func (s *SQLiteDB) UpdateArticle(id string, req *model.UpdateArticleRequest) (*model.Article, error) {
	article, err := s.GetArticleByID(id)
	if err != nil {
		return nil, err
	}
	if req.Title != "" {
		article.Title = req.Title
	}
	if req.LayoutID != "" {
		article.LayoutID = req.LayoutID
	}
	if req.Author != "" {
		article.Author = req.Author
	}
	if req.Summary != "" {
		article.Summary = req.Summary
	}
	if req.CoverImage != "" {
		article.CoverImage = req.CoverImage
	}
	if req.Status != "" {
		article.Status = req.Status
	}
	article.UpdatedAt = time.Now()

	_, err = s.db.Exec(
		`UPDATE articles SET title = ?, layout_id = ?, author = ?, summary = ?, cover_image = ?, status = ?, updated_at = ? WHERE id = ?`,
		article.Title, article.LayoutID, article.Author, article.Summary, article.CoverImage, article.Status, article.UpdatedAt, id,
	)
	if err != nil {
		return nil, err
	}
	return article, nil
}

// SoftDeleteArticle marks an article as deleted
func (s *SQLiteDB) SoftDeleteArticle(id string) error {
	_, err := s.db.Exec("UPDATE articles SET deleted = 1, updated_at = ? WHERE id = ?", time.Now(), id)
	return err
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/store/sqlite.go
git commit -m "feat: add article store methods with soft delete"
```

---

## Task 7: Update Layout Store for Auth and Soft Delete

**Files:**
- Modify: `backend/internal/store/sqlite.go`

- [ ] **Step 1: Modify CreateLayout to accept userID**

Replace `CreateLayout` signature and body:
```go
// CreateLayout creates a new layout bound to a user
func (s *SQLiteDB) CreateLayout(req *model.CreateLayoutRequest, userID string) (*model.Layout, error) {
	now := time.Now()
	layout := &model.Layout{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Content:     req.Content,
		CSS:         req.CSS,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	query := `INSERT INTO layouts (id, user_id, name, description, content, css, html, deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := s.db.Exec(query, layout.ID, userID, layout.Name, layout.Description, layout.Content, layout.CSS, layout.HTML, 0, layout.CreatedAt, layout.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return layout, nil
}
```

- [ ] **Step 2: Modify GetAllLayouts to filter by user**

Replace `GetAllLayouts`:
```go
// GetAllLayouts returns layouts for a user; admin can pass empty userID for all
func (s *SQLiteDB) GetAllLayouts(userID string) ([]*model.Layout, error) {
	var rows *sql.Rows
	var err error
	if userID != "" {
		rows, err = s.db.Query(`SELECT id, name, description, content, css, html, created_at, updated_at FROM layouts WHERE user_id = ? AND deleted = 0 ORDER BY created_at DESC`, userID)
	} else {
		rows, err = s.db.Query(`SELECT id, name, description, content, css, html, created_at, updated_at FROM layouts WHERE deleted = 0 ORDER BY created_at DESC`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var layouts []*model.Layout
	for rows.Next() {
		layout := &model.Layout{}
		err := rows.Scan(&layout.ID, &layout.Name, &layout.Description, &layout.Content, &layout.CSS, &layout.HTML, &layout.CreatedAt, &layout.UpdatedAt)
		if err != nil {
			return nil, err
		}
		layouts = append(layouts, layout)
	}

	return layouts, nil
}
```

- [ ] **Step 3: Modify GetLayoutByID to exclude deleted**

Replace `GetLayoutByID`:
```go
// GetLayoutByID gets a single non-deleted layout
func (s *SQLiteDB) GetLayoutByID(id string) (*model.Layout, error) {
	layout := &model.Layout{}
	query := `SELECT id, name, description, content, css, html, created_at, updated_at FROM layouts WHERE id = ? AND deleted = 0`
	err := s.db.QueryRow(query, id).Scan(&layout.ID, &layout.Name, &layout.Description, &layout.Content, &layout.CSS, &layout.HTML, &layout.CreatedAt, &layout.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("layout not found")
		}
		return nil, err
	}
	return layout, nil
}
```

- [ ] **Step 4: Add GetLayoutOwner to support ownership checks**

Add new method:
```go
// GetLayoutOwner returns the user_id of a layout
func (s *SQLiteDB) GetLayoutOwner(id string) (string, error) {
	var userID string
	err := s.db.QueryRow("SELECT user_id FROM layouts WHERE id = ? AND deleted = 0", id).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("layout not found")
		}
		return "", err
	}
	return userID, nil
}
```

- [ ] **Step 5: Modify DeleteLayout to soft delete**

Replace `DeleteLayout`:
```go
// DeleteLayout soft-deletes a layout
func (s *SQLiteDB) DeleteLayout(id string) error {
	_, err := s.db.Exec("UPDATE layouts SET deleted = 1, updated_at = ? WHERE id = ?", time.Now(), id)
	return err
}
```

- [ ] **Step 6: Commit**

```bash
git add internal/store/sqlite.go
git commit -m "feat: scope layouts to users and switch to soft delete"
```

---

## Task 8: Auth Middleware

**Files:**
- Create: `backend/internal/middleware/auth.go`

- [ ] **Step 1: Write auth middleware**

Create `backend/internal/middleware/auth.go`:
```go
package middleware

import (
	"net/http"
	"strings"

	"wechat-layout/pkg/jwt"

	"github.com/gin-gonic/gin"
)

// AuthRequired validates JWT and sets user_id and role in context
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			c.Abort()
			return
		}

		claims, err := jwt.ParseToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// AdminRequired ensures the user has admin role
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/middleware/auth.go
git commit -m "feat: add JWT and admin middleware"
```

---

## Task 9: Auth Handler

**Files:**
- Create: `backend/internal/handler/auth.go`

- [ ] **Step 1: Write auth handler**

Create `backend/internal/handler/auth.go`:
```go
package handler

import (
	"net/http"
	"wechat-layout/internal/model"
	"wechat-layout/internal/store"
	"wechat-layout/pkg/jwt"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication
type AuthHandler struct {
	db *store.SQLiteDB
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(db *store.SQLiteDB) *AuthHandler {
	return &AuthHandler{db: db}
}

// Login authenticates a user and returns a JWT
func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.db.GetUserByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	if !h.db.VerifyPassword(user, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	token, err := jwt.GenerateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, model.LoginResponse{
		Token: token,
		User:  *user,
	})
}

// Register creates a new user (admin only)
func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.db.CreateUser(req.Username, req.Password, req.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": user})
}

// GetUsers returns all users (admin only)
func (h *AuthHandler) GetUsers(c *gin.Context) {
	users, err := h.db.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": users})
}

// DeleteUser soft-deletes a user (admin only)
func (h *AuthHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.SoftDeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/handler/auth.go
git commit -m "feat: add auth handler for login and user management"
```

---

## Task 10: Article Handler

**Files:**
- Create: `backend/internal/handler/article.go`

- [ ] **Step 1: Write article handler**

Create `backend/internal/handler/article.go`:
```go
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
```

- [ ] **Step 2: Commit**

```bash
git add internal/handler/article.go
git commit -m "feat: add article handler with ownership checks"
```

---

## Task 11: Update Layout Handler for Auth

**Files:**
- Modify: `backend/internal/handler/layout.go`

- [ ] **Step 1: Replace entire file**

Replace `backend/internal/handler/layout.go` with:
```go
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
```

- [ ] **Step 2: Commit**

```bash
git add internal/handler/layout.go
git commit -m "feat: update layout handler with ownership checks and soft delete"
```

---

## Task 12: Wire Routes in main.go

**Files:**
- Modify: `backend/cmd/api/main.go`

- [ ] **Step 1: Replace main.go**

Replace `backend/cmd/api/main.go` with:
```go
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
```

- [ ] **Step 2: Verify backend compiles**

Run in `backend/`:
```bash
go build ./cmd/api
```
Expected: no errors, binary compiled.

- [ ] **Step 3: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat: wire auth middleware and new routes"
```

---

## Task 13: Install Frontend Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install vue-router**

Run in `frontend/`:
```bash
npm install vue-router@4
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add vue-router"
```

---

## Task 14: Auth Store

**Files:**
- Create: `frontend/src/stores/auth.ts`

- [ ] **Step 1: Write auth store**

Create `frontend/src/stores/auth.ts`:
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  username: string
  role: 'admin' | 'user'
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  function restoreFromStorage() {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
      // user will be fetched by router guard or app init
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    setAuth,
    clearAuth,
    restoreFromStorage
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/auth.ts
git commit -m "feat: add Pinia auth store"
```

---

## Task 15: Update API Client with Token Interceptor

**Files:**
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: Rewrite api.ts with auth support and article endpoints**

Replace `frontend/src/services/api.ts` with:
```typescript
import type { Document } from '@/types/document'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Backend Layout structure
export interface BackendLayout {
  id: string
  name: string
  description: string
  content: string
  css: string
  html: string
  created_at: string
  updated_at: string
}

export interface Layout {
  id: string
  name: string
  description?: string
  document: Document
  createdAt: string
  updatedAt: string
}

export interface Article {
  id: string
  user_id: string
  layout_id: string
  title: string
  author: string
  summary: string
  cover_image: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface LayoutCreateInput {
  name: string
  description?: string
  document: Document
}

export interface LayoutUpdateInput {
  name?: string
  description?: string
  document?: Document
}

export interface ArticleCreateInput {
  title: string
  layout_id: string
  author?: string
  summary?: string
  cover_image?: string
}

export interface ArticleUpdateInput {
  title?: string
  layout_id?: string
  author?: string
  summary?: string
  cover_image?: string
  status?: 'draft' | 'published'
}

export interface ExportHTMLResponse {
  html: string
  success: boolean
}

const API_BASE = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const authStore = useAuthStore()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  }

  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`
  }

  const config: RequestInit = {
    ...options,
    headers
  }

  const response = await fetch(`${API_BASE}${url}`, config)

  if (response.status === 401) {
    authStore.clearAuth()
    router.push('/login')
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

function backendToFrontend(backend: BackendLayout): Layout {
  let document: Document
  try {
    document = JSON.parse(backend.content)
  } catch {
    document = {
      id: backend.id,
      title: backend.name,
      createdAt: backend.created_at,
      updatedAt: backend.updated_at,
      root: {
        id: 'root',
        type: 'container' as const,
        props: { layout: 'single' as const },
        children: [],
        styles: {}
      }
    }
  }
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description,
    document,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at
  }
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: { id: string; username: string; role: 'admin' | 'user' } }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },

  async register(username: string, password: string, role: string): Promise<{ data: { id: string; username: string; role: string } }> {
    return request('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role })
    })
  },

  async getUsers(): Promise<{ data: Array<{ id: string; username: string; role: string; created_at: string }> }> {
    return request('/admin/users', { method: 'GET' })
  },

  async deleteUser(id: string): Promise<void> {
    return request(`/admin/users/${id}`, { method: 'DELETE' })
  },

  // Layouts
  async listLayouts(): Promise<Layout[]> {
    const response = await request<{ data: BackendLayout[] }>('/layouts', { method: 'GET' })
    return response.data.map(backendToFrontend)
  },

  async getLayout(id: string): Promise<Layout> {
    const response = await request<{ data: BackendLayout }>(`/layouts/${id}`, { method: 'GET' })
    return backendToFrontend(response.data)
  },

  async createLayout(data: LayoutCreateInput): Promise<Layout> {
    const response = await request<{ data: BackendLayout }>('/layouts', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description || '',
        content: JSON.stringify(data.document),
        css: ''
      })
    })
    return backendToFrontend(response.data)
  },

  async updateLayout(id: string, data: LayoutUpdateInput): Promise<Layout> {
    const response = await request<{ data: BackendLayout }>(`/layouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        description: data.description || '',
        content: data.document ? JSON.stringify(data.document) : undefined,
        css: ''
      })
    })
    return backendToFrontend(response.data)
  },

  async deleteLayout(id: string): Promise<void> {
    return request(`/layouts/${id}`, { method: 'DELETE' })
  },

  async exportHTMLByLayoutId(layoutId: string): Promise<ExportHTMLResponse> {
    const response = await request<{ data: { html: string } }>(`/layouts/${layoutId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ include_wrap: true })
    })
    return { html: response.data.html, success: true }
  },

  async exportHTML(document: Document): Promise<ExportHTMLResponse> {
    const html = generateHTMLFromDocument(document)
    return Promise.resolve({ html, success: true })
  },

  // Articles
  async listArticles(): Promise<Article[]> {
    const response = await request<{ data: Article[] }>('/articles', { method: 'GET' })
    return response.data
  },

  async getArticle(id: string): Promise<Article> {
    const response = await request<{ data: Article }>(`/articles/${id}`, { method: 'GET' })
    return response.data
  },

  async createArticle(data: ArticleCreateInput): Promise<Article> {
    const response = await request<{ data: Article }>('/articles', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return response.data
  },

  async updateArticle(id: string, data: ArticleUpdateInput): Promise<Article> {
    const response = await request<{ data: Article }>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return response.data
  },

  async deleteArticle(id: string): Promise<void> {
    return request(`/articles/${id}`, { method: 'DELETE' })
  }
}

// Simple HTML generator (kept from original)
function generateHTMLFromDocument(document: Document): string {
  const styles = `
    <style>
      .wechat-layout { max-width: 640px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .wechat-module { margin: 0 0 16px 0; }
      .wechat-text { font-size: 16px; line-height: 1.6; color: #333; }
      .wechat-image img { max-width: 100%; height: auto; display: block; }
      .wechat-divider { border: none; border-top: 2px solid #e5e7eb; margin: 16px 0; }
      .wechat-button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px; text-align: center; }
      .wechat-container { display: flex; gap: 16px; }
      .wechat-container.single { flex-direction: column; }
      .wechat-container.two-column > * { flex: 1; }
      .wechat-container.three-column > * { flex: 1; }
    </style>
  `
  function renderModule(module: any): string {
    switch (module.type) {
      case 'text':
        return `<div class="wechat-module wechat-text" style="${getStyleString(module.styles)}">${module.props.content}</div>`
      case 'image':
        return `<div class="wechat-module wechat-image" style="${getStyleString(module.styles)}"><img src="${module.props.src}" alt="${module.props.alt}"></div>`
      case 'divider':
        return `<hr class="wechat-module wechat-divider" style="border-top-color: ${module.props.color || '#e5e7eb'}; border-top-style: ${module.props.style || 'solid'};">`
      case 'button':
        return `<div class="wechat-module" style="text-align: ${module.styles.textAlign || 'center'};"><a href="${module.props.link}" class="wechat-button">${module.props.text}</a></div>`
      case 'container':
        return `<div class="wechat-module wechat-container ${module.props.layout}" style="${getStyleString(module.styles)}">${module.children?.map((c: any) => renderModule(c)).join('') || ''}</div>`
      default:
        return ''
    }
  }
  function getStyleString(styles: any): string {
    return Object.entries(styles)
      .filter(([, value]) => value && value !== 'transparent')
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ')
  }
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title}</title>
  ${styles}
</head>
<body>
  <div class="wechat-layout">
    <h1>${document.title}</h1>
    <div class="wechat-content">${document.root.children?.map((child: any) => renderModule(child)).join('') || ''}</div>
  </div>
</body>
</html>`
}

export default api
```

- [ ] **Step 2: Commit**

```bash
git add src/services/api.ts
git commit -m "feat: add token interceptor and article endpoints to API client"
```

---

## Task 16: Vue Router Setup

**Files:**
- Create: `frontend/src/router/index.ts`

- [ ] **Step 1: Create router config**

Create `frontend/src/router/index.ts`:
```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      component: () => import('@/components/AppShell.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard/articles'
        },
        {
          path: 'articles',
          name: 'ArticleList',
          component: () => import('@/pages/ArticleListPage.vue')
        },
        {
          path: 'articles/new',
          name: 'ArticleNew',
          component: () => import('@/pages/ArticleEditorPage.vue')
        },
        {
          path: 'articles/:id/edit',
          name: 'ArticleEdit',
          component: () => import('@/pages/ArticleEditorPage.vue')
        },
        {
          path: 'layouts',
          name: 'LayoutList',
          component: () => import('@/pages/LayoutListPage.vue')
        }
      ]
    },
    {
      path: '/editor/:layoutId',
      name: 'Editor',
      component: () => import('@/App.vue')
    },
    {
      path: '/admin/users',
      name: 'UserManagement',
      component: () => import('@/components/AppShell.vue'),
      children: [
        {
          path: '',
          component: () => import('@/pages/UserManagementPage.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    next()
    return
  }

  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (to.path.startsWith('/admin') && !authStore.isAdmin) {
    next('/dashboard')
    return
  }

  next()
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add src/router/index.ts
git commit -m "feat: setup vue-router with auth guards"
```

---

## Task 17: Update main.ts to Use Router

**Files:**
- Modify: `frontend/src/main.ts`

- [ ] **Step 1: Replace main.ts**

Replace `frontend/src/main.ts` with:
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import router from './router'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
```

- [ ] **Step 2: Commit**

```bash
git add src/main.ts
git commit -m "feat: install router in main app"
```

---

## Task 18: Update App.vue for Router

**Files:**
- Modify: `frontend/src/App.vue`

- [ ] **Step 1: Replace App.vue**

Replace `frontend/src/App.vue` with:
```vue
<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { storeToRefs } from 'pinia'
import { useDocumentStore } from './stores/document'
import ModuleLibrary from './components/ModuleLibrary.vue'
import EditorCanvas from './components/EditorCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import PreviewCanvas from './components/PreviewCanvas.vue'
import api from './services/api'

const documentStore = useDocumentStore()
const { document, selectedModuleId } = storeToRefs(documentStore)

const isPreviewMode = ref(false)
provide('isPreviewMode', isPreviewMode)

function togglePreview() {
  isPreviewMode.value = !isPreviewMode.value
}

const currentLayoutId = ref<string | null>(null)
const showExportModal = ref(false)
const exportedHTML = ref('')
const isExporting = ref(false)
const isSaving = ref(false)
const saveMessage = ref('')

const canUndo = computed(() => documentStore.canUndo())
const canRedo = computed(() => documentStore.canRedo())

function handleUndo() {
  documentStore.undo()
}

function handleRedo() {
  documentStore.redo()
}

async function handleSave() {
  isSaving.value = true
  saveMessage.value = ''
  try {
    if (currentLayoutId.value) {
      await api.updateLayout(currentLayoutId.value, {
        name: documentStore.document.title,
        document: documentStore.document
      })
      saveMessage.value = '保存成功！'
    } else {
      const layout = await api.createLayout({
        name: documentStore.document.title,
        document: documentStore.document
      })
      currentLayoutId.value = layout.id
      saveMessage.value = '创建成功！'
    }
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch (error) {
    saveMessage.value = '保存失败，请重试'
    console.error('Save failed:', error)
  } finally {
    isSaving.value = false
  }
}

async function handleExportHTML() {
  isExporting.value = true
  showExportModal.value = true
  try {
    const result = await api.exportHTML(documentStore.document)
    exportedHTML.value = result.html
  } catch (error) {
    exportedHTML.value = '导出失败，请重试'
    console.error('Export failed:', error)
  } finally {
    isExporting.value = false
  }
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(exportedHTML.value)
    alert('HTML 已复制到剪贴板！')
  } catch (error) {
    console.error('Copy failed:', error)
  }
}

function closeExportModal() {
  showExportModal.value = false
  exportedHTML.value = ''
}
</script>

<template>
  <div class="app-container">
    <header class="toolbar">
      <div class="toolbar-left">
        <div class="logo">
          <span class="logo-icon">📰</span>
          <span class="logo-text">公众号排版编辑器</span>
        </div>
      </div>
      <div class="toolbar-center">
        <div class="action-buttons">
          <button class="action-btn" :class="{ 'is-active': isPreviewMode }" @click="togglePreview">
            <span class="btn-icon">👁</span>
            <span class="btn-text">{{ isPreviewMode ? '编辑' : '预览' }}</span>
          </button>
          <button class="action-btn" @click="documentStore.loadTestData">
            <span class="btn-icon">📋</span>
            <span class="btn-text">加载演示</span>
          </button>
          <button class="action-btn" :disabled="!canUndo" @click="handleUndo">
            <span class="btn-icon">↩</span>
            <span class="btn-text">撤销</span>
          </button>
          <button class="action-btn" :disabled="!canRedo" @click="handleRedo">
            <span class="btn-icon">↪</span>
            <span class="btn-text">重做</span>
          </button>
        </div>
      </div>
      <div class="toolbar-right">
        <span v-if="saveMessage" class="save-message">{{ saveMessage }}</span>
        <button class="primary-btn save-btn" :disabled="isSaving" @click="handleSave">
          <span v-if="isSaving" class="spinner">⏳</span>
          <span class="btn-icon">💾</span>
          <span class="btn-text">{{ currentLayoutId ? '保存' : '创建' }}</span>
        </button>
        <button class="primary-btn export-btn" :disabled="isExporting" @click="handleExportHTML">
          <span v-if="isExporting" class="spinner">⏳</span>
          <span class="btn-icon">📄</span>
          <span class="btn-text">导出 HTML</span>
        </button>
      </div>
    </header>

    <main class="main-content">
      <section v-if="isPreviewMode" class="preview-area">
        <PreviewCanvas />
      </section>
      <template v-else>
        <aside class="sidebar-left"><ModuleLibrary /></aside>
        <section class="editor-area"><EditorCanvas /></section>
        <aside class="sidebar-right"><PropertyPanel /></aside>
      </template>
    </main>

    <Teleport to="body">
      <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">导出 HTML</h3>
            <button class="modal-close" @click="closeExportModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="isExporting" class="loading-state">
              <span class="loading-spinner">⏳</span>
              <span>正在生成 HTML...</span>
            </div>
            <textarea v-else v-model="exportedHTML" class="html-preview" readonly spellcheck="false"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeExportModal">关闭</button>
            <button class="btn-primary" :disabled="isExporting" @click="copyToClipboard">复制到剪贴板</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f3f4f6; color: #1f2937;
}
.app-container { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.toolbar { display: flex; align-items: center; justify-content: space-between; height: 56px; padding: 0 20px; background: #fff; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.toolbar-left { display: flex; align-items: center; }
.logo { display: flex; align-items: center; gap: 8px; }
.logo-icon { font-size: 24px; }
.logo-text { font-size: 16px; font-weight: 600; color: #111827; }
.toolbar-center { flex: 1; display: flex; justify-content: center; }
.action-buttons { display: flex; gap: 4px; background: #f3f4f6; padding: 4px; border-radius: 8px; }
.action-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #4b5563; background: transparent; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; }
.action-btn:hover:not(:disabled) { background: #fff; color: #1f2937; }
.action-btn.is-active { background: #dbeafe; color: #2563eb; }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.toolbar-right { display: flex; align-items: center; gap: 12px; }
.save-message { font-size: 13px; color: #059669; font-weight: 500; }
.primary-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 500; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; }
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.save-btn { background: #dbeafe; color: #1d4ed8; }
.save-btn:hover:not(:disabled) { background: #bfdbfe; }
.export-btn { background: #10b981; color: #fff; }
.export-btn:hover:not(:disabled) { background: #059669; }
.btn-icon { font-size: 14px; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.main-content { flex: 1; display: flex; overflow: hidden; }
.sidebar-left { width: 280px; background: #fff; border-right: 1px solid #e5e7eb; overflow-y: auto; flex-shrink: 0; }
.editor-area { flex: 1; overflow: hidden; }
.sidebar-right { width: 300px; background: #fff; border-left: 1px solid #e5e7eb; overflow-y: auto; flex-shrink: 0; }
.preview-area { flex: 1; overflow: auto; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-content { width: 90%; max-width: 800px; max-height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); display: flex; flex-direction: column; animation: slideUp 0.3s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
.modal-title { font-size: 16px; font-weight: 600; color: #111827; }
.modal-close { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #6b7280; background: transparent; border: none; border-radius: 6px; cursor: pointer; }
.modal-close:hover { background: #f3f4f6; color: #1f2937; }
.modal-body { flex: 1; padding: 20px; overflow-y: auto; }
.loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 20px; font-size: 14px; color: #6b7280; }
.loading-spinner { font-size: 24px; animation: spin 1s linear infinite; }
.html-preview { width: 100%; height: 400px; padding: 12px; font-family: Consolas, Monaco, monospace; font-size: 12px; line-height: 1.6; color: #374151; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; resize: none; outline: none; }
.modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid #e5e7eb; }
.btn-secondary { padding: 8px 16px; font-size: 14px; font-weight: 500; color: #4b5563; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
.btn-secondary:hover { background: #e5e7eb; }
.btn-primary { padding: 8px 16px; font-size: 14px; font-weight: 500; color: #fff; background: #3b82f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/App.vue
git commit -m "feat: prepare App.vue as editor route"
```

---

## Task 19: AppShell Navigation

**Files:**
- Create: `frontend/src/components/AppShell.vue`

- [ ] **Step 1: Write AppShell**

Create `frontend/src/components/AppShell.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = computed(() => authStore.user?.username || '')
const isAdmin = computed(() => authStore.isAdmin)

const navItems = computed(() => [
  { path: '/dashboard/articles', label: '文章' },
  { path: '/dashboard/layouts', label: '排版' },
  ...(isAdmin.value ? [{ path: '/admin/users', label: '用户管理' }] : [])
])

function logout() {
  authStore.clearAuth()
  router.push('/login')
}
</script>

<template>
  <div class="shell">
    <nav class="top-nav">
      <div class="nav-left">
        <span class="logo">📰 公众号排版编辑器</span>
      </div>
      <div class="nav-center">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: route.path.startsWith(item.path) }"
        >
          {{ item.label }}
        </router-link>
      </div>
      <div class="nav-right">
        <span class="user-badge">{{ username }}</span>
        <button class="logout-btn" @click="logout">退出</button>
      </div>
    </nav>
    <main class="shell-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.shell { display: flex; flex-direction: column; height: 100vh; }
.top-nav { display: flex; align-items: center; justify-content: space-between; height: 56px; padding: 0 24px; background: #fff; border-bottom: 1px solid #e5e7eb; }
.nav-left .logo { font-size: 16px; font-weight: 600; color: #111827; }
.nav-center { display: flex; gap: 4px; }
.nav-link { padding: 8px 16px; font-size: 14px; font-weight: 500; color: #4b5563; text-decoration: none; border-radius: 6px; transition: all 0.15s; }
.nav-link:hover { background: #f3f4f6; color: #1f2937; }
.nav-link.active { background: #dbeafe; color: #2563eb; }
.nav-right { display: flex; align-items: center; gap: 12px; }
.user-badge { font-size: 13px; color: #6b7280; background: #f3f4f6; padding: 4px 10px; border-radius: 12px; }
.logout-btn { padding: 6px 14px; font-size: 13px; font-weight: 500; color: #dc2626; background: transparent; border: 1px solid #fecaca; border-radius: 6px; cursor: pointer; }
.logout-btn:hover { background: #fef2f2; }
.shell-content { flex: 1; overflow: auto; background: #f3f4f6; padding: 24px; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AppShell.vue
git commit -m "feat: add AppShell with navigation and logout"
```

---

## Task 20: Login Page

**Files:**
- Create: `frontend/src/pages/LoginPage.vue`

- [ ] **Step 1: Write login page**

Create `frontend/src/pages/LoginPage.vue`:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await api.login(username.value, password.value)
    authStore.setAuth(res.token, res.user)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">📰 公众号排版编辑器</h1>
      <p class="login-subtitle">请登录以继续</p>
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" required />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p class="hint">默认管理员: admin / admin123</p>
    </div>
  </div>
</template>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); }
.login-card { width: 100%; max-width: 400px; padding: 40px; background: #fff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
.login-title { font-size: 22px; font-weight: 700; text-align: center; color: #111827; margin-bottom: 8px; }
.login-subtitle { font-size: 14px; text-align: center; color: #6b7280; margin-bottom: 28px; }
.login-form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; }
.form-group input { padding: 10px 14px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; transition: border-color 0.15s; }
.form-group input:focus { border-color: #3b82f6; }
.error-msg { font-size: 13px; color: #dc2626; text-align: center; }
.login-btn { padding: 12px; font-size: 14px; font-weight: 600; color: #fff; background: #3b82f6; border: none; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
.login-btn:hover:not(:disabled) { background: #2563eb; }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.hint { margin-top: 18px; font-size: 12px; text-align: center; color: #9ca3af; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LoginPage.vue
git commit -m "feat: add login page"
```

---

## Task 21: Article List Page

**Files:**
- Create: `frontend/src/pages/ArticleListPage.vue`

- [ ] **Step 1: Write article list**

Create `frontend/src/pages/ArticleListPage.vue`:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import type { Article } from '@/services/api'

const router = useRouter()
const articles = ref<Article[]>([])
const loading = ref(false)
const error = ref('')

async function loadArticles() {
  loading.value = true
  error.value = ''
  try {
    articles.value = await api.listArticles()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function editArticle(id: string) {
  router.push(`/dashboard/articles/${id}/edit`)
}

async function deleteArticle(id: string) {
  if (!confirm('确定要删除这篇文章吗？')) return
  try {
    await api.deleteArticle(id)
    await loadArticles()
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}

onMounted(loadArticles)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>我的文章</h2>
      <button class="btn-primary" @click="router.push('/dashboard/articles/new')">+ 新建文章</button>
    </div>
    <p v-if="loading" class="status">加载中...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <div v-else-if="articles.length === 0" class="empty">
      <p>还没有文章，点击右上角新建</p>
    </div>
    <div v-else class="card-grid">
      <div v-for="article in articles" :key="article.id" class="card">
        <div class="card-header">
          <h3 class="card-title">{{ article.title }}</h3>
          <span class="badge" :class="article.status">{{ article.status === 'published' ? '已发布' : '草稿' }}</span>
        </div>
        <p v-if="article.summary" class="card-summary">{{ article.summary }}</p>
        <div class="card-meta">
          <span v-if="article.author">作者: {{ article.author }}</span>
          <span>{{ new Date(article.updated_at).toLocaleString() }}</span>
        </div>
        <div class="card-actions">
          <button class="btn-small" @click="editArticle(article.id)">编辑</button>
          <button class="btn-small danger" @click="deleteArticle(article.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #111827; }
.btn-primary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #fff; background: #3b82f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary:hover { background: #2563eb; }
.status { text-align: center; color: #6b7280; padding: 40px; }
.error { color: #dc2626; }
.empty { text-align: center; padding: 60px; color: #9ca3af; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 10px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card-title { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
.badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; }
.badge.draft { background: #f3f4f6; color: #6b7280; }
.badge.published { background: #d1fae5; color: #065f46; }
.card-summary { font-size: 13px; color: #6b7280; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-meta { font-size: 12px; color: #9ca3af; display: flex; gap: 12px; }
.card-actions { display: flex; gap: 8px; margin-top: 4px; }
.btn-small { padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 5px; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; }
.btn-small:hover { background: #f9fafb; }
.btn-small.danger { color: #dc2626; border-color: #fecaca; }
.btn-small.danger:hover { background: #fef2f2; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ArticleListPage.vue
git commit -m "feat: add article list page"
```

---

## Task 22: Article Editor Page

**Files:**
- Create: `frontend/src/pages/ArticleEditorPage.vue`

- [ ] **Step 1: Write article editor**

Create `frontend/src/pages/ArticleEditorPage.vue`:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import type { Article, Layout } from '@/services/api'

const route = useRoute()
const router = useRouter()
const articleId = route.params.id as string | undefined

const title = ref('')
const author = ref('')
const summary = ref('')
const coverImage = ref('')
const layoutId = ref('')
const layouts = ref<Layout[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

async function loadData() {
  loading.value = true
  try {
    layouts.value = await api.listLayouts()
    if (articleId) {
      const article = await api.getArticle(articleId)
      title.value = article.title
      author.value = article.author
      summary.value = article.summary
      coverImage.value = article.cover_image
      layoutId.value = article.layout_id
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveArticle() {
  if (!title.value || !layoutId.value) {
    alert('请填写标题并选择排版')
    return
  }
  saving.value = true
  try {
    if (articleId) {
      await api.updateArticle(articleId, {
        title: title.value,
        layout_id: layoutId.value,
        author: author.value,
        summary: summary.value,
        cover_image: coverImage.value
      })
    } else {
      await api.createArticle({
        title: title.value,
        layout_id: layoutId.value,
        author: author.value,
        summary: summary.value,
        cover_image: coverImage.value
      })
    }
    router.push('/dashboard/articles')
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

function createLayout() {
  router.push('/editor/new')
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ articleId ? '编辑文章' : '新建文章' }}</h2>
      <div class="actions">
        <button class="btn-secondary" @click="router.push('/dashboard/articles')">取消</button>
        <button class="btn-primary" :disabled="saving" @click="saveArticle">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
    <p v-if="loading" class="status">加载中...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <form v-else class="form" @submit.prevent="saveArticle">
      <div class="form-group">
        <label>标题 *</label>
        <input v-model="title" type="text" placeholder="文章标题" required />
      </div>
      <div class="form-group">
        <label>作者</label>
        <input v-model="author" type="text" placeholder="作者名称" />
      </div>
      <div class="form-group">
        <label>摘要</label>
        <textarea v-model="summary" rows="3" placeholder="文章摘要"></textarea>
      </div>
      <div class="form-group">
        <label>封面图片 URL</label>
        <input v-model="coverImage" type="text" placeholder="https://..." />
      </div>
      <div class="form-group">
        <label>选择排版 *</label>
        <div class="layout-select">
          <select v-model="layoutId" required>
            <option value="" disabled>请选择排版</option>
            <option v-for="layout in layouts" :key="layout.id" :value="layout.id">{{ layout.name }}</option>
          </select>
          <button type="button" class="btn-secondary" @click="createLayout">新建排版</button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #e5e7eb; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: #111827; }
.actions { display: flex; gap: 10px; }
.btn-secondary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #4b5563; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
.btn-secondary:hover { background: #e5e7eb; }
.btn-primary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #fff; background: #3b82f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; }
.status { text-align: center; padding: 40px; color: #6b7280; }
.error { color: #dc2626; }
.form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; }
.form-group input, .form-group textarea, .form-group select {
  padding: 10px 12px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; font-family: inherit;
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: #3b82f6; }
.layout-select { display: flex; gap: 10px; }
.layout-select select { flex: 1; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ArticleEditorPage.vue
git commit -m "feat: add article editor page"
```

---

## Task 23: Layout List Page

**Files:**
- Create: `frontend/src/pages/LayoutListPage.vue`

- [ ] **Step 1: Write layout list**

Create `frontend/src/pages/LayoutListPage.vue`:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import type { Layout } from '@/services/api'
import { createEmptyDocument } from '@/types/document'

const router = useRouter()
const layouts = ref<Layout[]>([])
const loading = ref(false)
const error = ref('')

async function loadLayouts() {
  loading.value = true
  error.value = ''
  try {
    layouts.value = await api.listLayouts()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function editLayout(id: string) {
  router.push(`/editor/${id}`)
}

async function deleteLayout(id: string) {
  if (!confirm('确定要删除这个排版吗？')) return
  try {
    await api.deleteLayout(id)
    await loadLayouts()
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}

async function createLayout() {
  try {
    const layout = await api.createLayout({
      name: '未命名排版',
      document: createEmptyDocument()
    })
    router.push(`/editor/${layout.id}`)
  } catch (e: any) {
    alert('创建失败: ' + e.message)
  }
}

onMounted(loadLayouts)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>我的排版</h2>
      <button class="btn-primary" @click="createLayout">+ 新建排版</button>
    </div>
    <p v-if="loading" class="status">加载中...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <div v-else-if="layouts.length === 0" class="empty">
      <p>还没有排版，点击右上角新建</p>
    </div>
    <div v-else class="card-grid">
      <div v-for="layout in layouts" :key="layout.id" class="card">
        <h3 class="card-title">{{ layout.name }}</h3>
        <p v-if="layout.description" class="card-desc">{{ layout.description }}</p>
        <p class="card-meta">{{ new Date(layout.updatedAt).toLocaleString() }}</p>
        <div class="card-actions">
          <button class="btn-small" @click="editLayout(layout.id)">编辑</button>
          <button class="btn-small danger" @click="deleteLayout(layout.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #111827; }
.btn-primary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #fff; background: #3b82f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary:hover { background: #2563eb; }
.status { text-align: center; color: #6b7280; padding: 40px; }
.error { color: #dc2626; }
.empty { text-align: center; padding: 60px; color: #9ca3af; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 8px; }
.card-title { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
.card-desc { font-size: 13px; color: #6b7280; line-height: 1.4; }
.card-meta { font-size: 12px; color: #9ca3af; }
.card-actions { display: flex; gap: 8px; margin-top: 4px; }
.btn-small { padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 5px; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; }
.btn-small:hover { background: #f9fafb; }
.btn-small.danger { color: #dc2626; border-color: #fecaca; }
.btn-small.danger:hover { background: #fef2f2; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LayoutListPage.vue
git commit -m "feat: add layout list page"
```

---

## Task 24: User Management Page (Admin)

**Files:**
- Create: `frontend/src/pages/UserManagementPage.vue`

- [ ] **Step 1: Write user management**

Create `frontend/src/pages/UserManagementPage.vue`:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

interface UserItem {
  id: string
  username: string
  role: string
  created_at: string
}

const users = ref<UserItem[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const newUsername = ref('')
const newPassword = ref('')
const newRole = ref<'user' | 'admin'>('user')
const creating = ref(false)

async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.getUsers()
    users.value = res.data
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function createUser() {
  if (!newUsername.value || !newPassword.value) return
  creating.value = true
  try {
    await api.register(newUsername.value, newPassword.value, newRole.value)
    showModal.value = false
    newUsername.value = ''
    newPassword.value = ''
    newRole.value = 'user'
    await loadUsers()
  } catch (e: any) {
    alert('创建失败: ' + e.message)
  } finally {
    creating.value = false
  }
}

async function deleteUser(id: string) {
  if (!confirm('确定要删除该用户吗？')) return
  try {
    await api.deleteUser(id)
    await loadUsers()
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>用户管理</h2>
      <button class="btn-primary" @click="showModal = true">+ 新建用户</button>
    </div>
    <p v-if="loading" class="status">加载中...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <table v-else class="user-table">
      <thead>
        <tr><th>用户名</th><th>角色</th><th>创建时间</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.username }}</td>
          <td><span class="role-badge" :class="u.role">{{ u.role }}</span></td>
          <td>{{ new Date(u.created_at).toLocaleString() }}</td>
          <td><button class="btn-small danger" @click="deleteUser(u.id)">删除</button></td>
        </tr>
      </tbody>
    </table>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h3>新建用户</h3>
          <div class="form-group">
            <label>用户名</label>
            <input v-model="newUsername" type="text" placeholder="username" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="newPassword" type="password" placeholder="至少6位" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="newRole">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showModal = false">取消</button>
            <button class="btn-primary" :disabled="creating" @click="createUser">{{ creating ? '创建中...' : '创建' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: #111827; }
.btn-primary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #fff; background: #3b82f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary:hover { background: #2563eb; }
.status { text-align: center; padding: 40px; color: #6b7280; }
.error { color: #dc2626; }
.user-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.user-table th, .user-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
.user-table th { font-weight: 600; color: #374151; background: #f9fafb; }
.role-badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; }
.role-badge.admin { background: #dbeafe; color: #1e40af; }
.role-badge.user { background: #f3f4f6; color: #4b5563; }
.btn-small { padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 5px; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; }
.btn-small.danger { color: #dc2626; border-color: #fecaca; }
.btn-small.danger:hover { background: #fef2f2; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { width: 90%; max-width: 400px; background: #fff; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.modal h3 { margin: 0 0 4px; font-size: 16px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; }
.form-group input, .form-group select { padding: 9px 12px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
.btn-secondary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #4b5563; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/UserManagementPage.vue
git commit -m "feat: add admin user management page"
```

---

## Task 25: End-to-End Verification

- [ ] **Step 1: Start backend**

In `backend/`:
```bash
go run ./cmd/api
```
Expected: `Server starting on :8080...`

- [ ] **Step 2: Start frontend**

In `frontend/`:
```bash
npm run dev
```
Expected: Vite dev server starts on `http://localhost:3000`.

- [ ] **Step 3: Manual verification checklist**

Open `http://localhost:3000` in browser and verify:
1. Redirected to `/login`.
2. Login with `admin` / `admin123` → redirected to `/dashboard/articles`.
3. Create a new layout from `/dashboard/layouts` → editor opens.
4. Save layout → success message.
5. Create a new article from `/dashboard/articles` → select layout → save.
6. Article appears in list with correct metadata.
7. Delete article → confirms, disappears from list.
8. As admin, visit `/admin/users` → create a new user, delete a user.
9. Logout → redirected to `/login`.
10. Login as new user → sees empty articles/layouts.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete login and article archive system"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| JWT login | Task 2, 8, 9, 12 |
| User-scoped layouts | Task 7, 11 |
| Soft delete everywhere | Task 4, 5, 6, 7, 9, 10, 11 |
| Article CRUD | Task 3, 6, 10, 21, 22 |
| Admin user management | Task 5, 9, 24 |
| Frontend auth store | Task 14 |
| Token interceptor | Task 15 |
| Router with guards | Task 16, 17 |
| Login page | Task 20 |
| Article/Layout lists | Task 21, 23 |
| User management page | Task 24 |

## Placeholder Scan

No placeholders found. All steps contain complete code, exact commands, and expected outputs.

## Type Consistency Check

- `user_id` / `userID` consistent across backend.
- `role` field always `'admin' | 'user'`.
- Article status always `'draft' | 'published'`.
- Soft delete field always `deleted INTEGER DEFAULT 0`.
- JWT claims struct field names match middleware extraction keys.
