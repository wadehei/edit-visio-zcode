<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Edit, Plus, View } from '@element-plus/icons-vue'

import { getMaterial } from '@/modules/materials'
import PageRenderer from '@/modules/renderer/PageRenderer.vue'
import PageTemplateDialog from './PageTemplateDialog.vue'
import { usePagesStore } from '@/stores/pages'
import { usePageTemplatesStore, type PageTemplate } from '@/stores/page-templates'
import { useTemplatesStore } from '@/stores/templates'
import { buildBackupFile, parseBackupFile } from '@/stores/backup'
import { CANVAS_WIDTH, STORAGE_QUOTA } from '@/shared/constants'
import { createId } from '@/shared/utils/id'
import { deepClone } from '@/shared/utils/clone'
import { toPageRecord } from '@/shared/page'
import { downloadJson, readJsonFile } from '@/shared/utils/download'
import { formatDateTime } from '@/shared/utils/format'

const router = useRouter()
const pagesStore = usePagesStore()
const pageTemplatesStore = usePageTemplatesStore()
const templatesStore = useTemplatesStore()
const pageTemplateDialogVisible = ref(false)
const backupInputRef = ref<HTMLInputElement | null>(null)

// 存储占用口径 = 页面 + 组件模板 + 页面模板(三者共享同一 5MB 配额)
const usageBytes = computed(
  () =>
    pagesStore.usageBytes +
    JSON.stringify(templatesStore.templates).length +
    JSON.stringify(pageTemplatesStore.templates).length,
)
const usagePercent = computed(() => Math.min(100, Math.round((usageBytes.value / STORAGE_QUOTA) * 100)))
const usageLabel = computed(() => {
  const bytes = usageBytes.value
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
})
const usageColor = computed(() =>
  usagePercent.value >= 80 ? 'var(--visio-color-danger)' : 'var(--visio-color-warning)',
)

function createPage(kind: 'blank' | 'demo') {
  const record = pagesStore.createPage(kind)
  router.push(`/editor/${record.id}`)
}

/** 从页面模板新建页面:深拷贝 schema 并分配新页面 id,与模板脱钩 */
function createFromPageTemplate(t: PageTemplate) {
  const schema = deepClone(t.schema)
  schema.id = createId('p')
  schema.name = t.name
  pagesStore.upsert(toPageRecord(schema))
  router.push(`/editor/${schema.id}`)
}

function onCreateCommand(cmd: string | number | object) {
  if (String(cmd) === 'page-template') {
    pageTemplateDialogVisible.value = true
    return
  }
  createPage(cmd as 'blank' | 'demo')
}

// ---- 全量备份/恢复:页面 + 组件模板 + 页面模板 打包为一个 JSON 文件 ----

function exportBackup() {
  const file = buildBackupFile(pagesStore.pages, templatesStore.templates, pageTemplatesStore.templates)
  downloadJson(`visio-backup-${formatDateTime(file.exportedAt).replace(/[: ]/g, '-')}.json`, file)
  ElMessage.success('备份已导出')
}

function onBackupCommand(cmd: string | number | object) {
  if (String(cmd) === 'export') exportBackup()
  else if (String(cmd) === 'import') backupInputRef.value?.click()
}

