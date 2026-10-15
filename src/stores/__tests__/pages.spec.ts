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

/** node 环境下的 localStorage 内存实现 */
function createLocalStorageStub() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    keys: () => Array.from(store.keys()),
  }
}

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
})
