import { markRaw } from 'vue'

import type { MaterialDefinition } from '@/shared/types'
import ButtonWidget from './ButtonWidget.vue'

export const buttonMaterial: MaterialDefinition = {
  type: 'button',
  name: '按钮',
  group: '基础组件',
  icon: 'Pointer',
  description: '行动按钮(跳转能力在发布端生效)',
  component: markRaw(ButtonWidget),
  defaultProps: () => ({
    text: '立即购买',
    link: '',
    bgColor: '#4f46e5',
    color: '#ffffff',
    height: 44,
    radius: 22,
    block: true,
  }),
  propsSchema: [
    { type: 'input', key: 'text', label: '按钮文字' },
    { type: 'input', key: 'link', label: '跳转链接', placeholder: 'https://…(预览时点击跳转)' },
    { type: 'color', key: 'bgColor', label: '背景颜色' },
    { type: 'color', key: 'color', label: '文字颜色' },
    { type: 'slider', key: 'height', label: '高度(px)', min: 32, max: 56 },
    { type: 'slider', key: 'radius', label: '圆角(px)', min: 0, max: 48 },
    { type: 'switch', key: 'block', label: '通栏按钮' },
  ],
}
