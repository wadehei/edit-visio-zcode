import type { PageRecord } from '@/shared/types'
import { deepClone } from '@/shared/utils/clone'

import type { PageTemplate } from './page-templates'
import { isValidPageTemplate } from './page-templates'
import type { ComponentTemplate } from './templates'
import { isValidComponentTemplate } from './templates'
import { isValidRecord } from './pages'

/** 备份文件结构:version 变更时 parseBackupFile 需同步兼容 */
export interface BackupFile {
  app: 'edit-visio'
  version: 1
  exportedAt: number
  pages: PageRecord[]
  componentTemplates: ComponentTemplate[]
  pageTemplates: PageTemplate[]
}

/** 组装备份文件(不含校验,数据来自各 store 的内存态) */
export function buildBackupFile(
  pages: PageRecord[],
  componentTemplates: ComponentTemplate[],
  pageTemplates: PageTemplate[],
): BackupFile {
  return {
    app: 'edit-visio',
    version: 1,
    exportedAt: Date.now(),
    pages: deepClone(pages),
    componentTemplates: deepClone(componentTemplates),
    pageTemplates: deepClone(pageTemplates),
  }
}

export interface ParsedBackup {
  pages: PageRecord[]
  componentTemplates: ComponentTemplate[]
  pageTemplates: PageTemplate[]
  /** 各集合原始条数,供导入确认提示展示 */
  counts: { pages: number; componentTemplates: number; pageTemplates: number }
}

/** 解析并校验备份文件:结构非法返回 null,脏条目逐条过滤 */
export function parseBackupFile(value: unknown): ParsedBackup | null {
  const file = value as BackupFile | null
  if (!file || file.app !== 'edit-visio' || file.version !== 1) return null
  if (
    !Array.isArray(file.pages) ||
    !Array.isArray(file.componentTemplates) ||
    !Array.isArray(file.pageTemplates)
  ) {
    return null
  }
  const pages = file.pages.filter(isValidRecord).map((r) =>
    // id 一致性归一:以记录 id 为准,避免 schema.id 错位导致编辑保存时产生重复记录
    r.schema.id === r.id ? r : { ...r, schema: { ...r.schema, id: r.id } },
  )
  const componentTemplates = file.componentTemplates.filter(isValidComponentTemplate)
  const pageTemplates = file.pageTemplates.filter(isValidPageTemplate)
  return {
    pages,
    componentTemplates,
    pageTemplates,
    // 过滤后的条数:确认框展示用户实际会得到的数据量
    counts: {
      pages: pages.length,
      componentTemplates: componentTemplates.length,
      pageTemplates: pageTemplates.length,
    },
  }
}
