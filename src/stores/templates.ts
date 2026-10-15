import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

import { createId } from '@/shared/utils/id'

export interface ComponentTemplate {
  id: string
  name: string
  type: string
  props: Record<string, unknown>
  createdAt: number
}

const STORAGE_KEY = 'visio:templates:v1'

function loadTemplates(): ComponentTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('templates storage is not an array')
    return parsed.filter(
      (t): t is ComponentTemplate =>
        !!t && typeof t.id === 'string' && typeof t.name === 'string' && typeof t.type === 'string',
    )
  } catch (error) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) localStorage.setItem(`${STORAGE_KEY}:corrupted:${Date.now()}`, raw)
    } catch {
      /* 备份失败时忽略 */
    }
    console.error('[visio] 模板存储解析失败,已备份原始数据', error)
    return []
  }
}

/** 组件模板仓库:把配置好的组件存为可复用片段 */
export const useTemplatesStore = defineStore('templates', () => {
  const templates = ref<ComponentTemplate[]>(loadTemplates())

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates.value))
  }

  function saveTemplate(name: string, type: string, props: Record<string, unknown>): ComponentTemplate {
    const template: ComponentTemplate = {
      id: createId('t'),
      name,
      type,
      props: JSON.parse(JSON.stringify(props)),
      createdAt: Date.now(),
    }
    templates.value.unshift(template)
    persist()
    return template
  }

  function removeTemplate(id: string) {
    const i = templates.value.findIndex((t) => t.id === id)
    if (i < 0) return
    templates.value.splice(i, 1)
    persist()
  }

  return { templates, saveTemplate, removeTemplate }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTemplatesStore, import.meta.hot))
}
