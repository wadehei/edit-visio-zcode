import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { STORAGE_KEYS } from '@/shared/constants'
import { createEmptyPage } from '@/shared/page'
import type { PageSchema } from '@/shared/types'
import { usePageTemplatesStore } from '../page-templates'
import { createLocalStorageStub } from './storage-stub'

function makeSchema(name = '模板页'): PageSchema {
  return { ...createEmptyPage(name), components: [{ id: 'c-1', type: 'text', props: {} }] }
}

describe('page-templates store', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    setActivePinia(createPinia())
  })

  it('保存模板深拷贝 schema 并持久化,新模板置顶', () => {
    const store = usePageTemplatesStore()
    const schema = makeSchema()
    const a = store.savePageTemplate('模板 A', schema)
    schema.components[0]!.props['content'] = '修改不应影响模板'

    expect(store.templates).toHaveLength(1)
    expect(store.templates[0]?.name).toBe('模板 A')
    expect(store.templates[0]?.id).not.toBe(schema.id)
    expect(store.templates[0]?.schema).not.toBe(schema)

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.pageTemplates) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe(a!.id)

    const b = store.savePageTemplate('模板 B', makeSchema())
    expect(store.templates.map((t) => t.name)).toEqual(['模板 B', '模板 A'])
    expect(b!.id).not.toBe(a!.id)
  })

  it('删除模板并持久化', () => {
    const store = usePageTemplatesStore()
    const t = store.savePageTemplate('待删除', makeSchema())
    store.removePageTemplate(t!.id)
    expect(store.templates).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.pageTemplates) ?? '[]')).toHaveLength(0)
  })

  it('脏记录被过滤,损坏数据备份后降级为空', () => {
    localStorage.setItem(
      STORAGE_KEYS.pageTemplates,
      JSON.stringify([{ id: 'bad' }, { id: 'ok', name: '好模板', schema: { components: [] } }]),
    )
    expect(usePageTemplatesStore().templates.map((t) => t.id)).toEqual(['ok'])

    localStorage.setItem(STORAGE_KEYS.pageTemplates, '{broken!!')
    setActivePinia(createPinia()) // 重新初始化 store,触发重新加载
    expect(usePageTemplatesStore().templates).toHaveLength(0)
    const backups = Object.keys(localStorage).filter((k) =>
      k.startsWith(`${STORAGE_KEYS.pageTemplates}:corrupted:`),
    )
    expect(backups).toHaveLength(1)
  })
})
