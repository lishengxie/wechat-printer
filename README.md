# WeChat Printer — 公众号排版编辑器

一款基于拖拽模块的微信公众号排版编辑器，支持可视化排版、Markdown 导入、多用户管理，开箱即用。

## 功能特性

- **可视化拖拽编辑** — 通过拖拽模块（文本、图片、标题、引用、按钮、分割线、页眉/页脚等）自由拼装文章布局
- **容器布局** — 支持单栏、双栏、三栏网格容器，灵活排版
- **Markdown 导入** — 直接导入 Markdown 文件，自动解析为模块；支持 `:::type` 自定义围栏语法
- **富文本编辑** — 基于 Tiptap 的所见即所得编辑器，支持文字样式、颜色、对齐等
- **文章管理** — 文章的创建、编辑、归档、管理
- **微信兼容导出** — 渲染结果兼容微信公众号后台编辑器
- **多用户支持** — 用户注册、登录、角色管理
- **Docker 部署** — 一键启动前后端服务

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Pinia + Vue Router |
| UI | Element Plus + TailwindCSS |
| 编辑器 | Tiptap |
| 拖拽 | vue-draggable-plus |
| 后端 | Go + Gin |
| 数据库 | SQLite |
| 认证 | JWT |
| 部署 | Docker Compose |

## 快速开始

### 前置要求

- Node.js >= 18
- Go >= 1.21（本地开发）
- Docker & Docker Compose（容器部署）

### 本地开发

**1. 启动后端**

```bash
cd backend
cp ../.env.example .env    # 编辑 JWT_SECRET
go run ./cmd
```

后端默认监听 `:8080`。

**2. 启动前端**

```bash
cd frontend
npm install
npm run dev
```

前端默认监听 `:3000`，自动代理 `/api` 和 `/uploads` 到后端。

### Docker 部署

```bash
cp .env.example .env    # 编辑 JWT_SECRET 为随机字符串
docker compose up -d
```

- 前端访问：`http://localhost:3000`
- 后端 API：`http://localhost:8080`

首次启动会自动创建管理员账号（登录后可在用户管理页面添加其他用户）。

## 环境变量

参考 `.env.example`：

| 变量 | 必需 | 说明 |
|------|------|------|
| `JWT_SECRET` | 是 | JWT 签名密钥，务必改为随机字符串 |
| `LLM_API_KEY` | 否 | AI 功能 API Key |
| `LLM_API_BASE` | 否 | AI 接口地址 |
| `LLM_MODEL` | 否 | AI 模型名 |

## Markdown 导入语法

支持标准 Markdown 以及自定义 `:::` 围栏语法：

```markdown
:::image src="https://example.com/image.jpg"
可选图片描述
:::

:::button url="https://example.com" theme="primary"
按钮文字
:::

:::header
页眉内容
:::

:::footer variant="branded"
页脚内容
:::
```

支持的类型：`text` / `image` / `divider` / `button` / `header` / `footer` / `heading` / `quote` / `toc`

## 项目结构

```
├── backend/               # Go 后端
│   ├── cmd/               # 入口
│   ├── internal/          # 内部逻辑
│   │   ├── api/           # 路由定义
│   │   ├── handler/       # 请求处理器
│   │   ├── middleware/     # 中间件
│   │   ├── model/         # 数据模型
│   │   ├── service/       # 业务逻辑
│   │   └── store/         # 数据存储
│   ├── pkg/jwt/           # JWT 工具
│   └── Dockerfile
├── frontend/              # Vue 3 前端
│   ├── src/
│   │   ├── components/    # 组件（编辑器、模块等）
│   │   ├── pages/         # 页面
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── services/      # API 调用
│   │   ├── registry/      # 模块注册表
│   │   ├── router/        # 路由配置
│   │   ├── renderers/     # 微信兼容渲染
│   │   └── types/         # TypeScript 类型
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## License

MIT
