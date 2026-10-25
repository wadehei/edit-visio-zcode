import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
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
