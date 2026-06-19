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
  { path: '/dashboard/articles', label: '文章', icon: '📝' },
  { path: '/dashboard/templates', label: '模板库', icon: '📐' },
  { path: '/dashboard/ai-config', label: 'AI 助手', icon: '🤖' },
  ...(isAdmin.value ? [{ path: '/admin/users', label: '用户管理', icon: '👥' }] : [])
])

function logout() {
  authStore.clearAuth()
  router.push('/login')
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo">📰</span>
        <span class="logo-text">公众号编辑器</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: route.path.startsWith(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <span class="user-badge">{{ username }}</span>
        <button class="logout-btn" @click="logout">退出</button>
      </div>
    </aside>
    <main class="shell-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.shell { display: flex; height: 100vh; }
.sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid #e5e7eb;
}
.logo { font-size: 22px; }
.logo-text { font-size: 14px; font-weight: 600; color: #111827; }
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.15s;
}
.nav-link:hover { background: #f3f4f6; color: #1f2937; }
.nav-link.active { background: #dbeafe; color: #2563eb; }
.nav-icon { font-size: 16px; }
.nav-label { font-size: 14px; }
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}
.user-badge { font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 3px 8px; border-radius: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px; }
.logout-btn { padding: 4px 10px; font-size: 12px; font-weight: 500; color: #dc2626; background: transparent; border: 1px solid #fecaca; border-radius: 6px; cursor: pointer; white-space: nowrap; }
.logout-btn:hover { background: #fef2f2; }
.shell-content { flex: 1; overflow: auto; background: #f3f4f6; padding: 24px; }
</style>
