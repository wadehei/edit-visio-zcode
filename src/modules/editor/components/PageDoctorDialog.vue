<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { WarningFilled, InfoFilled, Aim } from '@element-plus/icons-vue'

import { inspectPage } from '../doctor'
import { useEditorStore } from '@/stores/editor'

const visible = defineModel<boolean>({ required: true })

const editor = useEditorStore()
const nonce = ref(0)

const issues = computed(() => {
  void nonce.value
  return inspectPage(editor.page)
})

const warnings = computed(() => issues.value.filter((i) => i.level === 'warning'))
const infos = computed(() => issues.value.filter((i) => i.level === 'info'))

const verdict = computed(() => {
  if (!issues.value.length) return { text: '优秀', type: 'success' as const }
  if (warnings.value.length) return { text: '待改进', type: 'danger' as const }
  return { text: '良好', type: 'warning' as const }
})

function locate(componentId: string | undefined) {
  if (!componentId) return
  editor.selectComponent(componentId)
  visible.value = false
  void nextTick(() => {
    document
      .querySelector(`[data-edit-item="${componentId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function rescan() {
  nonce.value += 1
}
</script>

<template>
  <el-dialog v-model="visible" title="页面体检" width="480px" append-to-body>
    <div class="doctor-summary">
      <el-tag :type="verdict.type" size="large" effect="dark">{{ verdict.text }}</el-tag>
      <span class="summary-text">
        {{ warnings.length }} 个问题 · {{ infos.length }} 条建议
      </span>
      <el-button size="small" text @click="rescan">重新扫描</el-button>
    </div>

    <div v-if="issues.length" class="issue-list">
      <div v-for="(issue, i) in issues" :key="i" class="issue-item" :class="issue.level">
        <el-icon class="issue-icon" :size="16">
          <WarningFilled v-if="issue.level === 'warning'" />
          <InfoFilled v-else />
        </el-icon>
        <span class="issue-message">{{ issue.message }}</span>
        <el-button
          v-if="issue.componentId"
          size="small"
          text
          type="primary"
          :icon="Aim"
          @click="locate(issue.componentId)"
        >
          定位
        </el-button>
      </div>
    </div>
    <el-empty v-else description="没有发现问题,页面状态很健康" :image-size="72" />
  </el-dialog>
</template>

<style scoped>
.doctor-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-text {
  flex: 1;
  font-size: 13px;
  color: var(--visio-text-secondary);
}

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.issue-item.warning {
  background: #fffbeb;
  color: #92400e;
}

.issue-item.info {
  background: #eff6ff;
  color: #1e40af;
}

.issue-icon {
  flex-shrink: 0;
}

.issue-message {
  flex: 1;
}
</style>
