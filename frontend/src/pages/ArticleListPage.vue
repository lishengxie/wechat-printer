<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import type { Article, Layout } from '@/services/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const articles = ref<Article[]>([])
const layouts = ref<Layout[]>([])
const loading = ref(false)
const error = ref('')

const showCreateModal = ref(false)
const newTitle = ref('')
const newLayoutId = ref('')
const creating = ref(false)

const EXAMPLE_ARTICLES = [
  { id: 'product-review', name: '产品评测文' },
  { id: 'blank', name: '空白文章' }
] as const

const selectedExample = ref('blank')

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
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '确认删除')
  } catch {
    return // user cancelled
  }
  try {
    await api.deleteArticle(id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e: any) {
    ElMessage.error('删除失败: ' + (e.message || ''))
  }
}

async function createArticleFromModal() {
  if (!newTitle.value.trim()) {
    ElMessage.warning('请填写文章标题')
    return
  }
  if (creating.value) return
  creating.value = true
  try {
    const article = await api.createArticle({
      title: newTitle.value.trim(),
      content: '',
      layout_id: newLayoutId.value || undefined
    })
    showCreateModal.value = false

    const params = new URLSearchParams()
    if (selectedExample.value && selectedExample.value !== 'blank') {
      params.set('example', selectedExample.value)
    }
    if (newLayoutId.value) {
      params.set('template', newLayoutId.value)
    }
    const qs = params.toString()

    newTitle.value = ''
    newLayoutId.value = ''
    selectedExample.value = 'blank'
    router.push(`/editor/article/${article.id}${qs ? '?' + qs : ''}`)
  } catch (e: any) {
    ElMessage.error('创建失败: ' + e.message)
  } finally {
    creating.value = false
  }
}

function closeModal() {
  showCreateModal.value = false
  newTitle.value = ''
  newLayoutId.value = ''
  selectedExample.value = 'blank'
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>我的文章</h2>
      <el-button type="primary" @click="showCreateModal = true">+ 新建文章</el-button>
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
        v-else-if="!loading && articles.length === 0"
        description="还没有文章"
      >
        <el-button type="primary" @click="showCreateModal = true">新建第一篇文章</el-button>
      </el-empty>
      <div v-else class="card-grid">
        <el-card
          v-for="article in articles"
          :key="article.id"
          shadow="hover"
          class="article-card"
        >
          <div class="card-header">
            <h3 class="card-title">{{ article.title }}</h3>
            <el-tag :type="article.status === 'published' ? 'success' : 'info'" size="small">
              {{ article.status === 'published' ? '已发布' : '已保存' }}
            </el-tag>
          </div>
          <p v-if="article.summary" class="card-summary">{{ article.summary }}</p>
          <div class="card-meta">
            <span v-if="article.author">作者: {{ article.author }}</span>
            <span>{{ new Date(article.updated_at).toLocaleString() }}</span>
          </div>
          <template #footer>
            <div class="card-actions">
              <el-button size="small" @click="editArticleContent(article.id)">编辑排版</el-button>
              <el-button size="small" type="danger" plain @click="deleteArticle(article.id)">删除</el-button>
            </div>
          </template>
        </el-card>
      </div>
    </div>

    <!-- 新建文章弹窗 -->
    <el-dialog
      v-model="showCreateModal"
      title="新建文章"
      width="480px"
      @close="closeModal"
    >
      <el-form label-position="top">
        <el-form-item label="标题 *">
          <el-input
            v-model="newTitle"
            placeholder="文章标题"
            @keyup.enter="createArticleFromModal"
          />
        </el-form-item>
        <el-form-item label="示例文章">
          <div class="example-tags">
            <el-tag
              v-for="ex in EXAMPLE_ARTICLES"
              :key="ex.id"
              :type="selectedExample === ex.id ? 'primary' : 'info'"
              :effect="selectedExample === ex.id ? 'dark' : 'plain'"
              style="cursor: pointer; margin-right: 8px; margin-bottom: 4px;"
              @click="selectedExample = ex.id"
            >
              {{ ex.name }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="应用模板（可选）">
          <el-select v-model="newLayoutId" placeholder="选择模板" clearable style="width: 100%">
            <el-option label="不选" value="" />
            <el-option
              v-for="layout in layouts"
              :key="layout.id"
              :label="layout.name"
              :value="layout.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeModal">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createArticleFromModal">
          {{ creating ? '创建中...' : '创建并编辑' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: var(--el-text-color-primary); margin: 0; }
.loading-wrap { min-height: 200px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.article-card { cursor: default; }
.card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
.card-summary { font-size: 13px; color: var(--el-text-color-secondary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 8px; }
.card-meta { font-size: 12px; color: var(--el-text-color-placeholder); display: flex; gap: 12px; margin-top: 8px; }
.card-actions { display: flex; gap: 8px; }
</style>
