let seq = 0

/** 生成带前缀的短 id,如同 c_lx3f2k01 */
export function createId(prefix: string): string {
  seq = (seq + 1) % 10000
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${seq}`
}
