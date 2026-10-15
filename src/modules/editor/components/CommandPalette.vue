<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import { materialList, getMaterial } from '@/modules/materials'
import { PAGE_THEMES } from '@/shared/theme'
import { toPageRecord } from '@/shared/page'
import { useEditorStore } from '@/stores/editor'
import { usePagesStore } from '@/stores/pages'
import { useTemplatesStore } from '@/stores/templates'

interface CommandItem {
  key: string
  label: string
  group: string
  run: () => void
}

const visible = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  (e: 'open-doctor'): void
}>()

const editor = useEditorStore()
const pagesStore = usePagesStore()
const templatesStore = useTemplatesStore()
const router = useRouter()

async function promptSaveTemplate() {
  const comp = editor.selectedComponent
  if (!comp) {
    ElMessage.warning('请先在画布选中一个组件')
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('给模板起个名字', '存为模板', {
      inputValue: `${getMaterial(comp.type)?.name ?? comp.type} 模板`,
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
    })
    templatesStore.saveTemplate(value.trim(), comp.type, comp.props)
    ElMessage.success('模板已保存')
  } catch {
    /* 用户取消 */
  }
}

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

function savePage() {
  if (!editor.loaded) return
  pagesStore.upsert(toPageRecord(editor.page))
  ElMessage.success('页面已保存')
}

function openPreview() {
  window.open(router.resolve(`/preview/${editor.page.id}`).href, '_blank')
}

const allCommands = computed<CommandItem[]>(() => [
  ...materialList.map((m) => ({
    key: `add:${m.type}`,
    label: `添加组件:${m.name}`,
    group: '物料',
    run: () => editor.addComponent(m.type),
  })),
  ...PAGE_THEMES.map((t) => ({
    key: `theme:${t.id}`,
    label: `应用主题:${t.name}`,
    group: '主题',
    run: () => {
      editor.applyTheme(t)
      ElMessage.success(`已应用「${t.name}」主题`)
    },
  })),
  {
    key: 'save-template',
    label: '存为模板(选中组件)',
    group: '操作',
    run: () => void promptSaveTemplate(),
  },
  {
    key: 'doctor',
    label: '页面体检',
    group: '操作',
    run: () => emit('open-doctor'),
  },
  { key: 'undo', label: '撤销', group: '操作', run: () => editor.undo() },
  { key: 'redo', label: '重做', group: '操作', run: () => editor.redo() },
  { key: 'save', label: '保存页面', group: '操作', run: savePage },
  { key: 'preview', label: '打开预览', group: '操作', run: openPreview },
  {
    key: 'clear',
    label: '清空画布(可撤销)',
    group: '操作',
    run: () => {
      editor.clearComponents()
      ElMessage.success('已清空,可 Ctrl+Z 撤销')
    },
  },
])

const filteredCommands = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allCommands.value
  return allCommands.value.filter((c) => c.label.toLowerCase().includes(q))
})

watch(filteredCommands, () => {
  activeIndex.value = 0
})

watch(visible, async (open) => {
  if (open) {
    query.value = ''
    activeIndex.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

function runCommand(item: CommandItem) {
  visible.value = false
  item.run()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % Math.max(filteredCommands.value.length, 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value =
      (activeIndex.value - 1 + filteredCommands.value.length) % Math.max(filteredCommands.value.length, 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = filteredCommands.value[activeIndex.value]
    if (item) runCommand(item)
  }
}
</script>

<template>
  <el-dialog v-model="visible" width="520px" class="command-palette-dialog" append-to-body>
    <template #header>
      <div class="palette-head">
        <span class="palette-title">命令面板</span>
        <span class="palette-hint">↑↓ 选择 · Enter 执行 · Esc 关闭</span>
      </div>
    </template>

    <input
      ref="inputRef"
      v-model="query"
      class="palette-input"
      placeholder="搜索:组件 / 主题 / 操作…"
      @keydown="onKeydown"
    />

    <div class="palette-list">
      <div
        v-for="(item, i) in filteredCommands"
        :key="item.key"
        class="palette-item"
        :class="{ active: i === activeIndex }"
        @mouseenter="activeIndex = i"
        @click="runCommand(item)"
      >
        <span class="item-group">{{ item.group }}</span>
        <span class="item-label">{{ item.label }}</span>
      </div>
      <div v-if="!filteredCommands.length" class="palette-empty">没有匹配的命令</div>
    </div>
  </el-dialog>
</template>

<style scoped>
.palette-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.palette-title {
  font-size: 14px;
  font-weight: 600;
}

.palette-hint {
  font-size: 12px;
  color: var(--visio-text-disabled);
}

.palette-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--visio-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  margin-bottom: 10px;
}

.palette-input:focus {
  border-color: var(--visio-color-primary);
}

.palette-list {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.palette-item.active {
  background: var(--visio-color-primary-light);
}

.item-group {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--visio-text-secondary);
  background: #f3f4f6;
  border-radius: 4px;
  padding: 2px 6px;
}

.palette-item.active .item-group {
  color: var(--visio-color-primary);
  background: #fff;
}

.item-label {
  flex: 1;
}

.palette-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--visio-text-disabled);
  font-size: 13px;
}
</style>
