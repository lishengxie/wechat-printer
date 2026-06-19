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

// 展开/收起状态
const expandedGroups = ref<Record<string, boolean>>({
  '基础组件': true  // 基础组件默认展开
})

function toggleGroup(name: string) {
  expandedGroups.value[name] = !expandedGroups.value[name]
}

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
    <div class="modules-list">
      <div
        v-for="group in groupedModules"
        :key="group.name"
        class="module-group"
      >
        <div class="group-header" @click="toggleGroup(group.name)">
          <div class="group-header-left">
            <span class="group-arrow" :class="{ expanded: expandedGroups[group.name] }">▶</span>
            <span class="group-title">{{ group.name }}</span>
          </div>
          <span class="group-count">{{ group.items.length }}</span>
        </div>
        <Transition name="collapse">
          <div v-if="expandedGroups[group.name]" class="group-items">
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
          </div>
        </Transition>
      </div>
    </div>
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
  color: #333;
}

.library-hint {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: #666;
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-group {
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  margin-bottom: 4px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.group-header:hover {
  background: #f3f4f6;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-arrow {
  font-size: 8px;
  color: #9ca3af;
  transition: transform 0.2s;
}

.group-arrow.expanded {
  transform: rotate(90deg);
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.group-count {
  font-size: 11px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.module-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.module-item:hover {
  background: #e9ecef;
  border-color: #dee2e6;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.module-item:active {
  cursor: grabbing;
}

/* 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 600px;
}

.module-icon {
  font-size: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.module-info {
  flex: 1;
}

.module-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.module-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}
</style>
