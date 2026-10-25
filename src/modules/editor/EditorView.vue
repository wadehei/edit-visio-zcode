<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { toPageRecord } from '@/shared/page'
import { debounce } from '@/shared/utils/debounce'
import { useEditorStore } from '@/stores/editor'
import { usePagesStore } from '@/stores/pages'
import EditorHeader from './components/EditorHeader.vue'
import MaterialPalette from './components/MaterialPalette.vue'
import CanvasArea from './components/CanvasArea.vue'
import PropsPanel from './components/PropsPanel.vue'
import PageDoctorDialog from './components/PageDoctorDialog.vue'
import CommandPalette from './components/CommandPalette.vue'
import ShortcutsDialog from './components/ShortcutsDialog.vue'

const route = useRoute()
const router = useRouter()
const editor = useEditorStore()
const pagesStore = usePagesStore()

const leftCollapsed = ref(false)
const rightCollapsed = ref(false)
const doctorVisible = ref(false)
const paletteVisible = ref(false)
const shortcutsVisible = ref(false)

let suppressAutoSave = true
/** 落盘状态:编辑产生改动置 dirty,保存成功置 saved,驱动头部状态显示 */
const saveState = ref<'saved' | 'dirty'>('saved')

/** 仅在真实页面装载完成后才允许写存储,防止 HMR/重挂载竞态写入初始空页 */
function saveNow() {
  if (!editor.loaded) return
  pagesStore.upsert(toPageRecord(editor.page))
  saveState.value = 'saved'
}

/** 手动保存(Ctrl+S / 头部按钮):立即落盘并按结果提示 */
function onManualSave() {
  saveNow()
  if (pagesStore.persistError) ElMessage.error('页面保存失败,请检查浏览器存储空间')
  else ElMessage.success('页面已保存')
}

const autoSave = debounce(saveNow, 600)

watch(
  () => editor.page,
  () => {
    if (suppressAutoSave) {
      suppressAutoSave = false
      return
    }
    saveState.value = 'dirty'
    autoSave()
  },
  { deep: true },
)

// 持久化失败(常见于 localStorage 配额超限)必须显式提示,否则用户会误以为已保存
watch(
  () => pagesStore.persistError,
  (msg) => {
    if (msg) ElMessage.error(`保存失败:${msg}`)
  },
)

// 直接关闭/刷新标签页不触发 onBeforeUnmount,用 pagehide 补一次同步落盘
function onPageHide() {
  autoSave.cancel()
  saveNow()
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const typing =
    !!target &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  if (typing) return

  const key = e.key.toLowerCase()
  if ((e.ctrlKey || e.metaKey) && key === 'k') {
    e.preventDefault()
    paletteVisible.value = true
  } else if ((e.ctrlKey || e.metaKey) && key === 'z') {
    e.preventDefault()
    if (e.shiftKey) editor.redo()
    else editor.undo()
  } else if ((e.ctrlKey || e.metaKey) && key === 'y') {
    e.preventDefault()
    editor.redo()
  } else if ((e.ctrlKey || e.metaKey) && key === 's') {
    e.preventDefault()
    onManualSave()
  } else if ((e.ctrlKey || e.metaKey) && key === 'c' && editor.selectedId) {
    e.preventDefault()
    editor.copyComponent(editor.selectedId)
  } else if ((e.ctrlKey || e.metaKey) && key === 'x' && editor.selectedId) {
    e.preventDefault()
    editor.cutComponent(editor.selectedId)
  } else if ((e.ctrlKey || e.metaKey) && key === 'v') {
    e.preventDefault()
    if (!editor.pasteComponent()) ElMessage.warning('剪贴板没有可粘贴的组件')
  } else if ((e.ctrlKey || e.metaKey) && key === 'd' && editor.selectedId) {
    e.preventDefault()
    editor.duplicateComponent(editor.selectedId)
  } else if (e.key === 'Escape') {
    editor.selectComponent(null)
  } else if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    shortcutsVisible.value = true
  } else if (e.altKey && e.key === 'ArrowUp' && editor.selectedId) {
    e.preventDefault()
    editor.moveComponentUp(editor.selectedId)
  } else if (e.altKey && e.key === 'ArrowDown' && editor.selectedId) {
    e.preventDefault()
    editor.moveComponentDown(editor.selectedId)
  } else if (e.key === 'Delete' && editor.selectedId) {
    editor.removeComponent(editor.selectedId)
  }
}

onMounted(() => {
  const id = String(route.params.id ?? '')
  const record = pagesStore.getPage(id)
  if (!record) {
    ElMessage.error('页面不存在或已被删除')
    router.replace('/')
    return
  }
  editor.loadPage(record.schema)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pagehide', onPageHide)
})

onBeforeUnmount(() => {
  autoSave.cancel()
  saveNow()
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', onPageHide)
})
</script>

<template>
  <div class="editor-view">
    <EditorHeader
      :left-collapsed="leftCollapsed"
      :right-collapsed="rightCollapsed"
      :save-state="saveState"
      @toggle-left="leftCollapsed = !leftCollapsed"
      @toggle-right="rightCollapsed = !rightCollapsed"
      @open-doctor="doctorVisible = true"
      @open-palette="paletteVisible = true"
      @open-shortcuts="shortcutsVisible = true"
      @save="onManualSave"
    />
    <div class="editor-body">
      <MaterialPalette v-show="!leftCollapsed" />
      <CanvasArea />
      <PropsPanel v-show="!rightCollapsed" />
    </div>
    <PageDoctorDialog v-model="doctorVisible" />
    <CommandPalette
      v-model="paletteVisible"
      @open-doctor="doctorVisible = true"
      @open-shortcuts="shortcutsVisible = true"
    />
    <ShortcutsDialog v-model="shortcutsVisible" />
  </div>
</template>

<style scoped>
.editor-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--visio-bg-layout);
}

.editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
}
</style>
