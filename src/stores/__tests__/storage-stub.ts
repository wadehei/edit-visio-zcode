/**
 * node 环境下的 localStorage 内存实现。
 * 存储键直接挂为 stub 的可枚举属性(Object.keys 可见,供生产代码扫描备份用),
 * 方法本身不可枚举但可写,便于测试中临时替换制造写入失败。
 */
export function createLocalStorageStub() {
  const stub = {} as Storage & { keys(): string[] }
  Object.defineProperties(stub, {
    getItem: {
      value: (key: string) => (key in stub ? String(stub[key]) : null),
      enumerable: false,
      writable: true,
      configurable: true,
    },
    setItem: {
      value: (key: string, value: string) => void (stub[key] = String(value)),
      enumerable: false,
      writable: true,
      configurable: true,
    },
    removeItem: {
      value: (key: string) => void delete stub[key],
      enumerable: false,
      writable: true,
      configurable: true,
    },
    clear: {
      value: () => {
        for (const key of Object.keys(stub)) delete stub[key]
      },
      enumerable: false,
      writable: true,
      configurable: true,
    },
    keys: {
      value: () => Object.keys(stub),
      enumerable: false,
      writable: true,
      configurable: true,
    },
  })
  return stub
}
