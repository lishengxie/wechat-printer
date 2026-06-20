<!-- frontend/src/pages/AIConfigPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiAI } from '@/services/api'
import type { AIConfigData } from '@/services/api'
import { ElMessage } from 'element-plus'

const config = ref<AIConfigData>({
  api_key: '',
  api_base: '',
  model: ''
})
const loading = ref(false)
const saving = ref(false)
const error = ref('')

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
  try {
    await apiAI.updateConfig(config.value)
    ElMessage.success('配置已保存')
  } catch (e: any) {
    error.value = e.message
    ElMessage.error('保存失败: ' + (e.message || ''))
  } finally {
    saving.value = false
  }
}

function resetForm() {
  config.value = { api_key: '', api_base: '', model: '' }
}

onMounted(loadConfig)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>AI 助手配置</h2>
      <el-button @click="resetForm">重置</el-button>
    </div>

    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <div v-loading="loading" class="config-form">
      <el-form :model="config" label-position="top">
        <el-form-item label="API Key" required>
          <el-input
            v-model="config.api_key"
            type="password"
            placeholder="sk-..."
            show-password
          />
          <p class="hint">支持 OpenAI 兼容接口的 API Key</p>
        </el-form-item>
        <el-form-item label="API 地址">
          <el-input
            v-model="config.api_base"
            placeholder="https://api.openai.com/v1"
          />
          <p class="hint">留空则使用默认值 https://api.openai.com/v1</p>
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input
            v-model="config.model"
            placeholder="gpt-4o"
          />
          <p class="hint">留空则使用默认值 gpt-4o</p>
        </el-form-item>
      </el-form>

      <el-alert
        title="提示：也可通过环境变量 LLM_API_KEY、LLM_API_BASE、LLM_MODEL 配置，环境变量优先级高于页面配置。"
        type="info"
        show-icon
        :closable="false"
      />

      <el-button type="primary" :loading="saving" @click="saveConfig" class="save-btn">
        {{ saving ? '保存中...' : '保存配置' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px; border: 1px solid var(--el-border-color-light); }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); margin: 0; }
.mb-4 { margin-bottom: 16px; }
.config-form { display: flex; flex-direction: column; gap: 20px; }
.hint { font-size: 12px; color: var(--el-text-color-placeholder); margin: 4px 0 0; }
.save-btn { align-self: flex-start; }
</style>
