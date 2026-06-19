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
        <div class="font-medium text-gray-800 mt-1">{{ moduleTypeName }}</div>
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

        <!-- Font Family -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">字体</label>
          <select
            :value="selectedModule.styles.fontFamily || ''"
            @change="updateStyle('fontFamily', ($event.target as HTMLSelectElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="">默认</option>
            <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">系统默认 (无衬线)</option>
            <option value="-apple-system, 'Noto Serif SC', Georgia, serif">衬线体 (宋体/Georgia)</option>
            <option value="-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif">苹方 / 微软雅黑</option>
            <option value="-apple-system, 'Noto Serif SC', 'KaiTi', serif">楷体</option>
            <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica Neue</option>
            <option value="Georgia, 'Noto Serif SC', serif">Georgia</option>
            <option value="'Courier New', monospace">等宽字体 (Courier)</option>
          </select>
        </div>

        <!-- Padding with sliders -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">内边距</label>
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">上</span>
              <input type="range" min="0" max="80" :value="paddingTop" @input="updatePadding('top', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ paddingTop }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">右</span>
              <input type="range" min="0" max="80" :value="paddingRight" @input="updatePadding('right', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ paddingRight }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">下</span>
              <input type="range" min="0" max="80" :value="paddingBottom" @input="updatePadding('bottom', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ paddingBottom }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">左</span>
              <input type="range" min="0" max="80" :value="paddingLeft" @input="updatePadding('left', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ paddingLeft }}px</span>
            </div>
          </div>
        </div>

        <!-- Margin with sliders -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">外边距</label>
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">上</span>
              <input type="range" min="0" max="80" :value="marginTop" @input="updateMargin('top', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ marginTop }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">右</span>
              <input type="range" min="0" max="80" :value="marginRight" @input="updateMargin('right', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ marginRight }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">下</span>
              <input type="range" min="0" max="80" :value="marginBottom" @input="updateMargin('bottom', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ marginBottom }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">左</span>
              <input type="range" min="0" max="80" :value="marginLeft" @input="updateMargin('left', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ marginLeft }}px</span>
            </div>
          </div>
        </div>

        <!-- Border -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">边框</label>
          <input
            type="text"
            :value="selectedModule.styles.border || ''"
            @change="updateStyle('border', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="1px solid #e5e7eb"
          />
        </div>

        <!-- Border Radius -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">圆角</label>
          <input
            type="text"
            :value="selectedModule.styles.borderRadius || ''"
            @change="updateStyle('borderRadius', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="8px"
          />
        </div>

        <!-- Line Height -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">行高</label>
          <input
            type="text"
            :value="selectedModule.styles.lineHeight || ''"
            @change="updateStyle('lineHeight', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="1.6"
          />
        </div>

        <!-- Font Weight -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">字重</label>
          <select
            :value="selectedModule.styles.fontWeight || 'normal'"
            @change="updateStyle('fontWeight', ($event.target as HTMLSelectElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="normal">正常</option>
            <option value="bold">加粗</option>
            <option value="300">细体</option>
            <option value="500">中等</option>
            <option value="600">半粗</option>
          </select>
        </div>
      </div>

      <!-- Module-Specific Property Editor (dynamically loaded from registry) -->
      <component :is="propertyEditor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { moduleRegistry } from '@/registry/modules'
import { storeToRefs } from 'pinia'

const documentStore = useDocumentStore()
const { selectedModule } = storeToRefs(documentStore)

const propertyEditor = computed(() => {
  if (!selectedModule.value) return null
  const reg = moduleRegistry[selectedModule.value.type]
  return reg ? defineAsyncComponent(reg.propertyPanel) : null
})

const textModules = ['text', 'button', 'header', 'footer', 'heading', 'quote'] as const
const supportsTextColor = computed(() => selectedModule.value && textModules.includes(selectedModule.value.type as any))
const supportsTextAlign = computed(() => selectedModule.value && textModules.includes(selectedModule.value.type as any))

const moduleTypeName = computed(() => {
  if (!selectedModule.value) return ''
  const reg = moduleRegistry[selectedModule.value.type]
  return reg ? reg.name : selectedModule.value.type
})

const styleBackgroundColor = computed(() => {
  const color = selectedModule.value?.styles.backgroundColor
  return color && color !== 'transparent' ? color : '#ffffff'
})

const alignOptions = [
  { label: '左', value: 'left' as const },
  { label: '中', value: 'center' as const },
  { label: '右', value: 'right' as const }
]

// Parse padding/margin into individual values
function parseSpacing(val: string | undefined, fallback = '0'): number[] {
  const parts = (val || fallback).split(/\s+/).map(v => parseInt(v) || 0)
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
  return [parts[0], parts[1], parts[2], parts[3]]
}

const paddingTop = computed(() => parseSpacing(selectedModule.value?.styles.padding)[0])
const paddingRight = computed(() => parseSpacing(selectedModule.value?.styles.padding)[1])
const paddingBottom = computed(() => parseSpacing(selectedModule.value?.styles.padding)[2])
const paddingLeft = computed(() => parseSpacing(selectedModule.value?.styles.padding)[3])
const marginTop = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0')[0])
const marginRight = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0')[1])
const marginBottom = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0')[2])
const marginLeft = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0')[3])

function updateStyle(key: string, value: string | undefined) {
  if (selectedModule.value) {
    documentStore.updateModuleStyles(selectedModule.value.id, { [key]: value })
  }
}

function updatePadding(side: string, px: string) {
  if (!selectedModule.value) return
  const cur = selectedModule.value.styles.padding || '0'
  const [t, r, b, l] = parseSpacing(cur)
  const map: Record<string, string> = {
    top: `${px}px ${r}px ${b}px ${l}px`,
    right: `${t}px ${px}px ${b}px ${l}px`,
    bottom: `${t}px ${r}px ${px}px ${l}px`,
    left: `${t}px ${r}px ${b}px ${px}px`
  }
  updateStyle('padding', map[side])
}

function updateMargin(side: string, px: string) {
  if (!selectedModule.value) return
  const cur = selectedModule.value.styles.margin || '0 0 16px 0'
  const [t, r, b, l] = parseSpacing(cur, '0 0 16px 0')
  const map: Record<string, string> = {
    top: `${px}px ${r}px ${b}px ${l}px`,
    right: `${t}px ${px}px ${b}px ${l}px`,
    bottom: `${t}px ${r}px ${px}px ${l}px`,
    left: `${t}px ${r}px ${b}px ${px}px`
  }
  updateStyle('margin', map[side])
}
</script>
