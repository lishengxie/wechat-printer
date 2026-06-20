# Element Plus UI 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目前端 UI 从原生 HTML + Tailwind 替换为 Element Plus（按需导入），分 A（基础框架）+ B（编辑器核心）两阶段

**Architecture:** 在 vite.config.ts 中配置 unplugin-vue-components + unplugin-element-plus 实现自动按需导入。逐个页面替换模板中的原生元素为 Element Plus 组件，保持所有业务逻辑、数据流、拖拽交互不变。

**Tech Stack:** Vue 3 + Element Plus 2.x + unplugin-vue-components + unplugin-element-plus

---

### Task 1: 安装依赖与配置

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/main.ts`

- [ ] **Step 1: 安装依赖**

```bash
cd frontend
npm install element-plus
npm install -D unplugin-vue-components unplugin-element-plus
```

- [ ] **Step 2: 配置 vite.config.ts**

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    ElementPlus({}),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 3: 更新 main.ts 导入 Element Plus 样式**

```typescript
// frontend/src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import './style.css'
import router from './router'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
```

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/src/main.ts
git commit -m "feat: add Element Plus with on-demand import config"
```

---

### Task 2: 替换 AppShell 导航

**Files:**
- Modify: `frontend/src/components/AppShell.vue`

- [ ] **Step 1: 将侧边栏导航替换为 el-menu**

```vue
<!-- frontend/src/components/AppShell.vue -->
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
  { path: '/dashboard/articles', label: '文章', icon: 'Notebook' },
  { path: '/dashboard/templates', label: '模板库', icon: 'List' },
  { path: '/dashboard/ai-config', label: 'AI 助手', icon: 'Cpu' },
  ...(isAdmin.value ? [{ path: '/admin/users', label: '用户管理', icon: 'User' }] : [])
])

const defaultActive = computed(() => route.path)

function handleMenuSelect(path: string) {
  router.push(path)
}

function logout() {
  authStore.clearAuth()
  router.push('/login')
}
</script>

<template>
  <div class="shell">
    <el-menu
      :default-active="defaultActive"
      class="sidebar"
      @select="handleMenuSelect"
    >
      <div class="sidebar-header">
        <span class="logo">📰</span>
        <span class="logo-text">公众号编辑器</span>
      </div>
      <el-menu-item
        v-for="item in navItems"
        :key="item.path"
        :index="item.path"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>
      <div class="sidebar-footer">
        <span class="user-badge">{{ username }}</span>
        <el-button size="small" type="danger" plain @click="logout">退出</el-button>
      </div>
    </el-menu>
    <main class="shell-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.shell { display: flex; height: 100vh; }
.sidebar {
  width: 200px;
  flex-shrink: 0;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid var(--el-border-color-light);
}
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}
.logo { font-size: 22px; }
.logo-text { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.sidebar-footer {
  position: absolute;
  bottom: 0;
  width: 200px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--el-border-color-light);
}
.user-badge {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 3px 8px;
  border-radius: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
}
.shell-content { flex: 1; overflow: auto; background: #f5f7fa; padding: 24px; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AppShell.vue
git commit -m "feat: replace sidebar nav with el-menu"
```

---

### Task 3: 替换 LoginPage

**Files:**
- Modify: `frontend/src/pages/LoginPage.vue`

- [ ] **Step 1: 将登录页表单替换为 el-form + el-input + el-button**

```vue
<!-- frontend/src/pages/LoginPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: ''
})
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    const res = await api.login(form.value.username, form.value.password)
    authStore.setAuth(res.token, res.user)
    router.push('/dashboard')
  } catch (e: any) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="never">
      <template #header>
        <h1 class="login-title">📰 公众号排版编辑器</h1>
        <p class="login-subtitle">请登录以继续</p>
      </template>
      <el-form
        :model="form"
        @submit.prevent="handleLogin"
        label-position="top"
      >
        <el-form-item label="用户名">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            required
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="login-btn"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      <p class="hint">默认管理员: admin / admin123</p>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}
.login-card {
  width: 100%;
  max-width: 400px;
}
.login-title {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 8px;
}
.login-subtitle {
  font-size: 14px;
  text-align: center;
  color: var(--el-text-color-secondary);
  margin: 0;
}
.login-btn {
  width: 100%;
}
.hint {
  margin-top: 18px;
  font-size: 12px;
  text-align: center;
  color: var(--el-text-color-placeholder);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/LoginPage.vue
git commit -m "feat: replace login page form with el-form/el-input"
```

---

### Task 4: 替换 ArticleListPage

**Files:**
- Modify: `frontend/src/pages/ArticleListPage.vue`

- [ ] **Step 1: 替换按钮、弹窗、空状态、标签**

