<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import type { Layout } from '@/services/api'
import { createEmptyDocument } from '@/types/document'

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
  if (!confirm('确定要删除这个模板吗？')) return
  try {
    await api.deleteLayout(id)
    await loadLayouts()
  } catch (e: any) {
    alert('删除失败: ' + e.message)
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
    alert('创建失败: ' + e.message)
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
    alert('创建文章失败: ' + e.message)
  }
}

onMounted(loadLayouts)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>排版模板</h2>
      <button class="btn-primary" @click="createLayout">+ 新建模板</button>
    </div>
    <p v-if="loading" class="status">加载中...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <div v-else-if="layouts.length === 0" class="empty">
      <p>还没有模板，点击右上角新建</p>
    </div>
    <div v-else class="card-grid">
      <div v-for="layout in layouts" :key="layout.id" class="card">
        <h3 class="card-title">{{ layout.name }}</h3>
        <p v-if="layout.description" class="card-desc">{{ layout.description }}</p>
        <p class="card-meta">{{ new Date(layout.updatedAt).toLocaleString() }}</p>
        <div class="card-actions">
          <button class="btn-small primary" @click="createArticleFromTemplate(layout.id)">用此模板创建文章</button>
          <button class="btn-small" @click="editLayout(layout.id)">编辑模板</button>
          <button class="btn-small danger" @click="deleteLayout(layout.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #111827; }
.btn-primary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #fff; background: #3b82f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary:hover { background: #2563eb; }
.status { text-align: center; color: #6b7280; padding: 40px; }
.error { color: #dc2626; }
.empty { text-align: center; padding: 60px; color: #9ca3af; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 8px; }
.card-title { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
.card-desc { font-size: 13px; color: #6b7280; line-height: 1.4; }
.card-meta { font-size: 12px; color: #9ca3af; }
.card-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 8px; flex-wrap: wrap; }
.btn-small { padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 5px; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; }
.btn-small:hover { background: #f9fafb; }
.btn-small.primary { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
.btn-small.primary:hover { background: #bfdbfe; }
.btn-small.danger { color: #dc2626; border-color: #fecaca; }
.btn-small.danger:hover { background: #fef2f2; }
</style>
