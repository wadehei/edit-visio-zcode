<script setup lang="ts">
import { computed } from 'vue'

import { useEditorStore } from '@/stores/editor'

const editor = useEditorStore()

/** past 倒序:最新操作在最上 */
const pastItems = computed(() =>
  editor.past.map((entry, index) => ({ index, label: entry.label })).reverse(),
)

/** future 正序:离当前最近的最上 */
const futureItems = computed(() =>
  editor.future.map((entry, index) => ({ index, label: entry.label })),
)

function jumpBack(index: number) {
  editor.jumpTo(index)
}

function jumpForward(index: number) {
  editor.jumpForward(index)
}
</script>

<template>
  <div class="history-timeline">
    <div v-if="!pastItems.length && !futureItems.length" class="history-empty">
      暂无历史,编辑画布后会记录每一步操作
    </div>
    <template v-else>
      <div
        v-for="item in pastItems"
        :key="`p-${item.index}`"
        class="history-item"
        title="点击回到这一步"
        @click="jumpBack(item.index)"
      >
        <span class="history-dot" />
        <span class="history-label">{{ item.label }}</span>
      </div>
      <div class="history-item current">
        <span class="history-dot" />
        <span class="history-label">当前状态</span>
      </div>
      <div
        v-for="item in futureItems"
        :key="`f-${item.index}`"
        class="history-item future"
        title="点击重做到这一步"
        @click="jumpForward(item.index)"
      >
        <span class="history-dot" />
        <span class="history-label">{{ item.label }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.history-timeline {
  width: 220px;
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.history-empty {
  padding: 16px 4px;
  font-size: 12px;
  color: var(--visio-text-disabled);
  text-align: center;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--visio-text-primary);
}

.history-item:hover {
  background: var(--visio-color-primary-light);
}

.history-item.current {
  background: var(--visio-color-primary);
  color: #ffffff;
  cursor: default;
  font-weight: 600;
}

.history-item.current:hover {
  background: var(--visio-color-primary);
}

.history-item.future {
  color: var(--visio-text-disabled);
}

.history-item.future:hover {
  background: #f3f4f6;
  color: var(--visio-text-secondary);
}

.history-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--visio-color-primary);
  flex-shrink: 0;
}

.history-item.current .history-dot {
  background: #ffffff;
}

.history-item.future .history-dot {
  background: #d1d5db;
}

.history-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
