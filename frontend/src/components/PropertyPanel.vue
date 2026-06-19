<template>
  <div class="property-panel bg-white border-l h-full overflow-y-auto">
    <div class="p-4 border-b">
      <h3 class="font-semibold text-gray-700">属性设置</h3>
    </div>

    <div v-if="!selectedModule" class="p-6 text-center text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
      <p class="text-sm">选中模块以编辑属性</p>
    </div>

    <div v-else class="p-4 space-y-6">
      <!-- Module Type Info -->
      <div class="pb-4 border-b border-gray-100">
        <span class="text-xs font-medium text-gray-500 uppercase">模块类型</span>
        <div class="font-medium text-gray-800 mt-1">{{ getModuleTypeName(selectedModule) }}</div>
      </div>

      <!-- Style Controls -->
      <div class="space-y-4">
        <h4 class="text-xs font-medium text-gray-500 uppercase">样式设置</h4>

        <!-- Text Color -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">文字颜色</label>
          <div class="flex gap-2">
            <input
              type="color"
              :value="selectedModule.styles.color || '#333333'"
              @input="updateStyle('color', ($event.target as HTMLInputElement).value)"
              class="w-10 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              :value="selectedModule.styles.color || '#333333'"
              @change="updateStyle('color', ($event.target as HTMLInputElement).value)"
              class="flex-1 px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        <!-- Background Color -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">背景颜色</label>
          <div class="flex gap-2">
            <input
              type="color"
              :value="styleBackgroundColor"
              @input="updateStyle('backgroundColor', ($event.target as HTMLInputElement).value)"
              class="w-10 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              :value="styleBackgroundColor"
              @change="updateStyle('backgroundColor', ($event.target as HTMLInputElement).value)"
              class="flex-1 px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        <!-- Text Align -->
        <div v-if="supportsTextAlign">
          <label class="block text-sm text-gray-600 mb-1">对齐方式</label>
          <div class="flex gap-2">
            <button
              v-for="align in alignOptions"
              :key="align.value"
              @click="updateStyle('textAlign', align.value)"
              class="flex-1 px-3 py-2 border rounded text-sm hover:bg-gray-50"
              :class="{ 'bg-blue-50 border-blue-400 text-blue-600': selectedModule.styles.textAlign === align.value }"
            >
              {{ align.label }}
            </button>
          </div>
        </div>

        <!-- Font Size -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">字体大小</label>
          <input
            type="text"
            :value="selectedModule.styles.fontSize || '16px'"
            @change="updateStyle('fontSize', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="16px"
          />
        </div>

        <!-- Font Family -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">字体</label>
          <select
            :value="selectedModule.styles.fontFamily || ''"
            @change="updateStyle('fontFamily', ($event.target as HTMLSelectElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="">默认</option>
            <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">系统默认 (无衬线)</option>
            <option value="-apple-system, 'Noto Serif SC', Georgia, serif">衬线体 (宋体/Georgia)</option>
            <option value="-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif">苹方 / 微软雅黑</option>
            <option value="-apple-system, 'Noto Serif SC', 'KaiTi', serif">楷体</option>
            <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica Neue</option>
            <option value="Georgia, 'Noto Serif SC', serif">Georgia</option>
            <option value="'Courier New', monospace">等宽字体 (Courier)</option>
          </select>
        </div>

        <!-- Padding with sliders -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">内边距</label>
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">上</span>
              <input type="range" min="0" max="80" :value="paddingTop" @input="updatePadding('top', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ paddingTop }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">右</span>
              <input type="range" min="0" max="80" :value="paddingRight" @input="updatePadding('right', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ paddingRight }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">下</span>
              <input type="range" min="0" max="80" :value="paddingBottom" @input="updatePadding('bottom', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ paddingBottom }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">左</span>
              <input type="range" min="0" max="80" :value="paddingLeft" @input="updatePadding('left', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ paddingLeft }}px</span>
            </div>
          </div>
        </div>

        <!-- Margin with sliders -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">外边距</label>
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">上</span>
              <input type="range" min="0" max="80" :value="marginTop" @input="updateMargin('top', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ marginTop }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">右</span>
              <input type="range" min="0" max="80" :value="marginRight" @input="updateMargin('right', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ marginRight }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">下</span>
              <input type="range" min="0" max="80" :value="marginBottom" @input="updateMargin('bottom', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ marginBottom }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">左</span>
              <input type="range" min="0" max="80" :value="marginLeft" @input="updateMargin('left', ($event.target as HTMLInputElement).value)" class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ marginLeft }}px</span>
            </div>
          </div>
        </div>

        <!-- Border -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">边框</label>
          <input
            type="text"
            :value="selectedModule.styles.border || ''"
            @change="updateStyle('border', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="1px solid #e5e7eb"
          />
        </div>

        <!-- Border Radius -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">圆角</label>
          <input
            type="text"
            :value="selectedModule.styles.borderRadius || ''"
            @change="updateStyle('borderRadius', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="8px"
          />
        </div>

        <!-- Line Height -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">行高</label>
          <input
            type="text"
            :value="selectedModule.styles.lineHeight || ''"
            @change="updateStyle('lineHeight', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="1.6"
          />
        </div>

        <!-- Font Weight -->
        <div v-if="supportsTextColor">
          <label class="block text-sm text-gray-600 mb-1">字重</label>
          <select
            :value="selectedModule.styles.fontWeight || 'normal'"
            @change="updateStyle('fontWeight', ($event.target as HTMLSelectElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="normal">正常</option>
            <option value="bold">加粗</option>
            <option value="300">细体</option>
            <option value="500">中等</option>
            <option value="600">半粗</option>
          </select>
        </div>
      </div>

      <!-- Module Specific Props - Text -->
      <div v-if="selectedModule.type === 'text'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">文字内容</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">图标 (Emoji)</label>
          <input
            type="text"
            :value="(selectedModule.props as any).icon || ''"
            @change="updateProps({ icon: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="如 📢 ✨ 💡（选填）"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">内容</label>
          <textarea
            :value="(selectedModule.props as any).content"
            @change="updateProps({ content: ($event.target as HTMLTextAreaElement).value })"
            class="w-full px-3 py-2 border rounded text-sm min-h-[100px]"
            placeholder="输入文字内容..."
          ></textarea>
        </div>
      </div>

      <!-- Module Specific Props - Button -->
      <div v-if="selectedModule.type === 'button'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">按钮设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">按钮文字</label>
          <input
            type="text"
            :value="(selectedModule.props as any).text"
            @change="updateProps({ text: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">链接地址</label>
          <input
            type="text"
            :value="(selectedModule.props as any).link"
            @change="updateProps({ link: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="https://..."
          />
        </div>
      </div>

