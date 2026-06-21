<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, ButtonModuleProps } from '@/types/document'
import { renderButton } from '@/renderers/button'

interface Props {
  module: Module & { props: ButtonModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderButton(props.module))

const containerStyle = computed(() => ({
  textAlign: (props.module.styles.textAlign || 'center') as any,
  padding: props.module.styles.padding || '0',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '0',
  border: props.module.styles.border || 'none',
  margin: props.module.styles.margin || '12px 0'
}))

const sizeClasses = {
  small: 'px-4 py-1 text-sm',
  medium: 'px-6 py-2',
  large: 'px-8 py-3 text-lg'
}

const linkStyle = computed(() => ({
  backgroundColor: props.module.styles.backgroundColor || '#3b82f6',
  color: props.module.styles.color || '#ffffff',
  borderRadius: props.module.styles.borderRadius || '6px',
  fontSize: props.module.styles.fontSize || undefined
}))

function onTextUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { text: content })
}
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml"></div>
  <div v-else class="button-module" :style="containerStyle">
    <a
      :href="module.props.link"
      class="inline-block rounded text-center no-underline transition-opacity hover:opacity-90"
      :class="sizeClasses[module.props.size]"
      :style="linkStyle"
    >
      <RichTextEditor
        :content="module.props.text"
        :editable="!isPreviewMode"
        @update:content="onTextUpdate"
      />
    </a>
  </div>
</template>
