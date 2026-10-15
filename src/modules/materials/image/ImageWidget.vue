<script setup lang="ts">
interface Props {
  src?: string
  link?: string
  height?: number
  fit?: 'cover' | 'contain' | 'fill'
  radius?: number
}

withDefaults(defineProps<Props>(), {
  src: '',
  link: '',
  height: 0,
  fit: 'cover',
  radius: 0,
})
</script>

<template>
  <component
    :is="link ? 'a' : 'div'"
    :href="link || undefined"
    target="_blank"
    class="image-widget"
    :style="{
      borderRadius: `${radius}px`,
      height: height > 0 ? `${height}px` : 'auto',
      overflow: 'hidden',
      display: 'block',
    }"
  >
    <img
      v-if="src"
      :src="src"
      alt=""
      :style="{ objectFit: fit, width: '100%', height: '100%' }"
      draggable="false"
    />
    <div v-else class="image-placeholder">请设置图片</div>
  </component>
</template>

<style scoped>
.image-widget {
  position: relative;
  width: 100%;
  background: #f8fafc;
  text-decoration: none;
}

.image-placeholder {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  background: #fff;
}
</style>
