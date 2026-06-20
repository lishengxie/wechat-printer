<script setup lang="ts">
import { ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { FontSize } from '@/extensions/FontSize'

const props = defineProps<{
  content: string
  editable?: boolean
}>()

const emit = defineEmits<{
  'update:content': [value: string]
}>()

const isPreviewMode = !props.editable

const editor = useEditor({
  content: props.content,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      code: true,
      codeBlock: false,
      blockquote: true,
      horizontalRule: false,
      bulletList: true,
      orderedList: true,
      history: { depth: 50 }
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    FontSize,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }
    })
  ],
  editable: props.editable ?? true,
  onUpdate: ({ editor: ed }) => {
    const html = ed.getHTML()
    if (html !== props.content) {
      emit('update:content', html)
    }
  }
})

// Sync content from outside
import { watch, onBeforeUnmount } from 'vue'
watch(() => props.content, (newContent) => {
  if (editor.value && editor.value.getHTML() !== newContent) {
    editor.value.commands.setContent(newContent, false)
  }
})

watch(() => props.editable, (val) => {
  editor.value?.setEditable(val ?? true)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  editor.value?.chain().focus().insertContent(text).run()
}

function shouldShowBubbleMenu({ editor: ed }: { editor: any }) {
  if (isPreviewMode) return false
  if (!ed) return false
  if (ed.state.selection.empty) return false
  return true
}

// Toolbar helpers
function toggleBold() { editor.value?.chain().focus().toggleBold().run() }
function toggleItalic() { editor.value?.chain().focus().toggleItalic().run() }
function toggleStrike() { editor.value?.chain().focus().toggleStrike().run() }
function toggleCode() { editor.value?.chain().focus().toggleCode().run() }
function toggleHeading(level: 2 | 3) { editor.value?.chain().focus().toggleHeading({ level }).run() }
function toggleBulletList() { editor.value?.chain().focus().toggleBulletList().run() }
function toggleOrderedList() { editor.value?.chain().focus().toggleOrderedList().run() }
function toggleBlockquote() { editor.value?.chain().focus().toggleBlockquote().run() }
function setTextAlign(align: 'left' | 'center' | 'right' | 'justify') { editor.value?.chain().focus().setTextAlign(align).run() }
function setFontSize(size: string) { editor.value?.chain().focus().setFontSize(size).run() }
function getCurrentFontSize(): string { return editor.value?.getAttributes('textStyle').fontSize || '16px' }
function setHighlight(color?: string) {
  if (color) editor.value?.chain().focus().setHighlight({ color }).run()
  else editor.value?.chain().focus().toggleHighlight().run()
}
function unsetHighlight() { editor.value?.chain().focus().unsetHighlight().run() }
function clearFormat() { editor.value?.chain().focus().clearNodes().unsetAllMarks().run() }
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
function unsetLink() { editor.value?.chain().focus().unsetLink().run() }
function setTextColor(event: Event) {
  const color = (event.target as HTMLInputElement).value
  editor.value?.chain().focus().setColor(color).run()
}
function undo() { editor.value?.chain().focus().undo().run() }
function redo() { editor.value?.chain().focus().redo().run() }

const fontSizeOptions = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']
</script>

<template>
  <div v-if="editor" class="rich-editor-wrapper">
    <BubbleMenu
      :editor="editor"
      :should-show="shouldShowBubbleMenu"
      :tippy-options="{ duration: 150, placement: 'top' }"
      class="format-toolbar"
    >
      <div class="toolbar-group">
        <button class="toolbar-btn" :class="{ active: editor.isActive('bold') }" @click="toggleBold" title="加粗"><strong>B</strong></button>
        <button class="toolbar-btn" :class="{ active: editor.isActive('italic') }" @click="toggleItalic" title="斜体"><em>I</em></button>
        <button class="toolbar-btn" :class="{ active: editor.isActive('strike') }" @click="toggleStrike" title="删除线"><span style="text-decoration: line-through;">S</span></button>
        <button class="toolbar-btn" :class="{ active: editor.isActive('code') }" @click="toggleCode" title="行内代码"><span style="font-family: monospace;">&lt;/&gt;</span></button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="toggleHeading(2)" title="二级标题"><span style="font-weight: bold; font-size: 14px;">H2</span></button>
        <button class="toolbar-btn" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="toggleHeading(3)" title="三级标题"><span style="font-weight: bold; font-size: 12px;">H3</span></button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn" :class="{ active: editor.isActive('bulletList') }" @click="toggleBulletList" title="无序列表"><span style="font-size: 16px;">&#8226;</span></button>
        <button class="toolbar-btn" :class="{ active: editor.isActive('orderedList') }" @click="toggleOrderedList" title="有序列表"><span style="font-size: 14px; font-weight: bold;">1.</span></button>
        <button class="toolbar-btn" :class="{ active: editor.isActive('blockquote') }" @click="toggleBlockquote" title="引用"><span style="font-size: 16px;">&#10077;</span></button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'left' }) }" @click="setTextAlign('left')" title="左对齐"><span class="align-icon">&#8592;</span></button>
        <button class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'center' }) }" @click="setTextAlign('center')" title="居中"><span class="align-icon">&#8596;</span></button>
        <button class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'right' }) }" @click="setTextAlign('right')" title="右对齐"><span class="align-icon">&#8594;</span></button>
        <button class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'justify' }) }" @click="setTextAlign('justify')" title="两端对齐"><span class="align-icon">&#8660;</span></button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group toolbar-group-select">
        <select class="font-size-select" :value="getCurrentFontSize()" @change="setFontSize(($event.target as HTMLSelectElement).value)" title="字号">
          <option v-for="size in fontSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn" :class="{ active: editor.isActive('highlight') }" @click="setHighlight()" title="文字高亮"><span style="font-size: 14px; text-decoration: underline; text-decoration-color: #fbbf24; text-underline-offset: 2px;">A</span></button>
        <button v-if="editor.isActive('highlight')" class="toolbar-btn" @click="unsetHighlight" title="取消高亮"><span style="font-size: 12px;">&#10005;</span></button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button v-if="!editor.isActive('link')" class="toolbar-btn" @click="setLink" title="插入链接"><span style="font-size: 14px;">&#128279;</span></button>
        <button v-if="editor.isActive('link')" class="toolbar-btn active" @click="unsetLink" title="取消链接"><span style="font-size: 14px;">&#128279;</span></button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <input type="color" class="color-input" :value="editor.getAttributes('textStyle').color || '#000000'" @input="setTextColor" title="文字颜色" />
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn" @click="clearFormat" title="清除格式"><span style="font-size: 13px;">&#9003;</span></button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn" @click="undo" title="撤销"><span style="font-size: 14px;">&#8630;</span></button>
        <button class="toolbar-btn" @click="redo" title="重做"><span style="font-size: 14px;">&#8631;</span></button>
      </div>
    </BubbleMenu>
    <EditorContent
      :editor="editor"
      class="editor-content"
      @paste="handlePaste"
    />
  </div>
</template>

<style scoped>
.rich-editor-wrapper {
  position: relative;
}

.editor-content {
  outline: none;
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

.editor-content :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  margin: 8px 0;
  padding: 4px 16px;
  color: #4b5563;
  font-style: italic;
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

.align-icon {
  font-size: 16px;
  line-height: 1;
}

.font-size-select {
  width: 58px;
  height: 26px;
  padding: 0 4px;
  border: 1px solid #4b5563;
  border-radius: 4px;
  background: #374151;
  color: #d1d5db;
  font-size: 12px;
  cursor: pointer;
  outline: none;
}

.font-size-select:hover {
  border-color: #6b7280;
}

.font-size-select:focus {
  border-color: #3b82f6;
}

.toolbar-group-select {
  padding: 0 2px;
}
</style>
