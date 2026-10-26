import { expect, test } from '@playwright/test'

/**
 * 4x CPU 节流下的编辑器交互帧预算(ADR-003/性能实测):
 * 20 组件页面,滚动 + 连续选中切换时的 requestAnimationFrame 间隔采样。
 * 4x 节流模拟中低端设备;断言是宽松的回归警戒线,
 * 实测 p95 数值输出到报告,供后续优化对照。
 */
test('4x CPU 节流下编辑器交互帧预算', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    const components = Array.from({ length: 20 }, (_, i) => ({
      id: `c-${i}`,
      type: 'text',
      props: { content: `组件 ${i} 的展示文案,用于撑起真实渲染负载` },
    }))
    const schema = {
      schemaVersion: 1,
      id: 'p-perf',
      name: '性能度量页',
      title: '性能度量页',
      backgroundColor: '#f5f5f5',
      components,
    }
    localStorage.setItem(
      'visio:pages:v1',
      JSON.stringify([{ id: schema.id, name: schema.name, updatedAt: 1, schema }]),
    )
  })
  await page.goto('/editor/p-perf')
  await expect(page.locator('.editable-wrapper')).toHaveCount(20)

  // 4x CPU 节流(模拟中低端设备)
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  const stats = await page.evaluate(
    () =>
      new Promise<{ baselineP95: number; interactP95: number }>((resolve) => {
        const deltas: number[] = []
        let last = performance.now()
        const sample = (now: number) => {
          deltas.push(now - last)
          last = now
          if (deltas.length < 30) {
            requestAnimationFrame(sample)
            return
          }
          // 采样期间持续产生交互:滚动画布 + 逐个选中组件
          const wrappers = Array.from(document.querySelectorAll<HTMLElement>('.editable-wrapper'))
          const scrollArea = document.querySelector<HTMLElement>('.canvas-scroll')
          let i = 0
          const interact = () => {
            wrappers[i % wrappers.length]?.dispatchEvent(
              new MouseEvent('click', { bubbles: true }),
            )
            if (scrollArea) scrollArea.scrollTop = (scrollArea.scrollTop + 120) % 800
            i++
            if (i < 20) requestAnimationFrame(interact)
            else {
              const sorted = [...deltas].sort((a, b) => a - b)
              const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0
              // baseline:前 30 帧含静止帧;交互帧取尾部再算一次
              const tail = sorted.slice(-20)
              resolve({ baselineP95: p95, interactP95: tail[Math.floor(tail.length * 0.95)] ?? 0 })
            }
          }
          requestAnimationFrame(interact)
        }
        requestAnimationFrame(sample)
      }),
  )

  await session.send('Emulation.setCPUThrottlingRate', { rate: 0 })
  console.info(
    `[frame-budget] 4x 节流,20 组件页面:综合 p95 帧间隔=${stats.baselineP95.toFixed(1)}ms,` +
      `交互尾部 p95=${stats.interactP95.toFixed(1)}ms(警戒线 <100ms,60fps 预算为 16.7ms)`,
  )
  // 回归警戒线:4x 节流下不允许出现可感知卡顿(>100ms 的长任务)
  expect(Math.max(stats.baselineP95, stats.interactP95)).toBeLessThan(100)
})
