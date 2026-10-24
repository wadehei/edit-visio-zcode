import { defineStore, acceptHMRUpdate } from 'pinia'
import { computed, ref } from 'vue'

import type { ComponentSchema, PageSchema } from '@/shared/types'
import type { PageTheme } from '@/shared/theme'
import { STORAGE_KEYS } from '@/shared/constants'
import { isDarkColor } from '@/shared/utils/color'
import { deepClone } from '@/shared/utils/clone'
import { createId } from '@/shared/utils/id'
import { createEmptyPage } from '@/shared/page'
import { getMaterial } from '@/modules/materials'

export type DragPayload = { kind: 'palette'; type: string } | { kind: 'canvas'; id: string }

/** 一条历史记录:label 描述"这一步发生了什么",snapshot 为变更前快照 */
export interface HistoryEntry {
  label: string
  snapshot: PageSchema
}

const HISTORY_LIMIT = 50
const COALESCE_MS = 600

export const useEditorStore = defineStore('editor', () => {
  const page = ref<PageSchema>(createEmptyPage())
  /** 是否已通过 loadPage 装载真实页面;未装载前禁止任何持久化写入 */
  const loaded = ref(false)
  const selectedId = ref<string | null>(null)
  const dragging = ref<DragPayload | null>(null)
  const past = ref<HistoryEntry[]>([])
  const future = ref<HistoryEntry[]>([])

  let lastTag = ''
  let lastTime = 0

  const selectedComponent = computed(
    () => page.value.components.find((c) => c.id === selectedId.value) ?? null,
  )
  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  /** 把 history tag 解析为人类可读的操作描述(在变更前调用,组件信息尚可查询) */
  function resolveLabel(tag: string): string {
    if (tag === 'clear') return '清空画布'
    if (tag === 'theme') return '应用主题'
    const [action, ...rest] = tag.split(':')
    const arg = rest.join(':')
    const compName = (id: string) => {
      const comp = page.value.components.find((c) => c.id === id)
      return comp ? (getMaterial(comp.type)?.name ?? comp.type) : '组件'
    }
    switch (action) {
      case 'add':
        return `添加 ${getMaterial(arg)?.name ?? arg}`
      case 'add-tpl':
        return `插入模板 ${getMaterial(arg)?.name ?? arg}`
      case 'paste':
        return `粘贴 ${getMaterial(arg)?.name ?? arg}`
      case 'remove':
        return `删除 ${compName(arg)}`
      case 'duplicate':
        return `复制 ${compName(arg)}`
      case 'move':
        return `移动 ${compName(arg)}`
      case 'prop': {
        const [id, key] = rest
        return `修改 ${compName(id)} · ${key}`
      }
      case 'page': {
        const map: Record<string, string> = {
          name: '页面名称',
          title: '页面标题',
          backgroundColor: '背景色',
        }
        return `修改页面 · ${map[arg] ?? arg}`
      }
      default:
        return tag
    }
  }

  /** 变更前调用;连续输入类编辑(prop:/page:)600ms 内合并为一步,结构操作始终快照 */
  function pushHistory(tag: string) {
    const now = Date.now()
    const mergeable = tag.startsWith('prop:') || tag.startsWith('page:')
    if (mergeable && tag === lastTag && now - lastTime < COALESCE_MS) {
      lastTime = now
      return
    }
    past.value.push({ label: resolveLabel(tag), snapshot: deepClone(page.value) })
    if (past.value.length > HISTORY_LIMIT) past.value.shift()
    future.value.length = 0
    lastTag = tag
    lastTime = now
  }

  function loadPage(next: PageSchema) {
    page.value = deepClone(next)
    selectedId.value = null
    dragging.value = null
    past.value = []
    future.value = []
    lastTag = ''
    loaded.value = true
  }

  function selectComponent(id: string | null) {
    selectedId.value = id
  }

  function setDragging(payload: DragPayload | null) {
    dragging.value = payload
  }

  function indexOf(id: string): number {
    return page.value.components.findIndex((c) => c.id === id)
  }

  function addComponent(type: string, index?: number) {
    const def = getMaterial(type)
    if (!def) return
    pushHistory(`add:${type}`)
    const comp: ComponentSchema = { id: createId('c'), type, props: def.defaultProps() }
    const list = page.value.components
    const at =
      index === undefined || index < 0 || index > list.length ? list.length : Math.floor(index)
    list.splice(at, 0, comp)
    selectedId.value = comp.id
  }

  /** 从已保存的组件模板实例化(深拷贝 props,避免共享引用) */
  function addComponentFromTemplate(template: { type: string; props: Record<string, unknown> }) {
    const def = getMaterial(template.type)
    if (!def) return
    pushHistory(`add-tpl:${template.type}`)
    const comp: ComponentSchema = {
      id: createId('c'),
      type: template.type,
      props: deepClone(template.props),
    }
    page.value.components.push(comp)
    selectedId.value = comp.id
  }

  function removeComponent(id: string) {
    const i = indexOf(id)
    if (i < 0) return
    pushHistory(`remove:${id}`)
    page.value.components.splice(i, 1)
    if (selectedId.value === id) selectedId.value = null
  }

  function duplicateComponent(id: string) {
    const i = indexOf(id)
    if (i < 0) return
    pushHistory(`duplicate:${id}`)
    const clone = deepClone(page.value.components[i])
    clone.id = createId('c')
    page.value.components.splice(i + 1, 0, clone)
    selectedId.value = clone.id
  }

  function moveComponent(id: string, toIndexRaw: number) {
    const from = indexOf(id)
    if (from < 0) return
    const len = page.value.components.length
    let target = toIndexRaw
    if (from < target) target -= 1
    target = Math.max(0, Math.min(target, len - 1))
    if (target === from) return
    pushHistory(`move:${id}`)
    const list = page.value.components
    const [comp] = list.splice(from, 1)
    list.splice(target, 0, comp)
  }

  function moveComponentUp(id: string) {
    const i = indexOf(id)
    if (i <= 0) return
    pushHistory(`move:${id}`)
    const list = page.value.components
    ;[list[i - 1], list[i]] = [list[i], list[i - 1]]
  }

  function moveComponentDown(id: string) {
    const i = indexOf(id)
    if (i < 0 || i >= page.value.components.length - 1) return
    pushHistory(`move:${id}`)
    const list = page.value.components
    ;[list[i], list[i + 1]] = [list[i + 1], list[i]]
  }

  function updateComponentProp(id: string, key: string, value: unknown) {
    const comp = page.value.components.find((c) => c.id === id)
    if (!comp) return
    pushHistory(`prop:${id}:${key}`)
    comp.props = { ...comp.props, [key]: value }
  }

  function updatePageSetting(key: 'name' | 'title' | 'backgroundColor', value: string) {
    pushHistory(`page:${key}`)
    page.value[key] = value
  }

  // ---- 组件剪贴板:localStorage 持久,跨页面(甚至刷新后)可粘贴 ----

  interface ClipPayload {
    type: string
    props: Record<string, unknown>
  }

  function readClipboard(): ClipPayload | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.clipboard)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<ClipPayload>
      if (!parsed || typeof parsed.type !== 'string' || !parsed.props) return null
      return { type: parsed.type, props: parsed.props }
    } catch {
      return null
    }
  }

  function writeClipboard(comp: ComponentSchema) {
    try {
      localStorage.setItem(
        STORAGE_KEYS.clipboard,
        JSON.stringify({ type: comp.type, props: comp.props } satisfies ClipPayload),
      )
    } catch {
      /* 剪贴板写入失败不影响编辑流程 */
    }
  }

  function copyComponent(id: string) {
    const comp = page.value.components.find((c) => c.id === id)
    if (comp) writeClipboard(comp)
  }

  function cutComponent(id: string) {
    copyComponent(id)
    removeComponent(id)
  }

  /** 粘贴剪贴板组件:深拷贝 props 并生成新 id,插到当前选中项之后(无选中则追加末尾) */
  function pasteComponent(): string | null {
    const clip = readClipboard()
    if (!clip || !getMaterial(clip.type)) return null
    pushHistory(`paste:${clip.type}`)
    const comp: ComponentSchema = { id: createId('c'), type: clip.type, props: deepClone(clip.props) }
    const list = page.value.components
    const i = selectedId.value ? list.findIndex((c) => c.id === selectedId.value) : -1
    list.splice(i >= 0 ? i + 1 : list.length, 0, comp)
    selectedId.value = comp.id
    return comp.id
  }

  /** 一键换肤:按语义槽位重映射页面与组件配色,整体作为一步历史 */
  function applyTheme(theme: PageTheme) {
    pushHistory('theme')
    page.value.backgroundColor = theme.pageBg
    for (const comp of page.value.components) {
      const props = { ...comp.props }
      switch (comp.type) {
        case 'notice-bar':
          props.bgColor = theme.noticeBg
          props.color = theme.noticeColor
          break
        case 'button':
          props.bgColor = theme.primary
          props.color = theme.onPrimary
          break
        case 'text':
          if (typeof props.color === 'string' && props.color) {
            props.color = isDarkColor(props.color) ? theme.titleColor : theme.bodyColor
          }
          break
      }
      comp.props = props
    }
  }

  function clearComponents() {
    if (!page.value.components.length) return
    pushHistory('clear')
    page.value.components = []
    selectedId.value = null
  }

  function undo() {
    if (!past.value.length) return
    const entry = past.value.pop()!
    future.value.push({ label: entry.label, snapshot: deepClone(page.value) })
    page.value = deepClone(entry.snapshot)
    lastTag = ''
  }

  function redo() {
    if (!future.value.length) return
    const entry = future.value.pop()!
    past.value.push({ label: entry.label, snapshot: deepClone(page.value) })
    page.value = deepClone(entry.snapshot)
    lastTag = ''
  }

  /** 时间线跳转:回到 past 中指定下标的那一步(0 = 最老) */
  function jumpTo(target: number) {
    if (target < 0 || target >= past.value.length) return
    const steps = past.value.length - target
    for (let i = 0; i < steps; i++) undo()
  }

  /** 时间线前跳:重做 future 中指定下标(含)之后的全部步骤 */
  function jumpForward(target: number) {
    if (target < 0 || target >= future.value.length) return
    const steps = future.value.length - target
    for (let i = 0; i < steps; i++) redo()
  }

  return {
    page,
    loaded,
    selectedId,
    dragging,
    past,
    future,
    selectedComponent,
    canUndo,
    canRedo,
    loadPage,
    selectComponent,
    setDragging,
    addComponent,
    addComponentFromTemplate,
    removeComponent,
    duplicateComponent,
    moveComponent,
    moveComponentUp,
    moveComponentDown,
    updateComponentProp,
    updatePageSetting,
    copyComponent,
    cutComponent,
    pasteComponent,
    applyTheme,
    clearComponents,
    undo,
    redo,
    jumpTo,
    jumpForward,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEditorStore, import.meta.hot))
}
