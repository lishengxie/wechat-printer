<script setup lang="ts">
import { computed } from 'vue'
import type { Module } from '@/types/document'
import TextModule from './modules/TextModule.vue'
import ImageModule from './modules/ImageModule.vue'
import DividerModule from './modules/DividerModule.vue'
import ButtonModule from './modules/ButtonModule.vue'
import ContainerModule from './modules/ContainerModule.vue'
import HeaderModule from './modules/HeaderModule.vue'
import FooterModule from './modules/FooterModule.vue'
import TocModule from './modules/TocModule.vue'
import HeadingModule from './modules/HeadingModule.vue'

interface Props {
  module: Module
}

const props = defineProps<Props>()

// 模块类型映射
const componentMap: Record<string, any> = {
  text: TextModule,
  image: ImageModule,
  divider: DividerModule,
  button: ButtonModule,
  container: ContainerModule,
  header: HeaderModule,
  footer: FooterModule,
  toc: TocModule,
  heading: HeadingModule
}

const currentComponent = computed(() => componentMap[props.module.type])
</script>

<template>
  <component
    :is="currentComponent"
    :module="module"
  />
</template>