```vue
<!-- frontend/src/pages/ArticleListPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import type { Article, Layout } from '@/services/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const articles = ref<Article[]>([])
const layouts = ref<Layout[]>([])
const loading = ref(false)
const error = ref('')

const showCreateModal = ref(false)
const newTitle = ref('')
const newLayoutId = ref('')
const creating = ref(false)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    articles.value = await api.listArticles()
    layouts.value = await api.listLayouts()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function editArticleContent(id: string) {
  router.push(`/editor/article/${id}`)
}

async function deleteArticle(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '确认删除')
    await api.deleteArticle(id)
    ElMessage.success('删除成功')
    await loadData()
  } catch {
    // cancelled
  }
}

async function createArticleFromModal() {
  if (!newTitle.value.trim()) {
    ElMessage.warning('请填写文章标题')
    return
  }
  creating.value = true
  try {
    let content = ''
    if (newLayoutId.value) {
      const layout = await api.getLayout(newLayoutId.value)
      content = JSON.stringify(layout.document)
    }
    const article = await api.createArticle({
      title: newTitle.value.trim(),
      content
    })
    showCreateModal.value = false
    newTitle.value = ''
    newLayoutId.value = ''
    router.push(`/editor/article/${article.id}`)
  } catch (e: any) {
    ElMessage.error('创建失败: ' + e.message)
  } finally {
    creating.value = false
  }
}

function closeModal() {
  showCreateModal.value = false
  newTitle.value = ''
  newLayoutId.value = ''
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>我的文章</h2>
      <el-button type="primary" @click="showCreateModal = true">+ 新建文章</el-button>
    </div>

    <div v-loading="loading" class="loading-wrap">
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
      />
      <el-empty
        v-else-if="!loading && articles.length === 0"
        description="还没有文章"
      >
        <el-button type="primary" @click="showCreateModal = true">新建第一篇文章</el-button>
      </el-empty>
      <div v-else class="card-grid">
        <el-card
          v-for="article in articles"
          :key="article.id"
          shadow="hover"
          class="article-card"
        >
          <div class="card-header">
            <h3 class="card-title">{{ article.title }}</h3>
            <el-tag :type="article.status === 'published' ? 'success' : 'info'" size="small">
              {{ article.status === 'published' ? '已发布' : '已保存' }}
            </el-tag>
          </div>
          <p v-if="article.summary" class="card-summary">{{ article.summary }}</p>
          <div class="card-meta">
            <span v-if="article.author">作者: {{ article.author }}</span>
            <span>{{ new Date(article.updated_at).toLocaleString() }}</span>
          </div>
          <template #footer>
            <div class="card-actions">
              <el-button size="small" @click="editArticleContent(article.id)">编辑排版</el-button>
              <el-button size="small" type="danger" plain @click="deleteArticle(article.id)">删除</el-button>
            </div>
          </template>
        </el-card>
      </div>
    </div>

    <!-- 新建文章弹窗 -->
    <el-dialog
      v-model="showCreateModal"
      title="新建文章"
      width="480px"
      @close="closeModal"
    >
      <el-form label-position="top">
        <el-form-item label="标题 *">
          <el-input
            v-model="newTitle"
            placeholder="文章标题"
            @keyup.enter="createArticleFromModal"
          />
        </el-form-item>
        <el-form-item label="基于模板（可选）">
          <el-select v-model="newLayoutId" placeholder="选择模板" clearable style="width: 100%">
            <el-option label="空白文章" value="" />
            <el-option
              v-for="layout in layouts"
              :key="layout.id"
              :label="layout.name"
              :value="layout.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeModal">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createArticleFromModal">
          {{ creating ? '创建中...' : '创建并编辑' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: var(--el-text-color-primary); margin: 0; }
.loading-wrap { min-height: 200px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.article-card { cursor: default; }
.card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
.card-summary { font-size: 13px; color: var(--el-text-color-secondary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 8px; }
.card-meta { font-size: 12px; color: var(--el-text-color-placeholder); display: flex; gap: 12px; margin-top: 8px; }
.card-actions { display: flex; gap: 8px; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/ArticleListPage.vue
git commit -m "feat: replace article list page with el-card/el-dialog/el-tag"
```

---

### Task 5: 替换 TemplateListPage

**Files:**
- Modify: `frontend/src/pages/TemplateListPage.vue`

- [ ] **Step 1: 替换按钮、卡片、标签**

