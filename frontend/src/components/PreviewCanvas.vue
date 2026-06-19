<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/document'
import ModuleRenderer from './ModuleRenderer.vue'

const documentStore = useDocumentStore()

const document = computed(() => documentStore.document)
const modules = computed(() => document.value.root.children || [])
</script>

<template>
  <div class="preview-canvas">
    <!-- 手机模拟器外壳 -->
    <div class="phone-mockup">
      <!-- 手机顶部状态栏 -->
      <div class="phone-status-bar">
        <span class="status-time">9:41</span>
        <div class="status-icons">
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      <!-- 公众号标题栏 -->
      <div class="mp-header">
        <div class="mp-back">‹</div>
        <div class="mp-title">公众号</div>
        <div class="mp-more">⋯</div>
      </div>

      <!-- 文章内容区 -->
      <div class="article-content">
        <!-- 文章标题 -->
        <h1 class="article-title">{{ document.title }}</h1>

        <!-- 文章元信息 -->
        <div class="article-meta">
          <span class="author-name">品牌官方</span>
          <span class="publish-time">{{ new Date().toLocaleDateString() }}</span>
        </div>

        <!-- 模块内容 -->
        <div class="article-body">
          <ModuleRenderer
            v-for="module in modules"
            :key="module.id"
            :module="module"
          />
        </div>

        <!-- 公众号底部 -->
        <div class="article-footer">
          <div class="follow-card">
            <div class="follow-avatar">📰</div>
            <div class="follow-info">
              <div class="follow-name">品牌官方公众号</div>
              <div class="follow-desc">关注了解更多新品资讯</div>
            </div>
            <button class="follow-btn">关注</button>
          </div>
        </div>

        <!-- 阅读全文提示 -->
        <div class="read-more-tip">
          <span>阅读原文</span>
        </div>
      </div>
    </div>

    <!-- 预览提示 -->
    <div class="preview-tip">
      <div class="tip-card">
        <h3>📱 预览模式</h3>
        <p>当前显示为公众号文章在手机端的实际效果</p>
        <ul>
          <li>✅ 还原真实手机阅读体验</li>
          <li>✅ 模拟公众号 UI 界面</li>
          <li>✅ 字号、间距、颜色精准还原</li>
          <li>点击顶部「编辑」按钮返回排版</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-canvas {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 48px;
  padding: 40px;
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

/* 手机模拟器 */
.phone-mockup {
  width: 375px;
  min-width: 375px;
  background: #ffffff;
  border-radius: 32px;
  box-shadow:
    0 50px 100px -20px rgba(50, 50, 93, 0.25),
    0 30px 60px -30px rgba(0, 0, 0, 0.3),
    0 0 0 8px #1f2937,
    0 0 0 12px #374151;
  overflow: hidden;
}

/* 状态栏 */
.phone-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.status-icons {
  display: flex;
  gap: 6px;
  font-size: 12px;
}

/* 公众号标题栏 */
.mp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 17px;
  font-weight: 500;
  color: #1f2937;
}

.mp-back {
  font-size: 24px;
  color: #374151;
}

.mp-more {
  font-size: 20px;
  color: #374151;
}

/* 文章内容 */
.article-content {
  background: #ffffff;
}

.article-title {
  margin: 20px 16px 12px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.4;
  color: #1f2937;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 16px 20px;
  font-size: 14px;
  color: #6b7280;
}

.author-name {
  color: #576b95;
}

.article-body {
  padding: 0 16px 24px;
  font-size: 16px;
  line-height: 1.75;
  color: #333333;
}

/* 文章底部 */
.article-footer {
  padding: 0 16px 16px;
}

.follow-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
}

.follow-avatar {
  width: 40px;
  height: 40px;
  background: #07c160;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.follow-info {
  flex: 1;
}

.follow-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.follow-desc {
  font-size: 12px;
  color: #6b7280;
}

.follow-btn {
  padding: 6px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.read-more-tip {
  text-align: center;
  padding: 20px;
  font-size: 14px;
  color: #576b95;
}

/* 预览提示 */
.preview-tip {
  width: 300px;
  min-width: 300px;
}

.tip-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.tip-card h3 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.tip-card p {
  margin: 0 0 16px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

.tip-card ul {
  margin: 0;
  padding-left: 20px;
}

.tip-card li {
  font-size: 13px;
  color: #4b5563;
  line-height: 2;
}
</style>
