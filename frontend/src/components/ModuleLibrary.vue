<script setup lang="ts">
import { useDocumentStore } from '@/stores/document'
import { createModule } from '@/types/document'
import { getModulesByGroup } from '@/registry/modules'
import { computed, ref } from 'vue'

interface GroupedModules {
  name: string
  items: Array<{
    type: string
    name: string
    description: string
    icon: string
    variant?: string
  }>
}

const emit = defineEmits<{
  (e: 'drag-module', moduleType: string): void
}>()

const documentStore = useDocumentStore()

const groupedModules = computed<GroupedModules[]>(() => {
  const groups = getModulesByGroup()
  const result: GroupedModules[] = []

  groups.forEach((items, name) => {
    const resolved: GroupedModules['items'] = []
    for (const reg of items) {
      if (reg.variants && reg.variants.length > 0) {
        for (const v of reg.variants) {
          resolved.push({
            type: reg.type,
            name: v.name,
            description: v.description,
            icon: v.icon,
            variant: v.variant
          })
        }
      } else {
        resolved.push({
          type: reg.type,
          name: reg.name,
          description: reg.description,
          icon: reg.icon
        })
      }
    }
    result.push({ name, items: resolved })
  })

  return result
})

// Default: expand first group
const activeNames = ref(['基础组件'])

const handleDragStart = (event: DragEvent, module: GroupedModules['items'][number]) => {
  console.log('Drag started:', module.type, module.variant)
  if (event.dataTransfer) {
    event.dataTransfer.setData('moduleType', module.type)
    if (module.variant) {
      event.dataTransfer.setData('moduleVariant', module.variant)
    }
    event.dataTransfer.effectAllowed = 'copy'
  }
  emit('drag-module', module.type)
}

function handleClickAdd(module: GroupedModules['items'][number]) {
  console.log('Click add module:', module.type, module.variant)
  const newModule = createModule(module.type as any)
  if (module.variant) {
    (newModule.props as any).variant = module.variant
  }
  documentStore.addModule(newModule)
}
</script>

<template>
  <div class="module-library">
    <h3 class="library-title">模块库</h3>
    <p class="library-hint">💡 拖拽或点击添加模块</p>
    <el-collapse v-model="activeNames" class="modules-collapse">
      <el-collapse-item
        v-for="group in groupedModules"
        :key="group.name"
        :title="group.name"
        :name="group.name"
      >
        <div
          v-for="module in group.items"
          :key="`${module.type}-${module.variant || 'default'}`"
          class="module-item"
          draggable="true"
          @dragstart="handleDragStart($event, module)"
          @click="handleClickAdd(module)"
        >
          <div class="module-icon">{{ module.icon }}</div>
          <div class="module-info">
            <div class="module-name">{{ module.name }}</div>
            <div class="module-description">{{ module.description }}</div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.module-library {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.library-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.library-hint {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.modules-collapse {
  --el-collapse-header-bg-color: transparent;
  --el-collapse-content-bg-color: transparent;
}
.module-item {
  display: flex;
  align-items: center;
  padding: 8px 4px;
  border-radius: 6px;
  cursor: grab;
  transition: background 0.15s;
  user-select: none;
}
.module-item:hover {
  background: var(--el-fill-color-light);
}
.module-item:active {
  cursor: grabbing;
}
.module-icon {
  font-size: 20px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}
.module-info {
  flex: 1;
  min-width: 0;
}
.module-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.module-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
