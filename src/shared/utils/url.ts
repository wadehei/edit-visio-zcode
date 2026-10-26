/**
 * 组件 props 中的 URL 经由 :href / :src 渲染,Vue 不做 sanitize;
 * 导入 JSON(备份/页面导入)可携带任意字符串,必须白名单放行。
 * 防护目标:javascript:/vbscript:/data:text-html 类可执行 scheme。
 */

/** 跳转链接(渲染为 <a href>):仅允许 http(s)、协议相对、站内相对与锚点 */
export function safeLinkUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined
  const value = url.trim()
  if (!value) return undefined
  if (/^(https?:)?\/\//i.test(value)) return value
  if (/^(\/|#|\.\.?\/)/.test(value)) return value
  return undefined
}

/** 图片地址(渲染为 <img src>):额外放行 data:image/(本地上传压缩产物) */
export function safeImageUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined
  const value = url.trim()
  if (!value) return undefined
  if (/^data:image\//i.test(value)) return value
  if (/^(https?:)?\/\//i.test(value)) return value
  if (/^(\/|#|\.\/|\.\.?\/)/.test(value)) return value
  return undefined
}
