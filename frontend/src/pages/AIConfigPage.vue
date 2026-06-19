<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiAI } from '@/services/api'
import type { AIConfigData } from '@/services/api'

const config = ref<AIConfigData>({
  api_key: '',
  api_base: '',
  model: ''
})
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const maskedKey = ref(true)

async function loadConfig() {
  loading.value = true
  error.value = ''
  try {
    const data = await apiAI.getConfig()
    config.value = data
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await apiAI.updateConfig(config.value)
    success.value = '配置已保存'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e: any) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>AI 助手配置</h2>
    </div>

    <p v-if="loading" class="status">加载中...</p>
    <p v-else-if="error && !saving" class="status error">{{ error }}</p>

    <div v-else class="config-form">
      <div class="form-group">
        <label>API Key <span class="required">*</span></label>
        <div class="input-wrapper">
          <input
            v-model="config.api_key"
            :type="maskedKey ? 'password' : 'text'"
            placeholder="sk-..."
          />
          <button class="toggle-btn" @click="maskedKey = !maskedKey">
            {{ maskedKey ? '显示' : '隐藏' }}
          </button>
        </div>
        <p class="hint">支持 OpenAI 兼容接口的 API Key</p>
      </div>

      <div class="form-group">
        <label>API 地址</label>
        <input
          v-model="config.api_base"
          type="text"
          placeholder="https://api.openai.com/v1"
        />
        <p class="hint">留空则使用默认值 https://api.openai.com/v1</p>
      </div>

      <div class="form-group">
        <label>模型名称</label>
        <input
          v-model="config.model"
          type="text"
          placeholder="gpt-4o"
        />
        <p class="hint">留空则使用默认值 gpt-4o</p>
      </div>

      <p class="env-hint">提示：也可通过环境变量 <code>LLM_API_KEY</code>、<code>LLM_API_BASE</code>、<code>LLM_MODEL</code> 配置，环境变量优先级高于页面配置。</p>

      <div class="form-actions">
        <p v-if="success" class="success-text">{{ success }}</p>
        <button class="btn-primary" :disabled="saving" @click="saveConfig">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #e5e7eb; }
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: #111827; margin: 0; }

.status { text-align: center; padding: 40px; color: #6b7280; font-size: 14px; }
.error { color: #dc2626; }

.config-form { display: flex; flex-direction: column; gap: 20px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 14px; font-weight: 500; color: #374151; }
.required { color: #dc2626; }
.form-group input {
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.form-group input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.input-wrapper { display: flex; gap: 8px; }
.input-wrapper input { flex: 1; }
.toggle-btn {
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.toggle-btn:hover { background: #e5e7eb; }

.hint { font-size: 12px; color: #9ca3af; margin: 2px 0 0; }
.env-hint { font-size: 12px; color: #9ca3af; background: #f9fafb; padding: 10px 14px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 0; line-height: 1.6; }
.env-hint code { font-size: 11px; background: #e5e7eb; padding: 1px 5px; border-radius: 4px; }

.form-actions { display: flex; align-items: center; gap: 16px; margin-top: 4px; }
.btn-primary {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.btn-primary:hover { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.success-text { font-size: 14px; color: #16a34a; font-weight: 500; }
</style>
