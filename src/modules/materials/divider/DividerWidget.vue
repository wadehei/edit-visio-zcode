<script setup lang="ts">
interface Props {
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  color?: string
  marginY?: number
}

withDefaults(defineProps<Props>(), {
  lineStyle: 'solid',
  color: '#e5e7eb',
  marginY: 8,
})
</script>

<template>
  <div class="divider-widget" :style="{ paddingTop: `${marginY}px`, paddingBottom: `${marginY}px` }">
    <div class="divider-line" :style="{ borderTop: `1px ${lineStyle} ${color}` }" />
  </div>
</template>

<style scoped>
.divider-widget {
  padding-left: 12px;
  padding-right: 12px;
}
</style>
