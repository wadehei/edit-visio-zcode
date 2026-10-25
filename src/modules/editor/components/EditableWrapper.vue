<script setup lang="ts">
import { computed } from 'vue'

import type { ComponentSchema } from '@/shared/types'
import { getMaterial } from '@/modules/materials'
import { useEditorStore } from '@/stores/editor'
import { ArrowDown, ArrowUp, CopyDocument, Delete, Hide, View } from '@element-plus/icons-vue'

const props = defineProps<{ comp: ComponentSchema }>()
const editor = useEditorStore()

const def = computed(() => getMaterial(props.comp.type))
const selected = computed(() => editor.selectedId === props.comp.id)

function onSelect(e: MouseEvent) {
  e.stopPropagation()
  editor.selectComponent(props.comp.id)
}

function onDragStart(e: DragEvent) {
  editor.setDragging({ kind: 'canvas', id: props.comp.id })
  e.dataTransfer?.setData('application/x-visio-component', props.comp.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  editor.setDragging(null)
}
</script>

<template>
  <div
    class="editable-wrapper"
    :class="{ selected, hidden: !!comp.hidden }"
    :data-edit-item="comp.id"
    draggable="true"
    @click.capture.prevent
    @click="onSelect"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <component :is="def?.component" v-if="def" v-bind="comp.props" />
    <div v-else class="unknown-material">未知组件:{{ comp.type }}</div>

    <div v-if="selected" class="wrapper-tag">{{ def?.name ?? comp.type }}</div>

    <div v-if="selected" class="wrapper-actions" @click.stop>
      <button
        class="wa-btn"
        :title="comp.hidden ? '显示' : '隐藏'"
        @click="editor.toggleComponentHidden(comp.id)"
      >
        <el-icon :size="13"><Hide v-if="comp.hidden" /><View v-else /></el-icon>
      </button>
      <button class="wa-btn" title="上移" @click="editor.moveComponentUp(comp.id)">
        <el-icon :size="13"><ArrowUp /></el-icon>
      </button>
      <button class="wa-btn" title="下移" @click="editor.moveComponentDown(comp.id)">
        <el-icon :size="13"><ArrowDown /></el-icon>
      </button>
      <button class="wa-btn" title="复制" @click="editor.duplicateComponent(comp.id)">
        <el-icon :size="13"><CopyDocument /></el-icon>
      </button>
      <button class="wa-btn" title="删除" @click="editor.removeComponent(comp.id)">
        <el-icon :size="13"><Delete /></el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
.editable-wrapper {
  position: relative;
  cursor: grab;
}

.editable-wrapper:hover {
  outline: 1px dashed #94a3b8;
  outline-offset: -1px;
}

.editable-wrapper.selected {
  outline: 2px solid var(--visio-color-primary);
  outline-offset: -2px;
}

.editable-wrapper.hidden {
  opacity: 0.35;
  outline: 1px dashed #94a3b8;
  outline-offset: -1px;
}

.unknown-material {
  padding: 20px 12px;
  color: #ef4444;
  font-size: 13px;
  text-align: center;
  background: #fef2f2;
}

.wrapper-tag {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  background: var(--visio-color-primary);
  color: #ffffff;
  font-size: 12px;
  line-height: 1;
  padding: 5px 8px;
  border-bottom-right-radius: 6px;
}

.wrapper-actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--visio-color-primary);
  border-bottom-left-radius: 6px;
}

.wa-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  padding: 0;
}

.wa-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
