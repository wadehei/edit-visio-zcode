import type { Component } from 'vue'

/** 属性面板字段描述:驱动右侧动态表单生成 */
export type PropField =
  | { type: 'input'; key: string; label: string; placeholder?: string }
  | {
      type: 'textarea'
      key: string
      label: string
      placeholder?: string
      rows?: number
    }
  | {
      type: 'number'
      key: string
      label: string
      min?: number
      max?: number
      step?: number
      suffix?: string
    }
  | { type: 'switch'; key: string; label: string }
  | {
      type: 'select'
      key: string
      label: string
      options: Array<{ label: string; value: string | number | boolean }>
    }
  | { type: 'color'; key: string; label: string }
  | { type: 'slider'; key: string; label: string; min: number; max: number; step?: number }
  | { type: 'image'; key: string; label: string; placeholder?: string }
  | {
      type: 'list'
      key: string
      label: string
      itemLabel?: string
      addText?: string
      max?: number
      itemFields: PropField[]
    }

/** 物料分组 */
export type MaterialGroup = '基础组件' | '营销组件'

/** 物料描述符:物料的全部元信息,注册后画布/面板/属性表单自动生效 */
export interface MaterialDefinition {
  /** 唯一标识,kebab-case,与目录名一致 */
  type: string
  name: string
  group: MaterialGroup
  /** Element Plus 图标名 */
  icon: string
  description?: string
  /** 渲染组件,必须 markRaw 包裹 */
  component: Component
  defaultProps: () => Record<string, unknown>
  propsSchema: PropField[]
}

/** 画布中的一个组件实例 */
export interface ComponentSchema {
  id: string
  type: string
  props: Record<string, unknown>
}

/** 页面 Schema:渲染的唯一数据源,必须 JSON 可序列化 */
export interface PageSchema {
  schemaVersion: number
  id: string
  name: string
  title: string
  backgroundColor: string
  components: ComponentSchema[]
}

/** localStorage 中的页面记录 */
export interface PageRecord {
  id: string
  name: string
  updatedAt: number
  schema: PageSchema
}
