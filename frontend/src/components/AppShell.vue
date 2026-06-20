<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Notebook, List, Cpu, User, QuestionFilled } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = computed(() => authStore.user?.username || '')
const isAdmin = computed(() => authStore.isAdmin)

const navItems = computed(() => [
  { path: '/dashboard/articles', label: '文章', icon: Notebook },
  { path: '/dashboard/templates', label: '模板库', icon: List },
  { path: '/dashboard/ai-config', label: 'AI 助手', icon: Cpu },
  { path: '/dashboard/help/markdown', label: '帮助', icon: QuestionFilled },
  ...(isAdmin.value ? [{ path: '/admin/users', label: '用户管理', icon: User }] : [])
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
    <div class="sidebar">
      <div class="sidebar-header">
        <span class="logo">📰</span>
        <span class="logo-text">公众号编辑器</span>
      </div>
      <el-menu
        :default-active="defaultActive"
        @select="handleMenuSelect"
      >
        <el-menu-item
          v-for="item in navItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <span class="user-badge">{{ username }}</span>
        <el-button size="small" type="danger" plain @click="logout">退出</el-button>
      </div>
    </div>
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
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
.sidebar .el-menu {
  flex: 1;
  overflow-y: auto;
  border-right: none;
}
.sidebar-footer {
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
.shell-content { flex: 1; overflow: auto; background: var(--el-bg-color-page); padding: 24px; }
</style>
