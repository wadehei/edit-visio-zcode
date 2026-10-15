<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  ArrowLeft,
  Check,
  CircleCheck,
  Fold,
  Expand,
  MagicStick,
  RefreshLeft,
  RefreshRight,
  View,
} from '@element-plus/icons-vue'

import type { PageSchema } from '@/shared/types'
import { toPageRecord } from '@/shared/page'
import { downloadJson, readJsonFile } from '@/shared/utils/download'
import { formatDateTime } from '@/shared/utils/format'
import { useEditorStore } from '@/stores/editor'
import { usePagesStore } from '@/stores/pages'

const router = useRouter()
const editor = useEditorStore()
const pagesStore = usePagesStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{
  (e: 'toggle-left'): void
  (e: 'toggle-right'): void
  (e: 'open-doctor'): void
  (e: 'open-palette'): void
}>()

defineProps<{
  leftCollapsed: boolean
  rightCollapsed: boolean
}>()

const pageName = computed({
  get: () => editor.page.name,
  set: (v: string) => editor.updatePageSetting('name', v),
})

const lastSavedText = computed(() => {
  const record = pagesStore.getPage(editor.page.id)
  return record ? formatDateTime(record.updatedAt) : '尚未保存'
})

function saveNow() {
  if (!editor.loaded) return
  pagesStore.upsert(toPageRecord(editor.page))
  ElMessage.success('页面已保存')
}

function onCommand(cmd: string | number | object) {
  const c = String(cmd)
  if (c === 'export') {
    downloadJson(`${editor.page.name || 'page'}.json`, editor.page)
  } else if (c === 'import') {
    fileInputRef.value?.click()
  } else if (c === 'clear') {
    void clearCanvas()
  }
}

async function clearCanvas() {
  try {
    await ElMessageBox.confirm('确定清空画布中的所有组件吗?', '清空画布', { type: 'warning' })
  } catch {
    return
  }
  editor.clearComponents()
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const data = (await readJsonFile(file)) as PageSchema
    if (!data || !Array.isArray(data.components)) throw new Error('invalid schema')
    editor.loadPage({ ...data, id: editor.page.id })
    pagesStore.upsert(toPageRecord(editor.page))
    ElMessage.success('导入成功')
  } catch {
    ElMessage.error('导入失败:文件不是有效的页面 JSON')
  }
}
</script>

<template>
  <header class="editor-header">
    <div class="header-left">
      <el-tooltip :content="leftCollapsed ? '展开物料面板' : '收起物料面板'" placement="bottom">
        <span class="header-btn-wrap">
          <el-button
            :icon="leftCollapsed ? Expand : Fold"
            circle
            size="small"
            @click="emit('toggle-left')"
          />
        </span>
      </el-tooltip>
      <el-button :icon="ArrowLeft" text @click="router.push('/')">页面列表</el-button>
      <el-input v-model="pageName" class="page-name-input" size="small" maxlength="30" />
    </div>

    <div class="header-right">
      <el-tooltip content="撤销 Ctrl+Z" placement="bottom">
        <span class="header-btn-wrap">
          <el-button
            :icon="RefreshLeft"
            :disabled="!editor.canUndo"
            circle
            size="small"
            @click="editor.undo()"
          />
        </span>
      </el-tooltip>
      <el-tooltip content="重做 Ctrl+Shift+Z" placement="bottom">
        <span class="header-btn-wrap">
          <el-button
            :icon="RefreshRight"
            :disabled="!editor.canRedo"
            circle
            size="small"
            @click="editor.redo()"
          />
        </span>
      </el-tooltip>

      <el-dropdown @command="onCommand">
        <el-button size="small">
          更多
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="export">导出 JSON</el-dropdown-item>
            <el-dropdown-item command="import">导入 JSON</el-dropdown-item>
            <el-dropdown-item command="clear" divided>清空画布</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <router-link :to="`/preview/${editor.page.id}`" target="_blank" class="header-btn-wrap">
        <el-button :icon="View" size="small">预览</el-button>
      </router-link>

      <span class="save-status" title="内容变更后 600ms 自动保存到本地">已自动保存 {{ lastSavedText }}</span>

      <el-tooltip content="命令面板 Ctrl+K" placement="bottom">
        <span class="header-btn-wrap">
          <el-button :icon="MagicStick" circle size="small" @click="emit('open-palette')" />
        </span>
      </el-tooltip>

      <el-tooltip content="页面体检:扫描占位文本/空图/缺链接" placement="bottom">
        <span class="header-btn-wrap">
          <el-button :icon="CircleCheck" size="small" @click="emit('open-doctor')">体检</el-button>
        </span>
      </el-tooltip>

      <el-tooltip :content="rightCollapsed ? '展开属性面板' : '收起属性面板'" placement="bottom">
        <span class="header-btn-wrap">
          <el-button
            :icon="rightCollapsed ? Expand : Fold"
            circle
            size="small"
            @click="emit('toggle-right')"
          />
        </span>
      </el-tooltip>

      <el-button type="primary" size="small" :icon="Check" @click="saveNow">保存</el-button>

      <input
        ref="fileInputRef"
        type="file"
        accept="application/json,.json"
        class="hidden-file"
        @change="onImportFile"
      />
    </div>
  </header>
</template>

<style scoped>
.editor-header {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--visio-bg-panel);
  border-bottom: 1px solid var(--visio-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-name-input {
  width: 200px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-btn-wrap {
  display: inline-flex;
}

.save-status {
  font-size: 12px;
  color: var(--visio-text-disabled);
  white-space: nowrap;
}

.hidden-file {
  display: none;
}
</style>
