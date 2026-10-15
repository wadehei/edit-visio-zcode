<script setup lang="ts">
import type { PropField } from '@/shared/types'
import FieldRenderer from './FieldRenderer.vue'

defineProps<{
  fields: PropField[]
  model: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'change', key: string, value: unknown): void
}>()
</script>

<template>
  <div class="schema-form">
    <FieldRenderer
      v-for="field in fields"
      :key="field.key"
      :field="field"
      :value="model[field.key]"
      @change="(value) => emit('change', field.key, value)"
    />
  </div>
</template>

<style scoped>
.schema-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
