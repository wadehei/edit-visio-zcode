<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderAdd } from '@element-plus/icons-vue'

import type { PropField } from '@/shared/types'
import { getMaterial } from '@/modules/materials'
import { useEditorStore } from '@/stores/editor'
import { useTemplatesStore } from '@/stores/templates'
import SchemaForm from './SchemaForm.vue'
import ThemePicker from './ThemePicker.vue'

const editor = useEditorStore()
const templatesStore = useTemplatesStore()

const pageFields: PropField[] = [
  { type: 'input', key: 'name', label: '页面名称', placeholder: '用于后台管理' },
  { type: 'input', key: 'title', label: '页面标题', placeholder: '浏览器/分享时展示' },
  { type: 'color', key: 'backgroundColor', label: '页面背景色' },
]

const comp = computed(() => editor.selectedComponent)
const def = computed(() => (comp.value ? getMaterial(comp.value.type) : undefined))

const pageModel = computed<Record<string, unknown>>(() => ({
  name: editor.page.name,
  title: editor.page.title,
  backgroundColor: editor.page.backgroundColor,
}))

function onPropChange(key: string, value: unknown) {
  if (comp.value) editor.updateComponentProp(comp.value.id, key, value)
}

function onPageChange(key: string, value: unknown) {
  if (key === 'name' || key === 'title' || key === 'backgroundColor') {
    editor.updatePageSetting(key, String(value))
  }
}

async function saveAsTemplate() {
  const comp = editor.selectedComponent
  if (!comp) return
  const def = getMaterial(comp.type)
  let name: string
  try {
    const { value } = await ElMessageBox.prompt('给模板起个名字', '存为模板', {
      inputValue: `${def?.name ?? comp.type} 模板`,
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
    })
    name = value.trim()
  } catch {
    return // 用户取消
  }
  const saved = templatesStore.saveTemplate(name, comp.type, comp.props)
  if (!saved) {
    ElMessage.error('模板保存失败,请检查浏览器存储空间')
    return
  }
  ElMessage.success('模板已保存,可在左侧「模板」页签中使用')
}
</script>

<template>
  <aside class="props-panel">
    <template v-if="comp && def">
      <div class="panel-header">
        <span class="panel-title">{{ def.name }}</span>
        <span v-if="def.description" class="panel-desc">{{ def.description }}</span>
        <el-button class="tpl-btn" size="small" text type="primary" :icon="FolderAdd" @click="saveAsTemplate">
          存为模板
        </el-button>
      </div>
      <SchemaForm :fields="def.propsSchema" :model="comp.props" @change="onPropChange" />
    </template>

    <template v-else-if="comp">
      <div class="panel-header">
        <span class="panel-title">未知组件</span>
      </div>
      <div class="panel-tip">
        组件类型 "{{ comp.type }}" 未注册,可能来自导入的旧数据,已按占位显示。
      </div>
    </template>

    <template v-else>
      <div class="panel-header">
        <span class="panel-title">页面设置</span>
      </div>
      <SchemaForm :fields="pageFields" :model="pageModel" @change="onPageChange" />
      <div class="panel-section">
        <div class="panel-section-title">一键换肤</div>
        <ThemePicker />
      </div>
      <div class="panel-tip">点击画布中的组件可编辑其属性;点击画布空白处回到页面设置。</div>
    </template>
  </aside>
</template>

<style scoped>
.props-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--visio-bg-panel);
  border-left: 1px solid var(--visio-border);
  overflow-y: auto;
  padding: 16px 14px;
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--visio-border);
  position: relative;
}

.tpl-btn {
  position: absolute;
  top: -4px;
  right: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
}

.panel-desc {
  font-size: 12px;
  color: var(--visio-text-secondary);
}

.panel-tip {
  margin-top: 20px;
  padding: 10px;
  font-size: 12px;
  color: var(--visio-text-secondary);
  background: var(--visio-color-primary-light);
  border-radius: 6px;
  line-height: 1.6;
}

.panel-section {
  margin-top: 20px;
}

.panel-section-title {
  font-size: 12px;
  color: var(--visio-text-secondary);
  margin-bottom: 10px;
}
</style>
