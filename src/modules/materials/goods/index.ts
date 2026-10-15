import { markRaw } from 'vue'

import type { MaterialDefinition } from '@/shared/types'
import { SAMPLE_IMAGES } from '@/shared/constants'
import GoodsWidget from './GoodsWidget.vue'

export const goodsMaterial: MaterialDefinition = {
  type: 'goods',
  name: '商品卡片',
  group: '营销组件',
  icon: 'Goods',
  description: '商品列表/网格展示',
  component: markRaw(GoodsWidget),
  defaultProps: () => ({
    layout: 'two',
    items: [
      {
        title: '无线蓝牙耳机 Pro 主动降噪',
        price: '199',
        originPrice: '299',
        image: SAMPLE_IMAGES.goods1,
        tag: '新品',
        link: '',
      },
      {
        title: '便携保温杯 500ml 12 小时保温',
        price: '89',
        originPrice: '129',
        image: SAMPLE_IMAGES.goods2,
        tag: '热卖',
        link: '',
      },
    ],
  }),
  propsSchema: [
    {
      type: 'select',
      key: 'layout',
      label: '布局方式',
      options: [
        { label: '两列网格', value: 'two' },
        { label: '三列网格', value: 'three' },
        { label: '单列列表', value: 'list' },
      ],
    },
    {
      type: 'list',
      key: 'items',
      label: '商品列表',
      itemLabel: '商品',
      addText: '添加商品',
      itemFields: [
        { type: 'input', key: 'title', label: '标题' },
        { type: 'input', key: 'price', label: '售价(¥)' },
        { type: 'input', key: 'originPrice', label: '原价(¥,可选)' },
        { type: 'image', key: 'image', label: '商品图' },
        { type: 'input', key: 'tag', label: '角标(可选)' },
        { type: 'input', key: 'link', label: '跳转链接', placeholder: 'https://…(可选)' },
      ],
    },
  ],
}
