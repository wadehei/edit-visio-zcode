# AGENTS.md

移动端页面可视化装修平台(低代码编辑器)。给 AI 助手与新人贡献者的项目入口说明。

## 项目速览

- 技术栈:Vue 3.5 + TypeScript(strict) + Vite 6 + Pinia + Element Plus(按需引入)+ Vitest
- 无后端:页面数据存 localStorage(`visio:pages:v1`),Schema 即 JSON
- 页面结构:首页(`/`)、编辑器(`/editor/:id`)、预览(`/preview/:id`),编辑/预览共用 `src/modules/renderer/PageRenderer.vue`

## 必读文档

| 文档 | 内容 |
| --- | --- |
| [docs/01-总体方案.md](docs/01-总体方案.md) | 架构、数据模型、里程碑 |
| [docs/02-项目规范.md](docs/02-项目规范.md) | 目录/命名/代码风格/测试规范 |
| [docs/03-开发指南.md](docs/03-开发指南.md) | **新人上手**:命令、架构分层、新增物料 SOP、常见坑 |

## 开发约定

1. 改动前先读 docs/03 的「架构分层」与「常见坑」;物料相关改动走 docs/03 §4 的 5 步 SOP。
2. 依赖方向:`shared → stores → modules`,禁止反向 import;localStorage 只允许 `stores/` 各 store 访问(加载/损坏备份统一走 `shared/utils/storage.ts`),键集中在 `shared/constants.ts` 的 `STORAGE_KEYS`。
3. 编辑器所有写操作走 editor store action(先 `pushHistory` 再改数据),保证撤销可用。
4. `Element Plus` 模板组件按需自动注入;命令式 API(ElMessage 等)手动 import 时必须在 `main.ts` 手动引样式;`manualChunks` 不要列 element-plus。

## 验证与提交

```bash
npm run check    # test + typecheck + lint,提交前必须全绿(pre-commit 自动执行)
```

- 新功能必须带单元测试;修 bug 先写复现用例。
- 提交信息用中文一行式:`<范围>:<做了什么>`,例如 `编辑器:组件支持隐藏/显示`。
- Schema 加字段必须向后兼容(可选字段),加载侧过滤脏数据(参考 `stores/pages.ts` 的 `isValidRecord`)。
