import { describe, expect, it } from 'vitest'

import { inspectPage } from '@/modules/editor/doctor'
import { isDarkColor, luminance } from '@/shared/utils/color'
import { createEmptyPage } from '@/shared/page'
import type { PageSchema } from '@/shared/types'

describe('isDarkColor / luminance', () => {
  it('黑白判别正确,3 位缩写同样支持', () => {
    expect(isDarkColor('#000000')).toBe(true)
    expect(isDarkColor('#ffffff')).toBe(false)
    expect(isDarkColor('#333333')).toBe(true)
    expect(isDarkColor('#f5f6f8')).toBe(false)
    expect(isDarkColor('#fff')).toBe(false)
  })

  it('非法颜色返回中性亮度', () => {
    expect(luminance('not-a-color')).toBe(0.5)
  })
})

describe('inspectPage', () => {
  function pageWith(components: PageSchema['components']): PageSchema {
    return { ...createEmptyPage('测试页'), components }
  }

  it('空页面给出告警', () => {
    const issues = inspectPage(pageWith([]))
    expect(issues.some((i) => i.message.includes('没有任何组件'))).toBe(true)
  })

  it('默认名称给出建议', () => {
    const page = createEmptyPage()
    const issues = inspectPage(page)
    expect(issues.some((i) => i.level === 'info' && i.message.includes('默认名称'))).toBe(true)
  })

  it('文本占位内容被识别并可定位', () => {
    const issues = inspectPage(
      pageWith([{ id: 'c1', type: 'text', props: { content: '在这里输入文本内容' } }]),
    )
    const issue = issues.find((i) => i.message.includes('占位'))
    expect(issue?.level).toBe('warning')
    expect(issue?.componentId).toBe('c1')
  })

  it('轮播图缺图是 warning,全缺链接是 info', () => {
    const noImage = inspectPage(pageWith([{ id: 'c1', type: 'carousel', props: { images: [{ url: '' }] } }]))
    expect(noImage.some((i) => i.level === 'warning' && i.message.includes('轮播图'))).toBe(true)

    const noLink = inspectPage(
      pageWith([{ id: 'c2', type: 'carousel', props: { images: [{ url: '/a.png' }] } }]),
    )
    expect(noLink.some((i) => i.level === 'info' && i.message.includes('跳转链接'))).toBe(true)
  })

  it('商品信息不完整触发 warning', () => {
    const issues = inspectPage(
      pageWith([{ id: 'c1', type: 'goods', props: { items: [{ title: '', price: '9', image: '/a.png' }] } }]),
    )
    expect(issues.some((i) => i.level === 'warning' && i.message.includes('商品信息不完整'))).toBe(true)
  })

  it('商品列表为空触发专用告警(区别于信息不完整)', () => {
    const issues = inspectPage(pageWith([{ id: 'c1', type: 'goods', props: { items: [] } }]))
    expect(issues.some((i) => i.level === 'warning' && i.message.includes('商品卡片列表为空'))).toBe(true)
  })

  it('公告栏/按钮/图片的空内容规则', () => {
    const issues = inspectPage(
      pageWith([
        { id: 'c1', type: 'notice-bar', props: { text: '' } },
        { id: 'c2', type: 'button', props: { text: '  ' } },
        { id: 'c3', type: 'image', props: { src: '' } },
      ]),
    )
    expect(issues.some((i) => i.componentId === 'c1' && i.message.includes('公告栏内容为空'))).toBe(true)
    expect(issues.some((i) => i.componentId === 'c2' && i.message.includes('按钮文字为空'))).toBe(true)
    expect(issues.some((i) => i.componentId === 'c3' && i.message.includes('未设置图片地址'))).toBe(true)
  })

  it('魔方栅格:空白格子 warning,配齐仅缺链接 info', () => {
    const blank = inspectPage(
      pageWith([{ id: 'c1', type: 'magic-grid', props: { cells: [{ image: '/a.png' }, { image: '' }] } }]),
    )
    expect(blank.some((i) => i.level === 'warning' && i.message.includes('空白格子'))).toBe(true)

    const noLink = inspectPage(
      pageWith([{ id: 'c2', type: 'magic-grid', props: { cells: [{ image: '/a.png' }] } }]),
    )
    expect(noLink.some((i) => i.level === 'info' && i.message.includes('魔方栅格未配置跳转链接'))).toBe(true)
  })

  it('配置完整的页面只剩链接建议', () => {
    const issues = inspectPage(
      pageWith([
        { id: 'c1', type: 'text', props: { content: '正式文案' } },
        { id: 'c2', type: 'image', props: { src: '/a.png' } },
      ]),
    )
    expect(issues.every((i) => i.level === 'info')).toBe(true)
  })

  it('部分隐藏组件给出 info 提示,全部隐藏升级为 warning', () => {
    const partial = inspectPage(
      pageWith([
        { id: 'c1', type: 'text', props: { content: '正式文案' } },
        { id: 'c2', type: 'image', props: { src: '/a.png' }, hidden: true },
      ]),
    )
    expect(partial.some((i) => i.level === 'info' && i.message.includes('1 个组件处于隐藏'))).toBe(true)

    const all = inspectPage(pageWith([{ id: 'c1', type: 'image', props: { src: '/a.png' }, hidden: true }]))
    expect(all.some((i) => i.level === 'warning' && i.message.includes('页面会是空白'))).toBe(true)
  })
})
