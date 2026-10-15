/**
 * 深拷贝。Schema 已约束为 JSON 可序列化,JSON 往返即安全且够快;
 * 禁止对含函数/类实例的数据使用。
 */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
