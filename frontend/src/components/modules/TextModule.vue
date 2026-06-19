<script setup lang="ts">
import { inject, ref } from 'vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, TextModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: TextModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))

// 处理编辑完成
function handleBlur(event: FocusEvent) {
  if (!isPreviewMode.value) {
    const target = event.target as HTMLElement
    const newContent = target.innerHTML
    documentStore.updateModuleProps(props.module.id, { content: newContent })
  }
}

// 处理粘贴事件 - 保留文本格式
function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}
</script>

<template>
  <div class="text-module">
    <p
      class="leading-relaxed"
      :style="{
        fontSize: module.styles.fontSize || '16px',
        color: module.styles.color || '#333333',
        fontWeight: module.styles.fontWeight || 'normal',
        lineHeight: module.styles.lineHeight || '1.6',
        textAlign: module.styles.textAlign || 'left',
        margin: module.styles.margin || '0',
        padding: module.styles.padding || '0',
        backgroundColor: module.styles.backgroundColor || 'transparent',
        borderRadius: module.styles.borderRadius || '0',
        border: module.styles.border || 'none',
        minHeight: '20px'
      }"
      :contenteditable="!isPreviewMode.value"
      v-html="module.props.content"
      @blur="handleBlur"
      @paste="handlePaste"
    ></p>
  </div>
</template>

<style scoped>
.text-module {
  min-height: 24px;
}

.text-module p {
  outline: none;
  transition: all 0.2s ease;
  word-break: break-word;
}

.text-module p[contenteditable="true"]:hover {
  background-color: rgba(59, 130, 246, 0.05);
  border-radius: 4px;
}

.text-module p[contenteditable="true"]:focus {
  background-color: rgba(59, 130, 246, 0.08);
  border-radius: 4px;
}
</style>
