<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

import PageRenderer from '@/modules/renderer/PageRenderer.vue'
import { CANVAS_WIDTH } from '@/shared/constants'
import { formatDateTime } from '@/shared/utils/format'
import { usePageTemplatesStore, type PageTemplate } from '@/stores/page-templates'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'use', t: PageTemplate): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const pageTemplatesStore = usePageTemplatesStore()

function useTemplate(t: PageTemplate) {
  emit('use', t)
  visible.value = false
}

function removeTemplate(t: PageTemplate) {
  pageTemplatesStore.removePageTemplate(t.id)
  ElMessage.success('模板已删除')
}
</script>

<template>
  <el-dialog v-model="visible" title="从页面模板创建" width="640px">
    <div v-if="pageTemplatesStore.templates.length" class="tpl-grid">
      <div v-for="t in pageTemplatesStore.templates" :key="t.id" class="tpl-card">
        <div class="tpl-thumb" @click="useTemplate(t)">
          <div class="tpl-thumb-scale" :style="{ width: `${CANVAS_WIDTH}px` }">
            <PageRenderer :page="t.schema" />
          </div>
          <div v-if="!t.schema.components.length" class="tpl-thumb-empty">空白模板</div>
        </div>
        <div class="tpl-info">
          <div class="tpl-name" :title="t.name">{{ t.name }}</div>
          <div class="tpl-meta">
            {{ t.schema.components.length }} 个组件 · {{ formatDateTime(t.createdAt) }}
          </div>
          <div class="tpl-actions">
            <el-button type="primary" size="small" @click="useTemplate(t)">使用</el-button>
            <el-button size="small" :icon="Delete" @click="removeTemplate(t)" />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="tpl-empty">
      还没有页面模板:进入编辑器,「更多 → 保存为页面模板」即可把当前页面存为模板
    </div>
  </el-dialog>
</template>

<style scoped>
.tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.tpl-card {
  border: 1px solid var(--visio-border);
  border-radius: 8px;
  overflow: hidden;
}

.tpl-thumb {
  position: relative;
  height: 110px;
  overflow: hidden;
  background: #fff;
  border-bottom: 1px solid var(--visio-border);
  cursor: pointer;
  display: flex;
  justify-content: center;
}

.tpl-thumb-scale {
  transform: scale(0.29);
  transform-origin: top center;
  pointer-events: none;
}

.tpl-thumb-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--visio-text-disabled);
  font-size: 12px;
  background: var(--visio-bg-panel);
}

.tpl-info {
  padding: 8px 10px 10px;
}

.tpl-name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpl-meta {
  font-size: 11px;
  color: var(--visio-text-secondary);
  margin: 4px 0 8px;
}

.tpl-actions {
  display: flex;
  gap: 6px;
}

.tpl-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--visio-text-secondary);
  font-size: 13px;
}
</style>