<!-- Module Specific Props - Image -->
      <div v-if="selectedModule.type === 'image'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">图片设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">图片地址</label>
          <input
            type="text"
            :value="(selectedModule.props as any).src"
            @change="updateProps({ src: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="https://..."
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">替代文本</label>
          <input
            type="text"
            :value="(selectedModule.props as any).alt || ''"
            @change="updateProps({ alt: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="图片描述"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">脚注文字</label>
          <input
            type="text"
            :value="(selectedModule.props as any).caption || ''"
            @change="updateProps({ caption: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="图片说明文字（可选）"
          />
        </div>
        <div v-if="(selectedModule.props as any).caption">
          <label class="block text-sm text-gray-600 mb-1">脚注样式</label>
          <div class="space-y-2">
            <div class="flex gap-2 items-center">
              <label class="text-xs text-gray-500 w-12">字号</label>
              <select
                :value="((selectedModule.props as any).captionStyle?.fontSize) || '13px'"
                @change="updateCaptionStyle('fontSize', ($event.target as HTMLSelectElement).value)"
                class="flex-1 px-2 py-1 border rounded text-xs"
              >
                <option value="11px">11px</option>
                <option value="12px">12px</option>
                <option value="13px">13px</option>
                <option value="14px">14px</option>
                <option value="15px">15px</option>
              </select>
            </div>
            <div class="flex gap-2 items-center">
              <label class="text-xs text-gray-500 w-12">颜色</label>
              <input
                type="color"
                :value="((selectedModule.props as any).captionStyle?.color) || '#9ca3af'"
                @input="updateCaptionStyle('color', ($event.target as HTMLInputElement).value)"
                class="w-8 h-8 rounded border cursor-pointer"
              />
              <input
                type="text"
                :value="((selectedModule.props as any).captionStyle?.color) || '#9ca3af'"
                @change="updateCaptionStyle('color', ($event.target as HTMLInputElement).value)"
                class="flex-1 px-2 py-1 border rounded text-xs"
              />
            </div>
            <div class="flex gap-2 items-center">
              <label class="text-xs text-gray-500 w-12">对齐</label>
              <select
                :value="((selectedModule.props as any).captionStyle?.textAlign) || 'center'"
                @change="updateCaptionStyle('textAlign', ($event.target as HTMLSelectElement).value)"
                class="flex-1 px-2 py-1 border rounded text-xs"
              >
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                :checked="!!((selectedModule.props as any).captionStyle?.italic)"
                @change="updateCaptionStyle('italic', ($event.target as HTMLInputElement).checked)"
                class="w-4 h-4"
              />
              <label class="text-xs text-gray-500">斜体</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Module Specific Props - Container -->
      <div v-if="selectedModule.type === 'container'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">布局设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">布局方式</label>
          <select
            :value="(selectedModule.props as any).layout"
            @change="updateProps({ layout: ($event.target as HTMLSelectElement).value as any })"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="single">单列</option>
            <option value="two-column">双列</option>
            <option value="three-column">三列</option>
          </select>
        </div>
        <p class="text-sm text-gray-500">容器包含 {{ selectedModule.children?.length || 0 }} 个子模块</p>
      </div>

      <!-- Module Specific Props - Header -->
      <div v-if="selectedModule.type === 'header'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">页首设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">风格</label>
          <select
            :value="(selectedModule.props as any).variant || 'default'"
            @change="updateProps({ variant: ($event.target as HTMLSelectElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="default">经典</option>
            <option value="magazine">杂志</option>
            <option value="minimal">极简</option>
            <option value="card">卡片</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">标题</label>
          <input
            type="text"
            :value="(selectedModule.props as any).title"
            @change="updateProps({ title: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">副标题</label>
          <input
            type="text"
            :value="(selectedModule.props as any).subtitle"
            @change="updateProps({ subtitle: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">作者</label>
          <input
            type="text"
            :value="(selectedModule.props as any).author"
            @change="updateProps({ author: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">日期</label>
          <input
            type="text"
            :value="(selectedModule.props as any).date"
            @change="updateProps({ date: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="(selectedModule.props as any).showAuthor"
            @change="updateProps({ showAuthor: ($event.target as HTMLInputElement).checked })"
            class="w-4 h-4"
          />
          <label class="text-sm text-gray-600">显示作者</label>
        </div>
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="(selectedModule.props as any).showDate"
            @change="updateProps({ showDate: ($event.target as HTMLInputElement).checked })"
            class="w-4 h-4"
          />
          <label class="text-sm text-gray-600">显示日期</label>
        </div>
      </div>

      <!-- Module Specific Props - Footer -->
      <div v-if="selectedModule.type === 'footer'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">页尾设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">风格</label>
          <select
            :value="(selectedModule.props as any).variant || 'default'"
            @change="updateProps({ variant: ($event.target as HTMLSelectElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="default">经典</option>
            <option value="simple">简约</option>
            <option value="branded">品牌</option>
            <option value="cta">互动</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">结尾文字</label>
          <textarea
            :value="(selectedModule.props as any).text"
            @change="updateProps({ text: ($event.target as HTMLTextAreaElement).value })"
            class="w-full px-3 py-2 border rounded text-sm min-h-[80px]"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">版权声明</label>
          <input
            type="text"
            :value="(selectedModule.props as any).copyright"
            @change="updateProps({ copyright: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="(selectedModule.props as any).showDivider"
            @change="updateProps({ showDivider: ($event.target as HTMLInputElement).checked })"
            class="w-4 h-4"
          />
          <label class="text-sm text-gray-600">显示分隔线</label>
        </div>
      </div>

      <!-- Module Specific Props - Heading -->
      <div v-if="selectedModule.type === 'heading'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">章节标题设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">风格</label>
          <select
            :value="(selectedModule.props as any).variant || 'numbered'"
            @change="updateProps({ variant: ($event.target as HTMLSelectElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="numbered">编号风</option>
            <option value="left-bar">左侧竖条</option>
            <option value="center">居中装饰</option>
            <option value="simple">极简</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">标题文字</label>
          <input
            type="text"
            :value="(selectedModule.props as any).text"
            @change="updateProps({ text: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">层级</label>
          <select
            :value="(selectedModule.props as any).level || 1"
            @change="updateProps({ level: parseInt(($event.target as HTMLSelectElement).value) })"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option :value="1">一级标题 (h1)</option>
            <option :value="2">二级标题 (h2)</option>
            <option :value="3">三级标题 (h3)</option>
            <option :value="4">四级标题 (h4)</option>
            <option :value="5">五级标题 (h5)</option>
            <option :value="6">六级标题 (h6)</option>
          </select>
        </div>
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            :checked="(selectedModule.props as any).showNumbering"
            @change="updateProps({ showNumbering: ($event.target as HTMLInputElement).checked })"
            class="w-4 h-4"
          />
          <label class="text-sm text-gray-600">显示编号前缀</label>
        </div>
      </div>

      <!-- Module Specific Props - TOC -->
      <div v-if="selectedModule.type === 'toc'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">目录设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">风格</label>
          <select
            :value="(selectedModule.props as any).variant || 'default'"
            @change="updateProps({ variant: ($event.target as HTMLSelectElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="default">经典</option>
            <option value="numbered">编号</option>
            <option value="card">卡片</option>
            <option value="minimal">极简</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">目录标题</label>
          <input
            type="text"
            :value="(selectedModule.props as any).title"
            @change="updateProps({ title: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-sm text-gray-600">目录项（双击编辑）</label>
          <div
            v-for="(item, index) in (selectedModule.props as any).items"
            :key="index"
            class="flex gap-2 items-center"
          >
            <select
              :value="item.level"
              @change="updateTocItem(index, 'level', parseInt(($event.target as HTMLSelectElement).value))"
              class="w-16 px-2 py-1 border rounded text-xs"
            >
              <option :value="0">一级</option>
              <option :value="1">二级</option>
              <option :value="2">三级</option>
            </select>
            <input
              type="text"
              :value="item.text"
              @change="updateTocItem(index, 'text', ($event.target as HTMLInputElement).value)"
              class="flex-1 px-2 py-1 border rounded text-sm"
            />
            <button
              @click="removeTocItem(index)"
              class="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
              title="删除"
            >
              ✕
            </button>
          </div>
          <button
            @click="addTocItem"
            class="w-full py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50"
          >
            + 添加目录项
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/document'
import type { ModuleType, ModuleStyles, ModuleSpecificProps } from '@/types/document'

