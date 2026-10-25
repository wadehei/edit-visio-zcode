export const SCHEMA_VERSION = 1

/** 画布设计稿宽度(375px 基准) */
export const CANVAS_WIDTH = 375

export const STORAGE_KEYS = {
  pages: 'visio:pages:v1',
  /** 组件剪贴板:跨页面复制组件,存单个 { type, props } */
  clipboard: 'visio:clipboard:v1',
  /** 组件级模板 */
  templates: 'visio:templates:v1',
  /** 页面级模板:整页另存为模板,从模板新建页面 */
  pageTemplates: 'visio:page-templates:v1',
} as const

/** localStorage 配额估算(主流浏览器约 5MB,按 UTF-16 码元计),供首页用量提示 */
export const STORAGE_QUOTA = 5 * 1024 * 1024

export const MATERIAL_GROUPS = ['基础组件', '营销组件'] as const

/** 内置示例素材(本地 SVG,离线可用) */
export const SAMPLE_IMAGES = {
  banner1: '/sample-images/banner-1.svg',
  banner2: '/sample-images/banner-2.svg',
  banner3: '/sample-images/banner-3.svg',
  goods1: '/sample-images/goods-1.svg',
  goods2: '/sample-images/goods-2.svg',
  goods3: '/sample-images/goods-3.svg',
  goods4: '/sample-images/goods-4.svg',
} as const

/** 属性面板「示例图」下拉选项 */
export const SAMPLE_IMAGE_OPTIONS = [
  { label: '示例横幅 · 渐变紫', value: SAMPLE_IMAGES.banner1 },
  { label: '示例横幅 · 促销红', value: SAMPLE_IMAGES.banner2 },
  { label: '示例横幅 · 清新绿', value: SAMPLE_IMAGES.banner3 },
  { label: '示例商品图 · 耳机', value: SAMPLE_IMAGES.goods1 },
  { label: '示例商品图 · 水杯', value: SAMPLE_IMAGES.goods2 },
  { label: '示例商品图 · 床品', value: SAMPLE_IMAGES.goods3 },
  { label: '示例商品图 · 香薰', value: SAMPLE_IMAGES.goods4 },
]
