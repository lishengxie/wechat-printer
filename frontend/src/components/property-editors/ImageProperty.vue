<script setup lang="ts">
import { ref } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { storeToRefs } from 'pinia'
import { uploadImage } from '@/services/api'

const documentStore = useDocumentStore()
const { selectedModule } = storeToRefs(documentStore)

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadError = ref('')

function updateProps(props: Record<string, any>) {
  if (selectedModule.value) {
    documentStore.updateModuleProps(selectedModule.value.id, props)
  }
}

function updateStyles(styles: Record<string, any>) {
  if (selectedModule.value) {
    documentStore.updateModuleStyles(selectedModule.value.id, styles)
  }
}

function updateCaptionStyle(key: string, value: any) {
  const current = ((selectedModule.value?.props as any)?.captionStyle) || {}
  updateProps({ captionStyle: { ...current, [key]: value } })
}

function pickFile() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    uploadError.value = '只能上传图片文件'
    return
  }
  uploadError.value = ''
  isUploading.value = true
  try {
    const result = await uploadImage(file)
    updateProps({ src: result.url })
  } catch (e: any) {
    uploadError.value = e?.message || '上传失败'
  } finally {
    isUploading.value = false
  }
}

function onBorderChange(width: string, style: string, color: string) {
  if (width === '0' || !width) {
    updateStyles({ border: 'none' })
    return
  }
  const borderStyle = style || 'solid'
  const borderColor = color || '#e5e7eb'
  updateStyles({ border: `${width}px ${borderStyle} ${borderColor}` })
}

