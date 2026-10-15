<script setup lang="ts">
interface Props {
  text?: string
  link?: string
  bgColor?: string
  color?: string
  height?: number
  radius?: number
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  text: '立即购买',
  link: '',
  bgColor: '#4f46e5',
  color: '#ffffff',
  height: 44,
  radius: 22,
  block: true,
})
</script>

<template>
  <component
    :is="link ? 'a' : 'div'"
    :href="link || undefined"
    target="_blank"
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
