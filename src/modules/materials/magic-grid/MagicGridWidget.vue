<script setup lang="ts">
import { computed } from 'vue'

import { safeImageUrl, safeLinkUrl } from '@/shared/utils/url'

interface Props {
  cols?: number
  rows?: number
  height?: number
  gap?: number
  cells?: Array<{ image?: string; link?: string }>
}

const props = withDefaults(defineProps<Props>(), {
  cols: 2,
  rows: 1,
  height: 130,
  gap: 4,
  cells: () => [],
})

const cellCount = computed(() => Math.max(1, props.cols) * Math.max(1, props.rows))

const displayCells = computed(() => props.cells.slice(0, cellCount.value))

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.cols}, 1fr)`,
  gap: `${props.gap}px`,
}))
</script>

<template>
  <div class="magic-grid-widget" :style="{ padding: `${gap}px` }">
    <div :style="gridStyle">
      <div
        v-for="(cell, i) in displayCells"
        :key="i"
        class="grid-cell"
        :style="{ height: `${height}px`, borderRadius: '8px', overflow: 'hidden' }"
      >
        <a
          :href="safeLinkUrl(cell.link)"
          target="_blank"
          rel="noopener noreferrer"
          class="cell-link"
          draggable="false"
        >
          <img v-if="safeImageUrl(cell.image)" :src="safeImageUrl(cell.image)" alt="" draggable="false" />
          <div v-else class="cell-placeholder">格子 {{ i + 1 }}</div>
        </a>
      </div>
    </div>
    <div v-if="!displayCells.length" class="grid-empty" :style="{ height: `${height}px` }">
      请添加图片格子
    </div>
  </div>
</template>

<style scoped>
.grid-cell {
  background: #f1f5f9;
  position: relative;
}

.cell-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
}

.grid-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cell-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fff;
}

.grid-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fff;
}
</style>
