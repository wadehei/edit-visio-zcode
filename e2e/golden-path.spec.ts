import { expect, test } from '@playwright/test'

/**
 * 编辑器金路径:创建 → 编辑 → 自动保存 → 撤销/重做 → 手动保存 → 预览。
 * 这是产品的主干用户旅程,任何一轮改动后必须保持绿色。
 */
test('新建页面到预览的完整旅程', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Visio 装修平台')

  // 新建空白页面(hover 展开下拉,等菜单可见再点击)
  await page.getByRole('button', { name: /新建页面/ }).hover()
  const blankItem = page.locator('.el-dropdown-menu__item', { hasText: '空白页面' })
  await blankItem.waitFor({ state: 'visible' })
  await blankItem.click()
  await expect(page).toHaveURL(/\/editor\//)

  // 点击物料添加组件
  await page.locator('.material-item').filter({ hasText: /^文本$/ }).click()
  await expect(page.locator('.editable-wrapper')).toHaveCount(1)

  // 修改页面名 → 保存状态联动(dirty → 自动保存 → saved)
  const nameInput = page.locator('.page-name-input input')
  await nameInput.fill('金路径页面')
  await expect(page.locator('.save-status')).toContainText('有未保存的修改')
  await expect(page.locator('.save-status')).toContainText('已自动保存', { timeout: 5000 })

  // 撤销改名(输入框聚焦时撤销走浏览器原生?否——editor 快捷键在非输入语义时生效;
  // 这里先失焦再撤销,断言精确回到默认名)
  await page.keyboard.press('Escape') // 取消选中/失焦画布
  await nameInput.blur()
  await page.keyboard.press('Control+z')
  await expect(nameInput).toHaveValue('未命名页面')
  await page.keyboard.press('Control+Shift+z')
  await expect(nameInput).toHaveValue('金路径页面')

  // 手动保存(焦点仍在输入框时 Ctrl+S 也必须生效)
  await page.keyboard.press('Control+s')
  await expect(page.locator('.el-message')).toContainText('页面已保存')

  // 打开预览(新标签)
  const [preview] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('link', { name: /预览/ }).click(),
  ])
  await expect(preview.locator('.preview-phone')).toBeVisible()
})
