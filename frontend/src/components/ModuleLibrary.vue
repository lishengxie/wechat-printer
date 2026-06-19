<script setup lang="ts">
import { useDragState } from '@/composables/useDragState'
import { useDocumentStore } from '@/stores/document'
import { createModule } from '@/types/document'
import type { HeaderVariant, FooterVariant, TocVariant, HeadingVariant } from '@/types/document'
import { computed } from 'vue'

interface ModuleItem {
  type: string
  name: string
  description: string
  icon: string
  variant?: string
  group?: string
}

const modules: ModuleItem[] = [
  // 页首预设
  {
    type: 'header',
    name: '页首 · 经典',
    description: '居中对齐的标题、副标题和元信息',
    icon: '📰',
    variant: 'default',
    group: '页首'
  },
  {
    type: 'header',
    name: '页首 · 杂志',
    description: '大字标题配红色装饰线，杂志封面感',
    icon: '🗞️',
    variant: 'magazine',
    group: '页首'
  },
  {
    type: 'header',
    name: '页首 · 极简',
    description: '左对齐无装饰，干净利落',
    icon: '📄',
    variant: 'minimal',
    group: '页首'
  },
  {
    type: 'header',
    name: '页首 · 卡片',
    description: '深色背景卡片，视觉冲击力强',
    icon: '🎴',
    variant: 'card',
    group: '页首'
  },
  // 目录预设
  {
    type: 'toc',
    name: '目录 · 经典',
    description: '带圆点层级缩进的目录列表',
    icon: '📑',
    variant: 'default',
    group: '目录'
  },
  {
    type: 'toc',
    name: '目录 · 编号',
    description: '自动编号的有序目录列表',
    icon: '🔢',
    variant: 'numbered',
    group: '目录'
  },
  {
    type: 'toc',
    name: '目录 · 卡片',
    description: '卡片容器包裹，带序号高亮',
    icon: '🃏',
    variant: 'card',
    group: '目录'
  },
  {
    type: 'toc',
    name: '目录 · 极简',
    description: '细线分隔的极简目录',
    icon: '📋',
    variant: 'minimal',
    group: '目录'
  },
  // 章节标题
  {
    type: 'heading',
    name: '标题 · 编号风',
    description: '左侧彩色竖条 + 编号前缀，章节感强',
    icon: '📌',
    variant: 'numbered',
    group: '章节标题'
  },
  {
    type: 'heading',
    name: '标题 · 左侧竖条',
    description: '彩色竖条装饰，无编号，简洁有力',
    icon: '📍',
    variant: 'left-bar',
    group: '章节标题'
  },
  {
    type: 'heading',
    name: '标题 · 居中装饰',
    description: '居中大标题配上下装饰线',
    icon: '🎯',
    variant: 'center',
    group: '章节标题'
  },
  {
    type: 'heading',
    name: '标题 · 极简',
    description: '仅加大加粗文字，干净利落',
    icon: '🔤',
    variant: 'simple',
    group: '章节标题'
  },
  // 基础模块
  {
    type: 'text',
    name: '文字',
    description: '添加文本内容，支持富文本编辑',
    icon: '📝',
    group: '基础组件'
  },
  {
    type: 'image',
    name: '图片',
    description: '上传并展示图片内容',
    icon: '🖼️',
    group: '基础组件'
  },
  {
    type: 'divider',
    name: '分割线',
    description: '添加水平分割线分隔内容',
    icon: '➖',
    group: '基础组件'
  },
  {
    type: 'button',
    name: '按钮',
    description: '添加可点击的按钮组件',
    icon: '🔘',
    group: '基础组件'
  },
  {
    type: 'container',
    name: '容器',
    description: '添加容器用于包裹其他组件',
    icon: '📦',
    group: '基础组件'
  },
  // 页尾预设
  {
    type: 'footer',
    name: '页尾 · 经典',
    description: '分割线加感谢语和版权信息',
    icon: '🏁',
    variant: 'default',
    group: '页尾'
  },
  {
    type: 'footer',
    name: '页尾 · 简约',
    description: '仅保留版权和简洁分隔线',
    icon: '📍',
    variant: 'simple',
    group: '页尾'
  },
  {
    type: 'footer',
    name: '页尾 · 品牌',
    description: 'Logo、社交点和品牌感设计',
    icon: '🏢',
    variant: 'branded',
    group: '页尾'
  },
  {
    type: 'footer',
    name: '页尾 · 互动',
    description: '引导点赞留言收藏的CTA设计',
    icon: '👍',
    variant: 'cta',
    group: '页尾'
  }
]

const emit = defineEmits<{
  (e: 'drag-module', moduleType: string): void
}>()

const { startDrag, endDrag } = useDragState()
const documentStore = useDocumentStore()

// 按组聚合模块
const groupedModules = computed(() => {
  const groups: Record<string, ModuleItem[]> = {}
  for (const m of modules) {
    const g = m.group || '其他'
    if (!groups[g]) groups[g] = []
    groups[g].push(m)
  }
  // 定义组的显示顺序
  const order = ['页首', '目录', '章节标题', '基础组件', '页尾']
  const ordered: [string, ModuleItem[]][] = []
  for (const name of order) {
    if (groups[name]) {
      ordered.push([name, groups[name]])
      delete groups[name]
    }
  }
  // 追加未定义的组
  for (const [name, items] of Object.entries(groups)) {
    ordered.push([name, items])
  }
  return ordered
})

const handleDragStart = (event: DragEvent, module: ModuleItem) => {
  console.log('Drag started:', module.type, module.variant)
  if (event.dataTransfer) {
    event.dataTransfer.setData('moduleType', module.type)
    if (module.variant) {
      event.dataTransfer.setData('moduleVariant', module.variant)
    }
    event.dataTransfer.effectAllowed = 'copy'
  }
  startDrag(module.type as any)
  emit('drag-module', module.type)
}

const handleDragEnd = () => {
  setTimeout(() => {
    endDrag()
  }, 100)
}

function handleClickAdd(module: ModuleItem) {
  console.log('Click add module:', module.type, module.variant)
  const newModule = createModule(module.type as any)
  if (module.variant) {
    if (module.type === 'header') {
      (newModule.props as any).variant = module.variant as HeaderVariant
    } else if (module.type === 'footer') {
      (newModule.props as any).variant = module.variant as FooterVariant
    } else if (module.type === 'toc') {
      (newModule.props as any).variant = module.variant as TocVariant
    } else if (module.type === 'heading') {
      (newModule.props as any).variant = module.variant as HeadingVariant
    }
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
        v-for="[groupName, groupItems] in groupedModules"
        :key="groupName"
        class="module-group"
      >
        <div class="group-header">
          <span class="group-title">{{ groupName }}</span>
          <span class="group-count">{{ groupItems.length }}</span>
        </div>
        <div class="group-items">
          <div
            v-for="module in groupItems"
            :key="`${module.type}-${module.variant || 'default'}`"
            class="module-item"
            draggable="true"
            @dragstart="handleDragStart($event, module)"
            @dragend="handleDragEnd"
            @click="handleClickAdd(module)"
          >
            <div class="module-icon">{{ module.icon }}</div>
            <div class="module-info">
              <div class="module-name">{{ module.name }}</div>
              <div class="module-description">{{ module.description }}</div>
            </div>
          </div>
        </div>
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
