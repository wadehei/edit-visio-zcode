import { markRaw } from 'vue'

import type { MaterialDefinition } from '@/shared/types'
import DividerWidget from './DividerWidget.vue'

export const dividerMaterial: MaterialDefinition = {
  type: 'divider',
  name: '分隔线',
  group: '基础组件',
  icon: 'SemiSelect',
  description: '内容分隔',
  component: markRaw(DividerWidget),
  defaultProps: () => ({
    lineStyle: 'solid',
    color: '#e5e7eb',
    marginY: 8,
  }),
  propsSchema: [
    {
      type: 'select',
      key: 'lineStyle',
      label: '线条样式',
      options: [
        { label: '实线', value: 'solid' },
        { label: '虚线', value: 'dashed' },
        { label: '点线', value: 'dotted' },
      ],
    },
    { type: 'color', key: 'color', label: '线条颜色' },
    { type: 'number', key: 'marginY', label: '上下间距', min: 0, max: 60, suffix: 'px' },
  ],
}
