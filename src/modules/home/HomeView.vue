<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Edit, Plus, View } from '@element-plus/icons-vue'

import { getMaterial } from '@/modules/materials'
import PageRenderer from '@/modules/renderer/PageRenderer.vue'
import { usePagesStore } from '@/stores/pages'
import { CANVAS_WIDTH } from '@/shared/constants'
import { downloadJson } from '@/shared/utils/download'
import { formatDateTime } from '@/shared/utils/format'

const router = useRouter()
const pagesStore = usePagesStore()

function createPage(kind: 'blank' | 'demo') {
  const record = pagesStore.createPage(kind)
  router.push(`/editor/${record.id}`)
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
      <el-dropdown @command="(cmd: string | number | object) => createPage(cmd as 'blank' | 'demo')">
        <el-button type="primary" :icon="Plus">
          新建页面
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="blank">空白页面</el-dropdown-item>
            <el-dropdown-item command="demo">从示例模板创建</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

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
</style>
