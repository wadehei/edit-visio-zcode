/**
 * localStorage JSON 集合的公共读写封装。
 * 各 store(pages/templates/page-templates)统一走这里加载与备份,
 * 保证损坏容错行为一致;键名集中在 shared/constants.ts 的 STORAGE_KEYS。
 */

/** 损坏备份最多保留份数,超出删最旧,防止解析失败反复发生时撑爆存储 */
const CORRUPTED_BACKUP_LIMIT = 3

/** 把损坏的原始数据备份到 `<key>:corrupted:<时间戳>`,超出限量删最旧 */
export function backupCorrupted(key: string, raw: string): void {
  const prefix = `${key}:corrupted:`
  try {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .sort()
    while (keys.length >= CORRUPTED_BACKUP_LIMIT) {
      const oldest = keys.shift()
      if (oldest) localStorage.removeItem(oldest)
    }
    localStorage.setItem(`${prefix}${Date.now()}`, raw)
  } catch {
    /* 备份失败时忽略 */
  }
}

/** 读取 JSON 数组集合:损坏/脏数据容错,解析失败备份原始数据并降级为空数组 */
export function loadJsonCollection<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  label: string,
): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error(`${label} storage is not an array`)
    return parsed.filter(isValid)
  } catch (error) {
    const raw = localStorage.getItem(key)
    if (raw) backupCorrupted(key, raw)
    console.error(`[visio] ${label}存储解析失败,已备份原始数据`, error)
    return []
  }
}
