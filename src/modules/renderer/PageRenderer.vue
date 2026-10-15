<script setup lang="ts">
import { computed } from 'vue'

import type { MaterialDefinition, PageSchema, ComponentSchema } from '@/shared/types'
import { getMaterial } from '@/modules/materials'

interface RenderItem {
  comp: ComponentSchema
  def: MaterialDefinition
}

const props = defineProps<{ page: PageSchema }>()

/** 未知物料直接跳过,保证脏数据不导致渲染崩溃 */
const renderItems = computed<RenderItem[]>(() => {
  const out: RenderItem[] = []
  for (const comp of props.page.components) {
    const def = getMaterial(comp.type)
    if (def) out.push({ comp, def })
  }
  return out
})
</script>

<template>
  <div class="page-renderer" :style="{ backgroundColor: page.backgroundColor }">
    <component :is="item.def.component" v-for="item in renderItems" :key="item.comp.id" v-bind="item.comp.props" />
  </div>
</template>

<style scoped>
.page-renderer {
  min-height: 100%;
  width: 100%;
}
</style>
