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
