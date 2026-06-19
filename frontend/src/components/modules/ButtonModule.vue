<script setup lang="ts">
import { computed } from 'vue'
import type { Module, ButtonModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: ButtonModuleProps }
}

const props = defineProps<Props>()

const containerStyle = computed(() => ({
  textAlign: (props.module.styles.textAlign || 'center') as any,
  padding: props.module.styles.padding || '0',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '0',
  border: props.module.styles.border || 'none',
  margin: props.module.styles.margin || '12px 0'
}))

const sizeClasses = {
  small: 'px-4 py-1 text-sm',
  medium: 'px-6 py-2',
  large: 'px-8 py-3 text-lg'
}
</script>

<template>
  <div class="button-module" :style="containerStyle">
    <a
      :href="module.props.link"
      class="inline-block rounded text-center no-underline transition-opacity hover:opacity-90"
      :class="sizeClasses[module.props.size]"
      :style="{
        backgroundColor: module.styles.backgroundColor || '#3b82f6',
        color: module.styles.color || '#ffffff',
        borderRadius: module.styles.borderRadius || '6px',
        fontSize: module.styles.fontSize
      }"
    >
      {{ module.props.text }}
    </a>
  </div>
</template>
