<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import type { Article, Layout } from '@/services/api'

const route = useRoute()
const router = useRouter()
const articleId = route.params.id as string | undefined

const title = ref('')
const author = ref('')
const summary = ref('')
const coverImage = ref('')
const layoutId = ref('')
const layouts = ref<Layout[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

async function loadData() {
  loading.value = true
  try {
    layouts.value = await api.listLayouts()
    if (articleId) {
      const article = await api.getArticle(articleId)
      title.value = article.title
      author.value = article.author
      summary.value = article.summary
      coverImage.value = article.cover_image
      layoutId.value = article.layout_id
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveArticle() {
  if (!title.value || !layoutId.value) {
    alert('请填写标题并选择排版')
    return
  }
  saving.value = true
  try {
    if (articleId) {
      await api.updateArticle(articleId, {
        title: title.value,
        layout_id: layoutId.value,
        author: author.value,
        summary: summary.value,
        cover_image: coverImage.value
      })
    } else {
      await api.createArticle({
        title: title.value,
        layout_id: layoutId.value,
        author: author.value,
        summary: summary.value,
        cover_image: coverImage.value
      })
    }
    router.push('/dashboard/articles')
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

function createLayout() {
  router.push('/editor/new')
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ articleId ? '编辑文章' : '新建文章' }}</h2>
      <div class="actions">
        <button class="btn-secondary" @click="router.push('/dashboard/articles')">取消</button>
        <button class="btn-primary" :disabled="saving" @click="saveArticle">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
    <p v-if="loading" class="status">加载中...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <form v-else class="form" @submit.prevent="saveArticle">
      <div class="form-group">
        <label>标题 *</label>
        <input v-model="title" type="text" placeholder="文章标题" required />
      </div>
      <div class="form-group">
        <label>作者</label>
        <input v-model="author" type="text" placeholder="作者名称" />
      </div>
      <div class="form-group">
        <label>摘要</label>
        <textarea v-model="summary" rows="3" placeholder="文章摘要"></textarea>
      </div>
      <div class="form-group">
        <label>封面图片 URL</label>
        <input v-model="coverImage" type="text" placeholder="https://..." />
      </div>
      <div class="form-group">
        <label>选择排版 *</label>
        <div class="layout-select">
          <select v-model="layoutId" required>
            <option value="" disabled>请选择排版</option>
            <option v-for="layout in layouts" :key="layout.id" :value="layout.id">{{ layout.name }}</option>
          </select>
          <button type="button" class="btn-secondary" @click="createLayout">新建排版</button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #e5e7eb; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: #111827; }
.actions { display: flex; gap: 10px; }
.btn-secondary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #4b5563; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
.btn-secondary:hover { background: #e5e7eb; }
.btn-primary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #fff; background: #3b82f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; }
.status { text-align: center; padding: 40px; color: #6b7280; }
.error { color: #dc2626; }
.form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; }
.form-group input, .form-group textarea, .form-group select {
  padding: 10px 12px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; font-family: inherit;
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: #3b82f6; }
.layout-select { display: flex; gap: 10px; }
.layout-select select { flex: 1; }
</style>
