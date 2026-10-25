import fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// 与 editor.spec.ts 相同的物料隔离 mock(属性测试聚焦 store 逻辑)
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
import { PAGE_THEMES } from '@/shared/theme'
import { HISTORY_LIMIT, useEditorStore } from '../editor'
import { createLocalStorageStub } from './storage-stub'

const COMPONENT_TYPES = ['text', 'image', 'button'] as const

/** 固定种子页:所有重放共用同一初始状态(createEmptyPage 每次生成新 id) */
const SEED_PAGE = createEmptyPage('属性测试页')

/**
 * 撤销系统属性测试:不枚举示例,而是对随机操作序列断言不变量。
 * 不变量清单(每条都是"无论用户怎么操作都必须成立"的性质):
 *   I1  undo 全部 → 精确回到装载时的初始状态(含 hidden 等一切字段)
 *   I2  undo 全部后 redo 全部 → 精确回到操作后的最终状态
 *   I3  jumpTo(0) 与"逐次 undo 到底"等价(两次独立重放同一序列)
 *   I4  moveComponent 任意目标下标(含越界)后:组件多重集不变、其余组件相对顺序不变
 *   I5  历史栈长度永不超过 HISTORY_LIMIT
 */
type Op =
  | { t: 'add' }
  | { t: 'remove'; i: number }
  | { t: 'duplicate'; i: number }
  | { t: 'move'; i: number; to: number }
  | { t: 'moveUp'; i: number }
  | { t: 'moveDown'; i: number }
  | { t: 'prop'; i: number }
  | { t: 'page'; i: number }
  | { t: 'clear' }
  | { t: 'theme' }
  | { t: 'hide'; i: number }
  | { t: 'paste' }

const opArb: fc.Arbitrary<Op> = fc.oneof(
  { arbitrary: fc.constant({ t: 'add' } as Op), weight: 3 },
  { arbitrary: fc.record({ t: fc.constant('remove' as const), i: fc.integer({ max: 99, min: 0 }) }), weight: 2 },
  { arbitrary: fc.record({ t: fc.constant('duplicate' as const), i: fc.integer({ max: 99, min: 0 }) }), weight: 1 },
  {
    arbitrary: fc.record({
      t: fc.constant('move' as const),
      i: fc.integer({ max: 99, min: 0 }),
      to: fc.integer({ min: -3, max: 30 }),
    }),
    weight: 3,
  },
  { arbitrary: fc.record({ t: fc.constant('moveUp' as const), i: fc.integer({ max: 99, min: 0 }) }), weight: 1 },
  { arbitrary: fc.record({ t: fc.constant('moveDown' as const), i: fc.integer({ max: 99, min: 0 }) }), weight: 1 },
  { arbitrary: fc.record({ t: fc.constant('prop' as const), i: fc.integer({ max: 99, min: 0 }) }), weight: 3 },
  { arbitrary: fc.record({ t: fc.constant('page' as const), i: fc.integer({ max: 99, min: 0 }) }), weight: 1 },
  { arbitrary: fc.constant({ t: 'clear' } as Op), weight: 1 },
  { arbitrary: fc.constant({ t: 'theme' } as Op), weight: 1 },
  { arbitrary: fc.record({ t: fc.constant('hide' as const), i: fc.integer({ max: 99, min: 0 }) }), weight: 2 },
  { arbitrary: fc.constant({ t: 'paste' } as Op), weight: 1 },
)
const opsArb = fc.array(opArb, { maxLength: 40, minLength: 0 })

/** 对当前组件列表按下标取目标 id,越界/空列表返回 null(调用方跳过该操作) */
function resolveId(editor: ReturnType<typeof useEditorStore>, i: number): string | null {
  const list = editor.page.components
  if (!list.length) return null
  return list[i % list.length]!.id
}

