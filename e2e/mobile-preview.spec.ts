import { expect, test } from '@playwright/test'

/**
 * 移动端是预览面(见 docs/04 ADR-004:编辑器桌面拖拽依赖 HTML5 DnD,触屏不可用是有意边界)。
 * 该用例验证移动视口 + 触屏环境下预览页正常渲染且无水平溢出。
 */
test.use({ viewport: { width: 375, height: 667 }, hasTouch: true })

test('移动端预览渲染且无水平溢出', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    const schema = {
      schemaVersion: 1,
      id: 'p-e2e-mobile',
      name: '移动预览页',
      title: '移动预览页',
      backgroundColor: '#f5f5f5',
      components: [
        { id: 'c-1', type: 'text', props: { content: '移动端预览验证' } },
        { id: 'c-2', type: 'image', props: { src: '/sample-images/banner-1.svg' } },
      ],
    }
    localStorage.setItem(
      'visio:pages:v1',
      JSON.stringify([{ id: schema.id, name: schema.name, updatedAt: 1, schema }]),
    )
  })
  await page.goto('/preview/p-e2e-mobile')

  await expect(page.locator('.preview-phone')).toBeVisible()
  await expect(page.locator('.preview-phone')).toContainText('移动端预览验证')
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(horizontalOverflow).toBeLessThanOrEqual(0)
})
