<script setup lang="ts">
import { ref } from 'vue'
import { Clock, ZoomIn, ZoomOut } from '@element-plus/icons-vue'

import { useEditorStore } from '@/stores/editor'
import EditableWrapper from './EditableWrapper.vue'
import HistoryTimeline from './HistoryTimeline.vue'

const editor = useEditorStore()
const containerRef = ref<HTMLElement | null>(null)
const dropIndex = ref<number | null>(null)
const pointerY = ref<number | null>(null)
let scrollRaf = 0

const AUTOSCROLL_EDGE = 90
const AUTOSCROLL_SPEED = 14

/** 画布缩放(0.4 ~ 1,CSS zoom 属性参与布局,拖拽坐标天然一致) */
const zoom = ref(1)
const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.4

function zoomIn() {
  zoom.value = Math.min(1, Math.round((zoom.value + ZOOM_STEP) * 10) / 10)
}

function zoomOut() {
  zoom.value = Math.max(ZOOM_MIN, Math.round((zoom.value - ZOOM_STEP) * 10) / 10)
}

/** 拖拽悬停在视口上下边缘时持续滚动画布 */
function autoScrollLoop() {
  const area = containerRef.value?.closest('.canvas-scroll') as HTMLElement | null
  if (!area || !editor.dragging || pointerY.value === null) {
    scrollRaf = 0
    return
  }
  const viewHeight = window.innerHeight
  if (pointerY.value < AUTOSCROLL_EDGE) area.scrollTop -= AUTOSCROLL_SPEED
  else if (pointerY.value > viewHeight - AUTOSCROLL_EDGE) area.scrollTop += AUTOSCROLL_SPEED
  scrollRaf = requestAnimationFrame(autoScrollLoop)
}

function stopAutoScroll() {
  pointerY.value = null
  if (scrollRaf) {
    cancelAnimationFrame(scrollRaf)
    scrollRaf = 0
  }
}

function calcDropIndex(clientY: number): number {
  const container = containerRef.value
  if (!container) return editor.page.components.length
  const items = Array.from(container.querySelectorAll<HTMLElement>('[data-edit-item]'))
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    if (clientY < rect.top + rect.height / 2) return i
  }
  return items.length
}

function onDragOver(e: DragEvent) {
  if (!editor.dragging) return
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = editor.dragging.kind === 'palette' ? 'copy' : 'move'
  }
  pointerY.value = e.clientY
  if (!scrollRaf) scrollRaf = requestAnimationFrame(autoScrollLoop)
  dropIndex.value = calcDropIndex(e.clientY)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  stopAutoScroll()
  const payload = editor.dragging
  const index = dropIndex.value ?? editor.page.components.length
  dropIndex.value = null
  if (!payload) return
  if (payload.kind === 'palette') editor.addComponent(payload.type, index)
  else editor.moveComponent(payload.id, index)
  editor.setDragging(null)
}

function onDragLeave(e: DragEvent) {
  const container = containerRef.value
  if (!container) return
  if (e.relatedTarget && container.contains(e.relatedTarget as Node)) return
  dropIndex.value = null
  stopAutoScroll()
}
</script>

<template>
  <main class="canvas-area">
    <div class="canvas-toolbar">
      <div class="zoom-group">
        <el-button :icon="ZoomOut" size="small" circle @click="zoomOut" />
        <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
        <el-button :icon="ZoomIn" size="small" circle @click="zoomIn" />
      </div>
      <el-popover placement="bottom-end" :width="240" trigger="click">
        <template #reference>
          <el-button :icon="Clock" size="small" text type="primary">
            历史({{ editor.past.length }})
          </el-button>
        </template>
        <HistoryTimeline />
      </el-popover>
    </div>

    <div class="canvas-scroll">
      <div class="phone-frame" :style="{ zoom: String(zoom) }">
        <div class="phone-statusbar">
          <span class="sb-time">9:41</span>
          <span class="sb-icons">●●● 📶 🔋</span>
        </div>
        <div
          ref="containerRef"
          class="canvas-container"
          :style="{ backgroundColor: editor.page.backgroundColor }"
          @dragover="onDragOver"
          @drop="onDrop"
          @dragleave="onDragLeave"
          @click="editor.selectComponent(null)"
        >
          <template v-if="editor.page.components.length">
            <template v-for="(comp, i) in editor.page.components" :key="comp.id">
              <div v-if="dropIndex === i" class="drop-indicator" />
              <EditableWrapper :comp="comp" />
            </template>
            <div v-if="dropIndex === editor.page.components.length" class="drop-indicator" />
          </template>
          <template v-else>
            <div v-if="dropIndex === 0" class="drop-indicator" />
            <div class="canvas-empty">从左侧拖拽或点击物料开始装修</div>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.canvas-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--visio-bg-layout);
}

.canvas-toolbar {
  flex-shrink: 0;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--visio-border);
  background: var(--visio-bg-panel);
}

.zoom-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-value {
  font-size: 12px;
  color: var(--visio-text-secondary);
  width: 40px;
  text-align: center;
}

.canvas-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 16px 80px;
}

.phone-frame {
  width: 377px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 41, 55, 0.12);
  overflow: hidden;
}

.phone-statusbar {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  font-size: 12px;
  color: #111827;
  background: #ffffff;
  border-bottom: 1px solid #f3f4f6;
}

.canvas-container {
  min-height: 600px;
  position: relative;
}

.canvas-empty {
  margin: 40px 20px;
  padding: 48px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

.drop-indicator {
  height: 3px;
  background: var(--visio-color-primary);
  border-radius: 2px;
  margin: 1px 6px;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}
</style>
