<script setup lang="ts">
import type { Module, DividerModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: DividerModuleProps }
}

defineProps<Props>()
</script>

<template>
  <div class="divider-module">
    <hr
      class="border-none h-px"
      :style="{
        backgroundColor: module.props.color || '#e5e7eb',
        borderStyle: module.props.style
      }"
    />
  </div>
</template>

<style scoped>
.divider-module {
  margin: 16px 0;
}
</style>
