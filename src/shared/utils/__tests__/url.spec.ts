import { describe, expect, it } from 'vitest'

import { safeImageUrl, safeLinkUrl } from '../url'

describe('safeLinkUrl(渲染为 <a href> 的跳转链接)', () => {
  it('放行 http(s)、协议相对、站内相对与锚点', () => {
    expect(safeLinkUrl('https://example.com/x')).toBe('https://example.com/x')
    expect(safeLinkUrl('http://example.com')).toBe('http://example.com')
    expect(safeLinkUrl('//cdn.example.com/a')).toBe('//cdn.example.com/a')
    expect(safeLinkUrl('/activity/main')).toBe('/activity/main')
    expect(safeLinkUrl('./relative')).toBe('./relative')
    expect(safeLinkUrl('../up')).toBe('../up')
    expect(safeLinkUrl('#anchor')).toBe('#anchor')
  })

  it('拒绝可执行 scheme 与非法输入(导入 JSON 注入防线)', () => {
    expect(safeLinkUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeLinkUrl('JAVASCRIPT:alert(1)')).toBeUndefined()
    expect(safeLinkUrl('vbscript:msgbox')).toBeUndefined()
    expect(safeLinkUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined()
    expect(safeLinkUrl(' javascript:alert(1)')).toBeUndefined()
    expect(safeLinkUrl('file:///C:/win.ini')).toBeUndefined()
    expect(safeLinkUrl('')).toBeUndefined()
    expect(safeLinkUrl(undefined)).toBeUndefined()
    expect(safeLinkUrl(123)).toBeUndefined()
    expect(safeLinkUrl({ href: 'https://x' })).toBeUndefined()
  })
})

describe('safeImageUrl(渲染为 <img src> 的图片地址)', () => {
  it('额外放行 data:image/(本地上传压缩产物)', () => {
    expect(safeImageUrl('data:image/jpeg;base64,AAAA')).toBe('data:image/jpeg;base64,AAAA')
    expect(safeImageUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA')
  })

  it('拒绝非图片的 data: 与可执行 scheme', () => {
    expect(safeImageUrl('data:text/html,<b>x</b>')).toBeUndefined()
    // SVG 经 <img> 加载不执行脚本(仅作为文档/对象嵌入才会),放行是安全的
    expect(safeImageUrl('data:image/svg+xml,<svg/onload=alert(1)>')).toBe(
      'data:image/svg+xml,<svg/onload=alert(1)>',
    )
    expect(safeImageUrl('javascript:alert(1)')).toBeUndefined()
  })

  it('常规地址与 safeLinkUrl 同规则', () => {
    expect(safeImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(safeImageUrl('/sample-images/banner-1.svg')).toBe('/sample-images/banner-1.svg')
    expect(safeImageUrl('')).toBeUndefined()
  })
})
