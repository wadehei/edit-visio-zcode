import { markRaw } from 'vue'

import type { MaterialDefinition } from '@/shared/types'
import ImageWidget from './ImageWidget.vue'

export const imageMaterial: MaterialDefinition = {
  type: 'image',
  name: '图片',
  group: '基础组件',
  icon: 'Picture',
  description: '单张图片展示',
  component: markRaw(ImageWidget),
  defaultProps: () => ({
    src: '',
    link: '',
    height: 0,
    fit: 'cover',
    radius: 0,
  }),
  propsSchema: [
    { type: 'image', key: 'src', label: '图片地址' },
    { type: 'input', key: 'link', label: '跳转链接', placeholder: 'https://…(预览时点击跳转)' },
    { type: 'number', key: 'height', label: '高度(0=自适应)', min: 0, max: 600, suffix: 'px' },
    {
      type: 'select',
      key: 'fit',
      label: '填充方式',
      options: [
        { label: '裁剪填满', value: 'cover' },
        { label: '完整显示', value: 'contain' },
        { label: '拉伸', value: 'fill' },
      ],
    },
    { type: 'slider', key: 'radius', label: '圆角(px)', min: 0, max: 24 },
  ],
}
