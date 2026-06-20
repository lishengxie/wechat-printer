<template>
  <div class="property-panel">
    <div class="panel-header">
      <h3>属性设置</h3>
    </div>

    <div v-if="!selectedModule" class="panel-empty">
      <el-empty description="选中模块以编辑属性" :image-size="80" />
    </div>

    <div v-else class="panel-body">
      <!-- 模块类型 -->
      <div class="section">
        <span class="section-title">模块类型</span>
        <div class="type-name">{{ moduleTypeName }}</div>
      </div>

      <!-- 样式设置 -->
      <div class="section">
        <span class="section-title">样式设置</span>

        <!-- 文字颜色 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">文字颜色</label>
          <el-color-picker
            :model-value="selectedModule.styles.color || '#333333'"
            @change="(v: any) => updateStyle('color', v || '#333333')"
            show-alpha
          />
        </div>

        <!-- 背景颜色 -->
        <div class="field">
          <label class="field-label">背景颜色</label>
          <el-color-picker
            :model-value="selectedModule.styles.backgroundColor || '#ffffff'"
            @change="(v: any) => updateStyle('backgroundColor', v || '#ffffff')"
            show-alpha
          />
        </div>

        <!-- 对齐方式 -->
        <div v-if="supportsTextAlign" class="field">
          <label class="field-label">对齐方式</label>
          <el-radio-group
            :model-value="selectedModule.styles.textAlign || 'left'"
            @change="(v: any) => updateStyle('textAlign', v)"
          >
            <el-radio-button v-for="opt in alignOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <!-- 字体大小 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">字体大小</label>
          <el-input
            :model-value="selectedModule.styles.fontSize || '16px'"
            @change="(v: string) => updateStyle('fontSize', v)"
            placeholder="16px"
          />
        </div>

        <!-- 字体 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">字体</label>
          <el-select
            :model-value="selectedModule.styles.fontFamily || ''"
            @change="(v: string) => updateStyle('fontFamily', v)"
            style="width: 100%"
          >
            <el-option v-for="opt in fontFamilyOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>

        <!-- 内边距 -->
        <div class="field">
          <label class="field-label">内边距</label>
          <div class="slider-group">
            <div v-for="(label, side) in { top: '上', right: '右', bottom: '下', left: '左' }" :key="side" class="slider-row">
              <span class="slider-label">{{ label }}</span>
              <el-slider
                :model-value="paddingVals[['top','right','bottom','left'].indexOf(side)]"
                @change="(v: number) => updatePadding(side, v)"
                :min="0"
                :max="80"
                :show-tooltip="false"
                size="small"
              />
              <span class="slider-value">{{ paddingVals[['top','right','bottom','left'].indexOf(side)] }}px</span>
            </div>
          </div>
        </div>

        <!-- 外边距 -->
        <div class="field">
          <label class="field-label">外边距</label>
          <div class="slider-group">
            <div v-for="(label, side) in { top: '上', right: '右', bottom: '下', left: '左' }" :key="side" class="slider-row">
              <span class="slider-label">{{ label }}</span>
              <el-slider
                :model-value="marginVals[['top','right','bottom','left'].indexOf(side)]"
                @change="(v: number) => updateMargin(side, v)"
                :min="0"
                :max="80"
                :show-tooltip="false"
                size="small"
              />
              <span class="slider-value">{{ marginVals[['top','right','bottom','left'].indexOf(side)] }}px</span>
            </div>
          </div>
        </div>

        <!-- 边框 -->
        <div class="field">
          <label class="field-label">边框</label>
          <el-input
            :model-value="selectedModule.styles.border || ''"
            @change="(v: string) => updateStyle('border', v)"
            placeholder="1px solid #e5e7eb"
          />
        </div>

        <!-- 圆角 -->
        <div class="field">
          <label class="field-label">圆角</label>
          <el-input
            :model-value="selectedModule.styles.borderRadius || ''"
            @change="(v: string) => updateStyle('borderRadius', v)"
            placeholder="8px"
          />
        </div>

        <!-- 行高 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">行高</label>
          <el-input
            :model-value="selectedModule.styles.lineHeight || ''"
            @change="(v: string) => updateStyle('lineHeight', v)"
            placeholder="1.6"
          />
        </div>

        <!-- 字重 -->
        <div v-if="supportsTextColor" class="field">
          <label class="field-label">字重</label>
          <el-select
            :model-value="selectedModule.styles.fontWeight || 'normal'"
            @change="(v: string) => updateStyle('fontWeight', v)"
            style="width: 100%"
          >
            <el-option v-for="opt in fontWeightOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
      </div>

      <!-- 模块专用属性编辑器 -->
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

