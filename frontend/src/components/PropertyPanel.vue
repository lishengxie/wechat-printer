<template>
  <div class="property-panel bg-white border-l h-full overflow-y-auto">
    <div class="p-4 border-b">
      <h3 class="font-semibold text-gray-700">属性设置</h3>
    </div>

    <div v-if="!selectedModule" class="p-6 text-center text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
      <p class="text-sm">选中模块以编辑属性</p>
    </div>

    <div v-else class="p-4 space-y-6">
      <!-- Module Type Info -->
      <div class="pb-4 border-b border-gray-100">
        <span class="text-xs font-medium text-gray-500 uppercase">模块类型</span>
        <div class="font-medium text-gray-800 mt-1">{{ getModuleTypeName(selectedModule.type) }}</div>
      </div>

      <!-- Style Controls -->
      <div class="space-y-4">
        <h4 class="text-xs font-medium text-gray-500 uppercase">样式设置</h4>

        <!-- Text Color -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">文字颜色</label>
          <div class="flex gap-2">
            <input
              type="color"
              :value="selectedModule.styles.color || '#333333'"
              @input="updateStyle('color', ($event.target as HTMLInputElement).value)"
              class="w-10 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              :value="selectedModule.styles.color || '#333333'"
              @change="updateStyle('color', ($event.target as HTMLInputElement).value)"
              class="flex-1 px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        <!-- Background Color -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">背景颜色</label>
          <div class="flex gap-2">
            <input
              type="color"
              :value="styleBackgroundColor"
              @input="updateStyle('backgroundColor', ($event.target as HTMLInputElement).value)"
              class="w-10 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              :value="styleBackgroundColor"
              @change="updateStyle('backgroundColor', ($event.target as HTMLInputElement).value)"
              class="flex-1 px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        <!-- Text Align -->
        <div v-if="supportsTextAlign">
          <label class="block text-sm text-gray-600 mb-1">对齐方式</label>
          <div class="flex gap-2">
            <button
              v-for="align in alignOptions"
              :key="align.value"
              @click="updateStyle('textAlign', align.value)"
              class="flex-1 px-3 py-2 border rounded text-sm hover:bg-gray-50"
              :class="{ 'bg-blue-50 border-blue-400 text-blue-600': selectedModule.styles.textAlign === align.value }"
            >
              {{ align.label }}
            </button>
          </div>
        </div>

        <!-- Font Size -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">字体大小</label>
          <input
            type="text"
            :value="selectedModule.styles.fontSize || '16px'"
            @change="updateStyle('fontSize', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="16px"
          />
        </div>

        <!-- Padding -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">内边距</label>
          <input
            type="text"
            :value="selectedModule.styles.padding || '0'"
            @change="updateStyle('padding', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="16px"
          />
        </div>

        <!-- Margin -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">外边距</label>
          <input
            type="text"
            :value="selectedModule.styles.margin || '0 0 16px 0'"
            @change="updateStyle('margin', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="0 0 16px 0"
          />
        </div>
      </div>

      <!-- Module Specific Props - Text -->
      <div v-if="selectedModule.type === 'text'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">文字内容</h4>
        <div>
          <textarea
            :value="(selectedModule.props as any).content"
            @change="updateProps({ content: ($event.target as HTMLTextAreaElement).value })"
            class="w-full px-3 py-2 border rounded text-sm min-h-[100px]"
            placeholder="输入文字内容..."
          ></textarea>
        </div>
      </div>

      <!-- Module Specific Props - Button -->
      <div v-if="selectedModule.type === 'button'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">按钮设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">按钮文字</label>
          <input
            type="text"
            :value="(selectedModule.props as any).text"
            @change="updateProps({ text: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">链接地址</label>
          <input
            type="text"
            :value="(selectedModule.props as any).link"
            @change="updateProps({ link: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="https://..."
          />
        </div>
      </div>

