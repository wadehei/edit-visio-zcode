export interface Debounced<F extends (...args: never[]) => void> {
  (...args: Parameters<F>): void
  /** 丢弃等待中的执行(调用方已自行落盘等场景,防止重复触发) */
  cancel(): void
}

export function debounce<F extends (...args: never[]) => void>(fn: F, wait = 300): Debounced<F> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const wrapped = ((...args: Parameters<F>) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn(...args)
    }, wait)
  }) as Debounced<F>
  wrapped.cancel = () => {
    clearTimeout(timer)
    timer = undefined
  }
  return wrapped
}
