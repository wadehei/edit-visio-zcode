import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

/** 全量备份/恢复的用户旅程:导出文件结构合法;导入覆盖确认后数据可见 */
test('导出备份文件包含全部数据集合', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    const schema = {
      schemaVersion: 1,
      id: 'p-bk',
      name: '备份页',
      title: '备份页',
      backgroundColor: '#fff',
      components: [],
    }
    localStorage.setItem(
      'visio:pages:v1',
      JSON.stringify([{ id: 'p-bk', name: '备份页', updatedAt: 1, schema }]),
    )
    localStorage.setItem(
      'visio:templates:v1',
      JSON.stringify([{ id: 't-1', name: 'CT', type: 'text', props: {}, createdAt: 1 }]),
    )
    localStorage.setItem(
      'visio:page-templates:v1',
      JSON.stringify([{ id: 'pt-1', name: 'PT', schema, createdAt: 1 }]),
    )
  })
  await page.goto('/')

  await page.getByRole('button', { name: '备份' }).hover()
  const exportItem = page.locator('.el-dropdown-menu__item', { hasText: '导出全部数据' })
  await exportItem.waitFor({ state: 'visible' })
  const [download] = await Promise.all([page.waitForEvent('download'), exportItem.click()])
  const json = JSON.parse(readFileSync(await download.path(), 'utf-8'))
  expect(json.app).toBe('edit-visio')
  expect(json.version).toBe(1)
  expect(json.pages).toHaveLength(1)
  expect(json.componentTemplates).toHaveLength(1)
  expect(json.pageTemplates).toHaveLength(1)
})

test('导入备份经确认后覆盖恢复', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')

  const backup = {
    app: 'edit-visio',
    version: 1,
    exportedAt: 1,
    pages: [
      {
        id: 'p-imported',
        name: '导入的页面',
        updatedAt: 1,
        schema: {
          schemaVersion: 1,
          id: 'p-imported',
          name: '导入的页面',
          title: '导入的页面',
          backgroundColor: '#fff',
          components: [],
        },
      },
    ],
    componentTemplates: [],
    pageTemplates: [],
  }
  await page.locator('input.hidden-file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })

  await page.getByRole('button', { name: /覆盖导入/ }).click()
  await expect(page.locator('.page-card')).toHaveCount(1)
  await expect(page.locator('.page-card')).toContainText('导入的页面')
})
