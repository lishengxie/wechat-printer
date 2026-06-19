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
    <h4 class="text-xs font-medium text-gray-500 uppercase">引用设置</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">引用内容</label>
      <textarea
        :value="(selectedModule?.props as any)?.content"
        @change="updateProps({ content: ($event.target as HTMLTextAreaElement).value })"
        class="w-full px-3 py-2 border rounded text-sm min-h-[80px]"
        placeholder="输入引用文字..."
      ></textarea>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">作者/来源（可选）</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.author || ''"
        @change="updateProps({ author: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
        placeholder="作者或来源"
      />
    </div>
  </div>
</template>
