/** 计算 hex 颜色的感知亮度(0~1),用于深浅色判断 */
export function luminance(hex: string): number {
  const m = hex.replace('#', '')
  if (m.length !== 6 && m.length !== 3) return 0.5
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 是否为深色(亮度 < 0.5) */
export function isDarkColor(hex: string): boolean {
  return luminance(hex) < 0.5
}
