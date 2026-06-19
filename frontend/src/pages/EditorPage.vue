<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDocumentStore } from '@/stores/document'
import { createEmptyDocument } from '@/types/document'
import ModuleLibrary from '@/components/ModuleLibrary.vue'
import EditorCanvas from '@/components/EditorCanvas.vue'
import PropertyPanel from '@/components/PropertyPanel.vue'
import PreviewCanvas from '@/components/PreviewCanvas.vue'
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
const saveMessage = ref('')

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
      alert('加载文章失败: ' + e.message)
      router.push('/dashboard/articles')
    }
  } else {
    // template mode
    try {
      const layout = await api.getLayout(entityId)
      documentStore.setDocument(layout.document)
    } catch (e: any) {
      alert('加载模板失败: ' + e.message)
      router.push('/dashboard/templates')
    }
  }
})

async function handleSave() {
  isSaving.value = true
  saveMessage.value = ''
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
    saveMessage.value = '保存成功！'
    setTimeout(() => {
      saveMessage.value = ''
    }, 3000)
  } catch (error) {
    saveMessage.value = '保存失败，请重试'
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
    exportedHTML.value = '导出失败，请重试'
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
    alert('HTML 已复制到剪贴板！可直接粘贴到公众号编辑器')
  } catch (error) {
    console.error('Copy failed:', error)
    alert('复制失败，请手动复制')
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
          <button class="back-btn" @click="goBack">← 返回</button>
          <span class="logo-icon">📰</span>
          <span class="logo-text">公众号排版编辑器</span>
        </div>
        <div v-if="isArticleMode" class="title-input-wrap">
          <input
            v-model="articleMeta.title"
            class="title-input"
            placeholder="文章标题"
          />
        </div>
      </div>

      <div class="toolbar-center">
        <div class="action-buttons">
          <button
            class="action-btn"
            :class="{ 'is-active': isPreviewMode }"
            @click="togglePreview"
            title="预览模式"
          >
            <span class="btn-icon">👁</span>
            <span class="btn-text">{{ isPreviewMode ? '编辑' : '预览' }}</span>
          </button>
          <button
            class="action-btn"
            @click="documentStore.loadTestData"
            title="加载测试数据"
          >
            <span class="btn-icon">📋</span>
            <span class="btn-text">加载示例</span>
          </button>
          <button
            class="action-btn"
            :disabled="!canUndo"
            @click="handleUndo"
            title="撤销 (Ctrl+Z)"
          >
            <span class="btn-icon">↩</span>
            <span class="btn-text">撤销</span>
          </button>
          <button
            class="action-btn"
            :disabled="!canRedo"
            @click="handleRedo"
            title="重做 (Ctrl+Y)"
          >
            <span class="btn-icon">↪</span>
            <span class="btn-text">重做</span>
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <span v-if="saveMessage" class="save-message">{{ saveMessage }}</span>
        <button
          class="primary-btn save-btn"
          :disabled="isSaving"
          @click="handleSave"
        >
          <span v-if="isSaving" class="spinner">⏳</span>
          <span class="btn-icon">💾</span>
          <span class="btn-text">保存</span>
        </button>
        <button
          class="primary-btn export-btn"
          :disabled="isExporting"
          @click="handleExportHTML"
        >
          <span v-if="isExporting" class="spinner">⏳</span>
          <span class="btn-icon">📄</span>
          <span class="btn-text">导出 HTML</span>
        </button>
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
      </template>
    </main>

    <!-- 导出 HTML 模态框 -->
    <Teleport to="body">
      <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">导出 HTML</h3>
            <button class="modal-close" @click="closeExportModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="isExporting" class="loading-state">
              <span class="loading-spinner">⏳</span>
              <span>正在生成 HTML...</span>
            </div>
            <textarea
              v-else
              v-model="exportedHTML"
              class="html-preview"
              readonly
              spellcheck="false"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeExportModal">关闭</button>
            <button
              class="btn-primary"
              :disabled="isExporting"
              @click="copyToClipboard"
            >
              复制到剪贴板
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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
  background-color: #f3f4f6;
  color: #1f2937;
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
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
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

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 14px;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.back-btn:hover {
  background: #e5e7eb;
  color: #111827;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.title-input-wrap {
  display: flex;
  align-items: center;
}

.title-input {
  padding: 6px 10px;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  outline: none;
  min-width: 240px;
}

.title-input:focus {
  border-color: #3b82f6;
  background: #fff;
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 4px;
  background-color: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover:not(:disabled) {
  background-color: #ffffff;
  color: #1f2937;
}

.action-btn.is-active {
  background-color: #dbeafe;
  color: #2563eb;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-message {
  font-size: 13px;
  color: #059669;
  font-weight: 500;
}

.primary-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.save-btn:hover:not(:disabled) {
  background-color: #bfdbfe;
}

.export-btn {
  background-color: #10b981;
  color: #ffffff;
}

.export-btn:hover:not(:disabled) {
  background-color: #059669;
}

.btn-icon {
  font-size: 14px;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧边栏 - 模块库 */
.sidebar-left {
  width: 280px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
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
  background-color: #ffffff;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
  flex-shrink: 0;
}

/* 预览区域 */
.preview-area {
  flex: 1;
  overflow: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #6b7280;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-close:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  font-size: 14px;
  color: #6b7280;
}

.loading-spinner {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

.html-preview {
  width: 100%;
  height: 400px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #374151;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  resize: none;
  outline: none;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-primary {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background-color: #3b82f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
