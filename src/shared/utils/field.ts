import type { PropField } from '../types'

/** 依据字段描述生成默认值(list 字段的 addItem、物料兜底使用) */
export function createDefaultFieldValue(field: PropField): unknown {
  switch (field.type) {
    case 'input':
    case 'textarea':
    case 'image':
      return ''
    case 'number':
      return field.min ?? 0
    case 'slider':
      return field.min
    case 'switch':
      return false
    case 'color':
      return '#333333'
    case 'select':
      return field.options[0]?.value ?? ''
    case 'list':
      return []
  }
}
