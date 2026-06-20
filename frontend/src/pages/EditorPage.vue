<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useDocumentStore } from '@/stores/document'
import { createEmptyDocument } from '@/types/document'
import ModuleLibrary from '@/components/ModuleLibrary.vue'
import EditorCanvas from '@/components/EditorCanvas.vue'
import PropertyPanel from '@/components/PropertyPanel.vue'
import PreviewCanvas from '@/components/PreviewCanvas.vue'
import AIChatDialog from '@/components/AIChatDialog.vue'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const documentStore = useDocumentStore()
const { document, selectedModuleId } = storeToRefs(documentStore)

const isArticleMode = route.path.startsWith('/editor/article/')
const entityId = isArticleMode ? (route.params.articleId as string) : (route.params.layoutId as string)

provide('isArticleMode', isArticleMode)

const articleMeta = ref({
  title: '',
  author: '',
  summary: '',
  cover_image: '',
  status: 'draft' as 'draft' | 'published'
})
provide('articleMeta', articleMeta)

// 预览模式
const isPreviewMode = ref(false)
provide('isPreviewMode', isPreviewMode)

function togglePreview() {
  isPreviewMode.value = !isPreviewMode.value
}

// 导出 HTML 模态框状态
const showExportModal = ref(false)
const exportedHTML = ref('')
const isExporting = ref(false)
const isSaving = ref(false)

// AI 助手面板
const showAIPanel = ref(false)
const selectedModuleForAI = computed(() => documentStore.selectedModule)

// 计算撤销/重做可用状态
const canUndo = computed(() => documentStore.canUndo())
const canRedo = computed(() => documentStore.canRedo())

function handleUndo() {
  documentStore.undo()
}

function handleRedo() {
  documentStore.redo()
}

onMounted(async () => {
  if (isArticleMode) {
    try {
      const article = await api.getArticle(entityId)
      articleMeta.value = {
        title: article.title,
        author: article.author,
        summary: article.summary,
        cover_image: article.cover_image,
        status: article.status
      }
      if (article.content) {
        try {
          const doc = JSON.parse(article.content)
          documentStore.setDocument(doc)
        } catch {
          documentStore.setDocument(createEmptyDocument(article.title))
        }
      } else {
        documentStore.setDocument(createEmptyDocument(article.title))
      }
    } catch (e: any) {
      ElMessage.error('加载文章失败: ' + e.message)
      router.push('/dashboard/articles')
    }
  } else {
    // template mode
    try {
      const layout = await api.getLayout(entityId)
      documentStore.setDocument(layout.document)
    } catch (e: any) {
      ElMessage.error('加载模板失败: ' + e.message)
      router.push('/dashboard/templates')
    }
  }
})

async function handleSave() {
  isSaving.value = true
  try {
    if (isArticleMode) {
      await api.updateArticle(entityId, {
        title: articleMeta.value.title || documentStore.document.title,
        author: articleMeta.value.author,
        summary: articleMeta.value.summary,
        cover_image: articleMeta.value.cover_image,
        content: JSON.stringify(documentStore.document)
      })
    } else {
      await api.updateLayout(entityId, {
        name: documentStore.document.title,
        document: documentStore.document
      })
    }
    ElMessage.success('保存成功！')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
    console.error('Save failed:', error)
  } finally {
    isSaving.value = false
  }
}

async function handleExportHTML() {
  isExporting.value = true
  showExportModal.value = true
  try {
    const result = await api.exportHTML(documentStore.document)
    exportedHTML.value = result.html
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('Export failed:', error)
  } finally {
    isExporting.value = false
  }
}

