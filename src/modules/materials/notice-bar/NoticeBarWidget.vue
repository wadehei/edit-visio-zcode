<script setup lang="ts">
interface Props {
  text?: string
  color?: string
  bgColor?: string
  scrollable?: boolean
}

withDefaults(defineProps<Props>(), {
  text: '这里是公告内容',
  color: '#ffffff',
  bgColor: '#ff976a',
  scrollable: true,
})
</script>

<template>
  <div class="notice-bar-widget" :style="{ background: bgColor, color }">
    <span class="notice-icon">📢</span>
    <div class="notice-content">
      <span class="notice-text" :class="{ scrolling: scrollable }">{{ text }}</span>
    </div>
  </div>
</template>

<style scoped>
.notice-bar-widget {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 36px;
  font-size: 13px;
}

.notice-content {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
}

.notice-text.scrolling {
  display: inline-block;
  padding-left: 100%;
  animation: notice-marquee 10s linear infinite;
}

@keyframes notice-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>
