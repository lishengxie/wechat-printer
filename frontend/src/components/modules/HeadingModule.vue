<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, HeadingModuleProps } from '@/types/document'
import { renderHeading } from '@/renderers/heading'

interface Props {
  module: Module & { props: HeadingModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderHeading(props.module))

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '12px 0',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '0',
  border: props.module.styles.border || 'none',
  margin: props.module.styles.margin || '24px 0 16px 0',
  fontFamily: props.module.styles.fontFamily || undefined
}))

const headingStyle = computed(() => {
  const level = props.module.props.level || 1
  const sizeMap: Record<number, string> = { 1: '24px', 2: '20px', 3: '18px', 4: '16px', 5: '15px', 6: '14px' }
  return {
    fontSize: props.module.styles.fontSize || sizeMap[level] || '24px',
    color: props.module.styles.color || '#111827',
    fontWeight: props.module.styles.fontWeight || 'bold',
    lineHeight: props.module.styles.lineHeight || '1.4',
    textAlign: props.module.styles.textAlign || 'left',
    margin: '0'
  }
})

const numberingPrefix = computed(() => {
  if (!props.module.props.showNumbering) return ''
  const level = props.module.props.level || 1
  const chinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  const map: Record<number, string> = {
    1: `${chinese[1]}、`,
    2: '1.',
    3: '(1)',
    4: '• ',
    5: '- ',
    6: '* '
  }
  return map[level] || ''
})

const barColor = computed(() => {
  const level = props.module.props.level || 1
  const colors: Record<number, string> = {
    1: '#3b82f6', 2: '#6366f1', 3: '#8b5cf6',
    4: '#06b6d4', 5: '#10b981', 6: '#f59e0b'
  }
  return colors[level] || '#3b82f6'
})

function onTextUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { text: content })
}
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="heading-module"></div>
  <div v-else class="heading-module" :class="`variant-${module.props.variant}`" :style="containerStyle">
    <!-- 编号风 -->
    <template v-if="module.props.variant === 'numbered'">
      <div class="numbered-inner">
        <div class="numbered-bar" :style="{ backgroundColor: barColor }"></div>
        <div class="numbered-text" :style="headingStyle">
          <span v-if="numberingPrefix" class="numbering-prefix" :style="{ color: barColor }">{{ numberingPrefix }}</span>
          <RichTextEditor
            :content="module.props.text"
            :editable="!isPreviewMode"
            @update:content="onTextUpdate"
          />
        </div>
      </div>
    </template>

    <!-- 左侧竖条风 -->
    <template v-if="module.props.variant === 'left-bar'">
      <div class="leftbar-inner">
        <div class="leftbar-bar" :style="{ backgroundColor: barColor }"></div>
        <div class="leftbar-text" :style="headingStyle">
          <RichTextEditor
            :content="module.props.text"
            :editable="!isPreviewMode"
            @update:content="onTextUpdate"
          />
        </div>
      </div>
    </template>

    <!-- 居中装饰风 -->
    <template v-if="module.props.variant === 'center'">
      <div class="center-inner">
        <div class="center-line"></div>
        <div :style="{ ...headingStyle, textAlign: 'center' }">
          <span v-if="numberingPrefix" class="numbering-prefix" :style="{ color: barColor }">{{ numberingPrefix }}</span>
          <RichTextEditor
            :content="module.props.text"
            :editable="!isPreviewMode"
            @update:content="onTextUpdate"
          />
        </div>
        <div class="center-line"></div>
      </div>
    </template>

    <!-- 极简风 -->
    <template v-if="module.props.variant === 'simple'">
      <div :style="headingStyle">
        <span v-if="numberingPrefix" class="numbering-prefix" :style="{ color: barColor }">{{ numberingPrefix }}</span>
        <RichTextEditor
          :content="module.props.text"
          :editable="!isPreviewMode"
          @update:content="onTextUpdate"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.heading-module {
  position: relative;
}

/* 编号风 */
.numbered-inner {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.numbered-bar {
  width: 4px;
  border-radius: 2px;
  flex-shrink: 0;
}

.numbered-text {
  word-break: break-word;
  flex: 1;
}

/* 左侧竖条风 */
.leftbar-inner {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.leftbar-bar {
  width: 4px;
  border-radius: 2px;
  flex-shrink: 0;
}

.leftbar-text {
  word-break: break-word;
  flex: 1;
}

/* 居中装饰风 */
.center-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.center-line {
  width: 60px;
  height: 2px;
  background: #e5e7eb;
  border-radius: 1px;
}

/* 极简风 */
.simple-text {
  word-break: break-word;
}

/* 通用 */
.numbering-prefix {
  font-weight: inherit;
}
</style>