function applyOp(editor: ReturnType<typeof useEditorStore>, op: Op): void {
  switch (op.t) {
    case 'add':
      editor.addComponent(COMPONENT_TYPES[editor.page.components.length % COMPONENT_TYPES.length]!)
      break
    case 'remove': {
      const id = resolveId(editor, op.i)
      if (id) editor.removeComponent(id)
      break
    }
    case 'duplicate': {
      const id = resolveId(editor, op.i)
      if (id) editor.duplicateComponent(id)
      break
    }
    case 'move': {
      const id = resolveId(editor, op.i)
      if (id) editor.moveComponent(id, op.to)
      break
    }
    case 'moveUp': {
      const id = resolveId(editor, op.i)
      if (id) editor.moveComponentUp(id)
      break
    }
    case 'moveDown': {
      const id = resolveId(editor, op.i)
      if (id) editor.moveComponentDown(id)
      break
    }
    case 'prop': {
      const id = resolveId(editor, op.i)
      if (id) editor.updateComponentProp(id, 'fontSize', (op.i % 7) * 2 + 10)
      break
    }
    case 'page':
      editor.updatePageSetting('name', `改名${op.i ?? 0}`)
      break
    case 'clear':
      editor.clearComponents()
      break
    case 'theme':
      editor.applyTheme(PAGE_THEMES[0]!)
      break
    case 'hide': {
      const id = resolveId(editor, op.i)
      if (id) editor.toggleComponentHidden(id)
      break
    }
    case 'paste':
      editor.pasteComponent()
      break
  }
}

function replay(ops: Op[]): { editor: ReturnType<typeof useEditorStore>; initial: unknown } {
  setActivePinia(createPinia())
  const editor = useEditorStore()
  // 固定种子页:两次重放得到完全相同的初始状态(createEmptyPage 每次生成新 id,不能现场造)
  editor.loadPage(SEED_PAGE)
  const initial = JSON.parse(JSON.stringify(editor.page))
  for (const op of ops) applyOp(editor, op)
  return { editor, initial }
}

describe('撤销系统不变量(属性测试)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-25T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('I1+I2:undo 全部还原初始状态,redo 全部还原最终状态', () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        const { editor, initial } = replay(ops)
        const finalState = JSON.parse(JSON.stringify(editor.page))

        while (editor.canUndo) editor.undo()
        expect(editor.page).toEqual(initial)

        while (editor.canRedo) editor.redo()
        expect(editor.page).toEqual(finalState)
      }),
      { numRuns: 200 },
    )
  })

  it('I3:jumpTo(0) 与逐次 undo 到底等价', () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        const { editor: viaJump } = replay(ops)
        viaJump.jumpTo(0)

        const { editor: viaUndo } = replay(ops)
        while (viaUndo.canUndo) viaUndo.undo()

        expect(viaJump.page).toEqual(viaUndo.page)
      }),
      { numRuns: 150 },
    )
  })

  it('I4:moveComponent 任意下标保持多重集与其余组件相对顺序', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...COMPONENT_TYPES), { maxLength: 12, minLength: 1 }),
        fc.integer({ max: 30, min: 0 }),
        fc.integer({ max: 20, min: -5 }),
        (types, fromIdx, toIdx) => {
          setActivePinia(createPinia())
          const editor = useEditorStore()
          editor.loadPage(createEmptyPage('move 测试页'))
          for (const type of types) editor.addComponent(type)

          const before = editor.page.components.map((c) => c.id)
          const moved = before[fromIdx % before.length]!
          editor.moveComponent(moved, toIdx)
          const after = editor.page.components.map((c) => c.id)

          expect([...after].sort()).toEqual([...before].sort())
          expect(after).toHaveLength(before.length)
          expect(after.filter((id) => id !== moved)).toEqual(before.filter((id) => id !== moved))
        },
      ),
      { numRuns: 200 },
    )
  })

  it('I5:历史栈长度永不超过 HISTORY_LIMIT', () => {
    fc.assert(
      fc.property(fc.integer({ min: 55, max: 120 }), (n) => {
        setActivePinia(createPinia())
        const editor = useEditorStore()
        editor.loadPage(createEmptyPage('历史容量页'))
        for (let i = 0; i < n; i++) editor.addComponent(COMPONENT_TYPES[i % COMPONENT_TYPES.length]!)
        expect(editor.past.length).toBeLessThanOrEqual(HISTORY_LIMIT)
      }),
      { numRuns: 30 },
    )
  })
})
