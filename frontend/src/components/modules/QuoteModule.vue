<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, QuoteModuleProps } from '@/types/document'
import { renderQuote } from '@/renderers/quote'

interface Props {
  module: Module & { props: QuoteModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderQuote(props.module))

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '16px 20px',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderLeft: props.module.styles.borderLeft || '4px solid #3b82f6',
  borderRadius: props.module.styles.borderRadius || '0 8px 8px 0',
  margin: props.module.styles.margin || '0 0 16px 0',
  fontFamily: props.module.styles.fontFamily || undefined
}))

const editorStyle = computed(() => ({
  fontSize: props.module.styles.fontSize || '15px',
  color: props.module.styles.color || '#4b5563',
  fontWeight: props.module.styles.fontWeight || 'normal',
  fontStyle: (props.module.styles.fontStyle || 'italic') as any,
  lineHeight: props.module.styles.lineHeight || '1.8',
  textAlign: props.module.styles.textAlign || ('left' as any)
}))

const authorStyle = computed(() => ({
  fontSize: '13px',
  color: '#9ca3af',
  margin: '8px 0 0 0',
  textAlign: 'right' as any
}))

function onContentUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { content })
}
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml"></div>
  <div v-else class="quote-module" :style="containerStyle">
    <div class="editor-wrapper" :style="editorStyle">
      <RichTextEditor
        :content="module.props.content"
        :editable="!isPreviewMode"
        @update:content="onContentUpdate"
      />
    </div>
    <p v-if="module.props.author" :style="authorStyle">—— {{ module.props.author }}</p>
  </div>
</template>

<style scoped>
.quote-module {
  min-height: 24px;
}

.editor-wrapper {
  position: relative;
}
</style>
