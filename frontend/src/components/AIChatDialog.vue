<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { apiAI } from '@/services/api'
import { useDocumentStore } from '@/stores/document'
import { moduleRegistry } from '@/registry/modules'
import type { Module } from '@/types/document'

const props = defineProps<{
  visible: boolean
  selectedModule: Module | null
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const documentStore = useDocumentStore()

const moduleTypeName = computed(() => {
  if (!props.selectedModule) return ''
  const reg = moduleRegistry[props.selectedModule.type]
  return reg ? reg.name : props.selectedModule.type
})

const modulePreviewText = computed(() => {
  const m = props.selectedModule
  if (!m) return ''
  const text = (m.props as any)?.content || (m.props as any)?.text || (m.props as any)?.title || ''
  return text ? text.slice(0, 30) : ''
})

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  suggestedModule?: Module
  suggestedPageStyles?: Record<string, string>
  mode?: string
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const error = ref('')
const messagesRef = ref<HTMLElement | null>(null)

const mode = ref<'style' | 'full' | 'page'>('full')

// 当前模式：选中模块时为模块模式，未选中时为页面模式
const isPageMode = computed(() => !props.selectedModule)

// Reset messages when selected module changes
watch(() => props.selectedModule?.id, () => {
  if (props.visible) {
    messages.value = []
    error.value = ''
  }
})

// 切换选中/未选中时重置模式
watch(isPageMode, (pageMode) => {
  if (pageMode) {
    mode.value = 'page'
  } else {
    mode.value = 'full'
  }
})

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  inputText.value = ''
  error.value = ''

  messages.value.push({ role: 'user', text })

  loading.value = true
  try {
    const result = await apiAI.chat({
      prompt: text,
      module: props.selectedModule || undefined,
      mode: mode.value
    })

    if (isPageMode.value && result.updated_page_styles) {
      // 页面模式
      let pageStyles: Record<string, string> = {}
      try {
        pageStyles = JSON.parse(result.updated_page_styles)
      } catch {
        // ignore parse errors
      }

      messages.value.push({
        role: 'assistant',
        text: result.explanation,
        suggestedPageStyles: pageStyles,
        mode: mode.value
      })
    } else {
      // 模块模式
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
    }
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
  const merged = {
    ...suggestedModule,
    id: selected.id,
    ...(mode.value === 'style' ? { type: selected.type } : {})
  }
  documentStore.replaceModule(merged)
}

function applyPageStyles(pageStyles: Record<string, string>) {
  if (!pageStyles) return
  documentStore.updatePageStyles(pageStyles)
}
</script>

<template>
  <div class="ai-panel" :class="{ expanded: visible }">
    <div class="ai-panel-header" @click="emit('toggle')">
      <span>AI 排版助手</span>
      <button class="ai-panel-toggle" @click.stop="emit('toggle')">{{ visible ? '▾' : '▸' }}</button>
    </div>

    <div v-show="visible" class="ai-panel-body">
      <!-- 当前选中模块信息 -->
      <div v-if="selectedModule" class="selected-module-info">
        <span class="smi-label">选中模块：</span>
        <el-tag size="small">{{ moduleTypeName }}</el-tag>
        <span class="smi-preview">{{ modulePreviewText }}</span>
      </div>
      <div v-else class="selected-module-info page-mode">
        <span class="smi-label">🎨 页面配色模式 — 描述你想要的页面风格</span>
      </div>

      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0 && !loading" class="chat-empty">
          <p v-if="selectedModule">选择一个模块后，描述你想要的排版效果</p>
          <p v-else>描述你想要的页面整体配色风格，例如"暖色调米色背景"</p>
        </div>
        <div v-for="(msg, i) in messages" :key="i" :class="['message', msg.role]">
          <div class="message-bubble">{{ msg.text }}</div>
          <!-- 模块修改建议 -->
          <div v-if="msg.suggestedModule" class="suggestion-card">
            <el-tag size="small" type="info">{{ msg.suggestedModule.type }}</el-tag>
            <span class="suggestion-text">建议修改此模块</span>
            <button class="apply-btn" @click="applyChanges(msg.suggestedModule!)">✓ 应用修改</button>
          </div>
          <!-- 页面样式建议 -->
          <div v-if="msg.suggestedPageStyles" class="suggestion-card">
            <span v-if="msg.suggestedPageStyles.backgroundColor" class="page-style-preview">
              <span class="color-swatch" :style="{ background: msg.suggestedPageStyles.backgroundColor }"></span>
              背景色: {{ msg.suggestedPageStyles.backgroundColor }}
            </span>
            <button class="apply-btn" @click="applyPageStyles(msg.suggestedPageStyles!)">✓ 应用配色</button>
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
        <el-radio-group v-model="mode" size="small" :disabled="isPageMode">
          <el-radio-button value="full">自由对话</el-radio-button>
          <el-radio-button value="style">仅样式</el-radio-button>
        </el-radio-group>
      </div>

      <div class="chat-input">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="2"
          :placeholder="selectedModule ? '描述你想要的排版效果...' : '描述你想要的页面配色风格...'"
          @keydown.enter.prevent="sendMessage"
        />
        <el-button type="primary" :loading="loading" @click="sendMessage" class="send-btn">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-panel {
  border-top: 1px solid var(--el-border-color-light);
  background: #fff;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  background: var(--el-bg-color);
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.ai-panel-header:hover {
  background: var(--el-fill-color-light);
}

.ai-panel-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.ai-panel-toggle:hover {
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-primary);
}

.ai-panel-body {
  display: flex;
  flex-direction: column;
  padding: 8px 16px 12px;
  min-height: 0;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  text-align: center;
  padding: 24px;
}

.message { display: flex; flex-direction: column; }
.message.user { justify-content: flex-end; }
.message.assistant { justify-content: flex-start; }
.message-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
.message.user .message-bubble { background: var(--el-color-primary-light-8); color: var(--el-text-color-primary); border-bottom-right-radius: 4px; }
.message.assistant .message-bubble { background: var(--el-fill-color-light); color: var(--el-text-color-primary); border-bottom-left-radius: 4px; }

.error-bar { margin-bottom: 12px; }
.chat-mode { margin-bottom: 12px; }
.chat-input { display: flex; gap: 8px; }
.chat-input .el-input { flex: 1; }
.send-btn { align-self: flex-end; }

.loading-dots { text-align: center; font-size: 24px; color: var(--el-text-color-placeholder); letter-spacing: 4px; }
.selected-module-info { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--el-fill-color-light); border-radius: 6px; margin-bottom: 8px; font-size: 12px; flex-shrink: 0; }
.selected-module-info.page-mode { background: #fef3c7; color: #92400e; }
.smi-label { color: var(--el-text-color-secondary); flex-shrink: 0; }
.selected-module-info.page-mode .smi-label { color: #92400e; }
.smi-preview { color: var(--el-text-color-regular); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.suggestion-card { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
.suggestion-text { font-size: 12px; color: var(--el-text-color-secondary); }
.apply-btn { padding: 2px 10px; font-size: 12px; border: 1px solid var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); border-radius: 4px; cursor: pointer; white-space: nowrap; }
.apply-btn:hover { background: var(--el-color-primary-light-8); }
.page-style-preview { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--el-text-color-regular); }
.color-swatch { display: inline-block; width: 16px; height: 16px; border-radius: 3px; border: 1px solid #d1d5db; flex-shrink: 0; }
</style>