```vue
<!-- frontend/src/pages/TemplateListPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import type { Layout } from '@/services/api'
import { createEmptyDocument } from '@/types/document'
import { ElMessage, ElMessageBox } from 'element-plus'

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
  router.push(`/editor/template/${id}`)
}

async function deleteLayout(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这个模板吗？', '确认删除')
    await api.deleteLayout(id)
    ElMessage.success('删除成功')
    await loadLayouts()
  } catch {
    // cancelled
  }
}

async function createLayout() {
  try {
    const layout = await api.createLayout({
      name: '未命名模板',
      document: createEmptyDocument()
    })
    router.push(`/editor/template/${layout.id}`)
  } catch (e: any) {
    ElMessage.error('创建失败: ' + e.message)
  }
}

async function createArticleFromTemplate(layoutId: string) {
  try {
    const layout = await api.getLayout(layoutId)
    const article = await api.createArticle({
      title: layout.name,
      content: JSON.stringify(layout.document)
    })
    router.push(`/editor/article/${article.id}`)
  } catch (e: any) {
    ElMessage.error('创建文章失败: ' + e.message)
  }
}

onMounted(loadLayouts)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>排版模板</h2>
      <el-button type="primary" @click="createLayout">+ 新建模板</el-button>
    </div>

    <div v-loading="loading" class="loading-wrap">
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
      />
      <el-empty
        v-else-if="!loading && layouts.length === 0"
        description="还没有模板"
      >
        <el-button type="primary" @click="createLayout">新建第一个模板</el-button>
      </el-empty>
      <div v-else class="card-grid">
        <el-card
          v-for="layout in layouts"
          :key="layout.id"
          shadow="hover"
          class="layout-card"
        >
          <div class="card-title-row">
            <h3 class="card-title">{{ layout.name }}</h3>
            <el-tag v-if="layout.isPreset" type="warning" size="small" effect="plain">预设</el-tag>
          </div>
          <p v-if="layout.description" class="card-desc">{{ layout.description }}</p>
          <p class="card-meta">{{ new Date(layout.updatedAt).toLocaleString() }}</p>
          <template #footer>
            <div class="card-actions">
              <el-button size="small" type="primary" @click="createArticleFromTemplate(layout.id)">用此模板创建文章</el-button>
              <el-button size="small" @click="editLayout(layout.id)">编辑模板</el-button>
              <el-button v-if="!layout.isPreset" size="small" type="danger" plain @click="deleteLayout(layout.id)">删除</el-button>
            </div>
          </template>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: var(--el-text-color-primary); margin: 0; }
.loading-wrap { min-height: 200px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.layout-card { cursor: default; }
.card-title-row { display: flex; align-items: center; gap: 8px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
.card-desc { font-size: 13px; color: var(--el-text-color-secondary); line-height: 1.4; margin-top: 8px; }
.card-meta { font-size: 12px; color: var(--el-text-color-placeholder); margin-top: 8px; }
.card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/TemplateListPage.vue
git commit -m "feat: replace template list page with el-card/el-tag"
```

---

### Task 6: 替换 UserManagementPage

**Files:**
- Modify: `frontend/src/pages/UserManagementPage.vue`

- [ ] **Step 1: 替换表格、按钮、弹窗**

```vue
<!-- frontend/src/pages/UserManagementPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { ElMessage, ElMessageBox } from 'element-plus'

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
  if (!newUsername.value || !newPassword.value) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  creating.value = true
  try {
    await api.register(newUsername.value, newPassword.value, newRole.value)
    showModal.value = false
    newUsername.value = ''
    newPassword.value = ''
    newRole.value = 'user'
    ElMessage.success('创建成功')
    await loadUsers()
  } catch (e: any) {
    ElMessage.error('创建失败: ' + e.message)
  } finally {
    creating.value = false
  }
}

async function deleteUser(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '确认删除')
    await api.deleteUser(id)
    ElMessage.success('删除成功')
    await loadUsers()
  } catch {
    // cancelled
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showModal = true">+ 新建用户</el-button>
    </div>

    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <el-table
      v-loading="loading"
      :data="users"
      stripe
      style="width: 100%"
    >
      <el-table-column prop="username" label="用户名" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'primary' : 'info'" size="small">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="200">
        <template #default="{ row }">
          {{ new Date(row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" type="danger" plain @click="deleteUser(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="showModal"
      title="新建用户"
      width="400px"
    >
      <el-form label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="newUsername" placeholder="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="newPassword" type="password" placeholder="至少6位" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="newRole" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showModal = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createUser">
          {{ creating ? '创建中...' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid var(--el-border-color-light); }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); margin: 0; }
.mb-4 { margin-bottom: 16px; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/UserManagementPage.vue
git commit -m "feat: replace user management page with el-table/el-dialog"
```

---

### Task 7: 替换 AIConfigPage

**Files:**
- Modify: `frontend/src/pages/AIConfigPage.vue`

- [ ] **Step 1: 替换表单、按钮、提示**

