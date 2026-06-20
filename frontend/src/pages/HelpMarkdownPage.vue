<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import helpDoc from '@/assets/help/markdown-import.md?raw'

const html = computed(() => marked.parse(helpDoc, { async: false }) as string)
</script>

<template>
  <div class="help-page">
    <div class="help-doc" v-html="html"></div>
  </div>
</template>

<style scoped>
.help-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 8px 0 32px;
}
.help-doc {
  background: var(--el-bg-color);
  padding: 32px 40px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-primary);
  line-height: 1.7;
}
.help-doc :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}
.help-doc :deep(h2) {
  font-size: 18px;
  font-weight: 600;
  margin: 28px 0 12px;
}
.help-doc :deep(h3) {
  font-size: 15px;
  font-weight: 600;
  margin: 20px 0 8px;
  color: var(--el-text-color-regular);
}
.help-doc :deep(p) {
  margin: 8px 0;
}
.help-doc :deep(ul),
.help-doc :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}
.help-doc :deep(li) {
  margin: 4px 0;
}
.help-doc :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 3px solid var(--el-color-primary);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}
.help-doc :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
}
.help-doc :deep(pre) {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px 16px;
  overflow-x: auto;
  margin: 12px 0;
}
.help-doc :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 13px;
}
.help-doc :deep(table) {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
}
.help-doc :deep(th),
.help-doc :deep(td) {
  border: 1px solid var(--el-border-color-light);
  padding: 8px 12px;
  text-align: left;
  font-size: 14px;
}
.help-doc :deep(th) {
  background: var(--el-fill-color-light);
  font-weight: 600;
}
.help-doc :deep(hr) {
  border: none;
  border-top: 1px solid var(--el-border-color-light);
  margin: 24px 0;
}
.help-doc :deep(strong) {
  font-weight: 600;
}
</style>
