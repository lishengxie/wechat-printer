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
const form = ref({
  username: '',
  password: '',
  role: 'user' as 'user' | 'admin'
})
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

function resetForm() {
  form.value = { username: '', password: '', role: 'user' }
}

async function createUser() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  if (creating.value) return
  creating.value = true
  try {
    await api.register(form.value.username, form.value.password, form.value.role)
    showModal.value = false
    resetForm()
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
  } catch {
    return
  }
  try {
    await api.deleteUser(id)
    ElMessage.success('删除成功')
    await loadUsers()
  } catch (e: any) {
    ElMessage.error('删除失败: ' + e.message)
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
      @close="resetForm"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="至少6位" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width: 100%">
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