const fontFamilyOptions = [
  { label: '默认', value: '' },
  { label: '系统默认 (无衬线)', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { label: '衬线体', value: "-apple-system, 'Noto Serif SC', Georgia, serif" },
  { label: '苹方 / 微软雅黑', value: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { label: '楷体', value: "-apple-system, 'Noto Serif SC', 'KaiTi', serif" },
  { label: 'Helvetica Neue', value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: 'Georgia', value: "Georgia, 'Noto Serif SC', serif" },
  { label: '等宽字体 (Courier)', value: "'Courier New', monospace" },
]

const fontWeightOptions = [
  { label: '正常', value: 'normal' },
  { label: '细体', value: '300' },
  { label: '中等', value: '500' },
  { label: '半粗', value: '600' },
  { label: '加粗', value: 'bold' },
]

const alignOptions = [
  { label: '左', value: 'left' as const },
  { label: '中', value: 'center' as const },
  { label: '右', value: 'right' as const }
]

function updateStyle(key: string, value: string | undefined) {
  if (selectedModule.value) {
    documentStore.updateModuleStyles(selectedModule.value.id, { [key]: value })
  }
}

function updatePadding(side: string, val: number) {
  if (!selectedModule.value) return
  const [t, r, b, l] = parseSpacing(selectedModule.value.styles.padding)
  const map: Record<string, string> = {
    top: `${val}px ${r}px ${b}px ${l}px`,
    right: `${t}px ${val}px ${b}px ${l}px`,
    bottom: `${t}px ${r}px ${val}px ${l}px`,
    left: `${t}px ${r}px ${b}px ${val}px`
  }
  updateStyle('padding', map[side])
}

function updateMargin(side: string, val: number) {
  if (!selectedModule.value) return
  const [t, r, b, l] = parseSpacing(selectedModule.value.styles.margin, '0 0 16px 0')
  const map: Record<string, string> = {
    top: `${val}px ${r}px ${b}px ${l}px`,
    right: `${t}px ${val}px ${b}px ${l}px`,
    bottom: `${t}px ${r}px ${val}px ${l}px`,
    left: `${t}px ${r}px ${b}px ${val}px`
  }
  updateStyle('margin', map[side])
}

function parseSpacing(val: string | undefined, fallback = '0'): number[] {
  const parts = (val || fallback).split(/\s+/).map(v => parseInt(v) || 0)
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
  return [parts[0], parts[1], parts[2], parts[3]]
}

const paddingVals = computed(() => parseSpacing(selectedModule.value?.styles.padding))
const marginVals = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0'))
</script>

<style scoped>
.property-panel { height: 100%; overflow-y: auto; background: var(--el-bg-color); border-left: 1px solid var(--el-border-color-light); }
.panel-header { padding: 16px; border-bottom: 1px solid var(--el-border-color-light); }
.panel-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }
.panel-empty { padding: 40px 16px; }
.panel-body { padding: 16px; display: flex; flex-direction: column; gap: 20px; }
.section { display: flex; flex-direction: column; gap: 12px; }
.section-title { font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.type-name { font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 13px; color: var(--el-text-color-regular); }
.slider-group { display: flex; flex-direction: column; gap: 6px; }
.slider-row { display: flex; align-items: center; gap: 8px; }
.slider-label { font-size: 12px; color: var(--el-text-color-secondary); width: 16px; flex-shrink: 0; }
.slider-row .el-slider { flex: 1; }
.slider-value { font-size: 12px; color: var(--el-text-color-secondary); width: 40px; text-align: right; flex-shrink: 0; }
</style>