const documentStore = useDocumentStore()

const selectedModule = computed(() => documentStore.selectedModule)

const styleBackgroundColor = computed(() => {
  const color = selectedModule.value?.styles.backgroundColor
  return color && color !== 'transparent' ? color : '#ffffff'
})

const alignOptions = [
  { label: '左', value: 'left' as const },
  { label: '中', value: 'center' as const },
  { label: '右', value: 'right' as const }
]

const textModules: ModuleType[] = ['text', 'button', 'header', 'footer', 'heading']
const supportsTextColor = computed(() => selectedModule.value && textModules.includes(selectedModule.value.type))
const supportsTextAlign = computed(() => selectedModule.value && textModules.includes(selectedModule.value.type))

// Parse padding/margin into individual values
function parseSpacing(val: string | undefined, fallback = '0'): [number, number, number, number] {
  const parts = (val || fallback).split(/\s+/).map(v => parseInt(v) || 0)
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
  return [parts[0], parts[1], parts[2], parts[3]]
}
const paddingTop = computed(() => parseSpacing(selectedModule.value?.styles.padding)[0])
const paddingRight = computed(() => parseSpacing(selectedModule.value?.styles.padding)[1])
const paddingBottom = computed(() => parseSpacing(selectedModule.value?.styles.padding)[2])
const paddingLeft = computed(() => parseSpacing(selectedModule.value?.styles.padding)[3])
const marginTop = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0')[0])
const marginRight = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0')[1])
const marginBottom = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0')[2])
const marginLeft = computed(() => parseSpacing(selectedModule.value?.styles.margin, '0 0 16px 0')[3])

