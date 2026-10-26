// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// 物料 mock:两个分组各一个物料,Widget 可渲染
vi.mock('@/modules/materials', async () => {
  const { defineComponent, h, markRaw } = await import('vue')
  const make = (type: string, group: string) => ({
    type,
    name: `物料${type}`,
    group,
    icon: 'Grid',
    component: markRaw(defineComponent({ setup: () => () => h('div') })),
    defaultProps: () => ({}),
    propsSchema: [],
  })
  const materialList = [make('text', '基础组件'), make('image', '基础组件'), make('carousel', '营销组件')]
  return {
    getMaterial: (type: string) => materialList.find((m) => m.type === type),
    materialList,
  }
})

import { createEmptyPage } from '@/shared/page'
import { useEditorStore } from '@/stores/editor'
import { useTemplatesStore } from '@/stores/templates'
import { createLocalStorageStub } from '@/stores/__tests__/storage-stub'
import MaterialPalette from '../MaterialPalette.vue'

function mountPalette() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const editor = useEditorStore()
  editor.loadPage(createEmptyPage('面板测试页'))
  const wrapper = mount(MaterialPalette, { global: { plugins: [pinia] } })
  return { wrapper, editor, templates: useTemplatesStore() }
}

describe('MaterialPalette(组件挂载)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
  })

  it('默认物料页签:按分组渲染物料,点击物料即添加组件', async () => {
    const { wrapper, editor } = mountPalette()
    const items = wrapper.findAll('.material-item')
    expect(items).toHaveLength(3)
    await items[0]!.trigger('click')
    expect(editor.page.components.map((c) => c.type)).toEqual(['text'])
  })

  it('图层面板:列出组件,眼睛图标切换隐藏', async () => {
    const { wrapper, editor } = mountPalette()
    editor.addComponent('text')
    editor.addComponent('image')
    await wrapper.get('.palette-tab:nth-child(2)').trigger('click')
    const layerItems = wrapper.findAll('.layer-item')
    expect(layerItems).toHaveLength(2)

    await wrapper.get('.layer-item .layer-actions .el-icon').trigger('click')
    expect(editor.page.components[0]!.hidden).toBe(true)
    expect(wrapper.find('.layer-item.hidden').exists()).toBe(true)
  })

  it('图层点击选中组件', async () => {
    const { wrapper, editor } = mountPalette()
    editor.addComponent('text')
    await wrapper.get('.palette-tab:nth-child(2)').trigger('click')
    await wrapper.get('.layer-item').trigger('click')
    expect(editor.selectedId).toBe(editor.page.components[0]!.id)
  })

  it('模板页签:空态提示;有模板时点击即插入画布,删除图标接线 store', async () => {
    const { wrapper, editor, templates } = mountPalette()
    await wrapper.get('.palette-tab:nth-child(3)').trigger('click')
    expect(wrapper.find('.layer-empty').exists()).toBe(true)

    templates.saveTemplate('我的模板', 'text', {})
    await wrapper.vm.$nextTick()
    const tplItems = wrapper.findAll('.layer-item')
    expect(tplItems).toHaveLength(1)
    await tplItems[0]!.trigger('click')
    expect(editor.page.components).toHaveLength(1)
    expect(editor.page.components[0]!.type).toBe('text')

    await wrapper.get('.layer-actions .el-icon.danger').trigger('click')
    expect(templates.templates).toHaveLength(0)
  })
})
