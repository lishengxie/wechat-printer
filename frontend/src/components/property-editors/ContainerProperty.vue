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
    <h4 class="text-xs font-medium text-gray-500 uppercase">布局设置</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">布局方式</label>
      <select
        :value="(selectedModule?.props as any)?.layout"
        @change="updateProps({ layout: ($event.target as HTMLSelectElement).value as any })"
        class="w-full px-3 py-2 border rounded text-sm"
      >
        <option value="single">单列</option>
        <option value="two-column">双列</option>
        <option value="three-column">三列</option>
      </select>
    </div>
    <p class="text-sm text-gray-500">容器包含 {{ selectedModule?.children?.length || 0 }} 个子模块</p>
  </div>
</template>
