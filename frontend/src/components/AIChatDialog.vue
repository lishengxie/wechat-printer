<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { apiAI } from '@/services/api'
import type { Module } from '@/types/document'

const props = defineProps<{
  visible: boolean
  selectedModule: Module | null
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const documentStore = useDocumentStore()

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  suggestedModule?: Module
  mode?: string
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const error = ref('')
const messagesRef = ref<HTMLElement | null>(null)

const mode = ref<'style' | 'full'>('full')

function moduleLabel(mod: Module | null): string {
  if (!mod) return ''
  const labels: Record<string, string> = {
    header: '页首', footer: '页尾', text: '文本',
    image: '图片', button: '按钮', divider: '分割线',
    container: '容器', toc: '目录', heading: '章节标题'
  }
  const base = labels[mod.type] || mod.type
  const p = mod.props as any
  if (mod.type === 'text' && p.content) {
    const preview = p.content.replace(/<[^>]+>/g, '').trim().substring(0, 14)
    return preview ? `${preview}` : base
  }
  if (mod.type === 'header' && p.title) return p.title.substring(0, 14)
  if (mod.type === 'button' && p.text) return p.text
  if (mod.type === 'footer' && p.text) return p.text.substring(0, 14)
  if (mod.type === 'image' && p.src) {
    const fn = p.src.split('/').pop() || ''
    return fn.substring(0, 14) || base
  }
  if (mod.type === 'toc' && p.title) return p.title
  if (mod.type === 'heading' && p.text) return p.text.substring(0, 14)
  return base
}

// Reset messages when selected module changes
watch(() => props.selectedModule?.id, () => {
  if (props.visible) {
    messages.value = []
    error.value = ''
  }
})

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value || !props.selectedModule) return

  inputText.value = ''
  error.value = ''

  messages.value.push({ role: 'user', text })

  loading.value = true
  try {
    const result = await apiAI.chat({
      prompt: text,
      module: props.selectedModule,
      mode: mode.value
    })

    let updatedModule: Module | undefined
    try {
      updatedModule = JSON.parse(result.updated_module)
    } catch {
      // If parsing fails, still show the explanation
    }

    messages.value.push({
      role: 'assistant',
      text: result.explanation,
      suggestedModule: updatedModule,
      mode: mode.value
    })
  } catch (e: any) {
    error.value = e.message || 'AI 请求失败，请重试'
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function applyChanges(suggestedModule: Module) {
  if (!suggestedModule) return
  const selected = props.selectedModule
  if (!selected) return
  // 样式模式下强制保持模块类型不变
  const merged = {
    ...suggestedModule,
    id: selected.id,
    ...(mode.value === 'style' ? { type: selected.type } : {})
  }
  documentStore.replaceModule(merged)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    title="AI 排版助手"
    width="480px"
    @update:model-value="emit('toggle')"
    :close-on-click-modal="false"
  >
    <div class="chat-messages" ref="messagesRef">
      <div v-for="(msg, i) in messages" :key="i" :class="['message', msg.role]">
        <div class="message-bubble">{{ msg.text }}</div>
        <div v-if="msg.suggestedModule" class="suggestion-card">
          <el-tag size="small" type="info">{{ msg.suggestedModule.type }}</el-tag>
          <span class="suggestion-text">建议添加此模块</span>
        </div>
      </div>
      <div v-if="loading" class="loading-dots">
        <span>.</span><span>.</span><span>.</span>
      </div>
    </div>

    <div v-if="error" class="error-bar">
      <el-alert :title="error" type="error" show-icon :closable="true" @close="error = ''" />
    </div>

    <div class="chat-mode">
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="full">自由对话</el-radio-button>
        <el-radio-button value="style">仅样式</el-radio-button>
      </el-radio-group>
    </div>

    <div class="chat-input">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="2"
        placeholder="描述你想要的排版效果..."
        @keyup.enter.prevent="sendMessage"
      />
      <el-button type="primary" :loading="loading" @click="sendMessage" class="send-btn">
        发送
      </el-button>
    </div>
  </el-dialog>
</template>

<style scoped>
.chat-messages { max-height: 360px; overflow-y: auto; margin-bottom: 16px; display: flex; flex-direction: column; gap: 12px; }
.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.assistant { justify-content: flex-start; }
.message-bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
.message.user .message-bubble { background: var(--el-color-primary-light-8); color: var(--el-text-color-primary); border-bottom-right-radius: 4px; }
.message.assistant .message-bubble { background: var(--el-fill-color-light); color: var(--el-text-color-primary); border-bottom-left-radius: 4px; }
.error-bar { margin-bottom: 12px; }
.chat-mode { margin-bottom: 12px; }
.chat-input { display: flex; gap: 8px; }
.chat-input .el-input { flex: 1; }
.send-btn { align-self: flex-end; }
.loading-dots { text-align: center; font-size: 24px; color: var(--el-text-color-placeholder); letter-spacing: 4px; }
.suggestion-card { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.suggestion-text { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