async function onBackupFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  let parsed: ReturnType<typeof parseBackupFile>
  try {
    parsed = parseBackupFile(await readJsonFile(file))
  } catch {
    parsed = null
  }
  if (!parsed) {
    ElMessage.error('导入失败:不是有效的备份文件')
    return
  }
  try {
    await ElMessageBox.confirm(
      `将覆盖当前全部数据:导入 ${parsed.counts.pages} 个页面、${parsed.counts.componentTemplates} 个组件模板、${parsed.counts.pageTemplates} 个页面模板。此操作不可撤销,确定继续?`,
      '导入备份',
      { type: 'warning', confirmButtonText: '覆盖导入' },
    )
  } catch {
    return
  }
  pagesStore.replaceAll(parsed.pages)
  templatesStore.replaceAll(parsed.componentTemplates)
  pageTemplatesStore.replaceAll(parsed.pageTemplates)
  // 三个集合必须都写入成功;部分失败时如实告知,避免"导入成功"的假象
  const failures = [
    ['页面', pagesStore.persistError],
    ['组件模板', templatesStore.persistError],
    ['页面模板', pageTemplatesStore.persistError],
  ].filter(([, err]) => !!err)
  if (failures.length) {
    ElMessage.error(`备份导入未完成(写入失败:${failures.map(([n]) => n).join('、')}),请清理存储空间后重试`)
    return
  }
  ElMessage.success('备份已导入')
}

function onCardCommand(id: string, cmd: string | number | object) {
  const c = String(cmd)
  if (c === 'copy') {
    if (pagesStore.duplicatePage(id)) ElMessage.success('页面已复制')
  } else if (c === 'rename') {
    void doRename(id)
  } else if (c === 'export') {
    const page = pagesStore.getPage(id)
    if (page) downloadJson(`${page.name}.json`, page.schema)
  } else if (c === 'delete') {
    void doDelete(id)
  }
}

async function doRename(id: string) {
  const page = pagesStore.getPage(id)
  if (!page) return
  try {
    const { value } = await ElMessageBox.prompt('请输入新的页面名称', '重命名', {
      inputValue: page.name,
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
    })
    pagesStore.renamePage(id, value.trim())
    ElMessage.success('已重命名')
  } catch {
    /* 用户取消 */
  }
}

async function doDelete(id: string) {
  try {
    await ElMessageBox.confirm('删除后无法恢复,确定删除该页面吗?', '删除页面', {
      type: 'warning',
      confirmButtonText: '删除',
      confirmButtonClass: 'el-button--danger',
    })
  } catch {
    return
  }
  pagesStore.removePage(id)
  ElMessage.success('已删除')
}

function componentSummary(types: string[]): string {
  const names = types.map((t) => getMaterial(t)?.name ?? t)
  return names.slice(0, 4).join(' / ') + (names.length > 4 ? ' …' : '')
}
</script>