async function copyToClipboard() {
  try {
    const html = exportedHTML.value
    const blob = new Blob([html], { type: 'text/html' })
    const textBlob = new Blob([html.replace(/<[^>]+>/g, '')], { type: 'text/plain' })
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob
      })
    ])
    ElMessage.success('HTML 已复制到剪贴板！可直接粘贴到公众号编辑器')
  } catch (error) {
    console.error('Copy failed:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

function closeExportModal() {
  showExportModal.value = false
  exportedHTML.value = ''
}

function goBack() {
  if (isArticleMode) {
    router.push('/dashboard/articles')
  } else {
    router.push('/dashboard/templates')
  }
}
</script>

<template>
  <div class="app-container">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="toolbar-left">
        <div class="logo">
          <el-button size="small" @click="goBack">← 返回</el-button>
          <span class="logo-icon">📰</span>
          <span class="logo-text">公众号排版编辑器</span>
        </div>
        <div v-if="isArticleMode" class="title-input-wrap">
          <el-input
            v-model="articleMeta.title"
            placeholder="文章标题"
            style="width: 240px"
          />
        </div>
      </div>

      <div class="toolbar-center">
        <el-button-group>
          <el-button
            :type="isPreviewMode ? 'primary' : 'default'"
            @click="togglePreview"
          >
            👁 {{ isPreviewMode ? '编辑' : '预览' }}
          </el-button>
          <el-button @click="documentStore.loadTestData">
            📋 加载示例
          </el-button>
          <el-button
            :type="showAIPanel ? 'primary' : 'default'"
            @click="showAIPanel = !showAIPanel"
          >
            🤖 AI 助手
          </el-button>
          <el-button :disabled="!canUndo" @click="handleUndo">
            ↩ 撤销
          </el-button>
          <el-button :disabled="!canRedo" @click="handleRedo">
            ↪ 重做
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-right">
        <el-button type="primary" :loading="isSaving" @click="handleSave">
          💾 保存
        </el-button>
        <el-button type="success" :loading="isExporting" @click="handleExportHTML">
          📄 导出 HTML
        </el-button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 预览模式 -->
      <section v-if="isPreviewMode" class="preview-area">
        <PreviewCanvas />
      </section>

      <!-- 编辑模式 -->
      <template v-else>
        <div class="editor-body">
          <!-- 左侧：模块库 -->
          <aside class="sidebar-left">
            <ModuleLibrary />
          </aside>

          <!-- 中间：编辑器画布 -->
          <section class="editor-area">
            <EditorCanvas />
          </section>

          <!-- 右侧：属性面板 -->
          <aside class="sidebar-right">
            <PropertyPanel />
          </aside>
        </div>

        <!-- AI 排版助手（页面底部常驻面板） -->
        <AIChatDialog
          :visible="showAIPanel"
          :selected-module="selectedModuleForAI"
          @toggle="showAIPanel = !showAIPanel"
        />
      </template>
    </main>

    <!-- 导出 HTML 弹窗 -->
    <el-dialog
      v-model="showExportModal"
      title="导出 HTML"
      width="800px"
      @close="closeExportModal"
    >
      <div v-loading="isExporting" style="min-height: 100px">
        <textarea
          v-if="!isExporting"
          v-model="exportedHTML"
          class="html-preview"
          readonly
          spellcheck="false"
        ></textarea>
      </div>
      <template #footer>
        <el-button @click="closeExportModal">关闭</el-button>
        <el-button type="primary" :disabled="isExporting" @click="copyToClipboard">
          复制到剪贴板
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.title-input-wrap {
  display: flex;
  align-items: center;
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* 左侧边栏 - 模块库 */
.sidebar-left {
  width: 280px;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  overflow-y: auto;
  flex-shrink: 0;
}

/* 中间 - 编辑器区域 */
.editor-area {
  flex: 1;
  overflow: hidden;
}

/* 右侧边栏 - 属性面板 */
.sidebar-right {
  width: 300px;
  background-color: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-light);
  overflow-y: auto;
  flex-shrink: 0;
}

/* 预览区域 */
.preview-area {
  flex: 1;
  overflow: auto;
  background: var(--el-bg-color-page);
}

.html-preview {
  width: 100%;
  height: 400px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  resize: none;
  outline: none;
}
</style>
