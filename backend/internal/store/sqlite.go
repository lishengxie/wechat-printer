package store

import (
	"database/sql"
	"fmt"
	"time"
	"wechat-layout/internal/model"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

// SQLiteDB SQLite 数据库封装
type SQLiteDB struct {
	db *sql.DB
}

// NewSQLiteDB 创建新的 SQLite 数据库连接
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

// initTables 初始化数据库表
func (s *SQLiteDB) initTables() error {
	query := `
	CREATE TABLE IF NOT EXISTS layouts (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT,
		content TEXT NOT NULL,
		css TEXT,
		html TEXT,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL
	);`
	_, err := s.db.Exec(query)
	return err
}

// Close 关闭数据库连接
func (s *SQLiteDB) Close() error {
	return s.db.Close()
}

// CreateLayout 创建新排版
func (s *SQLiteDB) CreateLayout(req *model.CreateLayoutRequest) (*model.Layout, error) {
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

	query := `INSERT INTO layouts (id, name, description, content, css, html, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := s.db.Exec(query, layout.ID, layout.Name, layout.Description, layout.Content, layout.CSS, layout.HTML, layout.CreatedAt, layout.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return layout, nil
}

// GetLayoutByID 根据 ID 获取排版
func (s *SQLiteDB) GetLayoutByID(id string) (*model.Layout, error) {
	layout := &model.Layout{}
	query := `SELECT id, name, description, content, css, html, created_at, updated_at FROM layouts WHERE id = ?`
	err := s.db.QueryRow(query, id).Scan(&layout.ID, &layout.Name, &layout.Description, &layout.Content, &layout.CSS, &layout.HTML, &layout.CreatedAt, &layout.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("layout not found")
		}
		return nil, err
	}
	return layout, nil
}

// GetAllLayouts 获取所有排版
func (s *SQLiteDB) GetAllLayouts() ([]*model.Layout, error) {
	query := `SELECT id, name, description, content, css, html, created_at, updated_at FROM layouts ORDER BY created_at DESC`
	rows, err := s.db.Query(query)
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

// UpdateLayout 更新排版
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

// UpdateLayoutHTML 更新排版的 HTML
func (s *SQLiteDB) UpdateLayoutHTML(id, html string) error {
	query := `UPDATE layouts SET html = ?, updated_at = ? WHERE id = ?`
	_, err := s.db.Exec(query, html, time.Now(), id)
	return err
}

// DeleteLayout 删除排版
func (s *SQLiteDB) DeleteLayout(id string) error {
	query := `DELETE FROM layouts WHERE id = ?`
	_, err := s.db.Exec(query, id)
	return err
}
