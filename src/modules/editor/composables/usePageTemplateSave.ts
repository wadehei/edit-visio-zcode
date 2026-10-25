import { ElMessage, ElMessageBox } from 'element-plus'

import { useEditorStore } from '@/stores/editor'
import { usePageTemplatesStore } from '@/stores/page-templates'

/** 整页另存为页面模板(编辑器头部菜单与命令面板共用) */
export function usePageTemplateSave() {
  const editor = useEditorStore()
  const pageTemplatesStore = usePageTemplatesStore()

  return async function saveAsPageTemplate() {
    try {
      const { value } = await ElMessageBox.prompt('模板名称', '保存为页面模板', {
        inputValue: editor.page.name,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空',
      })
      pageTemplatesStore.savePageTemplate(value.trim(), editor.page)
      ElMessage.success('已保存为页面模板')
    } catch {
      /* 用户取消 */
    }
  }
}
