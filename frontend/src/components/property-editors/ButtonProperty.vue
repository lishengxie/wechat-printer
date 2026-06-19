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
    <h4 class="text-xs font-medium text-gray-500 uppercase">按钮设置</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">按钮文字</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.text"
        @change="updateProps({ text: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">链接地址</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.link"
        @change="updateProps({ link: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
        placeholder="https://..."
      />
    </div>
  </div>
</template>
