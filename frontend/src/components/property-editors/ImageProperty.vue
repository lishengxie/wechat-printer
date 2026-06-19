<script setup lang="ts">
import { useDocumentStore } from '@/stores/document'
import { storeToRefs } from 'pinia'

const documentStore = useDocumentStore()
const { selectedModule } = storeToRefs(documentStore)

function updateProps(props: Record<string, any>) {
  if (selectedModule.value) {
    documentStore.updateModuleProps(selectedModule.value.id, props)
  }
}

function updateCaptionStyle(key: string, value: any) {
  const current = ((selectedModule.value?.props as any)?.captionStyle) || {}
  updateProps({ captionStyle: { ...current, [key]: value } })
}
</script>

<template>
  <div class="space-y-4 pt-4 border-t border-gray-100">
    <h4 class="text-xs font-medium text-gray-500 uppercase">图片设置</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">图片地址</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.src"
        @change="updateProps({ src: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
        placeholder="https://..."
      />
    </div>
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
