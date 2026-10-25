import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { calcVerticalDropIndex, type RectLike } from '../drop-target'

describe('calcVerticalDropIndex(边界示例)', () => {
  const rects: RectLike[] = [
    { top: 0, height: 100 }, // mid 50
    { top: 100, height: 100 }, // mid 150
    { top: 200, height: 100 }, // mid 250
  ]

  it('空列表返回 0(画布为空时落到开头)', () => {
    expect(calcVerticalDropIndex(500, [])).toBe(0)
    expect(calcVerticalDropIndex(-500, [])).toBe(0)
  })

  it('条目上半区落在其前,下半区落在其后', () => {
    expect(calcVerticalDropIndex(49, rects)).toBe(0)
    expect(calcVerticalDropIndex(50, rects)).toBe(1) // 恰在中线 → 归入后一段
    expect(calcVerticalDropIndex(151, rects)).toBe(2)
  })

  it('越过全部条目与超出上界分别落在末尾与开头', () => {
    expect(calcVerticalDropIndex(999, rects)).toBe(3)
    expect(calcVerticalDropIndex(-999, rects)).toBe(0)
  })

  it('高度为 0 的条目不拦截任何落点', () => {
    expect(calcVerticalDropIndex(100, [{ top: 100, height: 0 }, { top: 100, height: 50 }])).toBe(1)
  })
})

describe('calcVerticalDropIndex(性质)', () => {
  // 任意条目布局:允许重叠、无序,但高度非负(真实 DOM 不产生负高度)
  const rectsArb = fc.array(
    fc.record({ top: fc.integer({ max: 2000, min: -2000 }), height: fc.nat(400) }),
    { maxLength: 30, minLength: 0 },
  )
  const clientYArb = fc.integer({ max: 3000, min: -3000 })

  it('P1 落点始终在 [0, rects.length] 内', () => {
    fc.assert(
      fc.property(rectsArb, clientYArb, (rects, y) => {
        const i = calcVerticalDropIndex(y, rects)
        expect(i).toBeGreaterThanOrEqual(0)
        expect(i).toBeLessThanOrEqual(rects.length)
      }),
      { numRuns: 500 },
    )
  })

  it('P2 单调性:clientY 越靠下,落点下标不减小', () => {
    fc.assert(
      fc.property(rectsArb, fc.integer({ max: 2000, min: -3000 }), fc.nat(1000), (rects, y, delta) => {
        expect(calcVerticalDropIndex(y + delta, rects)).toBeGreaterThanOrEqual(
          calcVerticalDropIndex(y, rects),
        )
      }),
      { numRuns: 500 },
    )
  })

  it('P3 无重叠且按 top 升序的真实布局:落点前所有条目中线 ≤ clientY,落点处中线 > clientY', () => {
    // 生成严格不重叠的连续条目:top 递增 height ≥ 1
    const sortedRectsArb = fc
      .array(fc.nat(300), { maxLength: 20, minLength: 1 })
      .chain((heights) => {
        const rects: RectLike[] = []
        let top = 0
        for (const h of heights) {
          rects.push({ top, height: h + 1 })
          top += h + 1
        }
        return fc.constant(rects)
      })

    fc.assert(
      fc.property(sortedRectsArb, clientYArb, (rects, y) => {
        const i = calcVerticalDropIndex(y, rects)
        for (let j = 0; j < i; j++) {
          expect(y).toBeGreaterThanOrEqual(rects[j]!.top + rects[j]!.height / 2)
        }
        if (i < rects.length) {
          expect(y).toBeLessThan(rects[i]!.top + rects[i]!.height / 2)
        }
      }),
      { numRuns: 500 },
    )
  })
})
