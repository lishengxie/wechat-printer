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
