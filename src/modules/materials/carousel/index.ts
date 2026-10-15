import { markRaw } from 'vue'

import type { MaterialDefinition } from '@/shared/types'
import { SAMPLE_IMAGES } from '@/shared/constants'
import CarouselWidget from './CarouselWidget.vue'

export const carouselMaterial: MaterialDefinition = {
  type: 'carousel',
  name: '轮播图',
  group: '营销组件',
  icon: 'Film',
  description: '多图轮播的广告位',
  component: markRaw(CarouselWidget),
  defaultProps: () => ({
    images: [
      { url: SAMPLE_IMAGES.banner1 },
      { url: SAMPLE_IMAGES.banner2 },
      { url: SAMPLE_IMAGES.banner3 },
    ].map((img) => ({ link: '', ...img })),
    height: 160,
    interval: 3,
    autoplay: true,
    radius: 0,
  }),
  propsSchema: [
    {
      type: 'list',
      key: 'images',
      label: '轮播图片',
      itemLabel: '图片',
      addText: '添加图片',
      max: 8,
      itemFields: [
        { type: 'image', key: 'url', label: '图片' },
        { type: 'input', key: 'link', label: '跳转链接', placeholder: 'https://…(可选)' },
      ],
    },
    { type: 'number', key: 'height', label: '高度', min: 80, max: 400, suffix: 'px' },
    { type: 'switch', key: 'autoplay', label: '自动轮播' },
    { type: 'number', key: 'interval', label: '切换间隔', min: 1, max: 10, suffix: 's' },
    { type: 'slider', key: 'radius', label: '圆角(px)', min: 0, max: 24 },
  ],
}
