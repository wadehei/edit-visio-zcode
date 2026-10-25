import { ElMessage, ElMessageBox } from 'element-plus'

import { useEditorStore } from '@/stores/editor'
import { usePageTemplatesStore } from '@/stores/page-templates'

/** 整页另存为页面模板(编辑器头部菜单与命令面板共用) */
export function usePageTemplateSave() {
  const editor = useEditorStore()
  const pageTemplatesStore = usePageTemplatesStore()

  return async function saveAsPageTemplate() {
    // 取消与保存失败必须分开处理:persist 抛错不能被"用户取消"分支吞掉
    let name: string
    try {
      const { value } = await ElMessageBox.prompt('模板名称', '保存为页面模板', {
        inputValue: editor.page.name,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空',
      })
      name = value.trim()
    } catch {
      return // 用户取消
    }
    const saved = pageTemplatesStore.savePageTemplate(name, editor.page)
    if (!saved) {
      ElMessage.error('页面模板保存失败,请检查浏览器存储空间')
      return
    }
    ElMessage.success('已保存为页面模板')
  }
}