<template>
  <div class="home-view">
    <header class="home-header">
      <div class="home-brand">
        <span class="brand-logo">📱</span>
        <div class="brand-text">
          <h1>Visio 装修平台</h1>
          <p>移动端页面 · 可视化搭建</p>
        </div>
      </div>
      <el-dropdown @command="onBackupCommand">
        <el-button>
          备份
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="export">导出全部数据</el-dropdown-item>
            <el-dropdown-item command="import">导入备份(覆盖当前)</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown @command="onCreateCommand">
        <el-button type="primary" :icon="Plus">
          新建页面
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="blank">空白页面</el-dropdown-item>
            <el-dropdown-item command="demo">从示例模板创建</el-dropdown-item>
            <el-dropdown-item command="page-template" divided>
              从页面模板创建{{ pageTemplatesStore.templates.length ? `(${pageTemplatesStore.templates.length})` : '' }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <PageTemplateDialog
      v-model="pageTemplateDialogVisible"
      @use="createFromPageTemplate"
    />

    <input
      ref="backupInputRef"
      type="file"
      accept="application/json,.json"
      class="hidden-file"
      @change="onBackupFile"
    />

    <div class="storage-bar" title="本地浏览器存储占用估算,超过配额将无法保存">
      <el-progress
        class="storage-bar-track"
        :percentage="usagePercent"
        :stroke-width="5"
        :show-text="false"
        :color="usageColor"
      />
      <span class="storage-bar-text" :class="{ warn: usagePercent >= 80 }">
        存储已用 {{ usageLabel }}
      </span>
    </div>

    <main class="home-content">
      <div v-if="pagesStore.pages.length" class="page-grid">
        <div v-for="p in pagesStore.pages" :key="p.id" class="page-card">
          <div class="card-main" @click="router.push(`/editor/${p.id}`)">
            <div class="card-thumb">
              <div v-if="p.schema.components.length" class="thumb-viewport">
                <div class="thumb-scale" :style="{ width: `${CANVAS_WIDTH}px` }">
                  <PageRenderer :page="p.schema" />
                </div>
              </div>
              <div v-else class="thumb-empty">空白页</div>
            </div>
            <div class="card-title">{{ p.name }}</div>
            <div class="card-meta">
              <span>{{ formatDateTime(p.updatedAt) }}</span>
              <span>{{ p.schema.components.length }} 个组件</span>
            </div>
            <div class="card-summary">
              {{ componentSummary(p.schema.components.map((c) => c.type)) }}
            </div>
          </div>
          <div class="card-actions">
            <el-button type="primary" size="small" :icon="Edit" @click="router.push(`/editor/${p.id}`)">
              编辑
            </el-button>
            <router-link :to="`/preview/${p.id}`" target="_blank">
              <el-button size="small" :icon="View">预览</el-button>
            </router-link>
            <el-dropdown
              trigger="click"
              @command="(cmd: string | number | object) => onCardCommand(p.id, cmd)"
            >
              <el-button size="small">
                ···
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy">复制页面</el-dropdown-item>
                  <el-dropdown-item command="rename">重命名</el-dropdown-item>
                  <el-dropdown-item command="export">导出 JSON</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <div v-else class="home-empty">
        <div class="empty-icon">🧱</div>
        <p>还没有页面</p>
        <span>点击右上角「新建页面」,从空白页或示例模板开始装修</span>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-view {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.home-header {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: var(--visio-bg-panel);
  border-bottom: 1px solid var(--visio-border);
}

.home-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  font-size: 28px;
}

.brand-text h1 {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
}

.brand-text p {
  margin: 0;
  font-size: 12px;
  color: var(--visio-text-secondary);
}

.home-content {
  flex: 1;
  padding: 24px 32px;
}

.page-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.storage-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 320px;
  margin: 0 auto 16px;
}

.storage-bar-track {
  flex: 1;
}

.storage-bar-text {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--visio-text-secondary);
  white-space: nowrap;
}

.storage-bar-text.warn {
  color: var(--visio-color-danger);
  font-weight: 600;
}

.page-card {
  background: var(--visio-bg-panel);
  border: 1px solid var(--visio-border);
  border-radius: var(--visio-radius-md);
  padding: 16px;
  transition: box-shadow 0.15s;
  /* 页面多时跳过视口外卡片的渲染(缩略图每张都是完整 PageRenderer) */
  content-visibility: auto;
  contain-intrinsic-size: auto 236px;
}

.page-card:hover {
  box-shadow: 0 4px 16px rgba(31, 41, 55, 0.08);
}

.card-main {
  cursor: pointer;
}

.card-thumb {
  height: 140px;
  border: 1px solid var(--visio-border);
  border-radius: 6px;
  margin-bottom: 10px;
  overflow: hidden;
  background: #fff;
  display: flex;
  justify-content: center;
}

.thumb-viewport {
  width: 225px;
  height: 140px;
  overflow: hidden;
  position: relative;
}

.thumb-scale {
  transform: scale(0.6);
  transform-origin: top left;
  pointer-events: none;
}

.thumb-empty {
  align-self: center;
  color: var(--visio-text-disabled);
  font-size: 13px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--visio-text-secondary);
  margin-bottom: 8px;
}

.card-summary {
  font-size: 12px;
  color: var(--visio-text-disabled);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-height: 16px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--visio-border);
}

.home-empty {
  margin-top: 120px;
  text-align: center;
  color: var(--visio-text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.home-empty p {
  font-size: 16px;
  margin: 0 0 8px;
  color: var(--visio-text-primary);
}

.home-empty span {
  font-size: 13px;
}

.hidden-file {
  display: none;
}
</style>
