import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/modules/materials', () => ({
  getMaterial: (type: string) => ({
    type,
    name: type,
    group: '基础组件',
    icon: 'Grid',
    component: null,
    defaultProps: () => ({ seed: 1 }),
    propsSchema: [],
  }),
  materialList: [],
}))

import { STORAGE_KEYS } from '@/shared/constants'
import { usePagesStore } from '../pages'
import { createLocalStorageStub } from './storage-stub'

describe('pages store', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    setActivePinia(createPinia())
  })

  it('createPage 持久化到 localStorage', () => {
    const pages = usePagesStore()
    const record = pages.createPage('demo')
    expect(pages.pages).toHaveLength(1)
    expect(pages.getPage(record.id)?.name).toBe('示例首页')

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.pages) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe(record.id)
  })

  it('upsert 已存在的记录时置顶(最近编辑优先)', () => {
    const pages = usePagesStore()
    const a = pages.createPage('blank')
    const b = pages.createPage('blank')
    expect(pages.pages.map((p) => p.id)).toEqual([b.id, a.id])

    pages.upsert({ ...a, name: '更新后的 A', updatedAt: 2 })
    expect(pages.pages.map((p) => p.id)).toEqual([a.id, b.id])
    expect(pages.pages[0].name).toBe('更新后的 A')
  })

  it('removePage 删除并持久化', () => {
    const pages = usePagesStore()
    const a = pages.createPage('blank')
    pages.removePage(a.id)
    expect(pages.pages).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.pages) ?? '[]')).toHaveLength(0)
  })

  it('renamePage 同步记录名与 schema 名', () => {
    const pages = usePagesStore()
    const a = pages.createPage('blank')
    pages.renamePage(a.id, '新名字')
    const record = pages.getPage(a.id)
    expect(record?.name).toBe('新名字')
    expect(record?.schema.name).toBe('新名字')
  })

  it('duplicatePage 生成副本且紧随原页', () => {
    const pages = usePagesStore()
    const a = pages.createPage('blank')
    const copy = pages.duplicatePage(a.id)
    expect(copy?.name).toBe('未命名页面 副本')
    expect(pages.pages.map((p) => p.id)).toEqual([a.id, copy!.id])
    expect(copy?.id).not.toBe(a.id)
  })

  it('存储损坏时备份原始数据并降级为空列表', () => {
    localStorage.setItem(STORAGE_KEYS.pages, '{broken json!!')
    const pages = usePagesStore()
    expect(pages.pages).toHaveLength(0)

    const backups = (localStorage as unknown as ReturnType<typeof createLocalStorageStub>)
      .keys()
      .filter((k) => k.startsWith(`${STORAGE_KEYS.pages}:corrupted:`))
    expect(backups).toHaveLength(1)
  })

  it('脏记录被过滤:缺少 schema.components 的条目不进入列表', () => {
    localStorage.setItem(
      STORAGE_KEYS.pages,
      JSON.stringify([{ id: 'bad', name: '脏数据' }, { id: 'ok', name: 'ok', schema: { components: [] } }]),
    )
    const pages = usePagesStore()
    expect(pages.pages.map((p) => p.id)).toEqual(['ok'])
  })

  it('persist 写入失败时设置 persistError 且保留内存数据,成功后清除', () => {
    const pages = usePagesStore()
    const record = pages.createPage('blank')
    expect(pages.persistError).toBeNull()

    const original = localStorage.setItem.bind(localStorage)
    ;(localStorage as { setItem: unknown }).setItem = () => {
      throw new Error('quota exceeded')
    }
    pages.renamePage(record.id, '触发失败')
    expect(pages.persistError).toBe('quota exceeded')
    expect(pages.getPage(record.id)?.name).toBe('触发失败')

    ;(localStorage as { setItem: unknown }).setItem = original
    pages.renamePage(record.id, '恢复正常')
    expect(pages.persistError).toBeNull()
  })

  it('usageBytes 反映页面存储占用,与 JSON 长度同口径', () => {
    const pages = usePagesStore()
    expect(pages.usageBytes).toBe(JSON.stringify([]).length)
    pages.createPage('demo')
    expect(pages.usageBytes).toBe(JSON.stringify(pages.pages).length)
    expect(pages.usageBytes).toBeGreaterThan(JSON.stringify([]).length)
  })

  it('损坏备份超过上限时删除最旧的', () => {
    localStorage.setItem(`${STORAGE_KEYS.pages}:corrupted:100`, 'oldest')
    localStorage.setItem(`${STORAGE_KEYS.pages}:corrupted:200`, 'middle')
    localStorage.setItem(`${STORAGE_KEYS.pages}:corrupted:300`, 'newest')
    localStorage.setItem(STORAGE_KEYS.pages, '{broken!!')
    usePagesStore()

    const backups = Object.keys(localStorage)
      .filter((k) => k.startsWith(`${STORAGE_KEYS.pages}:corrupted:`))
      .sort()
    expect(backups).toHaveLength(3)
    expect(backups).not.toContain(`${STORAGE_KEYS.pages}:corrupted:100`)
  })
})
