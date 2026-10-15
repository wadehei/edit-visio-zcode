<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import PageRenderer from '@/modules/renderer/PageRenderer.vue'
import { usePagesStore } from '@/stores/pages'

const route = useRoute()
const pagesStore = usePagesStore()

const record = computed(() => pagesStore.getPage(String(route.params.id ?? '')))

watchEffect(() => {
  document.title = record.value?.schema.title || '页面预览 · Visio 装修平台'
})
</script>

<template>
  <div class="preview-view">
    <div class="preview-toolbar">
      <router-link :to="`/editor/${String(route.params.id)}`">
        <el-button size="small">← 返回编辑</el-button>
      </router-link>
      <span class="preview-title">{{ record?.schema.title ?? '页面预览' }}</span>
    </div>

    <div class="preview-stage">
      <div v-if="record" class="preview-phone">
        <PageRenderer :page="record.schema" />
        <div v-if="!record.schema.components.length" class="preview-empty">页面暂无内容,回到编辑器添加组件吧</div>
      </div>
      <el-empty v-else description="页面不存在或已被删除" />
    </div>
  </div>
</template>

<style scoped>
.preview-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1f2937;
}

.preview-toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
}

.preview-title {
  color: #f9fafb;
  font-size: 14px;
}

.preview-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 24px;
}

.preview-phone {
  width: 395px;
  height: min(806px, calc(100vh - 120px));
  border: 10px solid #111827;
  border-radius: 40px;
  overflow-y: auto;
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.preview-empty {
  padding: 60px 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
</style>
