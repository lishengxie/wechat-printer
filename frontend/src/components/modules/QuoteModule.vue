<script setup lang="ts">
import { inject, ref, computed, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useDocumentStore } from '@/stores/document'
import type { Module, QuoteModuleProps } from '@/types/document'

interface Props {
  module: Module & { props: QuoteModuleProps }
}

const props = defineProps<Props>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))

const editor = useEditor({
  content: props.module.props.content,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [2, 3]
      },
      code: true,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      bulletList: true,
      orderedList: true,
      history: {
        depth: 50
      }
    }),
    TextStyle,
    Color,
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
  }
})

// 监听预览模式变化
watch(isPreviewMode, (val) => {
  editor.value?.setEditable(!val)
})

// 监听外部内容变化
watch(() => props.module.props.content, (newContent) => {
  if (editor.value && editor.value.getHTML() !== newContent) {
    editor.value.commands.setContent(newContent, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '16px 20px',
  backgroundColor: props.module.styles.backgroundColor || '#f8fafc',
  borderLeft: props.module.styles.borderLeft || '4px solid #3b82f6',
  borderRadius: props.module.styles.borderRadius || '0 8px 8px 0',
  margin: props.module.styles.margin || '0 0 16px 0',
  fontFamily: props.module.styles.fontFamily || undefined
}))

const editorStyle = computed(() => ({
  fontSize: props.module.styles.fontSize || '15px',
  color: props.module.styles.color || '#4b5563',
  fontWeight: props.module.styles.fontWeight || 'normal',
  fontStyle: (props.module.styles.fontStyle || 'italic') as any,
  lineHeight: props.module.styles.lineHeight || '1.8',
  textAlign: props.module.styles.textAlign || ('left' as any)
}))

const authorStyle = computed(() => ({
  fontSize: '13px',
  color: '#9ca3af',
  margin: '8px 0 0 0',
  textAlign: 'right' as any
}))

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  editor.value?.chain().focus().insertContent(text).run()
}

function shouldShowBubbleMenu({ editor }: { editor: any }) {
  if (isPreviewMode.value) return false
  if (!editor) return false
  if (editor.state.selection.empty) return false
  return true
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

function toggleHeading(level: 2 | 3) {
  editor.value?.chain().focus().toggleHeading({ level }).run()
}

function toggleBulletList() {
  editor.value?.chain().focus().toggleBulletList().run()
}

function toggleOrderedList() {
  editor.value?.chain().focus().toggleOrderedList().run()
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

function setTextColor(event: Event) {
  const color = (event.target as HTMLInputElement).value
  editor.value?.chain().focus().setColor(color).run()
}

function undo() {
  editor.value?.chain().focus().undo().run()
}

function redo() {
  editor.value?.chain().focus().redo().run()
}
</script>

<template>
  <div class="quote-module" :style="containerStyle">
    <div v-if="editor" class="editor-wrapper" :style="editorStyle">
      <BubbleMenu
        :editor="editor"
        :should-show="shouldShowBubbleMenu"
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
            class="toolbar-btn"
            :class="{ active: editor.isActive('heading', { level: 2 }) }"
            @click="toggleHeading(2)"
            title="二级标题"
          >
            <span style="font-weight: bold; font-size: 14px;">H2</span>
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('heading', { level: 3 }) }"
            @click="toggleHeading(3)"
            title="三级标题"
          >
            <span style="font-weight: bold; font-size: 12px;">H3</span>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-group">
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('bulletList') }"
            @click="toggleBulletList"
            title="无序列表"
          >
            <span style="font-size: 16px;">&#8226;</span>
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('orderedList') }"
            @click="toggleOrderedList"
            title="有序列表"
          >
            <span style="font-size: 14px; font-weight: bold;">1.</span>
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
            <span style="font-size: 14px;">&#128279;</span>
          </button>
          <button
            v-if="editor.isActive('link')"
            class="toolbar-btn active"
            @click="unsetLink"
            title="取消链接"
          >
            <span style="font-size: 14px;">&#128279;</span>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-group">
          <input
            type="color"
            class="color-input"
            :value="editor.getAttributes('textStyle').color || '#000000'"
            @input="setTextColor"
            title="文字颜色"
          />
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-group">
          <button class="toolbar-btn" @click="undo" title="撤销">
            <span style="font-size: 14px;">&#8630;</span>
          </button>
          <button class="toolbar-btn" @click="redo" title="重做">
            <span style="font-size: 14px;">&#8631;</span>
          </button>
        </div>
      </BubbleMenu>
      <EditorContent
        :editor="editor"
        class="editor-content"
        @paste="handlePaste"
      />
    </div>
    <p v-if="module.props.author" :style="authorStyle">—— {{ module.props.author }}</p>
  </div>
</template>

<style scoped>
.quote-module {
  min-height: 24px;
}

.editor-wrapper {
  position: relative;
}

.editor-content {
  outline: none;
}

.editor-content :deep(p) {
  margin: 0;
  word-break: break-word;
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

.editor-content :deep(h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 16px 0 8px 0;
  color: #111827;
}

.editor-content :deep(h3) {
  font-size: 1.25em;
  font-weight: bold;
  margin: 12px 0 6px 0;
  color: #1f2937;
}

.editor-content :deep(ul),
.editor-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.editor-content :deep(li) {
  margin: 4px 0;
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

.color-input {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: 1px solid #4b5563;
  border-radius: 3px;
}
</style>