```vue
<!-- frontend/src/pages/AIConfigPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiAI } from '@/services/api'
import type { AIConfigData } from '@/services/api'
import { ElMessage } from 'element-plus'

const config = ref<AIConfigData>({
  api_key: '',
  api_base: '',
  model: ''
})
const loading = ref(false)
const saving = ref(false)
const error = ref('')

async function loadConfig() {
  loading.value = true
  error.value = ''
  try {
    const data = await apiAI.getConfig()
    config.value = data
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  error.value = ''
  try {
    await apiAI.updateConfig(config.value)
    ElMessage.success('配置已保存')
  } catch (e: any) {
    error.value = e.message
    ElMessage.error('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  config.value = { api_key: '', api_base: '', model: '' }
}

onMounted(loadConfig)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>AI 助手配置</h2>
      <el-button @click="resetForm">重置</el-button>
    </div>

    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <div v-loading="loading" class="config-form">
      <el-form label-position="top">
        <el-form-item label="API Key" required>
          <el-input
            v-model="config.api_key"
            type="password"
            placeholder="sk-..."
            show-password
          />
          <p class="hint">支持 OpenAI 兼容接口的 API Key</p>
        </el-form-item>
        <el-form-item label="API 地址">
          <el-input
            v-model="config.api_base"
            placeholder="https://api.openai.com/v1"
          />
          <p class="hint">留空则使用默认值 https://api.openai.com/v1</p>
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input
            v-model="config.model"
            placeholder="gpt-4o"
          />
          <p class="hint">留空则使用默认值 gpt-4o</p>
        </el-form-item>
      </el-form>

      <el-alert
        title="提示：也可通过环境变量 LLM_API_KEY、LLM_API_BASE、LLM_MODEL 配置，环境变量优先级高于页面配置。"
        type="info"
        show-icon
        :closable="false"
      />

      <el-button type="primary" :loading="saving" @click="saveConfig" class="save-btn">
        {{ saving ? '保存中...' : '保存配置' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px; border: 1px solid var(--el-border-color-light); }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); margin: 0; }
.mb-4 { margin-bottom: 16px; }
.config-form { display: flex; flex-direction: column; gap: 20px; }
.hint { font-size: 12px; color: var(--el-text-color-placeholder); margin: 4px 0 0; }
.save-btn { align-self: flex-start; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/AIConfigPage.vue
git commit -m "feat: replace AI config page with el-form/el-input"
```

---

### Task 8: 替换 EditorPage 工具栏与弹窗

**Files:**
- Modify: `frontend/src/pages/EditorPage.vue`

- [ ] **Step 1: 替换工具栏按钮、导出弹窗、保存提示**

在 EditorPage.vue 中：
1. 顶部工具按钮组用 `<el-button-group>` + `<el-button>`
2. 保存按钮用 `<el-button type="primary">`，导出用 `<el-button type="success">`
3. 导出 HTML 弹窗用 `<el-dialog>`
4. 保存提示用 `ElMessage.success()`
5. 复制按钮用 `<el-button type="primary">`
6. `modal-overlay` / `modal-content` 等 CSS 删除

```vue
<!-- frontend/src/pages/EditorPage.vue -->
<script setup lang="ts">
// ... 保持 script 部分完全不变 ...

async function handleSave() {
  isSaving.value = true
  saveMessage.value = ''
  try {
    // ... 现有逻辑 ...
    ElMessage.success('保存成功！')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
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
    ElMessage.error('导出失败')
    console.error('Export failed:', error)
  } finally {
    isExporting.value = false
  }
}

async function copyToClipboard() {
  try {
    const html = exportedHTML.value
    const blob = new Blob([html], { type: 'text/html' })
    const textBlob = new Blob([html.replace(/<[^>]+>/g, '')], { type: 'text/plain' })
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob
      })
    ])
    ElMessage.success('HTML 已复制到剪贴板！可直接粘贴到公众号编辑器')
  } catch (error) {
    console.error('Copy failed:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}
</script>

<template>
  <div class="app-container">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="toolbar-left">
        <div class="logo">
          <el-button size="small" @click="goBack">← 返回</el-button>
          <span class="logo-icon">📰</span>
          <span class="logo-text">公众号排版编辑器</span>
        </div>
        <div v-if="isArticleMode" class="title-input-wrap">
          <el-input
            v-model="articleMeta.title"
            placeholder="文章标题"
            style="width: 240px"
          />
        </div>
      </div>

      <div class="toolbar-center">
        <el-button-group>
          <el-button
            :type="isPreviewMode ? 'primary' : 'default'"
            @click="togglePreview"
          >
            👁 {{ isPreviewMode ? '编辑' : '预览' }}
          </el-button>
          <el-button @click="documentStore.loadTestData">
            📋 加载示例
          </el-button>
          <el-button
            :type="showAIPanel ? 'primary' : 'default'"
            @click="showAIPanel = !showAIPanel"
          >
            🤖 AI 助手
          </el-button>
          <el-button :disabled="!canUndo" @click="handleUndo">
            ↩ 撤销
          </el-button>
          <el-button :disabled="!canRedo" @click="handleRedo">
            ↪ 重做
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-right">
        <el-button type="primary" :loading="isSaving" @click="handleSave">
          💾 保存
        </el-button>
        <el-button type="success" :loading="isExporting" @click="handleExportHTML">
          📄 导出 HTML
        </el-button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <section v-if="isPreviewMode" class="preview-area">
        <PreviewCanvas />
      </section>

      <template v-else>
        <div class="editor-body">
          <aside class="sidebar-left">
            <ModuleLibrary />
          </aside>
          <section class="editor-area">
            <EditorCanvas />
          </section>
          <aside class="sidebar-right">
            <PropertyPanel />
          </aside>
        </div>
        <AIChatDialog
          :visible="showAIPanel"
          :selected-module="selectedModuleForAI"
          @toggle="showAIPanel = !showAIPanel"
        />
      </template>
    </main>

    <!-- 导出 HTML 弹窗 -->
    <el-dialog
      v-model="showExportModal"
      title="导出 HTML"
      width="800px"
      @close="closeExportModal"
    >
      <div v-loading="isExporting" style="min-height: 100px">
        <textarea
          v-if="!isExporting"
          v-model="exportedHTML"
          class="html-preview"
          readonly
          spellcheck="false"
        ></textarea>
      </div>
      <template #footer>
        <el-button @click="closeExportModal">关闭</el-button>
        <el-button type="primary" :disabled="isExporting" @click="copyToClipboard">
          复制到剪贴板
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
```

