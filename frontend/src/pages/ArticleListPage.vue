<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import type { Article, Layout } from '@/services/api'

const router = useRouter()
const articles = ref<Article[]>([])
const layouts = ref<Layout[]>([])
const loading = ref(false)
const error = ref('')

const showCreateModal = ref(false)
const newTitle = ref('')
const newLayoutId = ref('')
const creating = ref(false)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    articles.value = await api.listArticles()
    layouts.value = await api.listLayouts()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function editArticleContent(id: string) {
  router.push(`/editor/article/${id}`)
}

async function deleteArticle(id: string) {
  if (!confirm('确定要删除这篇文章吗？')) return
  try {
    await api.deleteArticle(id)
    await loadData()
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}

async function createArticleFromModal() {
  if (!newTitle.value.trim()) {
    alert('请填写文章标题')
    return
  }
  creating.value = true
  try {
    let content = ''
    if (newLayoutId.value) {
      const layout = await api.getLayout(newLayoutId.value)
      content = JSON.stringify(layout.document)
    }
    const article = await api.createArticle({
      title: newTitle.value.trim(),
      content
    })
    showCreateModal.value = false
    newTitle.value = ''
    newLayoutId.value = ''
    router.push(`/editor/article/${article.id}`)
  } catch (e: any) {
    alert('创建失败: ' + e.message)
  } finally {
    creating.value = false
  }
}

function closeModal() {
  showCreateModal.value = false
  newTitle.value = ''
  newLayoutId.value = ''
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>我的文章</h2>
      <div class="actions">
        <button class="btn-secondary" @click="router.push('/dashboard/templates')">模板库</button>
        <button class="btn-primary" @click="showCreateModal = true">+ 新建文章</button>
      </div>
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
          <button class="btn-small" @click="editArticleContent(article.id)">编辑排版</button>
          <button class="btn-small danger" @click="deleteArticle(article.id)">删除</button>
        </div>
      </div>
    </div>

    <!-- Create Article Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>新建文章</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>标题 *</label>
              <input v-model="newTitle" type="text" placeholder="文章标题" @keyup.enter="createArticleFromModal" />
            </div>
            <div class="form-group">
              <label>基于模板（可选）</label>
              <select v-model="newLayoutId">
                <option value="">空白文章</option>
                <option v-for="layout in layouts" :key="layout.id" :value="layout.id">{{ layout.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">取消</button>
            <button class="btn-primary" :disabled="creating" @click="createArticleFromModal">
              {{ creating ? '创建中...' : '创建并编辑' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #111827; }
.actions { display: flex; gap: 10px; }
.btn-primary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #fff; background: #3b82f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-primary:hover { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; }
.btn-secondary { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #4b5563; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
.btn-secondary:hover { background: #e5e7eb; }
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

/* Modal */
.modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { width: 90%; max-width: 480px; background: #fff; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
.modal-header h3 { font-size: 16px; font-weight: 600; color: #111827; margin: 0; }
.modal-close { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #6b7280; background: transparent; border: none; border-radius: 6px; cursor: pointer; }
.modal-close:hover { background: #f3f4f6; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #e5e7eb; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; }
.form-group input, .form-group select { padding: 10px 12px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; font-family: inherit; }
.form-group input:focus, .form-group select:focus { border-color: #3b82f6; }
</style>
