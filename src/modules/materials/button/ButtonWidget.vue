<script setup lang="ts">
import { computed } from 'vue'

import { safeLinkUrl } from '@/shared/utils/url'

interface Props {
  text?: string
  link?: string
  bgColor?: string
  color?: string
  height?: number
  radius?: number
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: '立即购买',
  link: '',
  bgColor: '#4f46e5',
  color: '#ffffff',
  height: 44,
  radius: 22,
  block: true,
})

// props 来自用户输入与导入的 JSON,渲染前白名单过滤可执行 scheme(javascript: 等)
const safeLink = computed(() => safeLinkUrl(props.link))
</script>

<template>
  <component
    :is="safeLink ? 'a' : 'div'"
    :href="safeLink"
    target="_blank"
    rel="noopener noreferrer"
    class="button-widget"
    :class="{ 'is-block': block }"
  >
    <span
      class="button-inner"
      :style="{
        background: bgColor,
        color,
        height: `${height}px`,
        lineHeight: `${height}px`,
        borderRadius: `${radius}px`,
      }"
    >
      {{ text }}
    </span>
  </component>
</template>

<style scoped>
.button-widget {
  padding: 10px 12px;
  display: flex;
  justify-content: center;
  text-decoration: none;
}

.button-inner {
  display: inline-block;
  padding: 0 32px;
  font-size: 15px;
  cursor: pointer;
  white-space: nowrap;
}

.is-block .button-inner {
  flex: 1;
  text-align: center;
}
</style>
