import { markRaw } from 'vue'

import type { MaterialDefinition } from '@/shared/types'
import SpacerWidget from './SpacerWidget.vue'

export const spacerMaterial: MaterialDefinition = {
  type: 'spacer',
  name: '辅助空白',
  group: '基础组件',
  icon: 'Minus',
  description: '占位空白区域',
  component: markRaw(SpacerWidget),
  defaultProps: () => ({
    height: 20,
  }),
  propsSchema: [{ type: 'number', key: 'height', label: '空白高度', min: 8, max: 200, suffix: 'px' }],
}
