import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Document, Module, ModuleStyles, ModuleSpecificProps } from '@/types/document'
import { createEmptyDocument, isContainerModule, createModule, generateId } from '@/types/document'

export const useDocumentStore = defineStore('document', () => {
  // State
  const document = ref<Document>(createEmptyDocument())
  const selectedModuleId = ref<string | null>(null)
  const history = ref<Document[]>([])
  const historyIndex = ref(-1)
  const MAX_HISTORY = 50

  // Computed
  const selectedModule = computed(() => {
    if (!selectedModuleId.value) return null
    return findModuleById(document.value.root, selectedModuleId.value)
  })

  // Helper: Find module recursively by ID
  function findModuleById(root: Module, id: string): Module | null {
    if (root.id === id) return root
    if (root.children) {
      for (const child of root.children) {
        const found = findModuleById(child, id)
        if (found) return found
      }
    }
    return null
  }

  // Helper: Find parent of a module
  function findParentModule(root: Module, id: string, parent: Module | null = null): Module | null {
    if (root.id === id) return parent
    if (root.children) {
      for (const child of root.children) {
        const found = findParentModule(child, id, root)
        if (found) return found
      }
    }
    return null
  }

  // Helper: Save current state to history
  function saveToHistory() {
    // Remove future states if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Deep clone current document
    const snapshot = JSON.parse(JSON.stringify(document.value))
    history.value.push(snapshot)

    // Limit history size
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  // Actions
  function setDocument(doc: Document) {
    document.value = doc
    history.value = []
    historyIndex.value = -1
    selectedModuleId.value = null
  }

  // 示例文章工厂：产品评测
  function getProductReviewExample(): Document {
    const doc = createEmptyDocument('【深度评测】2024年度旗舰产品发布全解析')

    // 1. 封面标题
    const titleModule = createModule('text')
    titleModule.props.content = '🚀 2024旗舰新品 · 震撼发布'
    titleModule.styles = {
      fontSize: '28px',
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1f2937',
      margin: '0 0 8px 0',
      lineHeight: '1.4'
    }

    // 2. 副标题
    const subtitleModule = createModule('text')
    subtitleModule.props.content = '重新定义行业标准 · 100+项创新升级'
    subtitleModule.styles = {
      fontSize: '15px',
      textAlign: 'center',
      color: '#6b7280',
      margin: '0 0 24px 0'
    }

    // 3. 主图
    const heroImage = createModule('image')
    heroImage.props.src = 'https://picsum.photos/640/360?random=1'
    heroImage.props.alt = '产品主视觉图'
    heroImage.styles = { margin: '0 0 24px 0' }

    // 4. 引导语
    const introModule = createModule('text')
    introModule.props.content = '经过整整两年的潜心研发，我们怀着激动的心情向大家介绍这款全新的旗舰产品。这不仅仅是一次迭代升级，更是对未来生活方式的重新定义。'
    introModule.styles = {
      fontSize: '16px',
      color: '#4b5563',
      lineHeight: '1.9',
      margin: '0 0 24px 0',
      padding: '0 8px'
    }

    // 5. 产品亮点 - 三列布局
    const highlightsTitle = createModule('text')
    highlightsTitle.props.content = '✨ 核心亮点'
    highlightsTitle.styles = {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '32px 0 16px 0'
    }

    const highlightsContainer = createModule('container')
    highlightsContainer.props.layout = 'three-column'

    const highlight1 = createModule('text')
    highlight1.props.content = '<strong style="color:#059669">性能</strong><br/><strong>300%</strong> 性能飞跃'
    highlight1.styles = {
      fontSize: '13px',
      textAlign: 'center',
      padding: '16px 8px',
      backgroundColor: '#f0fdf4',
      borderRadius: '12px',
      lineHeight: '1.7'
    }

    const highlight2 = createModule('text')
    highlight2.props.content = '<strong style="color:#2563eb">续航</strong><br/><strong>120h</strong> 超长待机'
    highlight2.styles = {
      fontSize: '13px',
      textAlign: 'center',
      padding: '16px 8px',
      backgroundColor: '#eff6ff',
      borderRadius: '12px',
      lineHeight: '1.7'
    }

    const highlight3 = createModule('text')
    highlight3.props.content = '<strong style="color:#dc2626">屏幕</strong><br/><strong>4K</strong> 超高清显示'
    highlight3.styles = {
      fontSize: '13px',
      textAlign: 'center',
      padding: '16px 8px',
      backgroundColor: '#fef2f2',
      borderRadius: '12px',
      lineHeight: '1.7'
    }

    highlightsContainer.children = [highlight1, highlight2, highlight3]

    // 6. 产品实拍
    const photoTitle = createModule('text')
    photoTitle.props.content = '📸 产品实拍'
    photoTitle.styles = {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '32px 0 16px 0'
    }

    const photoRow = createModule('container')
    photoRow.props.layout = 'two-column'

    const photo1 = createModule('image')
    photo1.props.src = 'https://picsum.photos/300/200?random=2'

    const photo2 = createModule('image')
    photo2.props.src = 'https://picsum.photos/300/200?random=3'

    photoRow.children = [photo1, photo2]

    // 7. 详细功能说明
    const featuresTitle = createModule('text')
    featuresTitle.props.content = '🔧 功能详解'
    featuresTitle.styles = {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '32px 0 16px 0'
    }

    const featureCards = createModule('container')
    featureCards.props.layout = 'two-column'

    const card1 = createModule('text')
    card1.props.content = '<strong>🎯 智能AI芯片</strong><br/>搭载最新神经网络处理器，学习你的使用习惯，提供个性化服务。'
    card1.styles = {
      fontSize: '14px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      lineHeight: '1.7',
      color: '#374151'
    }

    const card2 = createModule('text')
    card2.props.content = '<strong>💧 防水防尘</strong><br/>IP68 专业级防护，日常使用无需担心水溅和灰尘。'
    card2.styles = {
      fontSize: '14px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      lineHeight: '1.7',
      color: '#374151'
    }

    featureCards.children = [card1, card2]

    // 8. 参数规格表
    const specTitle = createModule('text')
    specTitle.props.content = '📊 详细规格'
    specTitle.styles = {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '32px 0 16px 0'
    }

    const specModule = createModule('text')
    specModule.props.content = `
<strong>📐 尺寸与重量</strong><br/>
• 机身尺寸：146.7 x 71.5 x 7.8mm<br/>
• 整机重量：185g<br/>
<br/>
<strong>🖥️ 显示</strong><br/>
• 6.1英寸 Super Retina XDR<br/>
• 2556 x 1179 分辨率<br/>
• 460 ppi，ProMotion 120Hz<br/>
<br/>
<strong>🔌 充电与续航</strong><br/>
• MagSafe 无线充电<br/>
• 有线快充 30分钟充至 50%<br/>
• 视频播放最长可达 22 小时
    `
    specModule.styles = {
      fontSize: '14px',
      color: '#4b5563',
      lineHeight: '2',
      padding: '20px',
      backgroundColor: '#fafafa',
      borderRadius: '12px'
    }

    // 9. 分割线
    const dividerModule = createModule('divider')
    dividerModule.props.color = '#e5e7eb'
    dividerModule.styles = { margin: '32px 0' }

    // 10. 用户评价
    const reviewTitle = createModule('text')
    reviewTitle.props.content = '💬 用户评价'
    reviewTitle.styles = {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '0 0 16px 0'
    }

    const reviewQuote = createModule('text')
    reviewQuote.props.content = '「这是我用过最好的产品！性能提升明显，续航更是惊喜，强烈推荐给所有人。」<br/><br/>—— 张某某，科技博主'
    reviewQuote.styles = {
      fontSize: '15px',
      color: '#6b7280',
      lineHeight: '1.8',
      padding: '24px',
      backgroundColor: '#f0f9ff',
      borderLeft: '4px solid #0ea5e9',
      fontStyle: 'italic'
    }

    // 11. 购买信息卡片
    const buyModule = createModule('text')
    buyModule.props.content = '🎁 首发优惠'
    buyModule.styles = {
      fontSize: '20px',
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#dc2626',
      margin: '32px 0 8px 0'
    }

    const buyDetail = createModule('text')
    buyDetail.props.content = '• 首发价：¥4,999（原价 ¥5,999）<br/>• 前 1000 名赠价值 ¥599 配件套装<br/>• 支持 24 期免息分期<br/>• 限时赠送 2 年延保服务'
    buyDetail.styles = {
      fontSize: '15px',
      textAlign: 'center',
      color: '#374151',
      lineHeight: '2.2',
      padding: '20px',
      backgroundColor: '#fffbeb',
      borderRadius: '12px'
    }

    // 12. 购买按钮
    const buyButton = createModule('button')
    buyButton.props.text = '👉 立即抢购 👈'
    buyButton.props.size = 'large'
    buyButton.styles = {
      textAlign: 'center',
      margin: '24px 0'
    }

    // 13. 底部提示
    const footerModule = createModule('text')
    footerModule.props.content = '⏰ 限时活动：2024年1月1日 - 2024年1月7日<br/>📞 客服热线：400-888-8888（9:00-21:00）'
    footerModule.styles = {
      fontSize: '13px',
      textAlign: 'center',
      color: '#9ca3af',
      lineHeight: '1.8',
      margin: '32px 0 16px 0'
    }

    // 将所有模块添加到文档
    doc.root.children = [
      titleModule,
      subtitleModule,
      heroImage,
      introModule,
      highlightsTitle,
      highlightsContainer,
      photoTitle,
      photoRow,
      featuresTitle,
      featureCards,
      specTitle,
      specModule,
      dividerModule,
      reviewTitle,
      reviewQuote,
      buyModule,
      buyDetail,
      buyButton,
      footerModule
    ]

    return doc
  }

  // 加载测试数据（保留作为快捷方式）
  function loadTestData() {
    const doc = getProductReviewExample()
    setDocument(doc)
    console.log('测试数据加载完成！共加载', doc.root.children.length, '个模块')
  }

  // 加载示例文章（通过 ID 选择）
  function loadExampleArticle(exampleId: string) {
    switch (exampleId) {
      case 'product-review':
        setDocument(getProductReviewExample())
        break
      default:
        setDocument(createEmptyDocument())
    }
  }

  function selectModule(id: string | null) {
    console.log('👉 selectModule called, id:', id)
    selectedModuleId.value = id
    console.log('👉 selectedModuleId now:', selectedModuleId.value)
  }

  function addModule(newModule: Module, parentId?: string, index?: number) {
    saveToHistory()

    // 创建整个 document 的新引用确保响应式
    const newDocument = JSON.parse(JSON.stringify(document.value))

    if (parentId) {
      // 添加到容器内
      const parent = findModuleById(newDocument.root, parentId)
      if (parent && isContainerModule(parent)) {
        if (!parent.children) parent.children = []
        // 确保索引有效
        const insertIndex = (index !== undefined && index >= 0)
          ? Math.min(index, parent.children.length)
          : parent.children.length
        parent.children.splice(insertIndex, 0, newModule)
      }
    } else {
      // 添加到根容器
      if (!newDocument.root.children) newDocument.root.children = []
      // 确保索引有效
      const insertIndex = (index !== undefined && index >= 0)
        ? Math.min(index, newDocument.root.children.length)
        : newDocument.root.children.length
      newDocument.root.children.splice(insertIndex, 0, newModule)
    }

    newDocument.updatedAt = new Date().toISOString()
    document.value = newDocument
  }

  function removeModule(id: string) {
    console.log('🗑️ removeModule called, id:', id)
    if (id === document.value.root.id) {
      console.log('  ❌ Cannot remove root')
      return
    }

    saveToHistory()

    // 创建整个 document 的新引用确保响应式
    const newDocument = JSON.parse(JSON.stringify(document.value))

    const parent = findParentModule(newDocument.root, id)
    console.log('  - Found parent:', parent?.id)
    if (parent && parent.children) {
      const index = parent.children.findIndex(m => m.id === id)
      console.log('  - Found index:', index)
      if (index !== -1) {
        parent.children.splice(index, 1)
        console.log('  ✅ Module removed')
      }
    }

    if (selectedModuleId.value === id) {
      selectedModuleId.value = null
    }

    newDocument.updatedAt = new Date().toISOString()
    document.value = newDocument
  }

  function reorderRootChildren(orderedIds: string[]) {
    saveToHistory()
    const newDocument = JSON.parse(JSON.stringify(document.value))
    const children = newDocument.root.children || []
    const moduleMap = new Map(children.map((m: Module) => [m.id, m]))
    newDocument.root.children = orderedIds
      .map((id: string) => moduleMap.get(id))
      .filter(Boolean)
    newDocument.updatedAt = new Date().toISOString()
    document.value = newDocument
  }

  function reorderChildModules(parentId: string, orderedIds: string[]) {
    saveToHistory()

    const newDocument = JSON.parse(JSON.stringify(document.value))
    const parent = findModuleById(newDocument.root, parentId)
    if (!parent || !parent.children) return

    const moduleMap = new Map(parent.children.map((m: Module) => [m.id, m]))
    parent.children = orderedIds
      .map((id: string) => moduleMap.get(id))
      .filter(Boolean) as Module[]

    newDocument.updatedAt = new Date().toISOString()
    document.value = newDocument
  }

  function moveModule(moduleId: string, newParentId: string | null, newIndex: number) {
    saveToHistory()

    // 创建整个 document 的新引用确保响应式
    const newDocument = JSON.parse(JSON.stringify(document.value))

    const module = findModuleById(newDocument.root, moduleId)
    if (!module) return

    // Remove from old parent
    const oldParent = findParentModule(newDocument.root, moduleId)
    if (oldParent && oldParent.children) {
      const oldIndex = oldParent.children.findIndex(m => m.id === moduleId)
      if (oldIndex !== -1) {
        oldParent.children.splice(oldIndex, 1)
      }
    }

    // Add to new parent
    const newParent = newParentId
      ? findModuleById(newDocument.root, newParentId)
      : newDocument.root

    if (newParent) {
      if (!newParent.children) newParent.children = []
      newParent.children.splice(newIndex, 0, module)
    }

    newDocument.updatedAt = new Date().toISOString()
    document.value = newDocument
  }

  function updateModuleStyles(id: string, styles: Partial<ModuleStyles>) {
    saveToHistory()

    // 直接 mutation，只在被修改的模块触发响应式更新
    const module = findModuleById(document.value.root, id)
    if (module) {
      module.styles = { ...module.styles, ...styles }
    }

    document.value.updatedAt = new Date().toISOString()
  }

  function updateModuleProps(id: string, props: Partial<ModuleSpecificProps>) {
    saveToHistory()

    // 直接 mutation，只在被修改的模块触发响应式更新
    const module = findModuleById(document.value.root, id)
    if (module) {
      module.props = { ...module.props, ...props } as ModuleSpecificProps
    }

    document.value.updatedAt = new Date().toISOString()
  }

  // 原子化替换整个模块（支持 styles、props、type、children 的全量替换）
  function replaceModule(updatedModule: Module) {
    saveToHistory()

    const newDocument = JSON.parse(JSON.stringify(document.value))
    const module = findModuleById(newDocument.root, updatedModule.id)
    if (module) {
      // 允许替换 type
      if (updatedModule.type) {
        module.type = updatedModule.type
      }
      // 替换 styles
      if (updatedModule.styles) {
        module.styles = { ...module.styles, ...updatedModule.styles }
      }
      // 替换 props
      if (updatedModule.props) {
        module.props = { ...module.props, ...updatedModule.props } as ModuleSpecificProps
      }
      // 替换 children（container 类型）
      if (updatedModule.children) {
        module.children = updatedModule.children
      }
    }

    newDocument.updatedAt = new Date().toISOString()
    document.value = newDocument
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      document.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      document.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }

  function canUndo(): boolean {
    return historyIndex.value > 0
  }

  function canRedo(): boolean {
    return historyIndex.value < history.value.length - 1
  }

  // 应用模板：从模板文档合并 styles 到当前文档
  function applyTemplateFromDocument(templateDocument: Document) {
    saveToHistory()
    const newDoc = JSON.parse(JSON.stringify(document.value))

    // Build moduleType -> styles map from template
    const stylesByType: Record<string, ModuleStyles> = {}
    function collect(module: Module) {
      if (module.styles && Object.keys(module.styles).length > 0) {
        stylesByType[module.type] = { ...module.styles }
      }
      if (module.children) {
        module.children.forEach(collect)
      }
    }
    collect(templateDocument.root)

    // Apply to current document
    function traverse(module: Module) {
      const moduleStyles = stylesByType[module.type]
      if (moduleStyles) {
        module.styles = { ...module.styles, ...moduleStyles }
      }
      if (module.children) {
        module.children.forEach(traverse)
      }
    }
    traverse(newDoc.root)

    newDoc.updatedAt = new Date().toISOString()
    document.value = newDoc
  }

  // 应用模板模块样式：将模板中同类型模块的 styles 合并到指定模块
  // 返回 boolean 表示是否成功应用了样式
  function applyTemplateModuleStyles(templateDocument: Document, targetModuleId: string): boolean {
    const targetModule = findModuleById(document.value.root, targetModuleId)
    if (!targetModule) return false

    // Find the matching module in template by type
    let templateModule: Module | null = null
    function findTemplateModule(module: Module) {
      if (module.type === targetModule.type) {
        templateModule = module
      }
      if (module.children && !templateModule) {
        module.children.forEach(findTemplateModule)
      }
    }
    findTemplateModule(templateDocument.root)

    if (templateModule && templateModule.styles) {
      updateModuleStyles(targetModuleId, templateModule.styles)
      return true
    }
    return false
  }

  return {
    // State
    document,
    selectedModuleId,
    // Computed
    selectedModule,
    // Actions
    setDocument,
    selectModule,
    addModule,
    removeModule,
    moveModule,
    reorderRootChildren,
    reorderChildModules,
    updateModuleStyles,
    updateModuleProps,
    replaceModule,
    undo,
    redo,
    canUndo,
    canRedo,
    findModuleById,
    loadTestData,
    loadExampleArticle,
    getProductReviewExample,
    applyTemplateFromDocument,
    applyTemplateModuleStyles
  }
})
