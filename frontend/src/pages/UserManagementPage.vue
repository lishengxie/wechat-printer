<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

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
  if (!newUsername.value || !newPassword.value) return
  creating.value = true
  try {
    await api.register(newUsername.value, newPassword.value, newRole.value)
    showModal.value = false
    newUsername.value = ''
    newPassword.value = ''
    newRole.value = 'user'
    await loadUsers()
  } catch (e: any) {
    alert('创建失败: ' + e.message)
  } finally {
    creating.value = false
  }
}

async function deleteUser(id: string) {
  if (!confirm('确定要删除该用户吗？')) return
  try {
    await api.deleteUser(id)
    await loadUsers()
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>用户管理</h2>
      <button class="btn-primary" @click="showModal = true">+ 新建用户</button>
    </div>
    <p v-if="loading" class="status">加载中...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <table v-else class="user-table">
      <thead>
        <tr><th>用户名</th><th>角色</th><th>创建时间</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.username }}</td>
          <td><span class="role-badge" :class="u.role">{{ u.role }}</span></td>
          <td>{{ new Date(u.created_at).toLocaleString() }}</td>
          <td><button class="btn-small danger" @click="deleteUser(u.id)">删除</button></td>
        </tr>
      </tbody>
    </table>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h3>新建用户</h3>
          <div class="form-group">
            <label>用户名</label>
            <input v-model="newUsername" type="text" placeholder="username" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="newPassword" type="password" placeholder="至少6位" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="newRole">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showModal = false">取消</button>
            <button class="btn-primary" :disabled="creating" @click="createUser">{{ creating ? '创建中...' : '创建' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: #111827; }
.btn-primary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #fff; background: #3b82f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary:hover { background: #2563eb; }
.status { text-align: center; padding: 40px; color: #6b7280; }
.error { color: #dc2626; }
.user-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.user-table th, .user-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
.user-table th { font-weight: 600; color: #374151; background: #f9fafb; }
.role-badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; }
.role-badge.admin { background: #dbeafe; color: #1e40af; }
.role-badge.user { background: #f3f4f6; color: #4b5563; }
.btn-small { padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 5px; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; }
.btn-small.danger { color: #dc2626; border-color: #fecaca; }
.btn-small.danger:hover { background: #fef2f2; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { width: 90%; max-width: 400px; background: #fff; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.modal h3 { margin: 0 0 4px; font-size: 16px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; }
.form-group input, .form-group select { padding: 9px 12px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
.btn-secondary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #4b5563; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
</style>
