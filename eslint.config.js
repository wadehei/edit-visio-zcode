import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'visio/ignores',
    ignores: ['dist', 'node_modules'],
  },
  {
    name: 'visio/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    name: 'visio/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
