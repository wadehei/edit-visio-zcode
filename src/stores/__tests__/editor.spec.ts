import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// 物料注册表含 .vue 组件,node 测试环境统一 mock,聚焦 store 逻辑本身
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

import { createEmptyPage } from '@/shared/page'
import { STORAGE_KEYS } from '@/shared/constants'
import { useEditorStore } from '../editor'
import { createLocalStorageStub } from './storage-stub'

function makePage() {
  return createEmptyPage('测试页')
}

describe('editor store', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-09T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('初始未装载,loadPage 后 loaded 为 true 并重置选中与历史', () => {
    const editor = useEditorStore()
    expect(editor.loaded).toBe(false)
    editor.loadPage(makePage())
    expect(editor.loaded).toBe(true)
    expect(editor.past).toHaveLength(0)
    expect(editor.future).toHaveLength(0)
    expect(editor.selectedId).toBeNull()
  })

  it('addComponent 追加组件并自动选中', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    expect(editor.page.components).toHaveLength(1)
    expect(editor.selectedId).toBe(editor.page.components[0].id)
  })

  it('结构操作不合并:600ms 内两次添加需要两次撤销', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    vi.advanceTimersByTime(100)
    editor.addComponent('text')
    expect(editor.past).toHaveLength(2)

    editor.undo()
    expect(editor.page.components).toHaveLength(1)
    editor.undo()
    expect(editor.page.components).toHaveLength(0)
  })

  it('属性编辑合并:600ms 内同组件同 key 连续修改只需一次撤销', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    editor.undo() // 撤销添加,清空历史便于断言
    editor.redo() // 恢复添加,历史回到 1 条(空页面快照)

    const id = editor.page.components[0].id
    editor.updateComponentProp(id, 'fontSize', 14)
    vi.advanceTimersByTime(100)
    editor.updateComponentProp(id, 'fontSize', 18)
    expect(editor.page.components[0].props.fontSize).toBe(18)
    expect(editor.past).toHaveLength(2) // 空页面快照 + 属性修改前快照(两次输入合并为一步)

    editor.undo()
    expect(editor.page.components[0].props.fontSize).toBeUndefined()
  })

  it('moveComponent 支持拖到末尾与自我位置无操作', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    editor.addComponent('image')
    editor.addComponent('button')

    const first = editor.page.components[0].id
    editor.moveComponent(first, 3)
    expect(editor.page.components.map((c) => c.type)).toEqual(['image', 'button', 'text'])

    editor.moveComponent(first, 2) // 已在末尾,目标等于自身
    expect(editor.page.components.map((c) => c.type)).toEqual(['image', 'button', 'text'])
  })

  it('duplicateComponent 生成新 id 并插入到紧随其后', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    editor.addComponent('image')
    const first = editor.page.components[0].id
    editor.duplicateComponent(first)
    expect(editor.page.components).toHaveLength(3)
    expect(editor.page.components[1].id).not.toBe(first)
    expect(editor.page.components[1].type).toBe('text')
  })

  it('removeComponent 清空选中', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    const id = editor.page.components[0].id
    editor.selectComponent(id)
    editor.removeComponent(id)
    expect(editor.page.components).toHaveLength(0)
    expect(editor.selectedId).toBeNull()
  })

  it('toggleComponentHidden 切换隐藏并可撤销,历史标签区分方向', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    const id = editor.page.components[0].id

    editor.toggleComponentHidden(id)
    expect(editor.page.components[0].hidden).toBe(true)
    expect(editor.past[editor.past.length - 1]?.label).toBe('隐藏 text')

    editor.toggleComponentHidden(id)
    expect(editor.page.components[0].hidden).toBeUndefined()
    expect(editor.past[editor.past.length - 1]?.label).toBe('显示 text')

    editor.undo()
    expect(editor.page.components[0].hidden).toBe(true)
    editor.undo()
    expect(editor.page.components[0].hidden).toBeUndefined()
  })

  it('历史条目携带可读标签', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    expect(editor.past[editor.past.length - 1]?.label).toBe('添加 text')

    editor.updatePageSetting('name', '新名字')
    expect(editor.past[editor.past.length - 1]?.label).toBe('修改页面 · 页面名称')
  })

  it('jumpTo 直接回退到指定历史步,redo 栈对称', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    editor.addComponent('image')
    editor.addComponent('button')
    expect(editor.page.components).toHaveLength(3)

    editor.jumpTo(1) // 回到只剩 1 个组件的状态
    expect(editor.page.components).toHaveLength(1)
    expect(editor.past).toHaveLength(1)
    // future 为栈:底→顶,重做时先恢复 image 再恢复 button
    expect(editor.future.map((f) => f.label)).toEqual(['添加 button', '添加 image'])

    editor.jumpForward(0) // 重做全部
    expect(editor.page.components).toHaveLength(3)
    expect(editor.future).toHaveLength(0)
  })
})

describe('组件剪贴板', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-09T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('copy 后 paste 插入当前选中项之后,新 id + 深拷贝 props', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    const first = editor.page.components[0].id
    editor.copyComponent(first)
    editor.addComponent('image')

    editor.pasteComponent()
    expect(editor.page.components.map((c) => c.type)).toEqual(['text', 'image', 'text'])
    const pasted = editor.page.components[2]
    expect(pasted.id).not.toBe(first)
    expect(pasted.props).toEqual({ seed: 1 })
    expect(editor.past[editor.past.length - 1]?.label).toBe('粘贴 text')
    expect(editor.selectedId).toBe(pasted.id)
  })

  it('无选中时 paste 追加末尾', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    editor.copyComponent(editor.page.components[0].id)
    editor.selectComponent(null)

    editor.pasteComponent()
    expect(editor.page.components.map((c) => c.type)).toEqual(['text', 'text'])
  })

  it('cut = 复制 + 删除,可撤销且可粘贴恢复', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('button')
    const id = editor.page.components[0].id

    editor.cutComponent(id)
    expect(editor.page.components).toHaveLength(0)
    editor.undo()
    expect(editor.page.components).toHaveLength(1)

    editor.pasteComponent()
    // undo 恢复的原组件 + 剪贴板粘贴的副本
    expect(editor.page.components.map((c) => c.type)).toEqual(['button', 'button'])
  })

  it('剪贴板跨页面可用:loadPage 换页后仍能粘贴', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    editor.addComponent('text')
    editor.copyComponent(editor.page.components[0].id)

    editor.loadPage(createEmptyPage('另一页'))
    editor.pasteComponent()
    expect(editor.page.components.map((c) => c.type)).toEqual(['text'])
  })

  it('剪贴板为空或损坏时 paste 返回 null 且不改画布', () => {
    const editor = useEditorStore()
    editor.loadPage(makePage())
    expect(editor.pasteComponent()).toBeNull()

    localStorage.setItem(STORAGE_KEYS.clipboard, '{broken!!')
    expect(editor.pasteComponent()).toBeNull()
    expect(editor.page.components).toHaveLength(0)
  })
})
