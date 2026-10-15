import type { ComponentSchema, PageRecord, PageSchema } from './types'
import { SAMPLE_IMAGES, SCHEMA_VERSION } from './constants'
import { createId } from './utils/id'
import { getMaterial } from '@/modules/materials'

function makeComponent(type: string, props: Record<string, unknown> = {}): ComponentSchema {
  const def = getMaterial(type)
  return { id: createId('c'), type, props: { ...(def?.defaultProps() ?? {}), ...props } }
}

export function createEmptyPage(name = '未命名页面'): PageSchema {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId('p'),
    name,
    title: name,
    backgroundColor: '#f5f6f8',
    components: [],
  }
}

export function createDemoPage(): PageSchema {
  const page = createEmptyPage('示例首页')
  page.title = '新品首发 · 每周上新'
  page.components = [
    makeComponent('notice-bar', {
      text: '🎉 新品首发周:全场满 199 减 50,限量抢购!',
    }),
    makeComponent('carousel'),
    makeComponent('text', {
      content: '每周新品\n为你精选好物',
      fontSize: 18,
      bold: true,
      align: 'center',
      color: '#111111',
    }),
    makeComponent('magic-grid', {
      cols: 2,
      rows: 2,
      height: 150,
      cells: [
        { image: SAMPLE_IMAGES.goods1 },
        { image: SAMPLE_IMAGES.goods2 },
        { image: SAMPLE_IMAGES.goods3 },
        { image: SAMPLE_IMAGES.goods4 },
      ],
    }),
    makeComponent('goods', {
      layout: 'two',
      items: [
        {
          title: '无线蓝牙耳机 Pro 主动降噪',
          price: '199',
          originPrice: '299',
          image: SAMPLE_IMAGES.goods1,
          tag: '新品',
        },
        {
          title: '便携保温杯 500ml 12 小时保温',
          price: '89',
          originPrice: '129',
          image: SAMPLE_IMAGES.goods2,
          tag: '热卖',
        },
        {
          title: '全棉四件套 莫兰迪色系',
          price: '259',
          originPrice: '399',
          image: SAMPLE_IMAGES.goods3,
          tag: '',
        },
        {
          title: '香薰蜡烛礼盒装 花草香',
          price: '69',
          originPrice: '99',
          image: SAMPLE_IMAGES.goods4,
          tag: '限时',
        },
      ],
    }),
    makeComponent('button', { text: '查看全部商品' }),
  ]
  return page
}

export function toPageRecord(schema: PageSchema): PageRecord {
  return { id: schema.id, name: schema.name, updatedAt: Date.now(), schema }
}
