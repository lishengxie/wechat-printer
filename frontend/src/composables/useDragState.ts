import { ref } from 'vue'
import type { ModuleType } from '@/types/document'

// 全局拖拽状态
const draggingType = ref<ModuleType | null>(null)

export function useDragState() {
  function startDrag(type: ModuleType) {
    draggingType.value = type
    console.log('Start dragging:', type)
  }

  function endDrag() {
    draggingType.value = null
    console.log('End dragging')
  }

  function getDraggingType() {
    return draggingType.value
  }

  return {
    draggingType,
    startDrag,
    endDrag,
    getDraggingType
  }
}
