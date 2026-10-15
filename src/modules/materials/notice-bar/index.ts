import { markRaw } from 'vue'

import type { MaterialDefinition } from '@/shared/types'
import NoticeBarWidget from './NoticeBarWidget.vue'

export const noticeBarMaterial: MaterialDefinition = {
  type: 'notice-bar',
  name: '公告栏',
  group: '营销组件',
  icon: 'Bell',
  description: '滚动播报的公告条',
  component: markRaw(NoticeBarWidget),
  defaultProps: () => ({
    text: '今日新品上市,全场满 199 减 50!',
    color: '#ffffff',
    bgColor: '#ff976a',
    scrollable: true,
  }),
  propsSchema: [
    { type: 'textarea', key: 'text', label: '公告内容', rows: 3 },
    { type: 'color', key: 'color', label: '文字颜色' },
    { type: 'color', key: 'bgColor', label: '背景颜色' },
    { type: 'switch', key: 'scrollable', label: '滚动播放' },
  ],
}
