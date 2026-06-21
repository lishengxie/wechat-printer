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

function updateStyles(styles: Record<string, any>) {
  if (selectedModule.value) {
    documentStore.updateModuleStyles(selectedModule.value.id, styles)
  }
}

const alignOptions = [
  { value: 'left', label: '左', icon: '←' },
  { value: 'center', label: '中', icon: '↔' },
  { value: 'right', label: '右', icon: '→' },
] as const

const fontSizeOptions = [
  '12px', '13px', '14px', '15px', '16px', '18px', '20px',
  '24px', '28px', '32px', '36px', '48px'
]
</script>

<template>
  <div class="space-y-4 pt-4 border-t border-gray-100">
    <h4 class="text-xs font-medium text-gray-500 uppercase">Markdown 内容</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">源码</label>
      <textarea
        :value="(selectedModule?.props as any)?.content"
        @change="updateProps({ content: ($event.target as HTMLTextAreaElement).value })"
        class="w-full px-3 py-2 border rounded text-sm min-h-[160px] font-mono"
        placeholder="输入 Markdown 内容..."
      ></textarea>
    </div>

    <div class="pt-2 border-t border-gray-50">
      <h4 class="text-xs font-medium text-gray-500 uppercase mb-2">排版</h4>

      <!-- 文字对齐 -->
      <div class="mb-3">
        <label class="block text-sm text-gray-600 mb-1">对齐方式</label>
        <div class="flex gap-1">
          <button
            v-for="opt in alignOptions"
            :key="opt.value"
            :title="opt.label"
            :class="[
              'flex-1 px-2 py-1.5 text-sm border rounded transition-colors',
              (selectedModule?.styles?.textAlign || 'left') === opt.value
                ? 'bg-blue-50 border-blue-400 text-blue-600'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            ]"
            @click="updateStyles({ textAlign: opt.value })"
          >
            {{ opt.icon }}
          </button>
        </div>
      </div>

      <!-- 字号 -->
      <div class="mb-3">
        <label class="block text-sm text-gray-600 mb-1">字号</label>
        <select
          :value="selectedModule?.styles?.fontSize || '16px'"
          @change="updateStyles({ fontSize: ($event.target as HTMLSelectElement).value })"
          class="w-full px-3 py-2 border rounded text-sm bg-white"
        >
          <option v-for="size in fontSizeOptions" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
