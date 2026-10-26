import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  // Vitest:只收集 src 下的单测,排除 Playwright 的 e2e/ 目录
  test: {
    include: ['src/**/*.spec.ts'],
    // 组件测试挂载 SFC 时,unplugin 注入的 element-plus 样式 import 需走 Vite 管线
    // (默认对 node_modules 外部化会以原生 ESM 加载 .css 直接报错)
    server: { deps: { inline: [/element-plus/] } },
  },
  plugins: [
    vue(),
    // Element Plus 按需引入:模板中的 el-* 组件与样式自动注入,替代全量 app.use(ElementPlus)
    Components({ resolvers: [ElementPlusResolver()], dts: 'src/components.d.ts' }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks: {
          // element-plus 不再整包分组:按需引入后由 Rollup 自然拆分,否则 manualChunks 会把整包打进一个 chunk
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
})
