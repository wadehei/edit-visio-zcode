import { markRaw } from 'vue'

import type { MaterialDefinition } from '@/shared/types'
import TextWidget from './TextWidget.vue'

export const textMaterial: MaterialDefinition = {
  type: 'text',
  name: '文本',
  group: '基础组件',
  icon: 'EditPen',
  description: '展示多行文本内容',
  component: markRaw(TextWidget),
  defaultProps: () => ({
    content: '在这里输入文本内容',
    fontSize: 14,
    color: '#333333',
    align: 'left',
    bold: false,
    lineHeight: 1.6,
  }),
  propsSchema: [
    { type: 'textarea', key: 'content', label: '文本内容', rows: 4, placeholder: '支持换行' },
    { type: 'slider', key: 'fontSize', label: '字号(px)', min: 12, max: 32, step: 1 },
    { type: 'color', key: 'color', label: '文字颜色' },
    {
      type: 'select',
      key: 'align',
      label: '对齐方式',
      options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右对齐', value: 'right' },
      ],
    },
    { type: 'switch', key: 'bold', label: '加粗' },
    { type: 'slider', key: 'lineHeight', label: '行高', min: 1, max: 2.5, step: 0.1 },
  ],
}
