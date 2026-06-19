<script setup lang="ts">
import { computed } from 'vue'
import type { Module, FooterModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: FooterModuleProps }
}

const props = defineProps<Props>()

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '16px',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '0',
  border: props.module.styles.border || 'none',
  margin: props.module.styles.margin || '0 0 16px 0',
  textAlign: (props.module.styles.textAlign || 'center') as any,
  fontFamily: props.module.styles.fontFamily || undefined
}))
</script>

<template>
  <div class="footer-module" :class="`variant-${module.props.variant}`" :style="containerStyle">
    <!-- 默认风格 -->
    <template v-if="module.props.variant === 'default'">
      <hr
        v-if="module.props.showDivider"
        class="footer-divider"
        :style="{
          border: 'none',
          borderTop: '1px solid #e5e7eb',
          margin: '0 0 16px 0'
        }"
      />
      <p
        v-if="module.props.text"
        class="footer-text"
        :style="{
          textAlign: module.styles.textAlign || 'center',
          fontSize: module.styles.fontSize || '13px',
          color: module.styles.color || '#6b7280',
          margin: '0 0 8px 0',
          lineHeight: '1.6'
        }"
      >
        {{ module.props.text }}
      </p>
      <p
        v-if="module.props.copyright"
        class="footer-copyright"
        :style="{
          textAlign: module.styles.textAlign || 'center',
          fontSize: '12px',
          color: '#9ca3af',
          margin: 0
        }"
      >
        {{ module.props.copyright }}
      </p>
    </template>

    <!-- 简约风 -->
    <template v-if="module.props.variant === 'simple'">
      <div
        class="simple-inner"
        :style="{
          textAlign: module.styles.textAlign || 'center'
        }"
      >
        <div class="simple-line"></div>
        <p
          v-if="module.props.copyright"
          class="simple-copyright"
        >
          {{ module.props.copyright }}
        </p>
      </div>
    </template>

    <!-- 品牌风 -->
    <template v-if="module.props.variant === 'branded'">
      <div
        class="branded-inner"
        :style="{
          backgroundColor: module.styles.backgroundColor || '#f8fafc',
          textAlign: module.styles.textAlign || 'center'
        }"
      >
        <div class="branded-logo">📰</div>
        <p
          v-if="module.props.text"
          class="branded-text"
        >
          {{ module.props.text }}
        </p>
        <p
          v-if="module.props.copyright"
          class="branded-copyright"
        >
          {{ module.props.copyright }}
        </p>
        <div class="branded-social">
          <span class="social-dot"></span>
          <span class="social-dot"></span>
          <span class="social-dot"></span>
        </div>
      </div>
    </template>

    <!-- CTA风 -->
    <template v-if="module.props.variant === 'cta'">
      <div
        class="cta-inner"
        :style="{
          backgroundColor: module.styles.backgroundColor || '#fef2f2',
          textAlign: module.styles.textAlign || 'center'
        }"
      >
        <p
          v-if="module.props.text"
          class="cta-text"
          :style="{
            color: module.styles.color || '#991b1b'
          }"
        >
          {{ module.props.text }}
        </p>
        <button class="cta-btn">
          👍 点赞 · 💬 留言 · ⭐ 收藏
        </button>
        <p
          v-if="module.props.copyright"
          class="cta-copyright"
        >
          {{ module.props.copyright }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.footer-module {
  position: relative;
}

/* 默认 */
.footer-text {
  word-break: break-word;
}

/* 简约 */
.simple-inner {
  padding: 8px 0;
}
.simple-line {
  width: 40px;
  height: 2px;
  background: #d1d5db;
  border-radius: 1px;
  margin: 0 auto 12px auto;
}
.simple-copyright {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

/* 品牌 */
.branded-inner {
  padding: 24px;
  border-radius: 12px;
}
.branded-logo {
  font-size: 28px;
  margin-bottom: 12px;
}
.branded-text {
  font-size: 14px;
  color: #4b5563;
  margin: 0 0 8px 0;
  line-height: 1.6;
}
.branded-copyright {
  font-size: 12px;
  color: #9ca3af;
  margin: 0 0 16px 0;
}
.branded-social {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.social-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
}

/* CTA */
.cta-inner {
  padding: 24px;
  border-radius: 12px;
  border: 1px dashed #fecaca;
}
.cta-text {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 16px 0;
  line-height: 1.6;
}
.cta-btn {
  display: inline-block;
  padding: 10px 24px;
  font-size: 14px;
  color: #ffffff;
  background: #dc2626;
  border: none;
  border-radius: 24px;
  cursor: default;
  margin-bottom: 16px;
}
.cta-copyright {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}
</style>