function updatePadding(side: string, px: string) {
  if (!selectedModule.value) return
  const cur = selectedModule.value.styles.padding || '0'
  const [t, r, b, l] = parseSpacing(cur)
  const map: Record<string, string> = { top: `${px}px ${r}px ${b}px ${l}px`, right: `${t}px ${px}px ${b}px ${l}px`, bottom: `${t}px ${r}px ${px}px ${l}px`, left: `${t}px ${r}px ${b}px ${px}px` }
  updateStyle('padding', map[side])
}

function updateMargin(side: string, px: string) {
  if (!selectedModule.value) return
  const cur = selectedModule.value.styles.margin || '0 0 16px 0'
  const [t, r, b, l] = parseSpacing(cur, '0 0 16px 0')
  const map: Record<string, string> = { top: `${px}px ${r}px ${b}px ${l}px`, right: `${t}px ${px}px ${b}px ${l}px`, bottom: `${t}px ${r}px ${px}px ${l}px`, left: `${t}px ${r}px ${b}px ${px}px` }
  updateStyle('margin', map[side])
}

function getModuleTypeName(module: typeof selectedModule.value): string {
  if (!module) return ''
  const names: Record<ModuleType, string> = {
    text: '文字',
    image: '图片',
    divider: '分割线',
    button: '按钮',
    container: '容器',
    header: '页首',
    footer: '页尾',
    toc: '目录',
    heading: '章节标题'
  }
  const base = names[module.type] || module.type
  // 提取内容摘要作为区分
  const props = module.props as any
  if (module.type === 'text' && props.content) {
    const preview = props.content.replace(/<[^>]+>/g, '').trim().substring(0, 20)
    return preview ? `${base} · ${preview}` : base
  }
  if (module.type === 'header' && props.title) {
    return `${base} · ${props.title.substring(0, 16)}`
  }
  if (module.type === 'footer' && props.text) {
    const preview = props.text.substring(0, 16)
    return `${base} · ${preview}`
  }
  if (module.type === 'button' && props.text) {
    return `${base} · ${props.text}`
  }
  if (module.type === 'image' && props.src) {
    const filename = props.src.split('/').pop() || ''
    return filename ? `${base} · ${filename.substring(0, 16)}` : base
  }
  if (module.type === 'toc' && props.title) {
    return `${base} · ${props.title}`
  }
  if (module.type === 'heading' && props.text) {
    return `${base} · ${props.text.substring(0, 16)}`
  }
  if (module.type === 'container') {
    const count = module.children?.length || 0
    return `${base}（${count} 子模块）`
  }
  return base
}

