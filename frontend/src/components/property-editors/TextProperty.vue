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
    <h4 class="text-xs font-medium text-gray-500 uppercase">文字内容</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">图标 (Emoji)</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.icon || ''"
        @change="updateProps({ icon: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
        placeholder="如 📢 ✨ 💡（选填）"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">内容</label>
      <textarea
        :value="(selectedModule?.props as any)?.content"
        @change="updateProps({ content: ($event.target as HTMLTextAreaElement).value })"
        class="w-full px-3 py-2 border rounded text-sm min-h-[100px]"
        placeholder="输入文字内容..."
      ></textarea>
    </div>
  </div>
</template>