**Import 说明：** 在 script 顶部添加 `import { ElMessage } from 'element-plus'`

**移除的 CSS：** 删除 `.back-btn`、`.action-buttons`、`.action-btn`、`.primary-btn`、`.save-btn`、`.export-btn`、`.btn-primary`、`.btn-secondary`、`.btn-icon`、`.spinner`、`.modal-overlay`、`.modal-content`、`.modal-header`、`.modal-title`、`.modal-close`、`.modal-body`、`.modal-footer` 相关样式。保留布局相关 CSS（`.toolbar`、`.editor-body`、`.sidebar-left`、`.sidebar-right` 等）。

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/EditorPage.vue
git commit -m "feat: replace editor toolbar and export dialog with el-button/el-dialog"
```

---

### Task 9: 替换 ModuleLibrary 折叠面板

**Files:**
- Modify: `frontend/src/components/ModuleLibrary.vue`

- [ ] **Step 1: 将手写折叠面板替换为 el-collapse，保留拖拽逻辑**

```vue
<!-- frontend/src/components/ModuleLibrary.vue -->
<script setup lang="ts">
import { useDocumentStore } from '@/stores/document'
import { createModule } from '@/types/document'
import { getModulesByGroup } from '@/registry/modules'
import { computed, ref } from 'vue'

interface GroupedModules {
  name: string
  items: Array<{
    type: string
    name: string
    description: string
    icon: string
    variant?: string
  }>
}

const emit = defineEmits<{
  (e: 'drag-module', moduleType: string): void
}>()

const documentStore = useDocumentStore()

const groupedModules = computed<GroupedModules[]>(() => {
  const groups = getModulesByGroup()
  const result: GroupedModules[] = []

  groups.forEach((items, name) => {
    const resolved: GroupedModules['items'] = []
    for (const reg of items) {
      if (reg.variants && reg.variants.length > 0) {
        for (const v of reg.variants) {
          resolved.push({
            type: reg.type,
            name: v.name,
            description: v.description,
            icon: v.icon,
            variant: v.variant
          })
        }
      } else {
        resolved.push({
          type: reg.type,
          name: reg.name,
          description: reg.description,
          icon: reg.icon
        })
      }
    }
    result.push({ name, items: resolved })
  })

  return result
})

// 默认展开第一个分组
const activeNames = ref(['基础组件'])

const handleDragStart = (event: DragEvent, module: GroupedModules['items'][number]) => {
  console.log('Drag started:', module.type, module.variant)
  if (event.dataTransfer) {
    event.dataTransfer.setData('moduleType', module.type)
    if (module.variant) {
      event.dataTransfer.setData('moduleVariant', module.variant)
    }
    event.dataTransfer.effectAllowed = 'copy'
  }
  emit('drag-module', module.type)
}

function handleClickAdd(module: GroupedModules['items'][number]) {
  console.log('Click add module:', module.type, module.variant)
  const newModule = createModule(module.type as any)
  if (module.variant) {
    (newModule.props as any).variant = module.variant
  }
  documentStore.addModule(newModule)
}
</script>

