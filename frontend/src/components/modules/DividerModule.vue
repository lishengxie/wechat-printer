<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import type { Module, DividerModuleProps } from '@/types/document'
import { renderDivider } from '@/renderers/divider'

interface Props {
  module: Module & { props: DividerModuleProps }
}

const props = defineProps<Props>()
const isPreviewMode = inject('isPreviewMode', ref(false))
const previewHtml = computed(() => renderDivider(props.module))
</script>

<template>
  <div v-if="isPreviewMode" v-html="previewHtml"></div>
  <div v-else class="divider-module">
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
