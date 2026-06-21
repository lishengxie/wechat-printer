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

	// Check if layouts table exists and handle creation/migration
	var tableExists int
	err = s.db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='layouts'").Scan(&tableExists)
	if err != nil {
		return err
	}

	if tableExists == 0 {
		// Fresh database — create layouts table
		_, err = s.db.Exec(`CREATE TABLE layouts (
			id TEXT PRIMARY KEY,
			user_id TEXT,
			name TEXT NOT NULL,
			description TEXT,
			content TEXT NOT NULL,
			css TEXT,
			html TEXT,
			deleted INTEGER NOT NULL DEFAULT 0,
			is_preset INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		);`)
		if err != nil {
			return err
		}
	} else {
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
				is_preset INTEGER NOT NULL DEFAULT 0,
				created_at DATETIME NOT NULL,
				updated_at DATETIME NOT NULL
			);`)
			if err != nil {
				return err
			}
			_, err = s.db.Exec(`INSERT INTO layouts (id, user_id, name, description, content, css, html, deleted, is_preset, created_at, updated_at)
				SELECT id, NULL, name, description, content, css, html, 0, 0, created_at, updated_at FROM layouts_old`)
			if err != nil {
				return err
			}
			_, err = s.db.Exec(`DROP TABLE layouts_old`)
			if err != nil {
				return err
			}
		}
	}

	// Migration: add is_preset column if it doesn't exist
	var hasIsPreset int
	_ = s.db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('layouts') WHERE name = 'is_preset'`).Scan(&hasIsPreset)
	if hasIsPreset == 0 {
		_, err = s.db.Exec(`ALTER TABLE layouts ADD COLUMN is_preset INTEGER NOT NULL DEFAULT 0`)
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

	// Create ai_config table
	_, err = s.db.Exec(`CREATE TABLE IF NOT EXISTS ai_config (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		api_key TEXT NOT NULL DEFAULT '',
		api_base TEXT NOT NULL DEFAULT '',
		model TEXT NOT NULL DEFAULT '',
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`)
	if err != nil {
		return err
	}

	// Ensure the single row exists
	var configCount int
	_ = s.db.QueryRow("SELECT COUNT(*) FROM ai_config").Scan(&configCount)
	if configCount == 0 {
		_, err = s.db.Exec("INSERT INTO ai_config (id, api_key, api_base, model) VALUES (1, '', '', '')")
		if err != nil {
			return err
		}
	}

	if err := s.seedDefaultAdmin(); err != nil {
		return err
	}
	return s.seedPresetLayouts()
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

// seedPresetLayouts creates built-in preset templates.
// Replaces all existing presets on each startup.
func (s *SQLiteDB) seedPresetLayouts() error {
	// Remove old presets before re-seeding
	_, err := s.db.Exec("DELETE FROM layouts WHERE is_preset = 1")
	if err != nil {
		return err
	}

	presets := []*model.Layout{
		// 1. 童话风 —— 童话绘本
		{
			ID:          "preset_story_002",
			Name:        "童话绘本 · 温馨风",
			Description: "暖黄奶油底色，柔和珊瑚橙强调，大圆角画框，适合亲子故事、育儿分享、暖心散文。灵感源自 Storybook 风格",
			Content:     `{"id":"preset_story_002","title":"童话绘本 · 温馨故事","createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z","root":{"id":"root","type":"container","props":{"layout":"single"},"styles":{"fontFamily":"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif","backgroundColor":"#FFF8F0","color":"#5C4033"},"children":[{"id":"mod_story_header","type":"header","props":{"title":"🌙 森林里的小月亮","subtitle":"一个温暖人心的睡前故事 / 送给所有心中有光的孩子","author":"童话妈妈","date":"2025-01-01","showDate":true,"showAuthor":true,"variant":"card"},"styles":{"textAlign":"center","padding":"28px 20px","backgroundColor":"linear-gradient(180deg, rgba(255,228,196,0.8) 0%, rgba(255,248,240,0.5) 100%)","borderRadius":"20px","border":"2px dashed rgba(232,150,90,0.4)","color":"#8B5E3C"}},{"id":"mod_story_toc","type":"toc","props":{"title":"📖 故事导读","items":[{"text":"一、森林里的小月亮","level":0},{"text":"萤火虫的愿望","level":1},{"text":"猫头鹰的智慧","level":1},{"text":"二、星光下的相遇","level":0},{"text":"温暖的帮助","level":1},{"text":"三、发光的力量","level":0}],"variant":"card"},"styles":{"padding":"20px","backgroundColor":"rgba(255,228,196,0.6)","borderRadius":"16px","border":"1px solid rgba(232,150,90,0.2)","margin":"0 0 24px 0"}},{"id":"mod_story_intro","type":"text","props":{"content":"从前，在一片<strong style=\"color:#D2691E;\">广袤的森林</strong>里，住着一只小小的萤火虫。她的光很微弱，微弱到几乎被夜晚吞没。<br/><br/>但是每天晚上，她都会飞到森林最高的那棵老橡树上，尽力点亮自己的小灯笼。<br/><br/>其他萤火虫笑她：「你的光那么小，谁会看见呢？」"},"styles":{"fontSize":"16px","color":"#5C4033","lineHeight":"2.0","margin":"0 0 20px 0","padding":"0 8px","letterSpacing":"0.05em"}},{"id":"mod_story_image","type":"image","props":{"src":"https://picsum.photos/640/360?random=10","alt":"月光下的森林","width":"100%"},"styles":{"margin":"0 0 24px 0","borderRadius":"20px","padding":"8px","backgroundColor":"#FFF","boxShadow":"0 6px 20px rgba(92,64,51,0.1)"}},{"id":"mod_story_characters_title","type":"heading","props":{"text":"🦊 故事角色","level":2,"variant":"left-bar","showNumbering":false},"styles":{"fontSize":"18px","fontWeight":"bold","color":"#A0522D","margin":"28px 0 16px 0","padding":"0 0 0 12px","lineHeight":"1.4"}},{"id":"mod_story_chars","type":"container","props":{"layout":"two-column"},"styles":{"margin":"0 0 24px 0"},"children":[{"id":"mod_story_char1","type":"text","props":{"content":"<div style=\"text-align:center;font-size:32px;margin-bottom:8px;\">✨</div><strong style=\"color:#D2691E;\">小萤火虫</strong><br/><span style=\"font-size:14px;color:#A08060;\">虽然微弱但永不放弃<br/>相信自己的光<br/>终能照亮他人的路</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(255,228,196,0.5)","borderRadius":"16px","lineHeight":"1.8"}},{"id":"mod_story_char2","type":"text","props":{"content":"<div style=\"text-align:center;font-size:32px;margin-bottom:8px;\">🦉</div><strong style=\"color:#D2691E;\">智慧猫头鹰</strong><br/><span style=\"font-size:14px;color:#A08060;\">森林里最年长的智者<br/>说话总是慢慢悠悠<br/>每一句都藏着道理</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(232,150,90,0.12)","borderRadius":"16px","lineHeight":"1.8"}}]},{"id":"mod_story_divider","type":"divider","props":{"style":"dashed","color":"#E8965A"},"styles":{"margin":"28px 0"}},{"id":"mod_story_quote","type":"quote","props":{"content":"你的光不需要比太阳亮，只要能照亮脚下的路就够了。","author":"智慧猫头鹰爷爷"},"styles":{"fontSize":"16px","fontStyle":"italic","color":"#8B6914","lineHeight":"2.0","padding":"24px 28px","backgroundColor":"rgba(255,240,224,0.8)","borderRadius":"16px","borderLeft":"4px solid #E8965A","margin":"0 0 24px 0"}},{"id":"mod_story_button","type":"button","props":{"text":"📚 更多童话故事","link":"","size":"medium"},"styles":{"textAlign":"center","margin":"24px 0"}},{"id":"mod_story_footer","type":"footer","props":{"text":"每一个孩子都是一颗星星，用自己的方式发光","copyright":"© 2025 童话绘本馆","showDivider":true,"variant":"branded"},"styles":{"textAlign":"center","padding":"24px 16px 16px","fontSize":"14px","color":"#A08060","letterSpacing":"2px"}}]}}`,
			CSS:       "",
			HTML:      "",
			IsPreset:  true,
		},
		// 2. 墨韵东方 · 中国风 (Chinese/Ink 风格)
		{
			ID:          "preset_chinese_007",
			Name:        "墨韵东方 · 中国风",
			Description: "朱红主色 + 宣纸底色，楷书风格标题，中式传统纹样点缀，适合传统文化、国潮文创、古典文学等内容。灵感源自 Chinese/Ink 风格",
			Content:     `{"id":"preset_chinese_007","title":"墨韵东方 · 风雅颂","createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z","root":{"id":"root","type":"container","props":{"layout":"single"},"styles":{"fontFamily":"-apple-system, 'Noto Serif SC', 'KaiTi', serif","backgroundColor":"#fefcf8","color":"#333333"},"children":[{"id":"mod_cn_header","type":"header","props":{"title":"墨韵东方 · 风雅颂","subtitle":"传承千年文脉 / 品味东方美学","author":"国潮文化馆","date":"2025-01-01","showDate":true,"showAuthor":true,"variant":"magazine"},"styles":{"textAlign":"center","padding":"36px 24px","backgroundColor":"#faf6f0","borderRadius":"0","borderTop":"3px solid #8B1E22","borderBottom":"3px solid #8B1E22","color":"#8B1E22","letterSpacing":"4px"}},{"id":"mod_cn_toc","type":"toc","props":{"title":"📋 文章目录","items":[{"text":"一、东方美学概述","level":0},{"text":"诗词之美","level":1},{"text":"水墨之意","level":1},{"text":"二、传统文化传承","level":0},{"text":"三、现代创新之路","level":0}],"variant":"numbered"},"styles":{"padding":"20px","backgroundColor":"rgba(139,30,34,0.04)","borderRadius":"8px","border":"1px solid rgba(139,30,34,0.12)","margin":"0 0 24px 0"}},{"id":"mod_cn_intro","type":"text","props":{"content":"中国传统文化，是一条绵延五千年的长河。<br/><br/>从甲骨文的刻痕到唐诗宋词的韵律，从水墨丹青的留白到园林建筑的意境——每一个细节都蕴含着<strong style=\"color:#8B1E22;\">东方审美</strong>的独特智慧。<br/><br/>在全球化浪潮席卷的今天，重新审视我们的文化根源，不仅是一种寻根，更是一种面向未来的自信。"},"styles":{"fontSize":"16px","color":"#4a4a4a","lineHeight":"2.0","margin":"0 0 24px 0","padding":"0 8px","letterSpacing":"1px"}},{"id":"mod_cn_image","type":"image","props":{"src":"https://picsum.photos/640/360?random=20","alt":"水墨山水画","width":"100%"},"styles":{"margin":"0 0 24px 0","borderRadius":"4px","border":"1px solid rgba(139,30,34,0.1)"}},{"id":"mod_cn_elements_title","type":"heading","props":{"text":"🎋 东方美学四韵","level":2,"variant":"left-bar","showNumbering":false},"styles":{"fontSize":"19px","fontWeight":"bold","color":"#8B1E22","margin":"28px 0 16px 0","padding":"0 0 0 12px","lineHeight":"1.4","letterSpacing":"3px"}},{"id":"mod_cn_elements","type":"container","props":{"layout":"two-column"},"styles":{"margin":"0 0 24px 0"},"children":[{"id":"mod_cn_elem1","type":"text","props":{"content":"<span style=\"font-size:28px;display:block;text-align:center;margin-bottom:8px;\">🏮</span><strong style=\"color:#8B1E22;\">诗 词</strong><br/><span style=\"font-size:14px;color:#6b6b6b;\">「明月几时有，把酒问青天」<br/>以极简的语言<br/>描绘最深沉的情感</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(139,30,34,0.04)","borderRadius":"8px","border":"1px solid rgba(139,30,34,0.12)","lineHeight":"1.9"}},{"id":"mod_cn_elem2","type":"text","props":{"content":"<span style=\"font-size:28px;display:block;text-align:center;margin-bottom:8px;\">🎨</span><strong style=\"color:#8B1E22;\">水 墨</strong><br/><span style=\"font-size:14px;color:#6b6b6b;\">「计白当黑，虚实相生」<br/>留白处自有天地<br/>墨色里藏着万千</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(139,30,34,0.04)","borderRadius":"8px","border":"1px solid rgba(139,30,34,0.12)","lineHeight":"1.9"}}]},{"id":"mod_cn_quote","type":"quote","props":{"content":"外师造化，中得心源","author":"唐 · 张璪"},"styles":{"fontSize":"17px","color":"#8B1E22","lineHeight":"2.0","padding":"24px 32px","backgroundColor":"#faf6f0","borderRadius":"4px","borderLeft":"4px solid #8B1E22","textAlign":"center","letterSpacing":"2px","margin":"0 0 24px 0"}},{"id":"mod_cn_divider","type":"divider","props":{"style":"solid","color":"rgba(139,30,34,0.2)"},"styles":{"margin":"32px 0"}},{"id":"mod_cn_culture","type":"text","props":{"content":"<strong style=\"color:#8B1E22;font-size:17px;letter-spacing:2px;\">🏯 传统文化在现代的传承</strong><br/><br/>● <strong>汉服复兴</strong>—— 年轻人穿在身上的文化自信，年增长率超过 200%<br/>● <strong>国潮设计</strong>—— 传统文化元素与现代审美的完美融合<br/>● <strong>非遗活化</strong>—— 数字化技术让古老技艺重获新生<br/>● <strong>中式生活</strong>—— 茶道、香道、花道，在仪式感中寻找内心平静"},"styles":{"fontSize":"15px","color":"#4a4a4a","lineHeight":"2.2","padding":"24px","backgroundColor":"rgba(139,30,34,0.03)","borderRadius":"8px","border":"1px solid rgba(139,30,34,0.08)","margin":"0 0 24px 0"}},{"id":"mod_cn_button","type":"button","props":{"text":"🏮 探索更多国潮文创","link":"","size":"medium"},"styles":{"textAlign":"center","margin":"24px 0"}},{"id":"mod_cn_footer","type":"footer","props":{"text":"传承不守旧，创新不忘本","copyright":"© 2025 国潮文化馆 · 东方美学传播者","showDivider":true,"variant":"branded"},"styles":{"textAlign":"center","padding":"24px 16px 16px","fontSize":"13px","color":"#8B1E22","letterSpacing":"3px"}}]}}`,
			CSS:       "",
			HTML:      "",
			IsPreset:  true,
		},
	}

	now := time.Now()
	for _, p := range presets {
		p.CreatedAt = now
		p.UpdatedAt = now
		_, err := s.db.Exec(
			`INSERT INTO layouts (id, user_id, name, description, content, css, html, deleted, is_preset, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			p.ID, "", p.Name, p.Description, p.Content, p.CSS, p.HTML, 0, 1, p.CreatedAt, p.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("seed preset layout %s: %w", p.ID, err)
		}
	}
	return nil
}

// ==================== AI Config Methods ====================

// GetAIConfig returns the saved AI configuration
func (s *SQLiteDB) GetAIConfig() (*model.AIConfig, error) {
	cfg := &model.AIConfig{}
	err := s.db.QueryRow("SELECT api_key, api_base, model FROM ai_config WHERE id = 1").Scan(&cfg.APIKey, &cfg.APIBase, &cfg.Model)
	if err != nil {
		if err == sql.ErrNoRows {
			return &model.AIConfig{}, nil
		}
		return nil, err
	}
	return cfg, nil
}

// UpdateAIConfig updates the saved AI configuration
func (s *SQLiteDB) UpdateAIConfig(cfg *model.AIConfig) error {
	_, err := s.db.Exec("UPDATE ai_config SET api_key = ?, api_base = ?, model = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
		cfg.APIKey, cfg.APIBase, cfg.Model)
	return err
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

	query := `INSERT INTO layouts (id, user_id, name, description, content, css, html, deleted, is_preset, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := s.db.Exec(query, layout.ID, userID, layout.Name, layout.Description, layout.Content, layout.CSS, layout.HTML, 0, 0, layout.CreatedAt, layout.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return layout, nil
}

// GetLayoutByID gets a single non-deleted layout
func (s *SQLiteDB) GetLayoutByID(id string) (*model.Layout, error) {
	layout := &model.Layout{}
	query := `SELECT id, name, description, content, css, html, is_preset, created_at, updated_at FROM layouts WHERE id = ? AND deleted = 0`
	err := s.db.QueryRow(query, id).Scan(&layout.ID, &layout.Name, &layout.Description, &layout.Content, &layout.CSS, &layout.HTML, &layout.IsPreset, &layout.CreatedAt, &layout.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("layout not found")
		}
		return nil, err
	}
	return layout, nil
}

// GetAllLayouts returns layouts for a user; admin can pass empty userID for all.
// Preset layouts are always included regardless of user_id.
func (s *SQLiteDB) GetAllLayouts(userID string) ([]*model.Layout, error) {
	var rows *sql.Rows
	var err error
	if userID != "" {
		rows, err = s.db.Query(`SELECT id, name, description, content, css, html, is_preset, created_at, updated_at FROM layouts WHERE (user_id = ? OR is_preset = 1) AND deleted = 0 ORDER BY is_preset DESC, created_at DESC`, userID)
	} else {
		rows, err = s.db.Query(`SELECT id, name, description, content, css, html, is_preset, created_at, updated_at FROM layouts WHERE deleted = 0 ORDER BY is_preset DESC, created_at DESC`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var layouts []*model.Layout
	for rows.Next() {
		layout := &model.Layout{}
		err := rows.Scan(&layout.ID, &layout.Name, &layout.Description, &layout.Content, &layout.CSS, &layout.HTML, &layout.IsPreset, &layout.CreatedAt, &layout.UpdatedAt)
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

// GetLayoutOwnerInfo returns ownerID and isPreset for a layout
func (s *SQLiteDB) GetLayoutOwnerInfo(id string) (ownerID string, isPreset bool, err error) {
	err = s.db.QueryRow("SELECT user_id, is_preset FROM layouts WHERE id = ? AND deleted = 0", id).Scan(&ownerID, &isPreset)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", false, fmt.Errorf("layout not found")
		}
		return "", false, err
	}
	return
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

// DeleteLayout soft-deletes a layout.
func (s *SQLiteDB) DeleteLayout(id string) error {
	_, err := s.db.Exec("UPDATE layouts SET deleted = 1, updated_at = ? WHERE id = ? AND deleted = 0", time.Now(), id)
	if err != nil {
		return err
	}
	return nil
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
