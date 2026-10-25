import { defineStore, acceptHMRUpdate } from 'pinia'
import { computed, ref } from 'vue'

import type { PageRecord } from '@/shared/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { createDemoPage, createEmptyPage, toPageRecord } from '@/shared/page'
import { deepClone } from '@/shared/utils/clone'
import { createId } from '@/shared/utils/id'
import { loadJsonCollection } from '@/shared/utils/storage'

/** 页面记录合法性校验(备份导入复用) */
export function isValidRecord(value: unknown): value is PageRecord {
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
  return loadJsonCollection(STORAGE_KEYS.pages, isValidRecord, '页面')
}

/** 页面列表仓库:localStorage 的唯一访问点,后续接后端仅需改造此文件 */
export const usePagesStore = defineStore('pages', () => {
  const pages = ref<PageRecord[]>(loadPages())
  /** 最近一次持久化失败的错误信息;null 表示写入正常,供 UI 提示"保存失败" */
  const persistError = ref<string | null>(null)
  /** 页面存储占用估算(localStorage 按 UTF-16 码元计配额,与字符串 length 同口径) */
  const usageBytes = computed(() => JSON.stringify(pages.value).length)

  // 其他标签页修改存储时同步列表,缩小多标签互相覆盖的窗口
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.pages) pages.value = loadPages()
    })
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.pages, JSON.stringify(pages.value))
      persistError.value = null
    } catch (error) {
      // 配额超限等写入失败:内存数据保留,暴露错误状态供 UI 提示,避免用户误以为已保存
      persistError.value = error instanceof Error ? error.message : String(error)
      console.error('[visio] 页面存储写入失败', error)
    }
  }

  function getPage(id: string): PageRecord | undefined {
    return pages.value.find((p) => p.id === id)
  }

  function upsert(record: PageRecord): PageRecord {
    const i = pages.value.findIndex((p) => p.id === record.id)
    if (i >= 0) pages.value.splice(i, 1)
    pages.value.unshift(record)
    persist()
    return record
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

  /** 整表替换(备份导入用):records 需已通过 isValidRecord 校验 */
  function replaceAll(records: PageRecord[]) {
    pages.value = records
    persist()
  }

  return {
    pages,
    persistError,
    usageBytes,
    persist,
    getPage,
    upsert,
    removePage,
    createPage,
    duplicatePage,
    renamePage,
    replaceAll,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePagesStore, import.meta.hot))
}

