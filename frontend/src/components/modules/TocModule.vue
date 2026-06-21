<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, TocModuleProps } from '@/types/document'
import { renderToc } from '@/renderers/toc'

interface Props {
  module: Module & { props: TocModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderToc(props.module))

function onTitleUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { title: content })
}
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="toc-module"></div>
  <div v-else class="toc-module" :class="`variant-${module.props.variant}`">
    <!-- 默认风格 -->
    <template v-if="module.props.variant === 'default'">
      <div class="toc-title" :style="{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 12px 0', padding: '0 0 8px 0', borderBottom: '2px solid #e5e7eb' }">
        <RichTextEditor
          :content="module.props.title"
          :editable="!isPreviewMode"
          @update:content="onTitleUpdate"
        />
      </div>
      <ul class="toc-list">
        <li v-for="(item, index) in module.props.items" :key="index" class="toc-item" :style="{ paddingLeft: item.level * 16 + 'px', margin: '6px 0' }">
          <span class="toc-bullet" :style="{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.level === 0 ? '#3b82f6' : '#93c5fd', marginRight: '8px', verticalAlign: 'middle' }"></span>
          <span :style="{ fontSize: item.level === 0 ? '14px' : '13px', fontWeight: item.level === 0 ? '500' : 'normal', color: item.level === 0 ? '#374151' : '#6b7280', lineHeight: '1.5' }">{{ item.text }}</span>
        </li>
      </ul>
    </template>

    <!-- 编号风 -->
    <template v-if="module.props.variant === 'numbered'">
      <div class="numbered-title">
        <span class="numbered-icon">📑</span>
        <RichTextEditor
          :content="module.props.title"
          :editable="!isPreviewMode"
          @update:content="onTitleUpdate"
        />
      </div>
      <ol class="numbered-list">
        <li v-for="(item, index) in module.props.items" :key="index" class="numbered-item" :class="{ 'is-level-0': item.level === 0 }" :style="{ paddingLeft: item.level * 20 + 'px' }">
          <span class="numbered-text">{{ item.text }}</span>
        </li>
      </ol>
    </template>

    <!-- 卡片风 -->
    <template v-if="module.props.variant === 'card'">
      <div class="card-inner" :style="{ backgroundColor: module.styles.backgroundColor || 'transparent', border: module.styles.border || '1px solid #e5e7eb' }">
        <div class="card-title">
          <span class="card-bar"></span>
          <RichTextEditor
            :content="module.props.title"
            :editable="!isPreviewMode"
            @update:content="onTitleUpdate"
          />
        </div>
        <ul class="card-list">
          <li v-for="(item, index) in module.props.items" :key="index" class="card-item" :class="{ 'is-active': index === 0 }" :style="{ paddingLeft: item.level * 16 + 'px' }">
            <span class="card-num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="card-text">{{ item.text }}</span>
          </li>
        </ul>
      </div>
    </template>

    <!-- 极简风 -->
    <template v-if="module.props.variant === 'minimal'">
      <div class="minimal-title">
        <RichTextEditor
          :content="module.props.title"
          :editable="!isPreviewMode"
          @update:content="onTitleUpdate"
        />
      </div>
      <ul class="minimal-list">
        <li v-for="(item, index) in module.props.items" :key="index" class="minimal-item" :style="{ paddingLeft: item.level * 12 + 'px' }">
          <span class="minimal-dash"></span>
          <span class="minimal-text">{{ item.text }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.toc-module {
  position: relative;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  display: flex;
  align-items: center;
}

/* 编号 */
.numbered-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.numbered-icon {
  font-size: 18px;
}

.numbered-list {
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: toc;
}

.numbered-item {
  margin: 8px 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.numbered-item::before {
  counter-increment: toc;
  content: counter(toc, decimal-leading-zero);
  font-size: 11px;
  font-weight: 600;
  color: #d1d5db;
  min-width: 22px;
}

.numbered-item.is-level-0 {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.numbered-item.is-level-0::before {
  color: #3b82f6;
}

/* 卡片 */
.card-inner {
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-bar {
  display: inline-block;
  width: 4px;
  height: 16px;
  background: #3b82f6;
  border-radius: 2px;
  flex-shrink: 0;
}

.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.card-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  color: #4b5563;
}

.card-item:last-child {
  border-bottom: none;
}

.card-num {
  font-size: 11px;
  font-weight: 600;
  color: #d1d5db;
  min-width: 22px;
}

.card-item.is-active .card-num {
  color: #3b82f6;
}

/* 极简 */
.minimal-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 10px 0;
  letter-spacing: 1px;
}

.minimal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.minimal-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  font-size: 13px;
  color: #6b7280;
}

.minimal-dash {
  display: inline-block;
  width: 12px;
  height: 1px;
  background: #d1d5db;
  flex-shrink: 0;
}

.minimal-text {
  line-height: 1.5;
}
</style>
