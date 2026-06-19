<script setup lang="ts">
import type { Module, ImageModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: ImageModuleProps }
}

defineProps<Props>()
</script>

<template>
  <div class="image-module" :style="{ margin: module.styles.margin }">
    <img
      v-if="module.props.src"
      :src="module.props.src"
      :alt="module.props.alt"
      class="max-w-full h-auto rounded-lg shadow-sm"
      :style="{
        width: module.props.width || '100%',
        height: module.props.height,
        borderRadius: module.styles.borderRadius || '8px'
      }"
    />
    <div v-else class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-sm">点击上传图片</p>
    </div>
  </div>
</template>

<style scoped>
.image-module {
  margin: 12px 0;
  text-align: center;
}
</style>
