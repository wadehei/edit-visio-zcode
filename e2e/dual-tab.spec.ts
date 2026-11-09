import { expect, test } from '@playwright/test'

/**
 * 双标签并发(独立审查 P0-2 修复的自动化证明,语义见 ADR-005 与 docs/03):
 * 同一浏览器上下文的两个标签页共享 localStorage(真实双标签场景)。
 * 1. 标签 B 修改页面并自动保存 → 标签 A 收到 storage 同步并出现外部改动警告;
 * 2. 标签 A 的编辑器状态保持独立(输入框不被覆盖);
 * 3. 无改动的标签 A 关闭(pagehide saveIfDirty 门控)不得覆盖标签 B 的数据。
 */
test('双标签编辑同一页面:外部改动警告 + 无改动关闭不覆盖', async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    const schema = {
      schemaVersion: 1,
      id: 'p-dual',
      name: '双标签页',
      title: '双标签页',
      backgroundColor: '#f5f5f5',
      components: [],
    }
    localStorage.setItem(
      'visio:pages:v1',
      JSON.stringify([{ id: schema.id, name: schema.name, updatedAt: 1, schema }]),
    )
  })

  // 标签 A:打开编辑器,不做任何修改
  await page.goto('/editor/p-dual')
  await expect(page.locator('.editable-wrapper, .canvas-empty').first()).toBeVisible()
  const nameA = page.locator('.page-name-input input')
  await expect(nameA).toHaveValue('双标签页')

  // 标签 B:打开同一页面,改名并等待自动保存落盘
  const pageB = await context.newPage()
  await pageB.goto('/editor/p-dual')
  const nameB = pageB.locator('.page-name-input input')
  await expect(nameB).toHaveValue('双标签页')
  await nameB.fill('标签二改名')
  await expect(pageB.locator('.save-status')).toContainText('已自动保存', { timeout: 5000 })

  // 标签 A:storage 同步后出现外部改动警告
  await expect(page.locator('.el-message')).toContainText('被其他标签页修改', { timeout: 5000 })
  // 编辑器内容保持独立(storage 同步只刷新列表,不覆盖正在编辑的 schema)
  await expect(nameA).toHaveValue('双标签页')

  // 无改动的标签 A 关闭 → saveIfDirty 门控不写 → 标签 B 的数据完好
  await page.close()
  const stored = await pageB.evaluate(() =>
    JSON.parse(localStorage.getItem('visio:pages:v1') ?? '[]').map((p: { name: string }) => p.name),
  )
  expect(stored).toEqual(['标签二改名'])
})
