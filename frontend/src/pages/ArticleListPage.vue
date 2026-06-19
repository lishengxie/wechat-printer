<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import type { Article } from '@/services/api'

const router = useRouter()
const articles = ref<Article[]>([])
const loading = ref(false)
const error = ref('')

async function loadArticles() {
  loading.value = true
  error.value = ''
  try {
    articles.value = await api.listArticles()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function editArticle(id: string) {
  router.push(`/dashboard/articles/${id}/edit`)
}

async function deleteArticle(id: string) {
  if (!confirm('确定要删除这篇文章吗？')) return
  try {
    await api.deleteArticle(id)
    await loadArticles()
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}

onMounted(loadArticles)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>我的文章</h2>
      <button class="btn-primary" @click="router.push('/dashboard/articles/new')">+ 新建文章</button>
    </div>
    <p v-if="loading" class="status">加载中...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <div v-else-if="articles.length === 0" class="empty">
      <p>还没有文章，点击右上角新建</p>
    </div>
    <div v-else class="card-grid">
      <div v-for="article in articles" :key="article.id" class="card">
        <div class="card-header">
          <h3 class="card-title">{{ article.title }}</h3>
          <span class="badge" :class="article.status">{{ article.status === 'published' ? '已发布' : '草稿' }}</span>
        </div>
        <p v-if="article.summary" class="card-summary">{{ article.summary }}</p>
        <div class="card-meta">
          <span v-if="article.author">作者: {{ article.author }}</span>
          <span>{{ new Date(article.updated_at).toLocaleString() }}</span>
        </div>
        <div class="card-actions">
          <button class="btn-small" @click="editArticle(article.id)">编辑</button>
          <button class="btn-small danger" @click="deleteArticle(article.id)">删除</button>
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
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 10px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card-title { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
.badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; }
.badge.draft { background: #f3f4f6; color: #6b7280; }
.badge.published { background: #d1fae5; color: #065f46; }
.card-summary { font-size: 13px; color: #6b7280; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-meta { font-size: 12px; color: #9ca3af; display: flex; gap: 12px; }
.card-actions { display: flex; gap: 8px; margin-top: 4px; }
.btn-small { padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 5px; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; }
.btn-small:hover { background: #f9fafb; }
.btn-small.danger { color: #dc2626; border-color: #fecaca; }
.btn-small.danger:hover { background: #fef2f2; }
</style>
