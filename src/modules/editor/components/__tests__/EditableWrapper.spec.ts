// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// 物料 mock:仅认识有限类型,可渲染的 Widget 组件(真实物料含 .vue,属性固定即可)
vi.mock('@/modules/materials', async () => {
  const { defineComponent, h, markRaw } = await import('vue')
  const KNOWN = new Set(['text', 'image', 'button', 'carousel'])
  const getMaterial = (type: string) => {
    if (!KNOWN.has(type)) return undefined
    return {
      type,
      name: `物料${type}`,
      group: '基础组件',
      icon: 'Grid',
      component: markRaw(
        defineComponent({
          name: 'MockWidget',
          setup(_props, { attrs }) {
            return () => h('div', { class: 'mock-widget' }, String(attrs.content ?? type))
          },
        }),
      ),
      defaultProps: () => ({ seed: 1, content: 'mock 内容' }),
      propsSchema: [],
    }
  }
  return { getMaterial, materialList: [] }
})

import { createEmptyPage } from '@/shared/page'
import { useEditorStore } from '@/stores/editor'
import { createLocalStorageStub } from '@/stores/__tests__/storage-stub'
import EditableWrapper from '../EditableWrapper.vue'

function mountWrapper(compOverrides: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const editor = useEditorStore()
  editor.loadPage(createEmptyPage('组件测试页'))
  editor.addComponent('text')
  const comp = { ...editor.page.components[0]!, ...compOverrides }
  // 直接以指定组件状态挂载(hidden 等场景绕过 store 生成)
  editor.page.components.splice(0, 1, comp)

  const wrapper = mount(EditableWrapper, {
    props: { comp },
    global: { plugins: [pinia] },
  })
  return { wrapper, editor, comp }
}

describe('EditableWrapper(组件挂载)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
  })

  it('渲染物料 Widget 并透传 props', () => {
    const { wrapper } = mountWrapper()
    expect(wrapper.find('.mock-widget').exists()).toBe(true)
    expect(wrapper.text()).toContain('mock 内容')
  })

  it('点击选中:写入 store 且不向外冒泡导航', async () => {
    const { wrapper, editor, comp } = mountWrapper()
    const outerClick = vi.fn()
    wrapper.element.parentElement?.addEventListener('click', outerClick)
    await wrapper.find('.editable-wrapper').trigger('click')
    expect(editor.selectedId).toBe(comp.id)
    expect(outerClick).not.toHaveBeenCalled()
  })

  it('选中态渲染工具条,四个操作按钮接线对应 store action', async () => {
    const { wrapper, editor, comp } = mountWrapper()
    editor.addComponent('image')
    editor.selectComponent(comp.id)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.wrapper-actions').exists()).toBe(true)

    const actions = wrapper.findAll('.wa-btn')
    // [隐藏, 上移, 下移, 复制, 删除]
    expect(actions).toHaveLength(5)

    // text 在 0 号位:先下移再上移,往返验证排序接线
    await actions[2]!.trigger('click') // 下移
    expect(editor.page.components.map((c) => c.type)).toEqual(['image', 'text'])
    await actions[1]!.trigger('click') // 上移
    expect(editor.page.components.map((c) => c.type)).toEqual(['text', 'image'])

    await actions[3]!.trigger('click') // 复制(副本插在原组件之后)
    expect(editor.page.components.map((c) => c.type)).toEqual(['text', 'text', 'image'])

    await actions[4]!.trigger('click') // 删除(移除的是本包装器的原组件)
    expect(editor.page.components).toHaveLength(2)
    expect(editor.page.components.map((c) => c.type)).toEqual(['text', 'image'])
  })

  it('隐藏眼睛按钮切换 store 的 hidden', async () => {
    const { wrapper, editor, comp } = mountWrapper()
    editor.selectComponent(comp.id)
    await wrapper.vm.$nextTick()
    const eye = wrapper.findAll('.wa-btn')[0]!
    await eye.trigger('click')
    expect(editor.page.components[0]!.hidden).toBe(true)
    await eye.trigger('click')
    expect(editor.page.components[0]!.hidden).toBeUndefined()
  })

  it('hidden 组件带半透明样式类', async () => {
    const { wrapper } = mountWrapper({ hidden: true })
    expect(wrapper.find('.editable-wrapper.hidden').exists()).toBe(true)
  })

  it('未知物料渲染占位提示而非崩溃', async () => {
    const { wrapper } = mountWrapper({ type: 'ghost-type' })
    expect(wrapper.find('.unknown-material').exists()).toBe(true)
    expect(wrapper.text()).toContain('未知组件')
  })
})
