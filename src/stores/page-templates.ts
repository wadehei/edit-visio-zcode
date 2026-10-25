import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

import type { PageSchema } from '@/shared/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { createId } from '@/shared/utils/id'
import { deepClone } from '@/shared/utils/clone'
import { loadJsonCollection } from '@/shared/utils/storage'

export interface PageTemplate {
  id: string
  name: string
  schema: PageSchema
  createdAt: number
}

/** 页面模板合法性校验(备份导入复用) */
export function isValidPageTemplate(value: unknown): value is PageTemplate {
  const t = value as PageTemplate | null
  return (
    !!t &&
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    !!t.schema &&
    Array.isArray(t.schema.components)
  )
}

function loadTemplates(): PageTemplate[] {
  return loadJsonCollection(STORAGE_KEYS.pageTemplates, isValidPageTemplate, '页面模板')
}

/** 页面模板仓库:整页另存为模板、从模板新建页面 */
export const usePageTemplatesStore = defineStore('pageTemplates', () => {
  const templates = ref<PageTemplate[]>(loadTemplates())

  function persist() {
    localStorage.setItem(STORAGE_KEYS.pageTemplates, JSON.stringify(templates.value))
  }

  /** 保存页面模板:schema 深拷贝,与原页面脱钩 */
  function savePageTemplate(name: string, schema: PageSchema): PageTemplate {
    const template: PageTemplate = {
      id: createId('pt'),
      name,
      schema: deepClone(schema),
      createdAt: Date.now(),
    }
    templates.value.unshift(template)
    persist()
    return template
  }

  function removePageTemplate(id: string) {
    const i = templates.value.findIndex((t) => t.id === id)
    if (i < 0) return
    templates.value.splice(i, 1)
    persist()
  }

  /** 整表替换(备份导入用):records 需已通过 isValidPageTemplate 校验 */
  function replaceAll(records: PageTemplate[]) {
    templates.value = records
    persist()
  }

  return { templates, savePageTemplate, removePageTemplate, replaceAll }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePageTemplatesStore, import.meta.hot))
}
