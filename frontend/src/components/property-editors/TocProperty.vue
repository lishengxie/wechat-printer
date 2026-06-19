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

function updateTocItem(index: number, field: 'text' | 'level', value: string | number) {
  const items = [...((selectedModule.value?.props as any)?.items || [])]
  items[index] = { ...items[index], [field]: value }
  updateProps({ items } as any)
}

function removeTocItem(index: number) {
  const items = ((selectedModule.value?.props as any)?.items || []).filter((_: any, i: number) => i !== index)
  updateProps({ items } as any)
}

function addTocItem() {
  const items = [...((selectedModule.value?.props as any)?.items || []), { text: '新目录项', level: 0 }]
  updateProps({ items } as any)
}
</script>

<template>
  <div class="space-y-4 pt-4 border-t border-gray-100">
    <h4 class="text-xs font-medium text-gray-500 uppercase">目录设置</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">风格</label>
      <select
        :value="(selectedModule?.props as any)?.variant || 'default'"
        @change="updateProps({ variant: ($event.target as HTMLSelectElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      >
        <option value="default">经典</option>
        <option value="numbered">编号</option>
        <option value="card">卡片</option>
        <option value="minimal">极简</option>
      </select>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">目录标题</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.title"
        @change="updateProps({ title: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
      />
    </div>
    <div class="space-y-2">
      <label class="block text-sm text-gray-600">目录项（双击编辑）</label>
      <div
        v-for="(item, index) in (selectedModule?.props as any)?.items"
        :key="index"
        class="flex gap-2 items-center"
      >
        <select
          :value="item.level"
          @change="updateTocItem(index, 'level', parseInt(($event.target as HTMLSelectElement).value))"
          class="w-16 px-2 py-1 border rounded text-xs"
        >
          <option :value="0">一级</option>
          <option :value="1">二级</option>
          <option :value="2">三级</option>
        </select>
        <input
          type="text"
          :value="item.text"
          @change="updateTocItem(index, 'text', ($event.target as HTMLInputElement).value)"
          class="flex-1 px-2 py-1 border rounded text-sm"
        />
        <button
          @click="removeTocItem(index)"
          class="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
          title="删除"
        >
          ✕
        </button>
      </div>
      <button
        @click="addTocItem"
        class="w-full py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50"
      >
        + 添加目录项
      </button>
    </div>
  </div>
</template>