function updateCaptionStyle(key: string, value: any) {
  if (!selectedModule.value) return
  const current = (selectedModule.value.props as any).captionStyle || {}
  updateProps({ captionStyle: { ...current, [key]: value } } as any)
}

function updateStyle(key: keyof ModuleStyles, value: string | undefined) {
  if (selectedModule.value) {
    documentStore.updateModuleStyles(selectedModule.value.id, { [key]: value })
  }
}

function updateProps(props: Partial<ModuleSpecificProps>) {
  if (selectedModule.value) {
    documentStore.updateModuleProps(selectedModule.value.id, props)
  }
}

// TOC 目录项操作
function updateTocItem(index: number, field: 'text' | 'level', value: string | number) {
  if (!selectedModule.value) return
  const items = [...(selectedModule.value.props as any).items]
  items[index] = { ...items[index], [field]: value }
  documentStore.updateModuleProps(selectedModule.value.id, { items } as Partial<ModuleSpecificProps>)
}

function removeTocItem(index: number) {
  if (!selectedModule.value) return
  const items = (selectedModule.value.props as any).items.filter((_: any, i: number) => i !== index)
  documentStore.updateModuleProps(selectedModule.value.id, { items } as Partial<ModuleSpecificProps>)
}

function addTocItem() {
  if (!selectedModule.value) return
  const items = [...(selectedModule.value.props as any).items, { text: '新目录项', level: 0 }]
  documentStore.updateModuleProps(selectedModule.value.id, { items } as Partial<ModuleSpecificProps>)
}
</script>
