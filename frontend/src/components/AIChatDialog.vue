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
  <div class="ai-panel" :class="{ collapsed: !visible }">
    <!-- Toggle bar -->
    <div class="ai-toggle" @click="emit('toggle')">
      <div class="ai-toggle-left">
        <span class="ai-icon">🤖</span>
        <span class="ai-title">AI 排版助手</span>
        <span v-if="selectedModule" class="ai-module-badge">{{ moduleLabel(selectedModule) }}</span>
      </div>
      <div class="ai-toggle-right">
        <span class="ai-hint">{{ visible ? '点击收起' : '点击展开' }}</span>
        <span class="ai-arrow" :class="{ up: visible }">▼</span>
      </div>
    </div>

    <!-- Content -->
    <Transition name="panel-slide">
      <div v-if="visible" class="ai-body">
        <!-- Mode Tabs -->
        <div class="ai-mode-tabs">
          <button
            class="ai-mode-tab"
            :class="{ active: mode === 'full' }"
            @click="mode = 'full'"
          >
            <span class="tab-label">完整模式</span>
            <span class="tab-desc">可修改任意内容</span>
          </button>
          <button
            class="ai-mode-tab"
            :class="{ active: mode === 'style' }"
            @click="mode = 'style'"
          >
            <span class="tab-label">样式模式</span>
            <span class="tab-desc">仅修改样式和内容</span>
          </button>
        </div>
        <!-- Messages -->
        <div class="ai-messages" ref="messagesRef">
          <div v-if="messages.length === 0 && !loading" class="ai-welcome">
            <p>选中一个模块，然后告诉我你想怎么调整排版效果。</p>
            <p class="ai-examples">例如：「改为渐变色背景」「加大字号并居中」「改成卡片风格」</p>
          </div>

          <div v-for="(msg, idx) in messages" :key="idx" class="msg-row" :class="msg.role">
            <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
            <div class="msg-body">
              <div v-if="msg.role === 'assistant' && msg.mode" class="msg-mode-label">
                {{ msg.mode === 'style' ? '🎨 样式模式' : '🔧 完整模式' }}
              </div>
              <div class="msg-text">{{ msg.text }}</div>
              <div v-if="msg.role === 'assistant' && msg.suggestedModule" class="msg-actions">
                <button class="apply-btn" @click="applyChanges(msg.suggestedModule!)">✓ 应用修改</button>
              </div>
            </div>
          </div>

          <div v-if="loading" class="msg-row assistant">
            <div class="msg-avatar">🤖</div>
            <div class="msg-body">
              <div class="loading-dots"><span>.</span><span>.</span><span>.</span></div>
            </div>
          </div>

          <div v-if="error" class="msg-row error-row">
            <div class="msg-avatar">⚠️</div>
            <div class="msg-body">
              <div class="msg-text error-text">{{ error }}</div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="ai-input-row">
          <textarea
            v-model="inputText"
            class="ai-input"
            placeholder="描述你想要的排版效果..."
            :disabled="loading || !selectedModule"
            @keydown="handleKeydown"
          ></textarea>
          <button
            class="send-btn"
            :disabled="!inputText.trim() || loading || !selectedModule"
            @click="sendMessage"
          >
            <span v-if="loading" class="btn-spin">⏳</span>
            <span v-else>发送</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ai-panel {
  border-top: 1px solid #e5e7eb;
  background: #fff;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.ai-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 16px;
  cursor: pointer;
  user-select: none;
  background: #fafafa;
  border-bottom: 1px solid #e5e7eb;
}

.ai-toggle:hover {
  background: #f3f4f6;
}

.ai-toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-icon { font-size: 16px; }
.ai-title { font-size: 13px; font-weight: 600; color: #111827; }

.ai-module-badge {
  font-size: 11px;
  font-weight: 600;
  color: #7c3aed;
  background: #f5f3ff;
  padding: 2px 8px;
  border-radius: 999px;
}

.ai-toggle-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-hint { font-size: 11px; color: #9ca3af; }
.ai-arrow { font-size: 10px; color: #9ca3af; transition: transform 0.2s; }
.ai-arrow.up { transform: rotate(180deg); }

.ai-body {
  display: flex;
  flex-direction: column;
  height: 260px;
  overflow: hidden;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: height 0.25s ease;
  overflow: hidden;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  height: 0;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-welcome {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.8;
}

.ai-examples {
  font-size: 12px;
  color: #d1d5db;
  margin-top: 4px;
}

.msg-row {
  display: flex;
  gap: 8px;
  max-width: 90%;
}

.msg-row.user {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.msg-row.assistant {
  align-self: flex-start;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  background: #f3f4f6;
}

.msg-row.user .msg-avatar { background: #ede9fe; }

.msg-body { max-width: 100%; }

.msg-text {
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  background: #f3f4f6;
  padding: 8px 12px;
  border-radius: 10px;
  word-break: break-word;
}

.msg-row.user .msg-text {
  background: #7c3aed;
  color: #fff;
  border-bottom-right-radius: 3px;
}

.msg-row.assistant .msg-text {
  border-bottom-left-radius: 3px;
}

.msg-actions { margin-top: 6px; }

.apply-btn {
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.apply-btn:hover { opacity: 0.9; }

.error-row .msg-text { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.loading-dots { display: flex; gap: 1px; padding: 8px 12px; background: #f3f4f6; border-radius: 10px; border-bottom-left-radius: 3px; }
.loading-dots span { font-size: 22px; line-height: 1; color: #7c3aed; animation: bounce 1.4s infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { opacity: 0; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}

.ai-mode-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 16px 0;
  background: #fafafa;
  flex-shrink: 0;
}

.ai-mode-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.ai-mode-tab:hover {
  border-color: #c4b5fd;
}

.ai-mode-tab.active {
  border-color: #7c3aed;
  background: #f5f3ff;
}

.tab-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.ai-mode-tab.active .tab-label {
  color: #7c3aed;
}

.tab-desc {
  font-size: 10px;
  color: #9ca3af;
}

.ai-mode-tab.active .tab-desc {
  color: #a78bfa;
}

.msg-mode-label {
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.ai-input-row {
  display: flex;
  gap: 8px;
  padding: 8px 16px 12px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: #fafafa;
}

.ai-input {
  flex: 1;
  height: 36px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  resize: none;
  font-family: inherit;
}

.ai-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1); }
.ai-input:disabled { background: #f9fafb; cursor: not-allowed; }

.send-btn {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) { opacity: 0.9; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
