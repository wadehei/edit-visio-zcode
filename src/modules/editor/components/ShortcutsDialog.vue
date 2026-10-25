<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const groups: Array<{ title: string; items: Array<[string, string]> }> = [
  {
    title: '编辑',
    items: [
      ['Ctrl+Z', '撤销'],
      ['Ctrl+Shift+Z / Ctrl+Y', '重做'],
      ['Ctrl+D', '复制选中组件'],
      ['Ctrl+C / Ctrl+X / Ctrl+V', '复制 / 剪切 / 粘贴组件(跨页面可用)'],
      ['Delete', '删除选中组件'],
      ['Esc', '取消选中'],
    ],
  },
  {
    title: '排序与保存',
    items: [
      ['Alt+↑ / Alt+↓', '上移 / 下移选中组件'],
      ['Ctrl+S', '立即保存'],
    ],
  },
  {
    title: '导航',
    items: [
      ['Ctrl+K', '命令面板'],
      ['?', '快捷键帮助'],
    ],
  },
]
</script>

<template>
  <el-dialog v-model="visible" title="快捷键" width="460px">
    <div v-for="g in groups" :key="g.title" class="sc-group">
      <div class="sc-title">{{ g.title }}</div>
      <div v-for="[keys, desc] in g.items" :key="keys" class="sc-row">
        <span class="sc-keys">
          <kbd v-for="k in keys.split(' / ')" :key="k">{{ k }}</kbd>
        </span>
        <span class="sc-desc">{{ desc }}</span>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.sc-group {
  margin-bottom: 14px;
}

.sc-title {
  font-size: 12px;
  color: var(--visio-text-secondary);
  margin-bottom: 8px;
}

.sc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  font-size: 13px;
}

.sc-keys {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
}

kbd {
  display: inline-block;
  min-width: 20px;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 12px;
  text-align: center;
  background: #f3f4f6;
  border: 1px solid var(--visio-border);
  border-bottom-width: 2px;
  border-radius: 4px;
  color: var(--visio-text-primary);
}

.sc-desc {
  color: var(--visio-text-primary);
}
</style>
