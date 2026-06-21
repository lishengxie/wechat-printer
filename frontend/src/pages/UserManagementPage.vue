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

// Create
const showCreateModal = ref(false)
const createForm = ref({ username: '', password: '', role: 'user' as 'user' | 'admin' })
const creating = ref(false)

// Edit
const showEditModal = ref(false)
const editForm = ref({ username: '', password: '' })
const editingId = ref('')
const updating = ref(false)

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

function resetCreateForm() {
  createForm.value = { username: '', password: '', role: 'user' }
}

async function createUser() {
  if (!createForm.value.username || !createForm.value.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  if (creating.value) return
  creating.value = true
  try {
    await api.register(createForm.value.username, createForm.value.password, createForm.value.role)
    showCreateModal.value = false
    resetCreateForm()
    ElMessage.success('创建成功')
    await loadUsers()
  } catch (e: any) {
    ElMessage.error('创建失败: ' + e.message)
  } finally {
    creating.value = false
  }
}

function openEdit(user: UserItem) {
  editingId.value = user.id
  editForm.value = { username: user.username, password: '' }
  showEditModal.value = true
}

async function updateUser() {
  if (!editForm.value.username && !editForm.value.password) {
    ElMessage.warning('请填写用户名或密码')
    return
  }
  if (updating.value) return
  updating.value = true
  try {
    const payload: { username?: string; password?: string } = {}
    if (editForm.value.username) payload.username = editForm.value.username
    if (editForm.value.password) payload.password = editForm.value.password
    await api.updateUser(editingId.value, payload)
    showEditModal.value = false
    ElMessage.success('更新成功')
    await loadUsers()
  } catch (e: any) {
    ElMessage.error('更新失败: ' + e.message)
  } finally {
    updating.value = false
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
      <el-button type="primary" @click="showCreateModal = true">+ 新建用户</el-button>
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
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" plain @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" plain @click="deleteUser(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create Dialog -->
    <el-dialog
      v-model="showCreateModal"
      title="新建用户"
      width="400px"
      @close="resetCreateForm"
    >
      <el-form :model="createForm" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="createForm.username" placeholder="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="createForm.password" type="password" placeholder="至少6位" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="createForm.role" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createUser">
          {{ creating ? '创建中...' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="showEditModal"
      title="编辑用户"
      width="400px"
      @close="editForm.password = ''"
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" placeholder="留空则不修改" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="editForm.password" type="password" placeholder="留空则不修改，至少6位" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditModal = false">取消</el-button>
        <el-button type="primary" :loading="updating" @click="updateUser">
          {{ updating ? '保存中...' : '保存' }}
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
