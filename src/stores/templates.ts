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

  function persist() {
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates.value))
  }

  /** 整表替换(备份导入用):records 需已通过 isValidComponentTemplate 校验 */
  function replaceAll(records: ComponentTemplate[]) {
    templates.value = records
    persist()
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

  return { templates, saveTemplate, removeTemplate, replaceAll }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTemplatesStore, import.meta.hot))
}
