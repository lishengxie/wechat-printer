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
    <h4 class="text-xs font-medium text-gray-500 uppercase">页尾设置</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">风格</label>
      <select
        :value="(selectedModule?.props as any)?.variant || 'default'"
        @change="updateProps({ variant: ($event.target as HTMLSelectElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      >
        <option value="default">经典</option>
        <option value="simple">简约</option>
        <option value="branded">品牌</option>
        <option value="cta">互动</option>
      </select>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">结尾文字</label>
      <textarea
        :value="(selectedModule?.props as any)?.text"
        @change="updateProps({ text: ($event.target as HTMLTextAreaElement).value })"
        class="w-full px-3 py-2 border rounded text-sm min-h-[80px]"
      ></textarea>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">版权声明</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.copyright"
        @change="updateProps({ copyright: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      />
    </div>
    <div class="flex items-center gap-3">
      <input
        type="checkbox"
        :checked="(selectedModule?.props as any)?.showDivider"
        @change="updateProps({ showDivider: ($event.target as HTMLInputElement).checked })"
        class="w-4 h-4"
      />
      <label class="text-sm text-gray-600">显示分隔线</label>
    </div>
  </div>
</template>
