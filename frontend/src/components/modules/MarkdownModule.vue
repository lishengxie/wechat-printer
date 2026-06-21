<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { marked } from 'marked'
import { useDocumentStore } from '@/stores/document'
import type { Module, MarkdownModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: MarkdownModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '0',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '0',
  border: props.module.styles.border || 'none',
  margin: props.module.styles.margin || '0 0 16px 0',
  fontFamily: props.module.styles.fontFamily || undefined
}))

const previewStyle = computed(() => ({
  fontSize: props.module.styles.fontSize || '16px',
  color: props.module.styles.color || '#333333',
  fontWeight: props.module.styles.fontWeight || 'normal',
  lineHeight: props.module.styles.lineHeight || '1.6',
  textAlign: props.module.styles.textAlign || ('left' as any)
}))

const renderedHtml = computed(() => {
  if (!props.module.props.content) return ''
  return marked.parse(props.module.props.content, { async: false }) as string
})

function onInput(event: Event) {
  const text = (event.target as HTMLTextAreaElement).value
  documentStore.updateModuleProps(props.module.id, { content: text })
}
</script>

<template>
  <div class="md-module" :style="containerStyle">
    <!-- 编辑模式：textarea + 实时预览 -->
    <template v-if="!isPreviewMode">
      <textarea
        class="md-textarea"
        :value="module.props.content"
        placeholder="输入 Markdown 内容..."
        @input="onInput"
      ></textarea>
      <div
        v-if="module.props.content.trim()"
        class="md-preview"
        :style="previewStyle"
        v-html="renderedHtml"
      ></div>
      <div v-else class="md-preview md-preview-empty" :style="previewStyle">
        <span class="hint">Markdown 预览区域</span>
      </div>
    </template>

    <!-- 预览模式：只显示渲染结果 -->
    <div v-else class="md-preview md-preview-only" :style="previewStyle" v-html="renderedHtml"></div>
  </div>
</template>

<style scoped>
.md-module {
  min-height: 24px;
  position: relative;
}

.md-textarea {
  display: block;
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  background: #f9fafb;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.md-textarea:focus {
  background: #fff;
  border-color: #3b82f6;
}

.md-preview {
  padding: 0;
  min-height: 24px;
}

.md-preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
}

.hint {
  color: #9ca3af;
  font-size: 13px;
}

/* 渲染内容样式 */
.md-preview :deep(p) {
  margin: 0 0 8px 0;
  word-break: break-word;
}

.md-preview :deep(h1),
.md-preview :deep(h2),
.md-preview :deep(h3),
.md-preview :deep(h4) {
  margin: 12px 0 6px 0;
  font-weight: bold;
  color: #111827;
}

.md-preview :deep(h1) { font-size: 1.5em; }
.md-preview :deep(h2) { font-size: 1.35em; }
.md-preview :deep(h3) { font-size: 1.2em; }

.md-preview :deep(ul),
.md-preview :deep(ol) {
  margin: 6px 0;
  padding-left: 24px;
}

.md-preview :deep(li) {
  margin: 3px 0;
}

.md-preview :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  margin: 8px 0;
  padding: 4px 16px;
  color: #4b5563;
  font-style: italic;
}

.md-preview :deep(code) {
  background: #f3f4f6;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.9em;
  color: #dc2626;
}

.md-preview :deep(pre) {
  background: #f3f4f6;
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
  margin: 8px 0;
}

.md-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

.md-preview :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.md-preview :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  margin: 8px 0;
}

.md-preview :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 16px 0;
}

.md-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.md-preview :deep(th),
.md-preview :deep(td) {
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  text-align: left;
  font-size: 14px;
}

.md-preview :deep(th) {
  background: #f9fafb;
  font-weight: 600;
}
</style>
