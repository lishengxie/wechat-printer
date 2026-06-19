<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { Module } from '@/types/document'
import { moduleRegistry } from '@/registry/modules'

interface Props {
  module: Module
}

const props = defineProps<Props>()

const currentComponent = computed(() => {
  const reg = moduleRegistry[props.module.type]
  return reg ? defineAsyncComponent(reg.component) : null
})
</script>

<template>
  <component
    v-if="currentComponent"
    :is="currentComponent"
    :module="module"
  />
  <div v-else class="unknown-module">
    未知模块类型: {{ module.type }}
  </div>
</template>
