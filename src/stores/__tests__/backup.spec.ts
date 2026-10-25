import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { createEmptyPage } from '@/shared/page'
import { STORAGE_KEYS } from '@/shared/constants'
import { buildBackupFile, parseBackupFile } from '../backup'
import { usePagesStore } from '../pages'
import { usePageTemplatesStore } from '../page-templates'
import { useTemplatesStore } from '../templates'
import { createLocalStorageStub } from './storage-stub'

const schema = () => ({ ...createEmptyPage('备份页'), components: [] })

describe('backup', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    setActivePinia(createPinia())
  })

  it('buildBackupFile 组装完整结构,parseBackupFile 往返一致', () => {
    const pages = usePagesStore()
    const templates = useTemplatesStore()
    const pageTemplates = usePageTemplatesStore()
    const page = pages.createPage('blank')
    templates.saveTemplate('组件模板', 'text', { content: 'hi' })
    pageTemplates.savePageTemplate('页面模板', schema())

    const file = buildBackupFile(pages.pages, templates.templates, pageTemplates.templates)
    expect(file.app).toBe('edit-visio')
    expect(file.version).toBe(1)

    const parsed = parseBackupFile(JSON.parse(JSON.stringify(file)))
    expect(parsed?.pages.map((p) => p.id)).toEqual([page.id])
    expect(parsed?.componentTemplates.map((t) => t.name)).toEqual(['组件模板'])
    expect(parsed?.pageTemplates.map((t) => t.name)).toEqual(['页面模板'])
    expect(parsed?.counts).toEqual({ pages: 1, componentTemplates: 1, pageTemplates: 1 })
  })

  it('非法结构返回 null,脏条目被过滤', () => {
    expect(parseBackupFile(null)).toBeNull()
    expect(parseBackupFile({ app: 'other', version: 1, pages: [] })).toBeNull()
    expect(parseBackupFile({ app: 'edit-visio', version: 1 })).toBeNull()

    const parsed = parseBackupFile({
      app: 'edit-visio',
      version: 1,
      exportedAt: 1,
      pages: [{ id: 'ok', name: '好页', schema: { components: [] } }, { bad: true }],
      componentTemplates: [null],
      pageTemplates: [{ id: 'pt-ok', name: '好模板', schema: { components: [] } }],
    })
    expect(parsed?.pages.map((p) => p.id)).toEqual(['ok'])
    expect(parsed?.componentTemplates).toEqual([])
    expect(parsed?.pageTemplates.map((t) => t.id)).toEqual(['pt-ok'])
  })

  it('replaceAll 覆盖各 store 并持久化', () => {
    const pages = usePagesStore()
    pages.createPage('blank')
    pages.replaceAll([{ id: 'p-1', name: '导入页', updatedAt: 1, schema: schema() }])
    expect(pages.pages.map((p) => p.id)).toEqual(['p-1'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.pages) ?? '[]')).toHaveLength(1)

    const templates = useTemplatesStore()
    templates.replaceAll([{ id: 't-1', name: 'T', type: 'text', props: {}, createdAt: 1 }])
    expect(templates.templates).toHaveLength(1)

    const pageTemplates = usePageTemplatesStore()
    pageTemplates.replaceAll([{ id: 'pt-1', name: 'PT', schema: schema(), createdAt: 1 }])
    expect(pageTemplates.templates).toHaveLength(1)
  })
})
