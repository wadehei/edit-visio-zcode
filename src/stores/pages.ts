import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

import type { PageRecord } from '@/shared/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { createDemoPage, createEmptyPage, toPageRecord } from '@/shared/page'
import { deepClone } from '@/shared/utils/clone'
import { createId } from '@/shared/utils/id'

function isValidRecord(value: unknown): value is PageRecord {
  const record = value as PageRecord | null
  return (
    !!record &&
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    !!record.schema &&
    Array.isArray(record.schema.components)
  )
}

function loadPages(): PageRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.pages)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('pages storage is not an array')
    return parsed.filter(isValidRecord)
  } catch (error) {
    // 备份损坏的原始数据,避免空数组在下次 persist 时覆盖真实数据
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.pages)
      if (raw) localStorage.setItem(`${STORAGE_KEYS.pages}:corrupted:${Date.now()}`, raw)
    } catch {
      /* 备份失败时忽略 */
    }
    console.error('[visio] 页面存储解析失败,已备份原始数据', error)
    return []
  }
}

/** 页面列表仓库:localStorage 的唯一访问点,后续接后端仅需改造此文件 */
export const usePagesStore = defineStore('pages', () => {
  const pages = ref<PageRecord[]>(loadPages())

  // 其他标签页修改存储时同步列表,缩小多标签互相覆盖的窗口
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.pages) pages.value = loadPages()
    })
  }

  function persist() {
    localStorage.setItem(STORAGE_KEYS.pages, JSON.stringify(pages.value))
  }

  function getPage(id: string): PageRecord | undefined {
    return pages.value.find((p) => p.id === id)
  }

  function upsert(record: PageRecord) {
    const i = pages.value.findIndex((p) => p.id === record.id)
    if (i >= 0) pages.value.splice(i, 1)
    pages.value.unshift(record)
    persist()
  }

  function removePage(id: string) {
    const i = pages.value.findIndex((p) => p.id === id)
    if (i < 0) return
    pages.value.splice(i, 1)
    persist()
  }

  function createPage(kind: 'blank' | 'demo'): PageRecord {
    const schema = kind === 'demo' ? createDemoPage() : createEmptyPage()
    const record = toPageRecord(schema)
    pages.value.unshift(record)
    persist()
    return record
  }

  function duplicatePage(id: string): PageRecord | undefined {
    const src = getPage(id)
    if (!src) return undefined
    const schema = deepClone(src.schema)
    schema.id = createId('p')
    schema.name = `${src.name} 副本`
    const record = toPageRecord(schema)
    const i = pages.value.findIndex((p) => p.id === id)
    pages.value.splice(i + 1, 0, record)
    persist()
    return record
  }

  function renamePage(id: string, name: string) {
    const record = getPage(id)
    if (!record || !name) return
    record.name = name
    record.schema.name = name
    persist()
  }

  return { pages, persist, getPage, upsert, removePage, createPage, duplicatePage, renamePage }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePagesStore, import.meta.hot))
}

