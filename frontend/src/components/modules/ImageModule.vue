<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import { uploadImage } from '@/services/api'
import type { Module, ImageModuleProps } from '@/types/document'
import { renderImage } from '@/renderers/image'

interface Props {
  module: Module & { props: ImageModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderImage(props.module))

const isDragOver = ref(false)
const isUploading = ref(false)
const uploadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const captionStyle = computed(() => {
  const cs = props.module.props.captionStyle || {}
  return {
    fontSize: cs.fontSize || '13px',
    color: cs.color || '#9ca3af',
    fontStyle: cs.italic ? 'italic' : 'normal',
    textAlign: cs.textAlign || 'center',
    margin: '8px 0 0 0',
    lineHeight: '1.6'
  }
})

const imageAlignStyle = computed(() => {
  const align = props.module.props.align || 'center'
  return {
    marginLeft: align === 'center' ? 'auto' : (align === 'right' ? 'auto' : '0'),
    marginRight: align === 'center' ? 'auto' : '0'
  }
})

function onCaptionUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { caption: content })
}

async function handleFile(file: File) {
  if (!file.type.startsWith('image/')) {
    uploadError.value = '只能上传图片文件'
    return
  }
  uploadError.value = ''
  isUploading.value = true
  try {
    const result = await uploadImage(file)
    documentStore.updateModuleProps(props.module.id, { src: result.url })
  } catch (e: any) {
    uploadError.value = e?.message || '上传失败'
  } finally {
    isUploading.value = false
  }
}

function onDragOver(event: DragEvent) {
  if (isPreviewMode.value) return
  // 仅响应文件拖入；模块库的拖动用 moduleType，不命中 Files
  const types = event.dataTransfer?.types || []
  if (!Array.from(types).some(t => t.toLowerCase() === 'files')) return
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = true
}

function onDragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement | null
  if (!target) {
    isDragOver.value = false
    return
  }
  const rect = target.getBoundingClientRect()
  if (
    event.clientX <= rect.left || event.clientX >= rect.right ||
    event.clientY <= rect.top || event.clientY >= rect.bottom
  ) {
    isDragOver.value = false
  }
}

function onDrop(event: DragEvent) {
  if (isPreviewMode.value) return
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return
  const file = Array.from(files).find(f => f.type.startsWith('image/'))
  if (!file) return
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false
  handleFile(file)
}

function onPaste(event: ClipboardEvent) {
  if (isPreviewMode.value) return
  const items = event.clipboardData?.items
  if (!items) return
  for (const item of Array.from(items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        event.preventDefault()
        handleFile(file)
        return
      }
    }
  }
}

function onPlaceholderClick() {
  if (isPreviewMode.value) return
  fileInput.value?.click()
}

function onFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    handleFile(file)
  }
  target.value = ''
}
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="image-module"></div>
  <div v-else
    class="image-module"
    :class="{ 'is-drag-over': isDragOver, 'is-uploading': isUploading }"
    :style="{ margin: module.styles.margin }"
    tabindex="0"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @paste="onPaste"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden-file-input"
      @change="onFileInputChange"
    />

    <div class="image-wrapper">
      <img
        v-if="module.props.src"
        :src="module.props.src"
        :alt="module.props.alt"
        class="max-w-full h-auto shadow-sm"
        :style="{
          width: module.props.width || '100%',
          height: module.props.height,
          border: module.styles.border,
          borderRadius: module.styles.borderRadius || '8px',
          ...imageAlignStyle
        }"
      />
      <div
        v-else
        class="placeholder bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        @click="onPlaceholderClick"
      >
        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-sm">点击选择 / 拖拽 / 粘贴图片</p>
      </div>

      <div v-if="isUploading" class="upload-overlay">上传中...</div>
      <div v-if="isDragOver" class="drop-overlay">松开上传</div>
    </div>

    <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>

    <div v-if="module.props.caption" class="image-caption" :style="captionStyle">
      <RichTextEditor
        :content="module.props.caption"
        :editable="!isPreviewMode"
        @update:content="onCaptionUpdate"
      />
    </div>
  </div>
</template>

<style scoped>
.image-module {
  margin: 12px 0;
  text-align: center;
  position: relative;
  outline: none;
  transition: margin 0.2s ease;
}

.image-module.is-drag-over {
  outline: 2px dashed #409eff;
  outline-offset: 4px;
  border-radius: 8px;
}

.image-wrapper {
  position: relative;
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.image-wrapper img {
  display: block;
  transition: border 0.2s ease, border-radius 0.2s ease;
}

.hidden-file-input {
  display: none;
}

.placeholder {
  user-select: none;
}

.upload-overlay,
.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  pointer-events: none;
}

.upload-overlay {
  background: rgba(255, 255, 255, 0.7);
  color: #303133;
}

.drop-overlay {
  background: rgba(64, 158, 255, 0.15);
  color: #1f2937;
}

.upload-error {
  margin-top: 6px;
  font-size: 12px;
  color: #ef4444;
}

.image-caption {
  word-break: break-word;
}
</style>
