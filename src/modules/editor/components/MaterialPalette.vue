<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDown, ArrowUp, Delete } from '@element-plus/icons-vue'

import { MATERIAL_GROUPS } from '@/shared/constants'
import type { MaterialDefinition, MaterialGroup } from '@/shared/types'
import { materialList, getMaterial } from '@/modules/materials'
import { useEditorStore } from '@/stores/editor'
import { useTemplatesStore } from '@/stores/templates'

const editor = useEditorStore()
const templatesStore = useTemplatesStore()
const activeTab = ref<'materials' | 'layers' | 'templates'>('materials')

/** 图层面板内的拖拽排序(局部状态,不与画布拖拽混用) */
const layerListRef = ref<HTMLElement | null>(null)
const draggingLayerId = ref<string | null>(null)
const layerDropIndex = ref<number | null>(null)

function onLayerDragOver(e: DragEvent) {
  if (!draggingLayerId.value) return
  e.preventDefault()
  const items = Array.from(
    layerListRef.value?.querySelectorAll<HTMLElement>('[data-layer-item]') ?? [],
  )
  let index = items.length
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    if (e.clientY < rect.top + rect.height / 2) {
      index = i
      break
    }
  }
  layerDropIndex.value = index
}

function onLayerDrop(e: DragEvent) {
  e.preventDefault()
  const id = draggingLayerId.value
  const index = layerDropIndex.value
  draggingLayerId.value = null
  layerDropIndex.value = null
  if (!id || index === null) return
  editor.moveComponent(id, index)
}

function onLayerDragEnd() {
  draggingLayerId.value = null
  layerDropIndex.value = null
}

function materialsOf(group: MaterialGroup): MaterialDefinition[] {
  return materialList.filter((m) => m.group === group)
}

function onDragStart(m: MaterialDefinition, e: DragEvent) {
  editor.setDragging({ kind: 'palette', type: m.type })
  e.dataTransfer?.setData('application/x-visio-material', m.type)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <aside class="material-palette">
    <div class="palette-tabs">
      <button
        class="palette-tab"
        :class="{ active: activeTab === 'materials' }"
        @click="activeTab = 'materials'"
      >
        组件
      </button>
      <button
        class="palette-tab"
        :class="{ active: activeTab === 'layers' }"
        @click="activeTab = 'layers'"
      >
        图层
      </button>
      <button
        class="palette-tab"
        :class="{ active: activeTab === 'templates' }"
        @click="activeTab = 'templates'"
      >
        模板
      </button>
    </div>

    <div v-show="activeTab === 'materials'" class="palette-pane">
      <div v-for="group in MATERIAL_GROUPS" :key="group" class="palette-group">
        <div class="group-title">{{ group }}</div>
        <div class="group-grid">
          <div
            v-for="m in materialsOf(group)"
            :key="m.type"
            class="material-item"
            draggable="true"
            :title="m.description || m.name"
            @dragstart="onDragStart(m, $event)"
            @dragend="editor.setDragging(null)"
            @click="editor.addComponent(m.type)"
          >
            <el-icon :size="20"><component :is="m.icon" /></el-icon>
            <span class="material-name">{{ m.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'templates'" class="palette-pane">
      <div v-if="templatesStore.templates.length" class="layer-list">
        <div
          v-for="tpl in templatesStore.templates"
          :key="tpl.id"
          class="layer-item"
          :title="`添加「${tpl.name}」到画布`"
          @click="editor.addComponentFromTemplate(tpl)"
        >
          <el-icon :size="14">
            <component :is="getMaterial(tpl.type)?.icon ?? 'Grid'" />
          </el-icon>
          <span class="layer-name">{{ tpl.name }}</span>
          <span class="layer-actions" @click.stop>
            <el-icon class="la danger" @click="templatesStore.removeTemplate(tpl.id)">
              <Delete />
            </el-icon>
          </span>
        </div>
      </div>
      <div v-else class="layer-empty">
        还没有模板:选中画布组件,在右侧属性面板点「存为模板」
      </div>
    </div>

    <div v-show="activeTab === 'layers'" class="palette-pane">
      <div
        v-if="editor.page.components.length"
        ref="layerListRef"
        class="layer-list"
        @dragover="onLayerDragOver"
        @drop="onLayerDrop"
        @dragend="onLayerDragEnd"
        @dragleave="layerDropIndex = null"
      >
        <template v-for="(comp, i) in editor.page.components" :key="comp.id">
          <div v-if="layerDropIndex === i" class="layer-drop-line" />
          <div
            class="layer-item"
            :data-layer-item="comp.id"
            :class="{ selected: editor.selectedId === comp.id }"
            draggable="true"
            title="拖拽调整顺序,点击选中"
            @dragstart="draggingLayerId = comp.id"
            @click="editor.selectComponent(comp.id)"
          >
            <el-icon :size="14">
              <component :is="getMaterial(comp.type)?.icon ?? 'Grid'" />
            </el-icon>
            <span class="layer-name">
              {{ i + 1 }}. {{ getMaterial(comp.type)?.name ?? comp.type }}
            </span>
            <span class="layer-actions" @click.stop>
              <el-icon class="la" @click="editor.moveComponentUp(comp.id)"><ArrowUp /></el-icon>
              <el-icon class="la" @click="editor.moveComponentDown(comp.id)"><ArrowDown /></el-icon>
              <el-icon class="la danger" @click="editor.removeComponent(comp.id)"><Delete /></el-icon>
            </span>
          </div>
        </template>
        <div v-if="layerDropIndex === editor.page.components.length" class="layer-drop-line" />
      </div>
      <div v-else class="layer-empty">画布暂无组件</div>
    </div>
  </aside>
</template>

<style scoped>
.material-palette {
  width: 264px;
  flex-shrink: 0;
  background: var(--visio-bg-panel);
  border-right: 1px solid var(--visio-border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.palette-tabs {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid var(--visio-border);
  position: sticky;
  top: 0;
  background: var(--visio-bg-panel);
  z-index: 1;
}

.palette-tab {
  flex: 1;
  padding: 12px 0;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--visio-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.palette-tab.active {
  color: var(--visio-color-primary);
  border-bottom-color: var(--visio-color-primary);
  font-weight: 600;
}

.palette-pane {
  padding: 12px;
}

.palette-group {
  margin-bottom: 16px;
}

.group-title {
  font-size: 12px;
  color: var(--visio-text-secondary);
  margin: 8px 0;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.material-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px;
  border: 1px solid var(--visio-border);
  border-radius: 8px;
  cursor: grab;
  user-select: none;
  color: var(--visio-color-primary);
  transition: all 0.15s;
}

.material-item:hover {
  border-color: var(--visio-color-primary);
  background: var(--visio-color-primary-light);
}

.material-name {
  font-size: 12px;
  color: var(--visio-text-primary);
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 16px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
}

.layer-item:hover {
  background: #f5f7fa;
}

.layer-item.selected {
  background: var(--visio-color-primary-light);
  border-color: var(--visio-color-primary);
}

.layer-name {
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-actions {
  display: none;
  gap: 8px;
}

.layer-item:hover .layer-actions {
  display: flex;
}

.layer-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--visio-text-disabled);
  font-size: 12px;
}

.layer-drop-line {
  height: 2px;
  border-radius: 1px;
  background: var(--visio-color-primary);
  margin: 1px 0;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}

.la {
  cursor: pointer;
  color: var(--visio-text-secondary);
}

.la:hover {
  color: var(--visio-color-primary);
}

.la.danger:hover {
  color: var(--visio-color-danger);
}
</style>
