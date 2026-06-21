<script setup lang="ts">
import { ref, inject, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, ContainerModuleProps, ModuleType } from '@/types/document'
import { createModule } from '@/types/document'
import ModuleItem from '../ModuleItem.vue'
import { VueDraggable } from 'vue-draggable-plus'

interface Props {
  module: Module & { props: ContainerModuleProps; children: Module[] }
}

const props = defineProps<Props>()
const documentStore = useDocumentStore()

// 注入预览模式标志
const isPreviewMode = inject('isPreviewMode', ref(false))
const isDragOverContainer = ref(false)

const childModules = ref<Module[]>([])

// VueDraggable 渲染出来的根 DOM 元素引用
const draggableRef = ref<any>(null)

watch(() => props.module.children, (children) => {
  childModules.value = children || []
}, { immediate: true })

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '24px 16px 16px',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '8px',
  border: props.module.styles.border || '2px dashed #c0c4cc',
  margin: props.module.styles.margin || '8px 0'
}))

// ============================================
// 辅助函数
// ============================================

function getLayoutClass(layout: string) {
  switch (layout) {
    case 'single': return 'grid-cols-1'
    case 'two-column': return 'grid-cols-2 gap-4'
    case 'three-column': return 'grid-cols-3 gap-3'
    default: return 'grid-cols-1'
  }
}

// ============================================
// 拖拽事件处理（直接挂在 VueDraggable 渲染出的真实 DOM 上，
// 因为 vue-draggable-plus 不会把 dragover/drop 转发到 Vue listener）
// ============================================

function handleDragOver(event: DragEvent) {
  if (isPreviewMode.value) return
  const types = event.dataTransfer?.types || []
  // dragover 阶段 types 在部分浏览器会被小写化，做大小写不敏感比较
  const hasModuleType = Array.from(types).some(t => t.toLowerCase() === 'moduletype')
  if (!hasModuleType) return
  event.preventDefault()
  event.stopPropagation()
  isDragOverContainer.value = true
}

function handleDragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement | null
  if (!target) {
    isDragOverContainer.value = false
    return
  }
  const rect = target.getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
    isDragOverContainer.value = false
  }
}

function handleDrop(event: DragEvent) {
  if (isPreviewMode.value) return

  const moduleId = event.dataTransfer?.getData('moduleId')
  const moduleType = event.dataTransfer?.getData('moduleType') as ModuleType

  // 已有模块的内部排序由 VueDraggable 处理，这里不拦截
  if (moduleId) return

  // 仅在确定是模块库新增时才拦截
  if (!moduleType) return

  event.preventDefault()
  event.stopPropagation()
  isDragOverContainer.value = false

  const insertIndex = computeInsertIndex(event)
  const newModule = createModule(moduleType)
  documentStore.addModule(newModule, props.module.id, insertIndex)
}

// 根据鼠标位置计算应插入的索引（基于各子模块 DOM 中点位置）
// 容器支持单列、两列、三列网格，因此需同时考虑 X / Y
function computeInsertIndex(event: DragEvent): number {
  const container = resolveEl()
  if (!container) return childModules.value.length
  const items = Array.from(container.querySelectorAll(':scope > .module-item')) as HTMLElement[]
  if (items.length === 0) return 0
  const x = event.clientX
  const y = event.clientY
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    // 鼠标在该子模块的"前方"则插到它前面
    // 多列网格里：先按行（Y 在 item 上方），再按列（同行内 X 在 item 中线左侧）
    if (y < rect.top) return i
    if (y <= rect.bottom && x < rect.left + rect.width / 2) return i
  }
  return items.length
}

// 解析 VueDraggable 组件实例对应的真实 DOM
function resolveEl(): HTMLElement | null {
  const r: any = draggableRef.value
  if (!r) return null
  if (r instanceof HTMLElement) return r
  if (r.$el instanceof HTMLElement) return r.$el
  return null
}

let boundEl: HTMLElement | null = null

function bindNativeListeners() {
  const el = resolveEl()
  if (!el || el === boundEl) return
  if (boundEl) {
    boundEl.removeEventListener('dragover', handleDragOver)
    boundEl.removeEventListener('dragleave', handleDragLeave)
    boundEl.removeEventListener('drop', handleDrop)
  }
  el.addEventListener('dragover', handleDragOver)
  el.addEventListener('dragleave', handleDragLeave)
  el.addEventListener('drop', handleDrop)
  boundEl = el
}

onMounted(bindNativeListeners)

// 编辑/预览模式切换会让 ref 重新挂载，watch 一下兜底
watch(draggableRef, bindNativeListeners)

onBeforeUnmount(() => {
  if (boundEl) {
    boundEl.removeEventListener('dragover', handleDragOver)
    boundEl.removeEventListener('dragleave', handleDragLeave)
    boundEl.removeEventListener('drop', handleDrop)
    boundEl = null
  }
})

function onChildDragUpdate() {
  const orderedIds = childModules.value.map(m => m.id)
  const currentIds = (props.module.children || []).map(m => m.id)
  if (JSON.stringify(orderedIds) !== JSON.stringify(currentIds)) {
    documentStore.reorderChildModules(props.module.id, orderedIds)
  }
}
</script>

<template>
  <div class="container-module">
    <!-- 编辑模式：VueDraggable 同时处理排序与外部库拖入 -->
    <template v-if="!isPreviewMode">
      <VueDraggable
        ref="draggableRef"
        v-model="childModules"
        tag="div"
        :class="[
          'container-inner grid',
          getLayoutClass(module.props.layout),
          { 'drag-active': isDragOverContainer }
        ]"
        :style="containerStyle"
        ghost-class="child-drag-ghost"
        @update="onChildDragUpdate"
        :animation="200"
      >
        <ModuleItem
          v-for="child in childModules"
          :key="child.id"
          :module="child"
        />

        <!-- 空容器提示 -->
        <div v-if="childModules.length === 0" class="empty-hint" :key="'empty'">
          <span>📦 拖拽模块到这里</span>
        </div>
      </VueDraggable>
    </template>

    <!-- 预览模式 -->
    <template v-else>
      <div
        class="container-inner grid"
        :class="getLayoutClass(module.props.layout)"
        :style="containerStyle"
      >
        <ModuleItem v-for="child in (module.children || [])" :key="child.id" :module="child" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.container-module {
  margin: 8px 0;
  min-height: 50px;
}

.container-inner {
  width: 100%;
  min-height: 50px;
  transition: all 0.2s ease;
  position: relative;
  z-index: 10;
}

/* 确保容器内部有可拖拽放置的区域 */
.container-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  pointer-events: auto;
  z-index: 100;
}

.container-inner::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 16px;
  pointer-events: auto;
  z-index: 100;
}

.container-inner.drag-active {
  border-color: #409eff !important;
  background-color: rgba(64, 158, 255, 0.05) !important;
}

/* VueDraggable 拖拽幽灵样式 */
.child-drag-ghost {
  opacity: 0.4;
  border: 2px dashed #67c23a;
  background-color: rgba(103, 194, 58, 0.05);
  border-radius: 4px;
}

/* 空容器提示 */
.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: #909399;
  font-size: 14px;
  pointer-events: none;
  grid-column: 1 / -1;
}
</style>
