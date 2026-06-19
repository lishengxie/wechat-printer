<script setup lang="ts">
import { inject, ref, computed, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useDocumentStore } from '@/stores/document'
import type { Module, TextModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: TextModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))

const showFloatingToolbar = ref(false)

const editor = useEditor({
  content: props.module.props.content,
  extensions: [
    StarterKit.configure({
      heading: false, // 禁用标题，保持文本简单
      code: true,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      history: {
        depth: 50
      }
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank'
      }
    })
  ],
  editable: !isPreviewMode.value,
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    if (html !== props.module.props.content) {
      documentStore.updateModuleProps(props.module.id, { content: html })
    }
  },
  onSelectionUpdate: () => {
    showFloatingToolbar.value = editor.value ? !editor.value.state.selection.empty : false
  }
})

// 监听预览模式变化
watch(isPreviewMode, (val) => {
  editor.value?.setEditable(!val)
})

// 监听外部内容变化（undo/redo 等）
watch(() => props.module.props.content, (newContent) => {
  if (editor.value && editor.value.getHTML() !== newContent) {
    editor.value.commands.setContent(newContent, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '0',
  backgroundColor: props.module.styles.backgroundColor || 'transparent',
  borderRadius: props.module.styles.borderRadius || '0',
  border: props.module.styles.border || 'none',
  margin: props.module.styles.margin || '0 0 16px 0',
  fontFamily: props.module.styles.fontFamily || undefined
}))

const editorStyle = computed(() => ({
  fontSize: props.module.styles.fontSize || '16px',
  color: props.module.styles.color || '#333333',
  fontWeight: props.module.styles.fontWeight || 'normal',
  lineHeight: props.module.styles.lineHeight || '1.6',
  textAlign: props.module.styles.textAlign || ('left' as any)
}))

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  editor.value?.chain().focus().insertContent(text).run()
}

function toggleBold() {
  editor.value?.chain().focus().toggleBold().run()
}

function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run()
}

function toggleStrike() {
  editor.value?.chain().focus().toggleStrike().run()
}

function toggleCode() {
  editor.value?.chain().focus().toggleCode().run()
}

function setLink() {
  const previousUrl = editor.value?.getAttributes('link').href
  const url = window.prompt('输入链接地址', previousUrl || 'https://')
  if (url === null) return
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function unsetLink() {
  editor.value?.chain().focus().unsetLink().run()
}
</script>

<template>
  <div class="text-module" :style="containerStyle">
    <div v-if="module.props.icon" class="text-icon-row">
      <span class="text-icon">{{ module.props.icon }}</span>
    </div>
    <div v-if="editor" class="editor-wrapper" :style="editorStyle">
      <BubbleMenu
        :editor="editor"
        v-if="!isPreviewMode && showFloatingToolbar"
        :tippy-options="{ duration: 150, placement: 'top' }"
        class="format-toolbar"
      >
        <div class="toolbar-group">
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('bold') }"
            @click="toggleBold"
            title="加粗"
          >
            <strong>B</strong>
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('italic') }"
            @click="toggleItalic"
            title="斜体"
          >
            <em>I</em>
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('strike') }"
            @click="toggleStrike"
            title="删除线"
          >
            <span style="text-decoration: line-through;">S</span>
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('code') }"
            @click="toggleCode"
            title="行内代码"
          >
            <span style="font-family: monospace;">&lt;/&gt;</span>
          </button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
          <button
            v-if="!editor.isActive('link')"
            class="toolbar-btn"
            @click="setLink"
            title="插入链接"
          >
            🔗
          </button>
          <button
            v-if="editor.isActive('link')"
            class="toolbar-btn active"
            @click="unsetLink"
            title="取消链接"
          >
            🔗
          </button>
        </div>
      </BubbleMenu>
      <EditorContent
        :editor="editor"
        class="editor-content"
        @paste="handlePaste"
      />
    </div>
  </div>
</template>

<style scoped>
.text-module {
  min-height: 24px;
  position: relative;
}

.text-icon-row {
  margin-bottom: 4px;
}

.text-icon {
  font-size: 20px;
  line-height: 1;
}

.editor-wrapper {
  position: relative;
}

.editor-content {
  outline: none;
  min-height: 20px;
}

.editor-content :deep(p) {
  margin: 0;
  word-break: break-word;
}

.editor-content :deep(p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.editor-content :deep(code) {
  background: #f3f4f6;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.9em;
  color: #dc2626;
}

.editor-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
}

.format-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: #1f2937;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 1000;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #4b5563;
  margin: 0 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #d1d5db;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: #374151;
  color: #fff;
}

.toolbar-btn.active {
  background: #3b82f6;
  color: #fff;
}
</style>
