<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, HeaderModuleProps } from '@/types/document'
import { renderHeader } from '@/renderers/header'

interface Props {
  module: Module & { props: HeaderModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderHeader(props.module))

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '24px 16px',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '8px',
  border: props.module.styles.border || 'none',
  margin: props.module.styles.margin || '0 0 16px 0',
  textAlign: (props.module.styles.textAlign || 'center') as any,
  fontFamily: props.module.styles.fontFamily || undefined
}))

const titleStyle = computed(() => ({
  fontSize: props.module.styles.fontSize || '24px',
  color: props.module.styles.color || '#1f2937',
  fontWeight: props.module.styles.fontWeight || 'bold',
  lineHeight: props.module.styles.lineHeight || '1.4'
}))

const subtitleStyle = computed(() => ({
  fontSize: '15px',
  color: '#6b7280',
  lineHeight: '1.6'
}))

function onTitleUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { title: content })
}

function onSubtitleUpdate(content: string) {
  documentStore.updateModuleProps(props.module.id, { subtitle: content })
}
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml" class="header-module"></div>
  <div v-else class="header-module" :class="`variant-${module.props.variant}`" :style="containerStyle">
    <!-- 默认风格 -->
    <template v-if="module.props.variant === 'default'">
      <RichTextEditor
        :content="module.props.title"
        :editable="!isPreviewMode"
        @update:content="onTitleUpdate"
        class="header-title-editor"
        :style="titleStyle"
      />
      <div v-if="module.props.subtitle" class="header-subtitle" :style="subtitleStyle">
        <RichTextEditor
          :content="module.props.subtitle"
          :editable="!isPreviewMode"
          @update:content="onSubtitleUpdate"
        />
      </div>
      <div class="header-meta" :style="{ textAlign: (module.styles.textAlign || 'center') as any, fontSize: '13px', color: '#9ca3af' }">
        <span v-if="module.props.showAuthor && module.props.author" class="meta-item">{{ module.props.author }}</span>
        <span v-if="module.props.showDate && module.props.date" class="meta-item">{{ module.props.date }}</span>
      </div>
    </template>

    <!-- 杂志封面风 -->
    <template v-if="module.props.variant === 'magazine'">
      <div class="magazine-accent"></div>
      <div v-if="module.props.subtitle" class="magazine-subtitle" :style="{ textAlign: module.styles.textAlign || 'center', color: module.styles.color || '#dc2626' }">
        <RichTextEditor
          :content="module.props.subtitle"
          :editable="!isPreviewMode"
          @update:content="onSubtitleUpdate"
        />
      </div>
      <div class="magazine-title" :style="{ color: module.styles.color || '#1f2937', textAlign: module.styles.textAlign || 'center' }">
        <RichTextEditor
          :content="module.props.title"
          :editable="!isPreviewMode"
          @update:content="onTitleUpdate"
        />
      </div>
      <div class="magazine-line" :style="{ margin: (module.styles.textAlign === 'left' ? '16px 0 12px 0' : '16px auto 12px auto') }"></div>
      <div class="magazine-meta" :style="{ textAlign: module.styles.textAlign || 'center' }">
        <span v-if="module.props.showAuthor && module.props.author">{{ module.props.author }}</span>
        <span v-if="module.props.showDate && module.props.date">{{ module.props.date }}</span>
      </div>
    </template>

    <!-- 极简风 -->
    <template v-if="module.props.variant === 'minimal'">
      <div :style="{ color: module.styles.color || '#111827', textAlign: module.styles.textAlign || 'left', fontSize: module.styles.fontSize || '26px', fontWeight: module.styles.fontWeight || '700', lineHeight: module.styles.lineHeight || '1.35' }">
        <RichTextEditor
          :content="module.props.title"
          :editable="!isPreviewMode"
          @update:content="onTitleUpdate"
        />
      </div>
      <div class="minimal-meta" :style="{ textAlign: module.styles.textAlign || 'left' }">
        <span v-if="module.props.showDate && module.props.date">{{ module.props.date }}</span>
        <span v-if="module.props.showAuthor && module.props.author">{{ module.props.author }}</span>
      </div>
    </template>

    <!-- 卡片风 -->
    <template v-if="module.props.variant === 'card'">
      <div class="card-inner" :style="{ backgroundColor: module.styles.backgroundColor || '#1f2937', textAlign: module.styles.textAlign || 'center', borderRadius: module.styles.borderRadius || '12px', border: module.styles.border || 'none' }">
        <div :style="{ color: module.styles.color || '#ffffff' }">
          <RichTextEditor
            :content="module.props.title"
            :editable="!isPreviewMode"
            @update:content="onTitleUpdate"
          />
        </div>
        <p v-if="module.props.subtitle" class="card-subtitle">
          <RichTextEditor
            :content="module.props.subtitle"
            :editable="!isPreviewMode"
            @update:content="onSubtitleUpdate"
          />
        </p>
        <div class="card-meta">
          <span v-if="module.props.showAuthor && module.props.author">{{ module.props.author }}</span>
          <span v-if="module.props.showDate && module.props.date">{{ module.props.date }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.header-module {
  position: relative;
}

.header-title-editor {
  margin: 0 0 8px 0;
}

.header-subtitle {
  margin: 0 0 16px 0;
}

.header-meta {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
}

.meta-item:not(:last-child)::after {
  content: '';
  display: inline-block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #d1d5db;
  margin-left: 12px;
}

/* 杂志风 */
.magazine-accent {
  width: 40px;
  height: 4px;
  background: #dc2626;
  border-radius: 2px;
  margin: 0 auto 16px auto;
}

.variant-magazine .magazine-subtitle {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0 0 8px 0;
}

.variant-magazine .magazine-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.3;
  margin: 0;
  letter-spacing: -0.5px;
}

.magazine-line {
  width: 60px;
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
}

.magazine-meta {
  font-size: 13px;
  color: #9ca3af;
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 极简风 */
.minimal-meta {
  font-size: 13px;
  color: #9ca3af;
  display: flex;
  gap: 16px;
}

/* 卡片风 */
.card-inner {
  padding: 32px 24px;
}

.card-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.card-meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