<!-- Module Specific Props - Image -->
      <div v-if="selectedModule.type === 'image'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">图片设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">图片地址</label>
          <input
            type="text"
            :value="(selectedModule.props as any).src"
            @change="updateProps({ src: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="https://..."
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">替代文本</label>
          <input
            type="text"
            :value="(selectedModule.props as any).alt || ''"
            @change="updateProps({ alt: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="图片描述"
          />
        </div>
      </div>

      <!-- Module Specific Props - Container -->
      <div v-if="selectedModule.type === 'container'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">布局设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">布局方式</label>
          <select
            :value="(selectedModule.props as any).layout"
            @change="updateProps({ layout: ($event.target as HTMLSelectElement).value as any })"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="single">单列</option>
            <option value="two-column">双列</option>
            <option value="three-column">三列</option>
          </select>
        </div>
        <p class="text-sm text-gray-500">容器包含 {{ selectedModule.children?.length || 0 }} 个子模块</p>
      </div>

      <!-- Module Specific Props - Header -->
      <div v-if="selectedModule.type === 'header'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">页首设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">风格</label>
          <select
            :value="(selectedModule.props as any).variant || 'default'"
            @change="updateProps({ variant: ($event.target as HTMLSelectElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="default">经典</option>
            <option value="magazine">杂志</option>
            <option value="minimal">极简</option>
            <option value="card">卡片</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">标题</label>
          <input
            type="text"
            :value="(selectedModule.props as any).title"
            @change="updateProps({ title: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">副标题</label>
          <input
            type="text"
            :value="(selectedModule.props as any).subtitle"
            @change="updateProps({ subtitle: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">作者</label>
          <input
            type="text"
            :value="(selectedModule.props as any).author"
            @change="updateProps({ author: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">日期</label>
          <input
            type="text"
            :value="(selectedModule.props as any).date"
            @change="updateProps({ date: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="(selectedModule.props as any).showAuthor"
            @change="updateProps({ showAuthor: ($event.target as HTMLInputElement).checked })"
            class="w-4 h-4"
          />
          <label class="text-sm text-gray-600">显示作者</label>
        </div>
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="(selectedModule.props as any).showDate"
            @change="updateProps({ showDate: ($event.target as HTMLInputElement).checked })"
            class="w-4 h-4"
          />
          <label class="text-sm text-gray-600">显示日期</label>
        </div>
      </div>

      <!-- Module Specific Props - Footer -->
      <div v-if="selectedModule.type === 'footer'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">页尾设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">风格</label>
          <select
            :value="(selectedModule.props as any).variant || 'default'"
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
            :value="(selectedModule.props as any).text"
            @change="updateProps({ text: ($event.target as HTMLTextAreaElement).value })"
            class="w-full px-3 py-2 border rounded text-sm min-h-[80px]"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">版权声明</label>
          <input
            type="text"
            :value="(selectedModule.props as any).copyright"
            @change="updateProps({ copyright: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="(selectedModule.props as any).showDivider"
            @change="updateProps({ showDivider: ($event.target as HTMLInputElement).checked })"
            class="w-4 h-4"
          />
          <label class="text-sm text-gray-600">显示分隔线</label>
        </div>
      </div>

      <!-- Module Specific Props - TOC -->
      <div v-if="selectedModule.type === 'toc'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">目录设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">风格</label>
          <select
            :value="(selectedModule.props as any).variant || 'default'"
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
            :value="(selectedModule.props as any).title"
            @change="updateProps({ title: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-sm text-gray-600">目录项（双击编辑）</label>
          <div
            v-for="(item, index) in (selectedModule.props as any).items"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/document'
import type { ModuleType, ModuleStyles, ModuleSpecificProps } from '@/types/document'

const documentStore = useDocumentStore()

const selectedModule = computed(() => documentStore.selectedModule)

const styleBackgroundColor = computed(() => {
  const color = selectedModule.value?.styles.backgroundColor
  return color && color !== 'transparent' ? color : '#ffffff'
})

const alignOptions = [
  { label: '左', value: 'left' as const },
  { label: '中', value: 'center' as const },
  { label: '右', value: 'right' as const }
]

const textModules: ModuleType[] = ['text', 'button', 'header', 'footer']
const supportsTextColor = computed(() => selectedModule.value && textModules.includes(selectedModule.value.type))
const supportsTextAlign = computed(() => selectedModule.value && textModules.includes(selectedModule.value.type))

function getModuleTypeName(type: ModuleType): string {
  const names: Record<ModuleType, string> = {
    text: '文字模块',
    image: '图片模块',
    divider: '分割线模块',
    button: '按钮模块',
    container: '容器模块',
    header: '页首模块',
    footer: '页尾模块',
    toc: '目录模块'
  }
  return names[type] || type
}

function updateStyle(key: keyof ModuleStyles, value: string | undefined) {
  if (selectedModule.value) {
    documentStore.updateModuleStyles(selectedModule.value.id, { [key]: value })
  }
}

function updateProps(props: Partial<ModuleSpecificProps>) {
  if (selectedModule.value) {
    documentStore.updateModuleProps(selectedModule.value.id, props)
  }
}

// TOC 目录项操作
function updateTocItem(index: number, field: 'text' | 'level', value: string | number) {
  if (!selectedModule.value) return
  const items = [...(selectedModule.value.props as any).items]
  items[index] = { ...items[index], [field]: value }
  documentStore.updateModuleProps(selectedModule.value.id, { items } as Partial<ModuleSpecificProps>)
}

function removeTocItem(index: number) {
  if (!selectedModule.value) return
  const items = (selectedModule.value.props as any).items.filter((_: any, i: number) => i !== index)
  documentStore.updateModuleProps(selectedModule.value.id, { items } as Partial<ModuleSpecificProps>)
}

function addTocItem() {
  if (!selectedModule.value) return
  const items = [...(selectedModule.value.props as any).items, { text: '新目录项', level: 0 }]
  documentStore.updateModuleProps(selectedModule.value.id, { items } as Partial<ModuleSpecificProps>)
}
</script>