function parseCurrentBorder(): { width: string; style: string; color: string } {
  const border = ((selectedModule.value?.styles as any)?.border) || ''
  if (!border || border === 'none') return { width: '0', style: 'solid', color: '#e5e7eb' }
  const parts = border.split(/\s+/)
  const width = parts.find(p => /^\d+/.test(p))?.replace(/px$/, '') || '1'
  const style = parts.find(p => /^(solid|dashed|dotted|none)$/i.test(p)) || 'solid'
  const color = parts.find(p => /^#/.test(p)) || '#e5e7eb'
  return { width, style, color }
}
</script>

<template>
  <div class="space-y-4 pt-4 border-t border-gray-100">
    <h4 class="text-xs font-medium text-gray-500 uppercase">图片设置</h4>

    <!-- 图片地址 & 上传 -->
    <div>
      <label class="block text-sm text-gray-600 mb-1">图片地址</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.src"
        @change="updateProps({ src: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
        placeholder="https://..."
      />
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />
      <button
        type="button"
        class="mt-2 w-full px-3 py-2 text-sm rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="isUploading"
        @click="pickFile"
      >
        {{ isUploading ? '上传中…' : '从本地选择文件' }}
      </button>
      <p v-if="uploadError" class="mt-1 text-xs text-red-500">{{ uploadError }}</p>
    </div>

    <!-- 图片宽度 -->
    <div>
      <label class="block text-sm text-gray-600 mb-1">宽度</label>
      <select
        :value="(selectedModule?.props as any)?.width || '100%'"
        @change="updateProps({ width: ($event.target as HTMLSelectElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      >
        <option value="100%">100% — 整行</option>
        <option value="75%">75% — 四分之三</option>
        <option value="50%">50% — 一半</option>
        <option value="25%">25% — 四分之一</option>
        <option value="auto">auto — 原始尺寸</option>
      </select>
    </div>

    <!-- 边框 -->
    <div>
      <label class="block text-sm text-gray-600 mb-1">边框</label>
      <div class="space-y-2">
        <div class="flex gap-2 items-center">
          <label class="text-xs text-gray-500 w-10">粗细</label>
          <select
            :value="parseCurrentBorder().width"
            @change="onBorderChange(($event.target as HTMLSelectElement).value, parseCurrentBorder().style, parseCurrentBorder().color)"
            class="flex-1 px-2 py-1 border rounded text-xs"
          >
            <option value="0">无</option>
            <option value="1">1px</option>
            <option value="2">2px</option>
            <option value="3">3px</option>
            <option value="4">4px</option>
          </select>
        </div>
        <div class="flex gap-2 items-center">
          <label class="text-xs text-gray-500 w-10">样式</label>
          <select
            :value="parseCurrentBorder().style"
            @change="onBorderChange(parseCurrentBorder().width, ($event.target as HTMLSelectElement).value, parseCurrentBorder().color)"
            class="flex-1 px-2 py-1 border rounded text-xs"
          >
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </select>
        </div>
        <div class="flex gap-2 items-center">
          <label class="text-xs text-gray-500 w-10">颜色</label>
          <input
            type="color"
            :value="parseCurrentBorder().color"
            @input="onBorderChange(parseCurrentBorder().width, parseCurrentBorder().style, ($event.target as HTMLInputElement).value)"
            class="w-8 h-8 rounded border cursor-pointer"
          />
          <input
            type="text"
            :value="parseCurrentBorder().color"
            @change="onBorderChange(parseCurrentBorder().width, parseCurrentBorder().style, ($event.target as HTMLInputElement).value)"
            class="flex-1 px-2 py-1 border rounded text-xs"
          />
        </div>
      </div>
    </div>

    <!-- 圆角 -->
    <div>
      <label class="block text-sm text-gray-600 mb-1">圆角</label>
      <select
        :value="((selectedModule?.styles as any)?.borderRadius) || '8px'"
        @change="updateStyles({ borderRadius: ($event.target as HTMLSelectElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      >
        <option value="0">0px — 直角</option>
        <option value="4px">4px — 小圆角</option>
        <option value="8px">8px — 默认</option>
        <option value="12px">12px — 大圆角</option>
        <option value="16px">16px — 更大</option>
        <option value="50%">50% — 圆形</option>
      </select>
    </div>

    <!-- 替代文本 -->
    <div>
      <label class="block text-sm text-gray-600 mb-1">替代文本</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.alt || ''"
        @change="updateProps({ alt: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
        placeholder="图片描述"
      />
    </div>

    <!-- 脚注 -->
    <div>
      <label class="block text-sm text-gray-600 mb-1">脚注文字</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.caption || ''"
        @change="updateProps({ caption: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
        placeholder="图片说明文字（可选）"
      />
    </div>
    <div v-if="(selectedModule?.props as any)?.caption">
      <label class="block text-sm text-gray-600 mb-1">脚注样式</label>
      <div class="space-y-2">
        <div class="flex gap-2 items-center">
          <label class="text-xs text-gray-500 w-12">字号</label>
          <select
            :value="((selectedModule?.props as any)?.captionStyle?.fontSize) || '13px'"
            @change="updateCaptionStyle('fontSize', ($event.target as HTMLSelectElement).value)"
            class="flex-1 px-2 py-1 border rounded text-xs"
          >
            <option value="11px">11px</option>
            <option value="12px">12px</option>
            <option value="13px">13px</option>
            <option value="14px">14px</option>
            <option value="15px">15px</option>
          </select>
        </div>
        <div class="flex gap-2 items-center">
          <label class="text-xs text-gray-500 w-12">颜色</label>
          <input
            type="color"
            :value="((selectedModule?.props as any)?.captionStyle?.color) || '#9ca3af'"
            @input="updateCaptionStyle('color', ($event.target as HTMLInputElement).value)"
            class="w-8 h-8 rounded border cursor-pointer"
          />
          <input
            type="text"
            :value="((selectedModule?.props as any)?.captionStyle?.color) || '#9ca3af'"
            @change="updateCaptionStyle('color', ($event.target as HTMLInputElement).value)"
            class="flex-1 px-2 py-1 border rounded text-xs"
          />
        </div>
        <div class="flex gap-2 items-center">
          <label class="text-xs text-gray-500 w-12">对齐</label>
          <select
            :value="((selectedModule?.props as any)?.captionStyle?.textAlign) || 'center'"
            @change="updateCaptionStyle('textAlign', ($event.target as HTMLSelectElement).value)"
            class="flex-1 px-2 py-1 border rounded text-xs"
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </div>
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="!!((selectedModule?.props as any)?.captionStyle?.italic)"
            @change="updateCaptionStyle('italic', ($event.target as HTMLInputElement).checked)"
            class="w-4 h-4"
          />
          <label class="text-xs text-gray-500">斜体</label>
        </div>
      </div>
    </div>
  </div>
</template>
