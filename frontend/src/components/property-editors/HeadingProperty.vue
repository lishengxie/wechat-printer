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
</script>

<template>
  <div class="space-y-4 pt-4 border-t border-gray-100">
    <h4 class="text-xs font-medium text-gray-500 uppercase">章节标题设置</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">风格</label>
      <select
        :value="(selectedModule?.props as any)?.variant || 'numbered'"
        @change="updateProps({ variant: ($event.target as HTMLSelectElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      >
        <option value="numbered">编号风</option>
        <option value="left-bar">左侧竖条</option>
        <option value="center">居中装饰</option>
        <option value="simple">极简</option>
      </select>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">标题文字</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.text"
        @change="updateProps({ text: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">层级</label>
      <select
        :value="(selectedModule?.props as any)?.level || 1"
        @change="updateProps({ level: parseInt(($event.target as HTMLSelectElement).value) })"
        class="w-full px-3 py-2 border rounded text-sm"
      >
        <option :value="1">一级标题 (h1)</option>
        <option :value="2">二级标题 (h2)</option>
        <option :value="3">三级标题 (h3)</option>
        <option :value="4">四级标题 (h4)</option>
        <option :value="5">五级标题 (h5)</option>
        <option :value="6">六级标题 (h6)</option>
      </select>
    </div>
    <div class="flex items-center gap-3">
      <input
        type="checkbox"
        :checked="(selectedModule?.props as any)?.showNumbering"
        @change="updateProps({ showNumbering: ($event.target as HTMLInputElement).checked })"
        class="w-4 h-4"
      />
      <label class="text-sm text-gray-600">显示编号前缀</label>
    </div>
  </div>
</template>
