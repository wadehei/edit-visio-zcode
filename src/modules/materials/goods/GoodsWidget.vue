<script setup lang="ts">
interface GoodsItem {
  title?: string
  price?: string
  originPrice?: string
  image?: string
  tag?: string
  link?: string
}

interface Props {
  layout?: 'two' | 'three' | 'list'
  items?: GoodsItem[]
}

withDefaults(defineProps<Props>(), {
  layout: 'two',
  items: () => [],
})
</script>

<template>
  <div class="goods-widget">
    <div v-if="items.length" class="goods-list" :class="`layout-${layout}`">
      <a
        v-for="(item, i) in items"
        :key="i"
        :href="item.link || undefined"
        target="_blank"
        class="goods-card-link"
        draggable="false"
      >
        <div class="goods-card">
        <div class="goods-pic">
          <img v-if="item.image" :src="item.image" alt="" draggable="false" />
          <div v-else class="goods-pic-placeholder">商品图</div>
          <span v-if="item.tag" class="goods-tag">{{ item.tag }}</span>
        </div>
        <div class="goods-info">
          <div class="goods-title">{{ item.title || '商品标题' }}</div>
          <div class="goods-price-row">
            <span class="goods-price"><i>¥</i>{{ item.price || '0' }}</span>
            <span v-if="item.originPrice" class="goods-origin">¥{{ item.originPrice }}</span>
          </div>
        </div>
        </div>
      </a>
    </div>
    <div v-else class="goods-empty">请添加商品</div>
  </div>
</template>

<style scoped>
.goods-widget {
  padding: 4px;
}

.goods-list.layout-two {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.goods-list.layout-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.goods-list.layout-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goods-card-link {
  text-decoration: none;
  display: block;
}

.goods-list.layout-list .goods-card-link {
  display: flex;
}

.goods-card {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
}

.goods-list.layout-list .goods-card {
  display: flex;
}

.goods-pic {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #f3f4f6;
}

.goods-list.layout-list .goods-pic {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  aspect-ratio: auto;
}

.goods-pic img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.goods-pic-placeholder {
  position: absolute;
  inset: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
}

.goods-tag {
  position: absolute;
  top: 0;
  left: 0;
  background: #ff4d4f;
  color: #ffffff;
  font-size: 11px;
  line-height: 1;
  padding: 4px 8px;
  border-bottom-right-radius: 8px;
}

.goods-info {
  padding: 8px 10px 10px;
}

.goods-list.layout-three .goods-info {
  padding: 6px;
}

.goods-title {
  font-size: 13px;
  color: #333333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.goods-list.layout-three .goods-title {
  font-size: 12px;
}

.goods-list.layout-list .goods-title {
  -webkit-line-clamp: 1;
}

.goods-price-row {
  margin-top: 6px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.goods-price {
  color: #ff4d4f;
  font-size: 16px;
  font-weight: 600;
}

.goods-price i {
  font-style: normal;
  font-size: 12px;
  margin-right: 1px;
}

.goods-origin {
  color: #9ca3af;
  font-size: 11px;
  text-decoration: line-through;
}

.goods-empty {
  margin: 8px;
  padding: 40px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  background: #ffffff;
  border-radius: 8px;
}
</style>
