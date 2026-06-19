<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, QuoteModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: QuoteModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '16px 20px',
  backgroundColor: props.module.styles.backgroundColor || '#f8fafc',
  borderLeft: props.module.styles.borderLeft || '4px solid #3b82f6',
  borderRadius: props.module.styles.borderRadius || '0 8px 8px 0',
  margin: props.module.styles.margin || '0 0 16px 0',
  fontFamily: props.module.styles.fontFamily || undefined
}))

const textStyle = computed(() => ({
  fontSize: props.module.styles.fontSize || '15px',
  color: props.module.styles.color || '#4b5563',
  fontWeight: props.module.styles.fontWeight || 'normal',
  fontStyle: (props.module.styles.fontStyle || 'italic') as any,
  lineHeight: props.module.styles.lineHeight || '1.8',
  textAlign: props.module.styles.textAlign || 'left' as any,
  margin: '0'
}))

const authorStyle = computed(() => ({
  fontSize: '13px',
  color: '#9ca3af',
  margin: '8px 0 0 0',
  textAlign: 'right' as any
}))

function handleBlur(event: FocusEvent) {
  if (!isPreviewMode.value) {
    const target = event.target as HTMLElement
    const newContent = target.innerHTML
    documentStore.updateModuleProps(props.module.id, { content: newContent })
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}
</script>

<template>
  <div class="quote-module" :style="containerStyle">
    <p
      :style="textStyle"
      :contenteditable="!isPreviewMode.value"
      v-html="module.props.content"
      @blur="handleBlur"
      @paste="handlePaste"
    ></p>
    <p v-if="module.props.author" :style="authorStyle">—— {{ module.props.author }}</p>
  </div>
</template>

<style scoped>
.quote-module {
  min-height: 24px;
}

.quote-module p {
  outline: none;
  word-break: break-word;
}

.quote-module p[contenteditable="true"]:hover {
  background-color: rgba(59, 130, 246, 0.05);
  border-radius: 4px;
}

.quote-module p[contenteditable="true"]:focus {
  background-color: rgba(59, 130, 246, 0.08);
  border-radius: 4px;
}
</style>
