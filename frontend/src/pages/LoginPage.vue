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
</style>
