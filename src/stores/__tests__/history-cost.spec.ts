import { describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/modules/materials', () => ({
  getMaterial: (type: string) => ({
    type,
    name: type,
    group: '基础组件',
    icon: 'Grid',
    component: null,
    // defaultProps 带一个 ~300KB 的 dataURL 样载荷,模拟真实"本地上传图片"页面
    defaultProps: () => ({ seed: 1, image: `data:image/jpeg;base64,${'A'.repeat(300_000)}` }),
    propsSchema: [],
  }),
  materialList: [],
}))

import { createEmptyPage } from '@/shared/page'
import { HISTORY_LIMIT, useEditorStore } from '../editor'
import { createLocalStorageStub } from './storage-stub'

/**
 * 度量型测试(非功能断言):验证快照历史的结构共享语义并量化成本。
 * 场景:4 个组件 × 300KB dataURL 的页面,连续编辑至 HISTORY_LIMIT 步。
 * 结构共享 + 写时复制(ADR-003)下,堆内存足迹 = 初始组件集 + 每步一个新组件对象,
 * 不再随步数 × 整页克隆线性增长;序列化尺寸(JSON)不因共享而减少,二者口径不同。
 */
describe('历史快照成本与共享语义(度量)', () => {
  it('50 步编辑:未变更组件对象跨快照共享,变更组件每步新对象', () => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    setActivePinia(createPinia())
    const editor = useEditorStore()
    editor.loadPage(createEmptyPage('共享度量页'))

    for (let i = 0; i < 4; i++) editor.addComponent('image')

    const t0 = performance.now()
    while (editor.past.length < HISTORY_LIMIT) {
      editor.updateComponentProp(editor.page.components[0]!.id, `k${editor.past.length}`, editor.past.length)
    }
    const elapsedMs = performance.now() - t0

    const snapshots = editor.past.map((e) => e.snapshot)
    // past 是"变更前"快照栈:前 4 个对应 4 次 add,后 46 个对应 prop 修改(每次都是 4 组件的完整状态)
    const propSnapshots = snapshots.slice(-HISTORY_LIMIT + 4)
    expect(propSnapshots).toHaveLength(46)

    // 未被编辑的组件(image)在所有 prop 快照中必须是同一个对象引用(共享的证明)
    const untouched = propSnapshots[0]!.components[1]!
    expect(untouched.type).toBe('image')
    expect(propSnapshots.every((s) => s.components[1] === untouched)).toBe(true)

    // 被编辑的组件(text)每一步都是新对象(copy-on-write 的证明),但 props 中的大字符串仍共享
    const editedRefs = new Set(propSnapshots.map((s) => s.components[0]))
    expect(editedRefs.size).toBe(propSnapshots.length)
    const imageStrings = new Set(
      propSnapshots.map((s) => (s.components[0]!.props as { image?: string }).image),
    )
    expect(imageStrings.size).toBe(1)

    // 撤销全部后状态仍精确还原(共享没有腐蚀历史)
    while (editor.canUndo) editor.undo()
    expect(editor.page.components).toHaveLength(0)
    expect(editor.past).toHaveLength(0)

    console.info(
      `[history-cost] 结构共享后:推进 ${HISTORY_LIMIT} 步耗时=${elapsedMs.toFixed(1)}ms;` +
        `堆足迹=初始组件集(≈1.2MB)+${HISTORY_LIMIT} 个数组与单组件对象(≈数十 KB);` +
        `(改造前:50 × 1.17MB ≈ 54MB)`,
    )
    // 回归警戒线:快照推进不应造成可感知卡顿
    expect(elapsedMs).toBeLessThan(5000)
  })
})
