import { markRaw } from 'vue'

import type { MaterialDefinition } from '@/shared/types'
import { SAMPLE_IMAGES } from '@/shared/constants'
import MagicGridWidget from './MagicGridWidget.vue'

export const magicGridMaterial: MaterialDefinition = {
  type: 'magic-grid',
  name: '魔方栅格',
  group: '营销组件',
  icon: 'Grid',
  description: '多图宫格导航位',
  component: markRaw(MagicGridWidget),
  defaultProps: () => ({
    cols: 2,
    rows: 1,
    height: 130,
    gap: 4,
    cells: [
      { image: SAMPLE_IMAGES.banner1, link: '' },
      { image: SAMPLE_IMAGES.banner2, link: '' },
    ],
  }),
  propsSchema: [
    {
      type: 'select',
      key: 'cols',
      label: '每行个数',
      options: [
        { label: '2 个', value: 2 },
        { label: '3 个', value: 3 },
        { label: '4 个', value: 4 },
      ],
    },
    {
      type: 'select',
      key: 'rows',
      label: '行数',
      options: [
        { label: '1 行', value: 1 },
        { label: '2 行', value: 2 },
      ],
    },
    { type: 'number', key: 'height', label: '格子高度', min: 60, max: 300, suffix: 'px' },
    { type: 'slider', key: 'gap', label: '间距(px)', min: 0, max: 20, step: 1 },
    {
      type: 'list',
      key: 'cells',
      label: '图片格子',
      itemLabel: '格子',
      addText: '添加格子',
      max: 8,
      itemFields: [
        { type: 'image', key: 'image', label: '图片' },
        { type: 'input', key: 'link', label: '跳转链接', placeholder: 'https://…(可选)' },
      ],
    },
  ],
}
