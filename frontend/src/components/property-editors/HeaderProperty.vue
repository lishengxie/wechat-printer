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
    <h4 class="text-xs font-medium text-gray-500 uppercase">页首设置</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">风格</label>
      <select
        :value="(selectedModule?.props as any)?.variant || 'default'"
        @change="updateProps({ variant: ($event.target as HTMLSelectElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      >
        <option value="default">经典</option>
        <option value="magazine">杂志</option>
        <option value="minimal">极简</option>
        <option value="card">卡片</option>
      </select>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">标题</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.title"
        @change="updateProps({ title: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">副标题</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.subtitle"
        @change="updateProps({ subtitle: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">作者</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.author"
        @change="updateProps({ author: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">日期</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.date"
        @change="updateProps({ date: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      />
    </div>
    <div class="flex items-center gap-3">
      <input
        type="checkbox"
        :checked="(selectedModule?.props as any)?.showAuthor"
        @change="updateProps({ showAuthor: ($event.target as HTMLInputElement).checked })"
        class="w-4 h-4"
      />
      <label class="text-sm text-gray-600">显示作者</label>
    </div>
    <div class="flex items-center gap-3">
      <input
        type="checkbox"
        :checked="(selectedModule?.props as any)?.showDate"
        @change="updateProps({ showDate: ($event.target as HTMLInputElement).checked })"
        class="w-4 h-4"
      />
      <label class="text-sm text-gray-600">显示日期</label>
    </div>
  </div>
</template>
