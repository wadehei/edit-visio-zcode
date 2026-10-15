<script setup lang="ts">
import { ElMessage } from 'element-plus'

import { PAGE_THEMES } from '@/shared/theme'
import type { PageTheme } from '@/shared/theme'
import { useEditorStore } from '@/stores/editor'

const editor = useEditorStore()

function apply(theme: PageTheme) {
  editor.applyTheme(theme)
  ElMessage.success(`已应用「${theme.name}」主题,可 Ctrl+Z 撤销`)
}
</script>

<template>
  <div class="theme-picker">
    <div class="theme-grid">
      <button
        v-for="t in PAGE_THEMES"
        :key="t.id"
        class="theme-card"
        :title="`应用「${t.name}」主题`"
        @click="apply(t)"
      >
        <span class="theme-swatch" :style="{ background: t.pageBg }">
          <span class="swatch-dot" :style="{ background: t.primary }" />
          <span class="swatch-bar" :style="{ background: t.noticeBg }" />
        </span>
        <span class="theme-name">{{ t.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.theme-card {
  border: 1px solid var(--visio-border);
  border-radius: 8px;
  background: #fff;
  padding: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.15s;
}

.theme-card:hover {
  border-color: var(--visio-color-primary);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.theme-swatch {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 44px;
  border-radius: 6px;
  padding: 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.swatch-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.swatch-bar {
  height: 6px;
  border-radius: 3px;
}

.theme-name {
  font-size: 12px;
  color: var(--visio-text-primary);
}
</style>
