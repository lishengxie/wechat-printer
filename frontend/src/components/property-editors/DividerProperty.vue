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
    <h4 class="text-xs font-medium text-gray-500 uppercase">分割线设置</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">样式</label>
      <select
        :value="(selectedModule?.props as any)?.style || 'solid'"
        @change="updateProps({ style: ($event.target as HTMLSelectElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      >
        <option value="solid">实线</option>
        <option value="dashed">虚线</option>
        <option value="dotted">点线</option>
      </select>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">颜色</label>
      <div class="flex gap-2">
        <input
          type="color"
          :value="(selectedModule?.props as any)?.color || '#e5e7eb'"
          @input="updateProps({ color: ($event.target as HTMLInputElement).value })"
          class="w-10 h-10 rounded border cursor-pointer"
        />
        <input
          type="text"
          :value="(selectedModule?.props as any)?.color || '#e5e7eb'"
          @change="updateProps({ color: ($event.target as HTMLInputElement).value })"
          class="flex-1 px-3 py-2 border rounded text-sm"
        />
      </div>
    </div>
  </div>
</template>
