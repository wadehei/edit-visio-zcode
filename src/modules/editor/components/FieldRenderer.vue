<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import type { PropField } from '@/shared/types'
import { SAMPLE_IMAGE_OPTIONS } from '@/shared/constants'
import { createDefaultFieldValue } from '@/shared/utils/field'
import { fileToCompressedDataUrl } from '@/shared/utils/image'

const props = defineProps<{
  field: PropField
  value?: unknown
}>()

const emit = defineEmits<{
  (e: 'change', value: unknown): void
}>()

const textValue = computed({
  get: () => (typeof props.value === 'string' ? props.value : ''),
  set: (v: string) => emit('change', v),
})

const numberValue = computed({
  get: () => (typeof props.value === 'number' ? props.value : 0),
  set: (v: number | null) => emit('change', v ?? 0),
})

const switchValue = computed({
  get: () => props.value === true,
  set: (v: boolean) => emit('change', v),
})

const colorValue = computed({
  get: () => (typeof props.value === 'string' ? props.value : '#333333'),
  set: (v: string | null) => emit('change', v ?? '#333333'),
})

const selectValue = computed({
  get: () =>
    typeof props.value === 'string' ||
    typeof props.value === 'number' ||
    typeof props.value === 'boolean'
      ? props.value
      : '',
  set: (v: unknown) => emit('change', v),
})

const listValue = computed(() =>
  Array.isArray(props.value) ? (props.value as Array<Record<string, unknown>>) : [],
)

function setItemValue(index: number, key: string, value: unknown) {
  const next = listValue.value.map((item, i) => (i === index ? { ...item, [key]: value } : item))
  emit('change', next)
}

function removeListItem(index: number) {
  emit(
    'change',
    listValue.value.filter((_, i) => i !== index),
  )
}

function moveListItem(index: number, offset: -1 | 1) {
  const target = index + offset
  if (target < 0 || target >= listValue.value.length) return
  const next = [...listValue.value]
  ;[next[index], next[target]] = [next[target], next[index]]
  emit('change', next)
}

function addListItem() {
  if (props.field.type !== 'list') return
  if (props.field.max && listValue.value.length >= props.field.max) return
  const item: Record<string, unknown> = {}
  for (const f of props.field.itemFields) item[f.key] = createDefaultFieldValue(f)
  emit('change', [...listValue.value, item])
}

const uploadInputRef = ref<HTMLInputElement | null>(null)

/** 本地上传:压缩为 dataURL 后直接写入 Schema(约 650KB 上限,防 localStorage 撑爆) */
async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const dataUrl = await fileToCompressedDataUrl(file)
    if (dataUrl.length > 900_000) {
      throw new Error('图片过大,请选择更小或更扁平的图片')
    }
    textValue.value = dataUrl
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '上传失败')
  }
}
</script>

<template>
  <div class="field-renderer">
    <div v-if="field.type !== 'list'" class="field-label">{{ field.label }}</div>

    <el-input
      v-if="field.type === 'input'"
      v-model="textValue"
      :placeholder="field.placeholder"
      size="small"
    />

    <el-input
      v-else-if="field.type === 'textarea'"
      v-model="textValue"
      type="textarea"
      :rows="field.rows ?? 3"
      :placeholder="field.placeholder"
      size="small"
    />

    <div v-else-if="field.type === 'number'" class="field-row">
      <el-input-number
        v-model="numberValue"
        :min="field.min"
        :max="field.max"
        :step="field.step ?? 1"
        size="small"
        controls-position="right"
        class="field-control"
      />
      <span v-if="field.suffix" class="field-suffix">{{ field.suffix }}</span>
    </div>

    <el-switch v-else-if="field.type === 'switch'" v-model="switchValue" size="small" />

    <el-select
      v-else-if="field.type === 'select'"
      v-model="selectValue"
      size="small"
      class="field-control"
    >
      <el-option
        v-for="opt in field.options"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>

    <div v-else-if="field.type === 'color'" class="field-row">
      <el-color-picker v-model="colorValue" size="small" />
      <span class="field-suffix">{{ colorValue }}</span>
    </div>

    <el-slider
      v-else-if="field.type === 'slider'"
      v-model="numberValue"
      :min="field.min"
      :max="field.max"
      :step="field.step ?? 1"
      size="small"
    />

    <div v-else-if="field.type === 'image'" class="field-image">
      <el-image
        v-if="textValue"
        :src="textValue"
        fit="cover"
        class="field-image-thumb"
        :preview-src-list="[textValue]"
        preview-teleported
        hide-on-click-modal
      />
      <el-input v-model="textValue" placeholder="输入图片地址,或选示例图" size="small" />
      <div class="field-image-actions">
        <el-dropdown @command="(cmd: string | number | object) => (textValue = String(cmd))">
          <el-button size="small">示例图</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="s in SAMPLE_IMAGE_OPTIONS" :key="s.value" :command="s.value">
                {{ s.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" @click="uploadInputRef?.click()">本地上传</el-button>
        <input
          ref="uploadInputRef"
          type="file"
          accept="image/*"
          class="hidden-file"
          @change="onUpload"
        />
      </div>
    </div>

    <div v-else-if="field.type === 'list'" class="field-list">
      <div class="field-label">{{ field.label }}({{ listValue.length }})</div>
      <div v-for="(item, i) in listValue" :key="i" class="list-item">
        <div class="list-item-header">
          <span>{{ field.itemLabel ?? '选项' }} {{ i + 1 }}</span>
          <span class="list-item-actions">
            <el-icon class="la" :class="{ disabled: i === 0 }" @click="moveListItem(i, -1)">
              <ArrowUp />
            </el-icon>
            <el-icon
              class="la"
              :class="{ disabled: i === listValue.length - 1 }"
              @click="moveListItem(i, 1)"
            >
              <ArrowDown />
            </el-icon>
            <el-icon class="la danger" @click="removeListItem(i)"><Delete /></el-icon>
          </span>
        </div>
        <div class="list-item-body">
          <FieldRenderer
            v-for="f in field.itemFields"
            :key="f.key"
            :field="f"
            :value="item[f.key]"
            @change="(value) => setItemValue(i, f.key, value)"
          />
        </div>
      </div>
      <el-button
        v-if="!field.max || listValue.length < field.max"
        size="small"
        plain
        class="list-add"
        @click="addListItem"
      >
        + {{ field.addText ?? '添加一项' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.field-renderer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: var(--visio-text-secondary);
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-control {
  width: 100%;
}

.field-suffix {
  font-size: 12px;
  color: var(--visio-text-secondary);
  white-space: nowrap;
}

.field-image {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-image-thumb {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  border: 1px solid var(--visio-border);
}

.field-image-actions {
  display: flex;
  gap: 8px;
}

.hidden-file {
  display: none;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  border: 1px solid var(--visio-border);
  border-radius: 8px;
  padding: 8px;
  background: #fafafa;
}

.list-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--visio-text-secondary);
  margin-bottom: 8px;
}

.list-item-actions {
  display: flex;
  gap: 8px;
}

.la {
  cursor: pointer;
  color: var(--visio-text-secondary);
}

.la:hover {
  color: var(--visio-color-primary);
}

.la.danger:hover {
  color: var(--visio-color-danger);
}

.la.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.list-add {
  width: 100%;
}
</style>
