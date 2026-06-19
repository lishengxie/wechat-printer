<script setup lang="ts">
import type { Module, HeaderModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: HeaderModuleProps }
}

defineProps<Props>()
</script>

<template>
  <div class="header-module" :class="`variant-${module.props.variant}`">
    <!-- 默认风格 -->
    <template v-if="module.props.variant === 'default'">
      <h1
        class="header-title"
        :style="{
          fontSize: module.styles.fontSize || '24px',
          color: module.styles.color || '#1f2937',
          fontWeight: module.styles.fontWeight || 'bold',
          textAlign: module.styles.textAlign || 'center',
          margin: '0 0 8px 0',
          lineHeight: '1.4'
        }"
      >
        {{ module.props.title }}
      </h1>
      <p
        v-if="module.props.subtitle"
        class="header-subtitle"
        :style="{
          fontSize: '15px',
          color: '#6b7280',
          textAlign: module.styles.textAlign || 'center',
          margin: '0 0 16px 0',
          lineHeight: '1.6'
        }"
      >
        {{ module.props.subtitle }}
      </p>
      <div
        class="header-meta"
        :style="{
          textAlign: module.styles.textAlign || 'center',
          fontSize: '13px',
          color: '#9ca3af'
        }"
      >
        <span v-if="module.props.showAuthor && module.props.author" class="meta-item">
          {{ module.props.author }}
        </span>
        <span v-if="module.props.showDate && module.props.date" class="meta-item">
          {{ module.props.date }}
        </span>
      </div>
    </template>

    <!-- 杂志封面风 -->
    <template v-if="module.props.variant === 'magazine'">
      <div class="magazine-accent"></div>
      <p
        v-if="module.props.subtitle"
        class="magazine-subtitle"
        :style="{
          textAlign: module.styles.textAlign || 'center',
          color: '#dc2626'
        }"
      >
        {{ module.props.subtitle }}
      </p>
      <h1
        class="magazine-title"
        :style="{
          color: module.styles.color || '#1f2937',
          textAlign: module.styles.textAlign || 'center'
        }"
      >
        {{ module.props.title }}
      </h1>
      <div
        class="magazine-line"
        :style="{
          margin: module.styles.textAlign === 'left' ? '16px 0 12px 0' : '16px auto 12px auto'
        }"
      ></div>
      <div
        class="magazine-meta"
        :style="{
          textAlign: module.styles.textAlign || 'center'
        }"
      >
        <span v-if="module.props.showAuthor && module.props.author">
          {{ module.props.author }}
        </span>
        <span v-if="module.props.showDate && module.props.date">
          {{ module.props.date }}
        </span>
      </div>
    </template>

    <!-- 极简风 -->
    <template v-if="module.props.variant === 'minimal'">
      <h1
        class="minimal-title"
        :style="{
          color: module.styles.color || '#111827',
          textAlign: module.styles.textAlign || 'left'
        }"
      >
        {{ module.props.title }}
      </h1>
      <div
        class="minimal-meta"
        :style="{
          textAlign: module.styles.textAlign || 'left'
        }"
      >
        <span v-if="module.props.showDate && module.props.date">{{ module.props.date }}</span>
        <span v-if="module.props.showAuthor && module.props.author">{{ module.props.author }}</span>
      </div>
    </template>

    <!-- 卡片风 -->
    <template v-if="module.props.variant === 'card'">
      <div
        class="card-inner"
        :style="{
          backgroundColor: module.styles.backgroundColor || '#1f2937',
          textAlign: module.styles.textAlign || 'center'
        }"
      >
        <h1
          class="card-title"
          :style="{
            color: module.styles.color || '#ffffff'
          }"
        >
          {{ module.props.title }}
        </h1>
        <p
          v-if="module.props.subtitle"
          class="card-subtitle"
        >
          {{ module.props.subtitle }}
        </p>
        <div class="card-meta">
          <span v-if="module.props.showAuthor && module.props.author">
            {{ module.props.author }}
          </span>
          <span v-if="module.props.showDate && module.props.date">
            {{ module.props.date }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.header-module {
  position: relative;
}

/* 默认 */
.header-title {
  word-break: break-word;
}
.header-subtitle {
  word-break: break-word;
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
.minimal-title {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0 0 12px 0;
  letter-spacing: -0.3px;
}
.minimal-meta {
  font-size: 13px;
  color: #9ca3af;
  display: flex;
  gap: 16px;
}

/* 卡片风 */
.card-inner {
  padding: 32px 24px;
  border-radius: 12px;
}
.card-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 8px 0;
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
