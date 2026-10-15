<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface CarouselImage {
  url?: string
  link?: string
}

interface Props {
  images?: CarouselImage[]
  height?: number
  interval?: number
  autoplay?: boolean
  radius?: number
}

const props = withDefaults(defineProps<Props>(), {
  images: () => [],
  height: 160,
  interval: 3,
  autoplay: true,
  radius: 0,
})

const current = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const count = computed(() => props.images.length)

const trackStyle = computed(() => ({
  width: `${count.value * 100}%`,
  transform: `translateX(-${current.value * (100 / Math.max(count.value, 1))}%)`,
}))

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function start() {
  stop()
  if (props.autoplay && count.value > 1) {
    timer = setInterval(() => {
      current.value = (current.value + 1) % count.value
    }, Math.max(1, props.interval) * 1000)
  }
}

watch(() => [props.autoplay, props.interval, count.value], start)
onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <div class="carousel-widget" :style="{ borderRadius: `${radius}px`, overflow: 'hidden' }">
    <div v-if="count" class="carousel-track" :style="trackStyle">
      <div
        v-for="(img, i) in images"
        :key="i"
        class="carousel-slide"
        :style="{ width: `${100 / count}%`, height: `${height}px` }"
      >
        <a
          :href="img.link || undefined"
          target="_blank"
          class="slide-link"
          draggable="false"
        >
          <img v-if="img.url" :src="img.url" alt="" draggable="false" />
          <div v-else class="slide-placeholder">轮播图 {{ i + 1 }}</div>
        </a>
      </div>
    </div>
    <div v-else class="carousel-empty" :style="{ height: `${height}px` }">请添加轮播图片</div>
    <div v-if="count > 1" class="carousel-dots">
      <span
        v-for="i in count"
        :key="i"
        class="dot"
        :class="{ active: i - 1 === current }"
        @click="current = i - 1"
      />
    </div>
  </div>
</template>

<style scoped>
.carousel-widget {
  position: relative;
  background: #f1f5f9;
}

.carousel-track {
  display: flex;
  transition: transform 0.4s ease;
}

.carousel-slide {
  flex-shrink: 0;
}

.slide-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  background: repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 12px, #e2e8f0 12px, #e2e8f0 24px);
}

.carousel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  border: 1px dashed #cbd5e1;
  margin: 8px;
  border-radius: 8px;
  background: #fff;
}

.carousel-dots {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 5px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.dot.active {
  width: 14px;
  background: #ffffff;
}
</style>
