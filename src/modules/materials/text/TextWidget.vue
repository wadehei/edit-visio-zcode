<script setup lang="ts">
interface Props {
  content?: string
  fontSize?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  lineHeight?: number
}

withDefaults(defineProps<Props>(), {
  content: '请输入文本内容',
  fontSize: 14,
  color: '#333333',
  align: 'left',
  bold: false,
  lineHeight: 1.6,
})
</script>

<template>
  <div
    class="text-widget"
    :style="{
      fontSize: `${fontSize}px`,
      color,
      textAlign: align,
      fontWeight: bold ? 600 : 400,
      lineHeight,
    }"
  >
    {{ content }}
  </div>
</template>

<style scoped>
.text-widget {
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
