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
 * 度量型测试(非功能断言):量化全量快照撤销系统的真实成本。
 * 场景:4 个组件 × 300KB dataURL 的页面,连续编辑至 HISTORY_LIMIT 步。
 * 输出的数字被 docs/04-技术决策记录(ADR)的"快照式历史"一节引用;
 * 宽松的耗时上限仅作为回归警戒线(当前机器实测远低于此)。
 */
describe('历史快照成本(度量)', () => {
  it('50 步快照的耗时与单页 JSON 尺寸', () => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    setActivePinia(createPinia())
    const editor = useEditorStore()
    editor.loadPage(createEmptyPage('成本度量页'))

    for (let i = 0; i < 4; i++) editor.addComponent('image')

    const pageJsonBytes = JSON.stringify(editor.page).length
    const t0 = performance.now()
    while (editor.past.length < HISTORY_LIMIT) {
      editor.updateComponentProp(editor.page.components[0]!.id, `k${editor.past.length}`, editor.past.length)
    }
    const elapsedMs = performance.now() - t0

    const historyFootprint = editor.past.reduce((sum, e) => sum + JSON.stringify(e.snapshot).length, 0)

    // 输出实测值(单机参考:2026-10,Windows/Node 22)
    console.info(
      `[history-cost] 单页 JSON=${(pageJsonBytes / 1024).toFixed(0)}KB;` +
        `推进 ${HISTORY_LIMIT} 步快照耗时=${elapsedMs.toFixed(1)}ms;` +
        `历史栈总足迹≈${(historyFootprint / 1024 / 1024).toFixed(1)}MB`,
    )

    // 回归警戒线:快照推进不应造成可感知卡顿(实测 ~几十 ms 量级)
    expect(elapsedMs).toBeLessThan(5000)
    expect(historyFootprint / 1024 / 1024).toBeGreaterThan(1) // 确认度量有效:足迹确实在 MB 级
  })
})
