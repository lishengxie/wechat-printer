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
  } catch {
    return
  }
  try {
    await api.deleteLayout(id)
    ElMessage.success('删除成功')
    await loadLayouts()
  } catch (e: any) {
    ElMessage.error('删除失败: ' + (e.message || ''))
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
              <el-button size="small" type="danger" plain @click="deleteLayout(layout.id)">删除</el-button>
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
