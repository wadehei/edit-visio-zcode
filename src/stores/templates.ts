import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

import { STORAGE_KEYS } from '@/shared/constants'
import { createId } from '@/shared/utils/id'
import { loadJsonCollection } from '@/shared/utils/storage'
export interface ComponentTemplate {
  id: string
  name: string
  type: string
  props: Record<string, unknown>
  createdAt: number
}

/** 组件模板合法性校验(备份导入复用) */
export function isValidComponentTemplate(value: unknown): value is ComponentTemplate {
  const t = value as ComponentTemplate | null
  return (
    !!t &&
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.type === 'string' &&
    !!t.props
  )
}

function loadTemplates(): ComponentTemplate[] {
  return loadJsonCollection(STORAGE_KEYS.templates, isValidComponentTemplate, '组件模板')
}

/** 组件模板仓库:把配置好的组件存为可复用片段 */
export const useTemplatesStore = defineStore('templates', () => {
  const templates = ref<ComponentTemplate[]>(loadTemplates())
  /** 最近一次持久化失败的错误信息;null 表示写入正常 */
  const persistError = ref<string | null>(null)

  // 其他标签页修改存储时同步列表,缩小多标签互相覆盖的窗口
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.templates) templates.value = loadTemplates()
    })
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates.value))
      persistError.value = null
    } catch (error) {
      persistError.value = error instanceof Error ? error.message : String(error)
      console.error('[visio] 组件模板存储写入失败', error)
    }
  }

  /** 整表替换(备份导入用):records 需已通过 isValidComponentTemplate 校验 */
  function replaceAll(records: ComponentTemplate[]) {
    templates.value = records
    persist()
  }

  /** 保存模板;持久化失败时返回 null(调用方据此提示),不影响内存态 */
  function saveTemplate(
    name: string,
    type: string,
    props: Record<string, unknown>,
  ): ComponentTemplate | null {
    const template: ComponentTemplate = {
      id: createId('t'),
      name,
      type,
      props: JSON.parse(JSON.stringify(props)),
      createdAt: Date.now(),
    }
    templates.value.unshift(template)
    persist()
    return persistError.value ? null : template
  }

  function removeTemplate(id: string) {
    const i = templates.value.findIndex((t) => t.id === id)
    if (i < 0) return
    templates.value.splice(i, 1)
    persist()
  }

  return { templates, persistError, saveTemplate, removeTemplate, replaceAll }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTemplatesStore, import.meta.hot))
}
