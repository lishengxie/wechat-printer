<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, TextModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: TextModuleProps }
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

const editorStyle = computed(() => ({
  fontSize: props.module.styles.fontSize || '16px',
  color: props.module.styles.color || '#333333',
  fontWeight: props.module.styles.fontWeight || 'normal',
  lineHeight: props.module.styles.lineHeight || '1.6',
  textAlign: props.module.styles.textAlign || ('left' as any)
}))

function onContentUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { content })
}
</script>

<template>
  <div class="text-module" :style="containerStyle">
    <div v-if="module.props.icon" class="text-icon-row">
      <span class="text-icon">{{ module.props.icon }}</span>
    </div>
    <div
      class="editor-wrapper"
      :style="{
        ...editorStyle,
        '--paragraph-spacing': props.module.styles.paragraphSpacing || '0'
      }"
    >
      <RichTextEditor
        :content="module.props.content"
        :editable="!isPreviewMode"
        @update:content="onContentUpdate"
      />
    </div>
  </div>
</template>

<style scoped>
.text-module {
  min-height: 24px;
  position: relative;
}

.text-icon-row {
  margin-bottom: 4px;
}

.text-icon {
  font-size: 20px;
  line-height: 1;
}

.editor-wrapper {
  position: relative;
}
</style>