<template>
  <div class="module-library">
    <h3 class="library-title">模块库</h3>
    <p class="library-hint">💡 拖拽或点击添加模块</p>
    <el-collapse v-model="activeNames" class="modules-collapse">
      <el-collapse-item
        v-for="group in groupedModules"
        :key="group.name"
        :title="group.name"
        :name="group.name"
      >
        <div
          v-for="module in group.items"
          :key="`${module.type}-${module.variant || 'default'}`"
          class="module-item"
          draggable="true"
          @dragstart="handleDragStart($event, module)"
          @click="handleClickAdd(module)"
        >
          <div class="module-icon">{{ module.icon }}</div>
          <div class="module-info">
            <div class="module-name">{{ module.name }}</div>
            <div class="module-description">{{ module.description }}</div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.module-library {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.library-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.library-hint {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.modules-collapse {
  --el-collapse-header-bg-color: transparent;
  --el-collapse-content-bg-color: transparent;
}
.module-item {
  display: flex;
  align-items: center;
  padding: 8px 4px;
  border-radius: 6px;
  cursor: grab;
  transition: background 0.15s;
  user-select: none;
}
.module-item:hover {
  background: var(--el-fill-color-light);
}
.module-item:active {
  cursor: grabbing;
}
.module-icon {
  font-size: 20px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}
.module-info {
  flex: 1;
  min-width: 0;
}
.module-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.module-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ModuleLibrary.vue
git commit -m "feat: replace module library collapse with el-collapse"
```

---

### Task 10: 替换 PropertyPanel 控件

**Files:**
- Modify: `frontend/src/components/PropertyPanel.vue`

- [ ] **Step 1: 替换颜色选择器、滑块、下拉选择、对齐按钮组**

```vue
<!-- frontend/src/components/PropertyPanel.vue -->
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { moduleRegistry } from '@/registry/modules'
import { storeToRefs } from 'pinia'

const documentStore = useDocumentStore()
const { selectedModule } = storeToRefs(documentStore)

const propertyEditor = computed(() => {
  if (!selectedModule.value) return null
  const reg = moduleRegistry[selectedModule.value.type]
  return reg ? defineAsyncComponent(reg.propertyPanel) : null
})

const textModules = ['text', 'button', 'header', 'footer', 'heading', 'quote'] as const
const supportsTextColor = computed(() => selectedModule.value && textModules.includes(selectedModule.value.type as any))
const supportsTextAlign = computed(() => selectedModule.value && textModules.includes(selectedModule.value.type as any))

const moduleTypeName = computed(() => {
  if (!selectedModule.value) return ''
  const reg = moduleRegistry[selectedModule.value.type]
  return reg ? reg.name : selectedModule.value.type
})

const fontFamilyOptions = [
  { label: '默认', value: '' },
  { label: '系统默认 (无衬线)', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { label: '衬线体', value: "-apple-system, 'Noto Serif SC', Georgia, serif" },
  { label: '苹方 / 微软雅黑', value: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { label: '楷体', value: "-apple-system, 'Noto Serif SC', 'KaiTi', serif" },
  { label: 'Helvetica Neue', value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: 'Georgia', value: "Georgia, 'Noto Serif SC', serif" },
  { label: '等宽字体 (Courier)', value: "'Courier New', monospace" },
]

const fontWeightOptions = [
  { label: '正常', value: 'normal' },
  { label: '细体', value: '300' },
  { label: '中等', value: '500' },
  { label: '半粗', value: '600' },
  { label: '加粗', value: 'bold' },
]

const alignOptions = [
  { label: '左', value: 'left' },
  { label: '中', value: 'center' },
  { label: '右', value: 'right' },
]

function updateStyle(key: string, value: string | undefined) {
  if (selectedModule.value) {
    documentStore.updateModuleStyles(selectedModule.value.id, { [key]: value })
  }
}

function updatePadding(side: string, val: number) {
  if (!selectedModule.value) return
  const cur = selectedModule.value.styles.padding || '0'
  const parts = cur.split(/\s+/).map(v => parseInt(v) || 0)
  const [t = 0, r = t, b = t, l = t] = parts.length === 1 ? [parts[0], parts[0], parts[0], parts[0]]
    : parts.length === 2 ? [parts[0], parts[1], parts[0], parts[1]]
    : parts.length === 3 ? [parts[0], parts[1], parts[2], parts[1]]
    : [parts[0], parts[1], parts[2], parts[3]]
  const map: Record<string, string> = {
    top: `${val}px ${r}px ${b}px ${l}px`,
    right: `${t}px ${val}px ${b}px ${l}px`,
    bottom: `${t}px ${r}px ${val}px ${l}px`,
    left: `${t}px ${r}px ${b}px ${val}px`
  }
  updateStyle('padding', map[side])
}

function updateMargin(side: string, val: number) {
  if (!selectedModule.value) return
  const cur = selectedModule.value.styles.margin || '0 0 16px 0'
  const parts = cur.split(/\s+/).map(v => parseInt(v) || 0)
  const [t = 0, r = t, b = t, l = t] = parts.length === 1 ? [parts[0], parts[0], parts[0], parts[0]]
    : parts.length === 2 ? [parts[0], parts[1], parts[0], parts[1]]
    : parts.length === 3 ? [parts[0], parts[1], parts[2], parts[1]]
    : [parts[0], parts[1], parts[2], parts[3]]
  const map: Record<string, string> = {
    top: `${val}px ${r}px ${b}px ${l}px`,
    right: `${t}px ${val}px ${b}px ${l}px`,
    bottom: `${t}px ${r}px ${val}px ${l}px`,
    left: `${t}px ${r}px ${b}px ${val}px`
  }
  updateStyle('margin', map[side])
}

function parseSpacing(val: string | undefined, fallback = '0'): number[] {
  const parts = (val || fallback).split(/\s+/).map(v => parseInt(v) || 0)
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
  return [parts[0], parts[1], parts[2], parts[3]]
}

const paddingVals = computed(() => parseSpacing(selectedModule.value?.styles.padding))
const marginVals = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0'))
</script>

<template>
  <div class="property-panel">
    <div class="panel-header">
      <h3>属性设置</h3>
    </div>

    <div v-if="!selectedModule" class="panel-empty">
      <el-empty description="选中模块以编辑属性" :image-size="80" />
    </div>

    <div v-else class="panel-body">
      <!-- 模块类型 -->
      <div class="section">
        <span class="section-title">模块类型</span>
        <div class="type-name">{{ moduleTypeName }}</div>
      </div>

      <!-- 样式设置 -->
      <div class="section">
        <span class="section-title">样式设置</span>

        <!-- 文字颜色 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">文字颜色</label>
          <el-color-picker
            :model-value="selectedModule.styles.color || '#333333'"
            @change="(v: any) => updateStyle('color', v || '#333333')"
            show-alpha
          />
        </div>

        <!-- 背景颜色 -->
        <div class="field">
          <label class="field-label">背景颜色</label>
          <el-color-picker
            :model-value="selectedModule.styles.backgroundColor || '#ffffff'"
            @change="(v: any) => updateStyle('backgroundColor', v || '#ffffff')"
            show-alpha
          />
        </div>

        <!-- 对齐方式 -->
        <div v-if="supportsTextAlign" class="field">
          <label class="field-label">对齐方式</label>
          <el-radio-group
            :model-value="selectedModule.styles.textAlign || 'left'"
            @change="(v: any) => updateStyle('textAlign', v)"
          >
            <el-radio-button v-for="opt in alignOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <!-- 字体大小 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">字体大小</label>
          <el-input
            :model-value="selectedModule.styles.fontSize || '16px'"
            @change="(v: string) => updateStyle('fontSize', v)"
            placeholder="16px"
          />
        </div>

        <!-- 字体 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">字体</label>
          <el-select
            :model-value="selectedModule.styles.fontFamily || ''"
            @change="(v: string) => updateStyle('fontFamily', v)"
            style="width: 100%"
          >
            <el-option
              v-for="opt in fontFamilyOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>

        <!-- 内边距 -->
        <div class="field">
          <label class="field-label">内边距</label>
          <div class="slider-group">
            <div v-for="(label, side) in { top: '上', right: '右', bottom: '下', left: '左' }" :key="side" class="slider-row">
              <span class="slider-label">{{ label }}</span>
              <el-slider
                :model-value="paddingVals[['top','right','bottom','left'].indexOf(side)]"
                @change="(v: number) => updatePadding(side, v)"
                :min="0"
                :max="80"
                :show-tooltip="false"
                size="small"
              />
              <span class="slider-value">{{ paddingVals[['top','right','bottom','left'].indexOf(side)] }}px</span>
            </div>
          </div>
        </div>

        <!-- 外边距 -->
        <div class="field">
          <label class="field-label">外边距</label>
          <div class="slider-group">
            <div v-for="(label, side) in { top: '上', right: '右', bottom: '下', left: '左' }" :key="side" class="slider-row">
              <span class="slider-label">{{ label }}</span>
              <el-slider
                :model-value="marginVals[['top','right','bottom','left'].indexOf(side)]"
                @change="(v: number) => updateMargin(side, v)"
                :min="0"
                :max="80"
                :show-tooltip="false"
                size="small"
              />
              <span class="slider-value">{{ marginVals[['top','right','bottom','left'].indexOf(side)] }}px</span>
            </div>
          </div>
        </div>

        <!-- 边框 -->
        <div class="field">
          <label class="field-label">边框</label>
          <el-input
            :model-value="selectedModule.styles.border || ''"
            @change="(v: string) => updateStyle('border', v)"
            placeholder="1px solid #e5e7eb"
          />
        </div>

        <!-- 圆角 -->
        <div class="field">
          <label class="field-label">圆角</label>
          <el-input
            :model-value="selectedModule.styles.borderRadius || ''"
            @change="(v: string) => updateStyle('borderRadius', v)"
            placeholder="8px"
          />
        </div>

        <!-- 行高 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">行高</label>
          <el-input
            :model-value="selectedModule.styles.lineHeight || ''"
            @change="(v: string) => updateStyle('lineHeight', v)"
            placeholder="1.6"
          />
        </div>

        <!-- 字重 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">字重</label>
          <el-select
            :model-value="selectedModule.styles.fontWeight || 'normal'"
            @change="(v: string) => updateStyle('fontWeight', v)"
            style="width: 100%"
          >
            <el-option
              v-for="opt in fontWeightOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
      </div>

      <!-- 模块专用属性编辑器 -->
      <component :is="propertyEditor" />
    </div>
  </div>
</template>

<style scoped>
.property-panel {
  height: 100%;
  overflow-y: auto;
  background: #fff;
  border-left: 1px solid var(--el-border-color-light);
}
.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}
.panel-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.panel-empty {
  padding: 40px 16px;
}
.panel-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.type-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  width: 16px;
  flex-shrink: 0;
}
.slider-row .el-slider {
  flex: 1;
}
.slider-value {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/PropertyPanel.vue
git commit -m "feat: replace property panel controls with el-color-picker/el-slider/el-select"
```

---

### Task 11: 替换 AIChatDialog

**Files:**
- Modify: `frontend/src/components/AIChatDialog.vue`

- [ ] **Step 1: 将对话框替换为 el-dialog、输入框替换为 el-input、按钮替换为 el-button**

修改 AIChatDialog.vue 的 template 部分：

```vue
<!-- AIChatDialog.vue - template changes (script changes are minimal) -->
<script setup lang="ts">
// ... 保留所有现有 script 逻辑不变 ...
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    title="AI 排版助手"
    width="480px"
    @update:model-value="emit('toggle')"
    :close-on-click-modal="false"
  >
    <div class="chat-messages" ref="messagesRef">
      <div v-for="(msg, i) in messages" :key="i" :class="['message', msg.role]">
        <div class="message-bubble">{{ msg.text }}</div>
        <div v-if="msg.suggestedModule" class="suggestion-card">
          <el-tag size="small" type="info">{{ msg.suggestedModule.type }}</el-tag>
          <span class="suggestion-text">建议添加此模块</span>
        </div>
      </div>
      <div v-if="loading" class="loading-dots">
        <span>.</span><span>.</span><span>.</span>
      </div>
    </div>

    <div v-if="error" class="error-bar">
      <el-alert :title="error" type="error" show-icon :closable="true" @close="error = ''" />
    </div>

    <div class="chat-mode">
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="full">自由对话</el-radio-button>
        <el-radio-button value="style">仅样式</el-radio-button>
      </el-radio-group>
    </div>

    <div class="chat-input">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="2"
        placeholder="描述你想要的排版效果..."
        @keyup.enter.prevent="sendMessage"
      />
      <el-button type="primary" :loading="loading" @click="sendMessage" class="send-btn">
        发送
      </el-button>
    </div>
  </el-dialog>
</template>

<style scoped>
.chat-messages {
  max-height: 360px;
  overflow-y: auto;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.assistant { justify-content: flex-start; }
.message-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.message.user .message-bubble {
  background: var(--el-color-primary-light-8);
  color: var(--el-text-color-primary);
  border-bottom-right-radius: 4px;
}
.message.assistant .message-bubble {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  border-bottom-left-radius: 4px;
}
.error-bar { margin-bottom: 12px; }
.chat-mode { margin-bottom: 12px; }
.chat-input { display: flex; gap: 8px; }
.chat-input .el-input { flex: 1; }
.send-btn { align-self: flex-end; }
.loading-dots { text-align: center; font-size: 24px; color: var(--el-text-color-placeholder); letter-spacing: 4px; }
.suggestion-card { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.suggestion-text { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AIChatDialog.vue
git commit -m "feat: replace AI chat dialog with el-dialog/el-input"
```

---

## 验收清单

完成所有任务后验证：
1. `npm run dev` 能正常启动，无编译错误
2. 登录页正常登录
3. 文章/模板列表页渲染正确，弹窗正常
4. 编辑器页面工具栏按钮正常使用
5. 模块库折叠展开正常，拖拽添加模块正常
6. 属性面板颜色选择、滑块、下拉选择正常
7. 导出 HTML 弹窗正常
8. AI 对话框正常打开/关闭/发送
9. 用户管理页表格和弹窗正常
