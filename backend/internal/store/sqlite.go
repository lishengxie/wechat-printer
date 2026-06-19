package store

import (
	"database/sql"
	"fmt"
	"time"
	"wechat-layout/internal/model"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

// SQLiteDB SQLite database wrapper
type SQLiteDB struct {
	db *sql.DB
}

// NewSQLiteDB creates a new SQLite database connection
func NewSQLiteDB(dbPath string) (*SQLiteDB, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	sqliteDB := &SQLiteDB{db: db}
	if err := sqliteDB.initTables(); err != nil {
		return nil, err
	}

	return sqliteDB, nil
}

// initTables initializes database tables and migrates existing data
func (s *SQLiteDB) initTables() error {
	// Create users table
	_, err := s.db.Exec(`CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		username TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'user',
		deleted INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`)
	if err != nil {
		return err
	}

	// Migrate layouts table if it exists without user_id and deleted columns
	var layoutColCount int
	err = s.db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('layouts') WHERE name IN ('user_id', 'deleted')`).Scan(&layoutColCount)
	if err != nil {
		return err
	}

	if layoutColCount == 0 {
		// Old table without new columns: rename, recreate, migrate
		_, err = s.db.Exec(`ALTER TABLE layouts RENAME TO layouts_old`)
		if err != nil {
			return err
		}
		_, err = s.db.Exec(`CREATE TABLE layouts (
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
		);`)
		if err != nil {
			return err
		}
		_, err = s.db.Exec(`INSERT INTO layouts (id, user_id, name, description, content, css, html, deleted, created_at, updated_at)
			SELECT id, NULL, name, description, content, css, html, 0, created_at, updated_at FROM layouts_old`)
		if err != nil {
			return err
		}
		_, err = s.db.Exec(`DROP TABLE layouts_old`)
		if err != nil {
			return err
		}
	} else {
		// Ensure layouts table exists with new schema
		_, err = s.db.Exec(`CREATE TABLE IF NOT EXISTS layouts (
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
		);`)
		if err != nil {
			return err
		}
	}

	// Create articles table
	_, err = s.db.Exec(`CREATE TABLE IF NOT EXISTS articles (
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
	);`)
	if err != nil {
		return err
	}

	// Attempt to add content column if it doesn't exist (safe to ignore error if already present)
	_, _ = s.db.Exec(`ALTER TABLE articles ADD COLUMN content TEXT DEFAULT ''`)

	return s.seedDefaultAdmin()
}

// seedDefaultAdmin creates a default admin if no users exist
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

// Close closes the database connection
func (s *SQLiteDB) Close() error {
	return s.db.Close()
}

// ==================== Layout Methods ====================

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

// UpdateLayout updates a layout
func (s *SQLiteDB) UpdateLayout(id string, req *model.UpdateLayoutRequest) (*model.Layout, error) {
	layout, err := s.GetLayoutByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		layout.Name = req.Name
	}
	if req.Description != "" {
		layout.Description = req.Description
	}
	if req.Content != "" {
		layout.Content = req.Content
	}
	if req.CSS != "" {
		layout.CSS = req.CSS
	}
	layout.UpdatedAt = time.Now()

	query := `UPDATE layouts SET name = ?, description = ?, content = ?, css = ?, html = ?, updated_at = ? WHERE id = ?`
	_, err = s.db.Exec(query, layout.Name, layout.Description, layout.Content, layout.CSS, layout.HTML, layout.UpdatedAt, id)
	if err != nil {
		return nil, err
	}

	return layout, nil
}

// UpdateLayoutHTML updates layout HTML
func (s *SQLiteDB) UpdateLayoutHTML(id, html string) error {
	query := `UPDATE layouts SET html = ?, updated_at = ? WHERE id = ?`
	_, err := s.db.Exec(query, html, time.Now(), id)
	return err
}

// DeleteLayout soft-deletes a layout
func (s *SQLiteDB) DeleteLayout(id string) error {
	_, err := s.db.Exec("UPDATE layouts SET deleted = 1, updated_at = ? WHERE id = ?", time.Now(), id)
	return err
}

// ==================== User Methods ====================

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

// ==================== Article Methods ====================

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
		Content:    req.Content,
		Status:     "draft",
		Deleted:    0,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	_, err := s.db.Exec(
		`INSERT INTO articles (id, user_id, layout_id, title, author, summary, cover_image, content, status, deleted, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		article.ID, article.UserID, article.LayoutID, article.Title, article.Author,
		article.Summary, article.CoverImage, article.Content, article.Status, article.Deleted, article.CreatedAt, article.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return article, nil
}

// GetArticleByID returns an article by ID (checking deleted = 0)
func (s *SQLiteDB) GetArticleByID(id string) (*model.Article, error) {
	article := &model.Article{}
	query := `SELECT id, user_id, layout_id, title, author, summary, cover_image, content, status, deleted, created_at, updated_at
			  FROM articles WHERE id = ? AND deleted = 0`
	err := s.db.QueryRow(query, id).Scan(
		&article.ID, &article.UserID, &article.LayoutID, &article.Title, &article.Author,
		&article.Summary, &article.CoverImage, &article.Content, &article.Status, &article.Deleted,
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
			`SELECT id, user_id, layout_id, title, author, summary, cover_image, content, status, deleted, created_at, updated_at
			 FROM articles WHERE user_id = ? AND deleted = 0 ORDER BY updated_at DESC`, userID)
	} else {
		rows, err = s.db.Query(
			`SELECT id, user_id, layout_id, title, author, summary, cover_image, content, status, deleted, created_at, updated_at
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
			&a.Summary, &a.CoverImage, &a.Content, &a.Status, &a.Deleted,
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
	article.Content = req.Content
	article.UpdatedAt = time.Now()

	_, err = s.db.Exec(
		`UPDATE articles SET title = ?, layout_id = ?, author = ?, summary = ?, cover_image = ?, content = ?, status = ?, updated_at = ? WHERE id = ?`,
		article.Title, article.LayoutID, article.Author, article.Summary, article.CoverImage, article.Content, article.Status, article.UpdatedAt, id,
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
