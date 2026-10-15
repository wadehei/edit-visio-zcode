<script setup lang="ts">
interface Props {
  height?: number
}

withDefaults(defineProps<Props>(), {
  height: 20,
})
</script>

<template>
  <div class="spacer-widget" :style="{ height: `${height}px` }" />
</template>

<style scoped>
.spacer-widget {
  width: 100%;
}
</style>
