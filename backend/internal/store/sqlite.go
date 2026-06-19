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

// seedPresetLayouts creates built-in preset templates if none exist
func (s *SQLiteDB) seedPresetLayouts() error {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM layouts WHERE is_preset = 1 AND deleted = 0").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	presets := []*model.Layout{
		// 1. 科技风 —— 赛博前沿
		{
			ID:          "preset_tech_001",
			Name:        "赛博前沿 · 科技风",
			Description: "深色科技感排版，青色+蓝色渐变强调，适用于科技产品发布、技术评测、AI 资讯。灵感源自 ByteDance 风格",
			Content:     `{"id":"preset_tech_001","title":"赛博前沿 · 科技发布","createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z","root":{"id":"root","type":"container","props":{"layout":"single"},"styles":{"fontFamily":"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif","backgroundColor":"#0d1117","color":"#e6edf3"},"children":[{"id":"mod_tech_header","type":"header","props":{"title":"🚀 赛博前沿 · 深度技术评测","subtitle":"重新定义 AI 时代的交互体验 / 下一代智能系统全面解析","author":"科技编辑部","date":"2025-01-01","showDate":true,"showAuthor":true,"variant":"default"},"styles":{"textAlign":"center","padding":"32px 20px 24px","backgroundColor":"linear-gradient(135deg, #0d1117 0%, #161b22 100%)","borderRadius":"12px","border":"1px solid rgba(0,212,170,0.15)","color":"#e6edf3"}},{"id":"mod_tech_intro","type":"text","props":{"content":"在人工智能技术飞速迭代的今天，我们见证了前所未有的创新浪潮。从大语言模型到多模态 AI，从边缘计算到云端协同，每一项突破都在重塑我们的数字生活。<br/><br/>本文将从<strong style=\"color:#00d4aa\">技术架构</strong>、<strong style=\"color:#00d4aa\">性能表现</strong>、<strong style=\"color:#00d4aa\">应用场景</strong>三个维度，为你深度解析最新一代智能系统的核心突破。"},"styles":{"fontSize":"15px","color":"#c9d1d9","lineHeight":"1.9","margin":"0 0 24px 0","padding":"0 4px","letterSpacing":"0.5px"}},{"id":"mod_tech_highlight_title","type":"text","props":{"content":"⚡ 核心性能指标"},"styles":{"fontSize":"20px","fontWeight":"bold","color":"#00d4aa","margin":"32px 0 16px 0","padding":"0 0 8px 0","borderBottom":"2px solid rgba(0,212,170,0.2)"}},{"id":"mod_tech_cards","type":"container","props":{"layout":"three-column"},"styles":{"margin":"0 0 24px 0"},"children":[{"id":"mod_tech_card1","type":"text","props":{"content":"<strong style=\"color:#00d4aa;font-size:28px;display:block;text-align:center;margin-bottom:8px;\">300%</strong><span style=\"color:#8b949e;font-size:13px;display:block;text-align:center;\">性能提升<br/>比上一代快 3 倍</span>"},"styles":{"fontSize":"14px","textAlign":"center","padding":"20px 12px","backgroundColor":"rgba(0,212,170,0.08)","borderRadius":"12px","border":"1px solid rgba(0,212,170,0.15)","lineHeight":"1.7"}},{"id":"mod_tech_card2","type":"text","props":{"content":"<strong style=\"color:#58a6ff;font-size:28px;display:block;text-align:center;margin-bottom:8px;\">120h</strong><span style=\"color:#8b949e;font-size:13px;display:block;text-align:center;\">超长续航<br/>一周一充不是梦</span>"},"styles":{"fontSize":"14px","textAlign":"center","padding":"20px 12px","backgroundColor":"rgba(22,119,255,0.08)","borderRadius":"12px","border":"1px solid rgba(22,119,255,0.15)","lineHeight":"1.7"}},{"id":"mod_tech_card3","type":"text","props":{"content":"<strong style=\"color:#3fb950;font-size:28px;display:block;text-align:center;margin-bottom:8px;\">99.9%</strong><span style=\"color:#8b949e;font-size:13px;display:block;text-align:center;\">准确率<br/>AI 识别精度新高度</span>"},"styles":{"fontSize":"14px","textAlign":"center","padding":"20px 12px","backgroundColor":"rgba(63,185,80,0.08)","borderRadius":"12px","border":"1px solid rgba(63,185,80,0.15)","lineHeight":"1.7"}}]},{"id":"mod_tech_toc","type":"toc","props":{"title":"📋 文章目录","items":[{"text":"第一章：技术架构革新","level":0},{"text":"1.1 分布式计算框架","level":1},{"text":"1.2 神经网络优化","level":1},{"text":"第二章：性能实测数据","level":0},{"text":"2.1 基准测试结果","level":1},{"text":"2.2 实际场景表现","level":1},{"text":"第三章：应用前景展望","level":0}],"variant":"numbered"},"styles":{"padding":"20px","backgroundColor":"rgba(22,119,255,0.06)","borderRadius":"12px","border":"1px solid rgba(22,119,255,0.15)","margin":"0 0 24px 0"}},{"id":"mod_tech_divider","type":"divider","props":{"style":"solid","color":"rgba(0,212,170,0.3)"},"styles":{"margin":"32px 0"}},{"id":"mod_tech_features","type":"text","props":{"content":"<strong style=\"color:#00d4aa;font-size:18px;\">🔬 关键技术突破</strong><br/><br/>• <strong>分布式推理引擎</strong> — 延迟降低 60%，吞吐量提升 5 倍<br/>• <strong>多模态对齐</strong> — 文本、图像、语音统一理解框架<br/>• <strong>自适应学习</strong> — 根据用户行为动态优化模型参数<br/>• <strong>隐私计算</strong> — 数据不出本地，模型加密推理"},"styles":{"fontSize":"15px","color":"#c9d1d9","lineHeight":"2.2","padding":"24px","backgroundColor":"rgba(22,119,255,0.04)","borderRadius":"12px","border":"1px solid rgba(22,119,255,0.1)","margin":"0 0 24px 0"}},{"id":"mod_tech_footer","type":"footer","props":{"text":"如果这篇文章对你有帮助，欢迎点赞、在看、转发给更多朋友","copyright":"© 2025 赛博前沿 · 保留所有权利","showDivider":true,"variant":"default"},"styles":{"textAlign":"center","padding":"24px 16px 16px","fontSize":"13px","color":"#8b949e"}}]}}`,
			CSS:       "",
			HTML:      "",
			IsPreset:  true,
		},
		// 2. 童话风 —— 童话绘本
		{
			ID:          "preset_story_002",
			Name:        "童话绘本 · 温馨风",
			Description: "暖黄奶油底色，柔和珊瑚橙强调，大圆角画框，适合亲子故事、育儿分享、暖心散文。灵感源自 Storybook 风格",
			Content:     `{"id":"preset_story_002","title":"童话绘本 · 温馨故事","createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z","root":{"id":"root","type":"container","props":{"layout":"single"},"styles":{"fontFamily":"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif","backgroundColor":"#FFF8F0","color":"#5C4033"},"children":[{"id":"mod_story_header","type":"header","props":{"title":"🌙 森林里的小月亮","subtitle":"一个温暖人心的睡前故事 / 送给所有心中有光的孩子","author":"童话妈妈","date":"2025-01-01","showDate":true,"showAuthor":true,"variant":"card"},"styles":{"textAlign":"center","padding":"28px 20px","backgroundColor":"linear-gradient(180deg, rgba(255,228,196,0.8) 0%, rgba(255,248,240,0.5) 100%)","borderRadius":"20px","border":"2px dashed rgba(232,150,90,0.4)","color":"#8B5E3C"}},{"id":"mod_story_intro","type":"text","props":{"content":"从前，在一片<strong style=\"color:#D2691E;\">广袤的森林</strong>里，住着一只小小的萤火虫。她的光很微弱，微弱到几乎被夜晚吞没。<br/><br/>但是每天晚上，她都会飞到森林最高的那棵老橡树上，尽力点亮自己的小灯笼。<br/><br/>其他萤火虫笑她：「你的光那么小，谁会看见呢？」"},"styles":{"fontSize":"16px","color":"#5C4033","lineHeight":"2.0","margin":"0 0 20px 0","padding":"0 8px","letterSpacing":"0.05em"}},{"id":"mod_story_image","type":"image","props":{"src":"https://picsum.photos/640/360?random=10","alt":"月光下的森林","width":"100%"},"styles":{"margin":"0 0 24px 0","borderRadius":"20px","padding":"8px","backgroundColor":"#FFF","boxShadow":"0 6px 20px rgba(92,64,51,0.1)"}},{"id":"mod_story_characters_title","type":"text","props":{"content":"🦊 故事角色"},"styles":{"fontSize":"18px","fontWeight":"bold","color":"#A0522D","margin":"28px 0 16px 0","padding":"0 0 8px 12px","borderLeft":"4px solid #E8965A"}},{"id":"mod_story_chars","type":"container","props":{"layout":"two-column"},"styles":{"margin":"0 0 24px 0"},"children":[{"id":"mod_story_char1","type":"text","props":{"content":"<div style=\"text-align:center;font-size:32px;margin-bottom:8px;\">✨</div><strong style=\"color:#D2691E;\">小萤火虫</strong><br/><span style=\"font-size:14px;color:#A08060;\">虽然微弱但永不放弃<br/>相信自己的光<br/>终能照亮他人的路</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(255,228,196,0.5)","borderRadius":"16px","lineHeight":"1.8"}},{"id":"mod_story_char2","type":"text","props":{"content":"<div style=\"text-align:center;font-size:32px;margin-bottom:8px;\">🦉</div><strong style=\"color:#D2691E;\">智慧猫头鹰</strong><br/><span style=\"font-size:14px;color:#A08060;\">森林里最年长的智者<br/>说话总是慢慢悠悠<br/>每一句都藏着道理</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(232,150,90,0.12)","borderRadius":"16px","lineHeight":"1.8"}}]},{"id":"mod_story_divider","type":"divider","props":{"style":"dashed","color":"#E8965A"},"styles":{"margin":"28px 0"}},{"id":"mod_story_quote","type":"text","props":{"content":"「<em>你的光不需要比太阳亮，</em><br/><em>只要能照亮脚下的路就够了。</em>」<br/><br/>—— 智慧猫头鹰爷爷"},"styles":{"fontSize":"16px","fontStyle":"italic","color":"#8B6914","lineHeight":"2.0","padding":"24px 28px","backgroundColor":"rgba(255,240,224,0.8)","borderRadius":"16px","borderLeft":"4px solid #E8965A","margin":"0 0 24px 0"}},{"id":"mod_story_footer","type":"footer","props":{"text":"每一个孩子都是一颗星星，用自己的方式发光","copyright":"© 2025 童话绘本馆","showDivider":true,"variant":"branded"},"styles":{"textAlign":"center","padding":"24px 16px 16px","fontSize":"14px","color":"#A08060","letterSpacing":"2px"}}]}}`,
			CSS:       "",
			HTML:      "",
			IsPreset:  true,
		},
		// 3. 简约风 —— 极简留白
		{
			ID:          "preset_minimal_003",
			Name:        "极简留白 · 简约风",
			Description: "纯白底色，舒适阅读间距，浅灰卡片区隔，适合深度长文、书评影评、个人随笔。灵感源自 Ink/Magazine 风格",
			Content:     `{"id":"preset_minimal_003","title":"极简留白 · 深度阅读","createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z","root":{"id":"root","type":"container","props":{"layout":"single"},"styles":{"fontFamily":"-apple-system, 'Noto Serif SC', Georgia, serif","backgroundColor":"#ffffff","color":"#333333","maxWidth":"640px","margin":"0 auto"},"children":[{"id":"mod_min_header","type":"header","props":{"title":"读书，是一场与自己的对话","subtitle":"在信息爆炸的时代，找回深度阅读的力量","author":"书虫","date":"2025-01-01","showDate":true,"showAuthor":true,"variant":"minimal"},"styles":{"textAlign":"center","padding":"40px 20px 24px","backgroundColor":"#fafafa","borderRadius":"0","color":"#222222"}},{"id":"mod_min_toc","type":"toc","props":{"title":"目录","items":[{"text":"一、为什么要深度阅读","level":0},{"text":"二、如何培养阅读习惯","level":1},{"text":"三、我的私人书单","level":0},{"text":"四、写在最后","level":0}],"variant":"minimal"},"styles":{"padding":"24px","backgroundColor":"#fafafa","borderRadius":"0","border":"none","margin":"0 0 32px 0"}},{"id":"mod_min_body1","type":"text","props":{"content":"在这个短视频横行的时代，我们的注意力被切割成碎片。一条 15 秒的视频、一段 140 字的微博、一个自动播放的短剧——我们的脑子习惯了<strong>快速切换</strong>，却渐渐失去了<strong>长时间聚焦</strong>的能力。<br/><br/>但真正有价值的知识，从来都不是被 "喂到嘴边" 的。它需要你静下来，花时间，一个字一个字地去<em>咀嚼</em>、<em>消化</em>、<em>反刍</em>。这就是深度阅读不可替代的价值。"},"styles":{"fontSize":"16px","color":"#333333","lineHeight":"2.0","margin":"0 0 28px 0","padding":"0 4px","letterSpacing":"0.5px"}},{"id":"mod_min_divider","type":"divider","props":{"style":"solid","color":"#e5e7eb"},"styles":{"margin":"36px 0"}},{"id":"mod_min_body2","type":"text","props":{"content":"<span style=\"font-size:13px;color:#999;letter-spacing:2px;text-transform:uppercase;\">方 法 论</span><br/><br/><strong style=\"font-size:18px;color:#222;\">如何培养持久的阅读习惯？</strong><br/><br/>首先，不要贪多。一天读 10 页比一天读 100 页然后放弃要好得多。关键在于<strong>持续</strong>，而非<strong>强度</strong>。<br/><br/>其次，创造仪式感。一盏灯、一杯茶、一段不受打扰的时间——让阅读成为一天中最值得期待的 moment。<br/><br/>最后，学会输出。读完一本书，写下三句话的感悟。这会让你的阅读效率提升 3 倍以上。"},"styles":{"fontSize":"16px","color":"#333333","lineHeight":"2.0","margin":"0 0 28px 0","padding":"24px","backgroundColor":"#fafafa","borderRadius":"0","borderLeft":"4px solid #333"}},{"id":"mod_min_footer","type":"footer","props":{"text":"感谢你的阅读。愿我们都能在浮躁的世界里，找到属于自己的那一份宁静。","copyright":"© 2025 书虫笔记","showDivider":true,"variant":"simple"},"styles":{"textAlign":"center","padding":"32px 16px 16px","fontSize":"13px","color":"#999"}}]}}`,
			CSS:       "",
			HTML:      "",
			IsPreset:  true,
		},
		// 4. 商务风 —— 商业简报
		{
			ID:          "preset_business_004",
			Name:        "商业简报 · 商务风",
			Description: "深蓝主色 + 金色强调，结构化卡片布局，适合商业计划书、行业报告、公司介绍。灵感源自 Focus-Gold/Elegant-Navy 风格",
			Content:     `{"id":"preset_business_004","title":"商业简报 · 季度报告","createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z","root":{"id":"root","type":"container","props":{"layout":"single"},"styles":{"fontFamily":"-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif","backgroundColor":"#ffffff","color":"#333333"},"children":[{"id":"mod_biz_header","type":"header","props":{"title":"2025 年第一季度 · 商业简报","subtitle":"Q1 Business Review — 稳健增长 · 多元布局","author":"战略规划部","date":"2025-01-01","showDate":true,"showAuthor":true,"variant":"default"},"styles":{"textAlign":"center","padding":"36px 24px 24px","backgroundColor":"#1e3a5f","borderRadius":"8px","color":"#ffffff"}},{"id":"mod_biz_summary","type":"text","props":{"content":"<strong style=\"color:#1e3a5f;\">执行摘要</strong><br/><br/>第一季度，公司在整体市场波动中保持稳健增长态势。核心业务营收同比增长 <strong style=\"color:#c9a84c;\">23.5%</strong>，新用户获取成本降低 <strong style=\"color:#c9a84c;\">18%</strong>，各项关键指标均达成或超过预期目标。<br/><br/>以下是各业务线的具体表现："},"styles":{"fontSize":"15px","color":"#4a5568","lineHeight":"1.9","margin":"0 0 24px 0","padding":"0 4px"}},{"id":"mod_biz_kpi_title","type":"text","props":{"content":"📊 核心业绩数据"},"styles":{"fontSize":"18px","fontWeight":"bold","color":"#1e3a5f","margin":"32px 0 16px 0","padding":"0 0 8px 0","borderBottom":"2px solid #c9a84c"}},{"id":"mod_biz_kpis","type":"container","props":{"layout":"three-column"},"styles":{"margin":"0 0 24px 0"},"children":[{"id":"mod_biz_kpi1","type":"text","props":{"content":"<strong style=\"color:#c9a84c;font-size:26px;display:block;text-align:center;margin-bottom:6px;\">¥2.8亿</strong><span style=\"color:#718096;font-size:13px;display:block;text-align:center;\">总营收<br/>同比 +23.5%</span>"},"styles":{"fontSize":"14px","textAlign":"center","padding":"20px 12px","backgroundColor":"rgba(30,58,95,0.04)","borderRadius":"8px","border":"1px solid rgba(30,58,95,0.1)","lineHeight":"1.7"}},{"id":"mod_biz_kpi2","type":"text","props":{"content":"<strong style=\"color:#c9a84c;font-size:26px;display:block;text-align:center;margin-bottom:6px;\">156万</strong><span style=\"color:#718096;font-size:13px;display:block;text-align:center;\">活跃用户<br/>环比 +12.8%</span>"},"styles":{"fontSize":"14px","textAlign":"center","padding":"20px 12px","backgroundColor":"rgba(30,58,95,0.04)","borderRadius":"8px","border":"1px solid rgba(30,58,95,0.1)","lineHeight":"1.7"}},{"id":"mod_biz_kpi3","type":"text","props":{"content":"<strong style=\"color:#c9a84c;font-size:26px;display:block;text-align:center;margin-bottom:6px;\">92%</strong><span style=\"color:#718096;font-size:13px;display:block;text-align:center;\">客户满意度<br/>创历史新高</span>"},"styles":{"fontSize":"14px","textAlign":"center","padding":"20px 12px","backgroundColor":"rgba(30,58,95,0.04)","borderRadius":"8px","border":"1px solid rgba(30,58,95,0.1)","lineHeight":"1.7"}}]},{"id":"mod_biz_detail","type":"text","props":{"content":"<strong style=\"color:#1e3a5f;font-size:17px;\">🔍 业务亮点回顾</strong><br/><br/>● <strong>产品线 A</strong>：发布 3.0 版本，新功能上线首周使用率突破 40%<br/>● <strong>市场拓展</strong>：新开 5 个城市分部，本地化团队组建完成<br/>● <strong>战略合作</strong>：与三家行业头部企业签署战略合作协议<br/>● <strong>技术创新</strong>：研发投入同比增长 45%，申请专利 12 项<br/><br/>下季度重点：持续优化用户体验，加速海外市场布局。"},"styles":{"fontSize":"15px","color":"#4a5568","lineHeight":"2.1","padding":"24px","backgroundColor":"rgba(30,58,95,0.03)","borderRadius":"8px","border":"1px solid rgba(30,58,95,0.08)","margin":"0 0 24px 0"}},{"id":"mod_biz_button","type":"button","props":{"text":"📥 下载完整报告","link":"","size":"large"},"styles":{"textAlign":"center","margin":"24px 0"}},{"id":"mod_biz_footer","type":"footer","props":{"text":"本报告仅限内部传阅，未经授权不得对外转发","copyright":"© 2025 商业简报 · 战略规划部","showDivider":true,"variant":"simple"},"styles":{"textAlign":"center","padding":"24px 16px 16px","fontSize":"12px","color":"#a0aec0"}}]}}`,
			CSS:       "",
			HTML:      "",
			IsPreset:  true,
		},
		// 5. 暗夜霓虹 · 赛博风 (Midnight/Cyberpunk 风格)
		{
			ID:          "preset_tech_005",
			Name:        "暗夜霓虹 · 赛博风",
			Description: "深色背景 + 粉紫蓝霓虹渐变，赛博朋克光效，适合 AI/Web3/元宇宙等前沿科技话题。灵感源自 Midnight 风格",
			Content:     `{"id":"preset_tech_005","title":"暗夜霓虹 · 未来已来","createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z","root":{"id":"root","type":"container","props":{"layout":"single"},"styles":{"fontFamily":"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif","backgroundColor":"#0f0f1a","color":"#e5e5e7"},"children":[{"id":"mod_neo_header","type":"header","props":{"title":"暗夜霓虹 · AI 纪元","subtitle":"当人工智能遇见量子计算 / 下一代技术栈全面解析","author":"深科技实验室","date":"2025-01-01","showDate":true,"showAuthor":true,"variant":"default"},"styles":{"textAlign":"center","padding":"36px 20px 28px","background":"linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)","borderRadius":"16px","border":"1px solid rgba(139,92,246,0.3)","color":"#ffffff"}},{"id":"mod_neo_intro","type":"text","props":{"content":"我们正站在技术奇点的门槛上。<strong style=\"color:#c4b5fd;\">大语言模型</strong>、<strong style=\"color:#f9a8d4;\">量子计算</strong>、<strong style=\"color:#93c5fd;\">脑机接口</strong>——这三股技术洪流正在汇聚成一股前所未有的变革力量。<br/><br/>在未来五年内，我们将见证比过去五十年更多的技术突破。这不是预测，而是正在发生的现实。"},"styles":{"fontSize":"15px","color":"#c9d1d9","lineHeight":"1.9","margin":"0 0 24px 0","padding":"0 4px","letterSpacing":"0.5px"}},{"id":"mod_neo_metrics_title","type":"text","props":{"content":"⚡ 技术爆发指数"},"styles":{"fontSize":"20px","fontWeight":"bold","color":"#c4b5fd","margin":"32px 0 16px 0","padding":"0 0 8px 0","borderBottom":"1px solid rgba(139,92,246,0.2)"}},{"id":"mod_neo_metrics","type":"container","props":{"layout":"three-column"},"styles":{"margin":"0 0 24px 0"},"children":[{"id":"mod_neo_metric1","type":"text","props":{"content":"<strong style=\"color:#f9a8d4;font-size:28px;display:block;text-align:center;margin-bottom:8px;\">3000x</strong><span style=\"color:#9ca3af;font-size:13px;display:block;text-align:center;\">算力增长<br/>近五年 AI 算力</span>"},"styles":{"fontSize":"14px","textAlign":"center","padding":"20px 12px","backgroundColor":"rgba(244,114,182,0.1)","borderRadius":"12px","border":"1px solid rgba(244,114,182,0.3)","lineHeight":"1.7"}},{"id":"mod_neo_metric2","type":"text","props":{"content":"<strong style=\"color:#c4b5fd;font-size:28px;display:block;text-align:center;margin-bottom:8px;\">97%</strong><span style=\"color:#9ca3af;font-size:13px;display:block;text-align:center;\">任务替代率<br/>标准化工作自动化</span>"},"styles":{"fontSize":"14px","textAlign":"center","padding":"20px 12px","backgroundColor":"rgba(139,92,246,0.1)","borderRadius":"12px","border":"1px solid rgba(139,92,246,0.3)","lineHeight":"1.7"}},{"id":"mod_neo_metric3","type":"text","props":{"content":"<strong style=\"color:#93c5fd;font-size:28px;display:block;text-align:center;margin-bottom:8px;\">12x</strong><span style=\"color:#9ca3af;font-size:13px;display:block;text-align:center;\">推理加速<br/>新一代芯片突破</span>"},"styles":{"fontSize":"14px","textAlign":"center","padding":"20px 12px","backgroundColor":"rgba(96,165,250,0.1)","borderRadius":"12px","border":"1px solid rgba(96,165,250,0.3)","lineHeight":"1.7"}}]},{"id":"mod_neo_toc","type":"toc","props":{"title":"📋 探索路线图","items":[{"text":"第一章：AI 大模型的进化之路","level":0},{"text":"1.1 从 GPT 到多模态","level":1},{"text":"1.2 上下文窗口的革命","level":1},{"text":"第二章：量子计算的破晓","level":0},{"text":"2.1 量子优势的实现","level":1},{"text":"2.2 混合计算架构","level":1},{"text":"第三章：人机共生的未来","level":0}],"variant":"numbered"},"styles":{"padding":"20px","backgroundColor":"rgba(139,92,246,0.06)","borderRadius":"12px","border":"1px solid rgba(139,92,246,0.2)","margin":"0 0 24px 0"}},{"id":"mod_neo_divider","type":"divider","props":{"style":"solid","color":"rgba(139,92,246,0.3)"},"styles":{"margin":"32px 0"}},{"id":"mod_neo_features","type":"text","props":{"content":"<strong style=\"color:#c4b5fd;font-size:18px;\">🔬 关键技术突破</strong><br/><br/>• <strong>神经符号系统</strong> — 结合神经网络与符号推理，突破可解释性瓶颈<br/>• <strong>量子机器学习</strong> — 量子态表示学习，指数级加速特征提取<br/>• <strong>边缘智能</strong> — 端侧大模型推理，延迟低于 10ms<br/>• <strong>隐私计算</strong> — 联邦学习 + 同态加密，数据可用不可见"},"styles":{"fontSize":"15px","color":"#d1d5db","lineHeight":"2.2","padding":"24px","backgroundColor":"rgba(139,92,246,0.04)","borderRadius":"12px","border":"1px solid rgba(139,92,246,0.15)","margin":"0 0 24px 0"}},{"id":"mod_neo_footer","type":"footer","props":{"text":"关注深科技实验室，一起见证未来","copyright":"© 2025 深科技实验室 · 保留所有权利","showDivider":true,"variant":"default"},"styles":{"textAlign":"center","padding":"24px 16px 16px","fontSize":"13px","color":"#6b7280"}}]}}`,
			CSS:       "",
			HTML:      "",
			IsPreset:  true,
		},
		// 6. 清新薄荷 · 生活风 (Mint-Fresh 风格)
		{
			ID:          "preset_life_006",
			Name:        "清新薄荷 · 生活风",
			Description: "薄荷绿点缀 + 纯白底色，圆角卡片化设计，适合健康养生、生活方式、美食旅行等清新内容。灵感源自 Mint-Fresh 风格",
			Content:     `{"id":"preset_life_006","title":"清新薄荷 · 慢生活","createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z","root":{"id":"root","type":"container","props":{"layout":"single"},"styles":{"fontFamily":"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif","backgroundColor":"#ffffff","color":"#2d4a3e"},"children":[{"id":"mod_mint_header","type":"header","props":{"title":"🌿 慢下来，遇见更好的自己","subtitle":"在快节奏的世界里 / 找回内心的平静与力量","author":"薄荷生活志","date":"2025-01-01","showDate":true,"showAuthor":true,"variant":"card"},"styles":{"textAlign":"center","padding":"32px 20px","backgroundColor":"linear-gradient(180deg, rgba(224,245,236,0.95) 0%, #ffffff 100%)","borderRadius":"20px","border":"1px solid rgba(26,122,90,0.15)","color":"#1d5e49"}},{"id":"mod_mint_intro","type":"text","props":{"content":"你是否也感到，生活越来越像一场永不停歇的赛跑？<br/><br/>其实，真正的幸福往往藏在那些<strong style=\"color:#1a7a5a;\">慢下来的时刻</strong>里——一杯手冲咖啡的香气、一本好书的午后、一次与自然亲密接触的散步。<br/><br/>今天，我们聊聊如何在喧嚣中找到属于自己的节奏。"},"styles":{"fontSize":"15px","color":"#2d4a3e","lineHeight":"2.0","margin":"0 0 24px 0","padding":"0 4px","letterSpacing":"0.5px"}},{"id":"mod_mint_tips_title","type":"text","props":{"content":"✨ 五个小改变，让生活更美好"},"styles":{"fontSize":"19px","fontWeight":"bold","color":"#1a7a5a","margin":"28px 0 16px 0","padding":"6px 16px","backgroundColor":"rgba(224,245,236,0.7)","borderRadius":"999px","textAlign":"center"}},{"id":"mod_mint_tips","type":"container","props":{"layout":"two-column"},"styles":{"margin":"0 0 24px 0"},"children":[{"id":"mod_mint_tip1","type":"text","props":{"content":"<span style=\"font-size:24px;display:block;text-align:center;margin-bottom:6px;\">☀️</span><strong style=\"color:#1a7a5a;\">早起 30 分钟</strong><br/><span style=\"font-size:14px;color:#5a8a72;\">用从容的早餐开启一天<br/>告别匆忙与焦虑<br/>给自己一段独处时光</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(224,245,236,0.5)","borderRadius":"16px","border":"1px solid rgba(26,122,90,0.12)","lineHeight":"1.8"}},{"id":"mod_mint_tip2","type":"text","props":{"content":"<span style=\"font-size:24px;display:block;text-align:center;margin-bottom:6px;\">📵</span><strong style=\"color:#1a7a5a;\">数字排毒</strong><br/><span style=\"font-size:14px;color:#5a8a72;\">每天 1 小时远离屏幕<br/>读书、散步或冥想<br/>让大脑真正休息</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(224,245,236,0.5)","borderRadius":"16px","border":"1px solid rgba(26,122,90,0.12)","lineHeight":"1.8"}}]},{"id":"mod_mint_quote","type":"text","props":{"content":"「生活不是赛跑，而是一次旅行。<br/>每一步都值得欣赏，每一刻都值得珍惜。」"},"styles":{"fontSize":"16px","fontStyle":"italic","color":"rgba(26,122,90,0.85)","lineHeight":"2.0","padding":"20px 24px","backgroundColor":"rgba(224,245,236,0.9)","borderRadius":"14px","borderLeft":"4px solid #1a7a5a","margin":"0 0 24px 0"}},{"id":"mod_mint_divider","type":"divider","props":{"style":"dashed","color":"rgba(26,122,90,0.3)"},"styles":{"margin":"32px 0"}},{"id":"mod_mint_tips_detail","type":"text","props":{"content":"<strong style=\"color:#1a7a5a;font-size:17px;\">🌱 日常践行小贴士</strong><br/><br/>🥗 <strong>饮食</strong>：多吃当季蔬果，少油少盐，让身体轻装上阵<br/>🚶 <strong>运动</strong>：每天 30 分钟快走，比健身房更可持续<br/>🧘 <strong>冥想</strong>：每天 10 分钟正念呼吸，有效降低焦虑水平<br/>📖 <strong>阅读</strong>：每月 2 本纸质书，远离屏幕的蓝光伤害<br/>💧 <strong>饮水</strong>：每天 8 杯水，最简单的护肤秘诀"},"styles":{"fontSize":"15px","color":"#2d4a3e","lineHeight":"2.2","padding":"24px","backgroundColor":"rgba(224,245,236,0.4)","borderRadius":"16px","border":"1px solid rgba(26,122,90,0.1)","margin":"0 0 24px 0"}},{"id":"mod_mint_footer","type":"footer","props":{"text":"愿你的生活，如薄荷般清新","copyright":"© 2025 薄荷生活志 · 慢下来，更美好","showDivider":true,"variant":"simple"},"styles":{"textAlign":"center","padding":"24px 16px 16px","fontSize":"13px","color":"#5a8a72"}}]}}`,
			CSS:       "",
			HTML:      "",
			IsPreset:  true,
		},
		// 7. 墨韵东方 · 中国风 (Chinese/Ink 风格)
		{
			ID:          "preset_chinese_007",
			Name:        "墨韵东方 · 中国风",
			Description: "朱红主色 + 宣纸底色，楷书风格标题，中式传统纹样点缀，适合传统文化、国潮文创、古典文学等内容。灵感源自 Chinese/Ink 风格",
			Content:     `{"id":"preset_chinese_007","title":"墨韵东方 · 风雅颂","createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z","root":{"id":"root","type":"container","props":{"layout":"single"},"styles":{"fontFamily":"-apple-system, 'Noto Serif SC', 'KaiTi', serif","backgroundColor":"#fefcf8","color":"#333333"},"children":[{"id":"mod_cn_header","type":"header","props":{"title":"墨韵东方 · 风雅颂","subtitle":"传承千年文脉 / 品味东方美学","author":"国潮文化馆","date":"2025-01-01","showDate":true,"showAuthor":true,"variant":"magazine"},"styles":{"textAlign":"center","padding":"36px 24px","backgroundColor":"#faf6f0","borderRadius":"0","borderTop":"3px solid #8B1E22","borderBottom":"3px solid #8B1E22","color":"#8B1E22","letterSpacing":"4px"}},{"id":"mod_cn_intro","type":"text","props":{"content":"中国传统文化，是一条绵延五千年的长河。<br/><br/>从甲骨文的刻痕到唐诗宋词的韵律，从水墨丹青的留白到园林建筑的意境——每一个细节都蕴含着<strong style=\"color:#8B1E22;\">东方审美</strong>的独特智慧。<br/><br/>在全球化浪潮席卷的今天，重新审视我们的文化根源，不仅是一种寻根，更是一种面向未来的自信。"},"styles":{"fontSize":"16px","color":"#4a4a4a","lineHeight":"2.0","margin":"0 0 24px 0","padding":"0 8px","letterSpacing":"1px"}},{"id":"mod_cn_elements_title","type":"text","props":{"content":"🎋 东方美学四韵"},"styles":{"fontSize":"19px","fontWeight":"bold","color":"#8B1E22","margin":"28px 0 16px 0","padding":"0 0 8px 12px","borderLeft":"4px solid #8B1E22","borderBottom":"1px dashed rgba(139,30,34,0.3)","letterSpacing":"3px"}},{"id":"mod_cn_elements","type":"container","props":{"layout":"two-column"},"styles":{"margin":"0 0 24px 0"},"children":[{"id":"mod_cn_elem1","type":"text","props":{"content":"<span style=\"font-size:28px;display:block;text-align:center;margin-bottom:8px;\">🏮</span><strong style=\"color:#8B1E22;\">诗 词</strong><br/><span style=\"font-size:14px;color:#6b6b6b;\">「明月几时有，把酒问青天」<br/>以极简的语言<br/>描绘最深沉的情感</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(139,30,34,0.04)","borderRadius":"8px","border":"1px solid rgba(139,30,34,0.12)","lineHeight":"1.9"}},{"id":"mod_cn_elem2","type":"text","props":{"content":"<span style=\"font-size:28px;display:block;text-align:center;margin-bottom:8px;\">🎨</span><strong style=\"color:#8B1E22;\">水 墨</strong><br/><span style=\"font-size:14px;color:#6b6b6b;\">「计白当黑，虚实相生」<br/>留白处自有天地<br/>墨色里藏着万千</span>"},"styles":{"fontSize":"15px","textAlign":"center","padding":"20px 16px","backgroundColor":"rgba(139,30,34,0.04)","borderRadius":"8px","border":"1px solid rgba(139,30,34,0.12)","lineHeight":"1.9"}}]},{"id":"mod_cn_quote","type":"text","props":{"content":"「<em>外师造化，中得心源</em>」<br/><br/>—— 唐 · 张璪"},"styles":{"fontSize":"17px","color":"#8B1E22","lineHeight":"2.0","padding":"24px 32px","backgroundColor":"#faf6f0","borderRadius":"4px","borderLeft":"4px solid #8B1E22","textAlign":"center","letterSpacing":"2px","margin":"0 0 24px 0"}},{"id":"mod_cn_divider","type":"divider","props":{"style":"solid","color":"rgba(139,30,34,0.2)"},"styles":{"margin":"32px 0"}},{"id":"mod_cn_culture","type":"text","props":{"content":"<strong style=\"color:#8B1E22;font-size:17px;letter-spacing:2px;\">🏯 传统文化在现代的传承</strong><br/><br/>● <strong>汉服复兴</strong>—— 年轻人穿在身上的文化自信，年增长率超过 200%<br/>● <strong>国潮设计</strong>—— 传统文化元素与现代审美的完美融合<br/>● <strong>非遗活化</strong>—— 数字化技术让古老技艺重获新生<br/>● <strong>中式生活</strong>—— 茶道、香道、花道，在仪式感中寻找内心平静"},"styles":{"fontSize":"15px","color":"#4a4a4a","lineHeight":"2.2","padding":"24px","backgroundColor":"rgba(139,30,34,0.03)","borderRadius":"8px","border":"1px solid rgba(139,30,34,0.08)","margin":"0 0 24px 0"}},{"id":"mod_cn_footer","type":"footer","props":{"text":"传承不守旧，创新不忘本","copyright":"© 2025 国潮文化馆 · 东方美学传播者","showDivider":true,"variant":"branded"},"styles":{"textAlign":"center","padding":"24px 16px 16px","fontSize":"13px","color":"#8B1E22","letterSpacing":"3px"}}]}}`,
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

// DeleteLayout soft-deletes a layout. Preset layouts cannot be deleted.
func (s *SQLiteDB) DeleteLayout(id string) error {
	var isPreset bool
	err := s.db.QueryRow("SELECT is_preset FROM layouts WHERE id = ? AND deleted = 0", id).Scan(&isPreset)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("layout not found")
		}
		return err
	}
	if isPreset {
		return fmt.Errorf("preset layouts cannot be deleted")
	}
	_, err = s.db.Exec("UPDATE layouts SET deleted = 1, updated_at = ? WHERE id = ?", time.Now(), id)
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
