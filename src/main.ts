import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 命令式 API(手动 import,不走 unplugin resolver)需要显式引入样式
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

import App from './App.vue'
import router from './router'
import './styles/variables.css'
import './styles/base.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 图标在模板中以字符串名动态解析(物料 icon 字段),需全量注册
for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, component)
}

app.mount('#app')
