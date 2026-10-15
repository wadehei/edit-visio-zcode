import type { PageSchema } from '@/shared/types'

export type IssueLevel = 'warning' | 'info'

export interface PageIssue {
  level: IssueLevel
  message: string
  /** 可定位的组件 id */
  componentId?: string
}

interface ItemLike {
  url?: string
  image?: string
  link?: string
  title?: string
  price?: string
}

function asItems(value: unknown): ItemLike[] {
  return Array.isArray(value) ? (value as ItemLike[]) : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** 装修体检:静态规则扫描页面 Schema,输出问题清单(纯函数,便于单测) */
export function inspectPage(page: PageSchema): PageIssue[] {
  const issues: PageIssue[] = []

  if (!page.components.length) {
    issues.push({ level: 'warning', message: '画布还没有任何组件,先从左侧添加物料吧' })
  }

  for (const comp of page.components) {
    const p = comp.props
    switch (comp.type) {
      case 'text': {
        const content = asString(p.content)
        if (!content || content === '请输入文本内容' || content === '在这里输入文本内容') {
          issues.push({
            level: 'warning',
            message: '文本组件的内容还是默认占位,记得修改',
            componentId: comp.id,
          })
        }
        break
      }
      case 'notice-bar': {
        if (!asString(p.text)) {
          issues.push({ level: 'warning', message: '公告栏内容为空', componentId: comp.id })
        }
        break
      }
      case 'button': {
        if (!asString(p.text)) {
          issues.push({ level: 'warning', message: '按钮文字为空', componentId: comp.id })
        }
        break
      }
      case 'image': {
        if (!asString(p.src)) {
          issues.push({ level: 'warning', message: '图片组件未设置图片地址', componentId: comp.id })
        }
        break
      }
      case 'carousel': {
        const images = asItems(p.images)
        if (!images.length || images.some((i) => !i.url)) {
          issues.push({ level: 'warning', message: '轮播图存在未设置图片的帧', componentId: comp.id })
        } else if (!images.some((i) => i.link)) {
          issues.push({ level: 'info', message: '轮播图未配置任何跳转链接', componentId: comp.id })
        }
        break
      }
      case 'magic-grid': {
        const cells = asItems(p.cells)
        if (!cells.length || cells.some((c) => !c.image)) {
          issues.push({ level: 'warning', message: '魔方栅格存在空白格子', componentId: comp.id })
        } else if (!cells.some((c) => c.link)) {
          issues.push({ level: 'info', message: '魔方栅格未配置跳转链接', componentId: comp.id })
        }
        break
      }
      case 'goods': {
        const items = asItems(p.items)
        if (!items.length) {
          issues.push({ level: 'warning', message: '商品卡片列表为空', componentId: comp.id })
          break
        }
        for (const [i, item] of items.entries()) {
          if (!item.title || !item.price || !item.image) {
            issues.push({
              level: 'warning',
              message: `第 ${i + 1} 个商品信息不完整(标题/价格/图片)`,
              componentId: comp.id,
            })
            break
          }
        }
        if (!items.some((item) => item.link)) {
          issues.push({ level: 'info', message: '商品卡片未配置跳转链接', componentId: comp.id })
        }
        break
      }
    }
  }

  if (page.name === '未命名页面' || page.title === '未命名页面') {
    issues.push({ level: 'info', message: '页面还是默认名称,建议改一个好记的名字' })
  }

  return issues
}
