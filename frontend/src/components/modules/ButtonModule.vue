<script setup lang="ts">
import type { Module, ButtonModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: ButtonModuleProps }
}

defineProps<Props>()

const sizeClasses = {
  small: 'px-4 py-1 text-sm',
  medium: 'px-6 py-2',
  large: 'px-8 py-3 text-lg'
}
</script>

<template>
  <div class="button-module">
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

<style scoped>
.button-module {
  margin: 12px 0;
  text-align: center;
}
</style>
