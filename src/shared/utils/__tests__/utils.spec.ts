import { describe, expect, it, vi } from 'vitest'

import { createDefaultFieldValue } from '../field'
import { formatDateTime } from '../format'
import { deepClone } from '../clone'
import { createId } from '../id'
import { debounce } from '../debounce'

describe('createId', () => {
  it('携带前缀且全局唯一', () => {
    const a = createId('c')
    const b = createId('c')
    expect(a.startsWith('c_')).toBe(true)
    expect(a).not.toBe(b)
  })
})

describe('deepClone', () => {
  it('深拷贝后修改副本不影响原对象', () => {
    const source = { list: [{ id: 1 }], meta: { name: 'x' } }
    const copy = deepClone(source)
    copy.list[0].id = 99
    copy.meta.name = 'y'
    expect(source.list[0].id).toBe(1)
    expect(source.meta.name).toBe('x')
  })
})

describe('createDefaultFieldValue', () => {
  it('input/textarea/image 默认空字符串', () => {
    expect(createDefaultFieldValue({ type: 'input', key: 'a', label: 'A' })).toBe('')
    expect(createDefaultFieldValue({ type: 'image', key: 'a', label: 'A' })).toBe('')
  })

  it('number/slider 取 min,switch 取 false,select 取首个选项', () => {
    expect(createDefaultFieldValue({ type: 'number', key: 'a', label: 'A', min: 8 })).toBe(8)
    expect(createDefaultFieldValue({ type: 'slider', key: 'a', label: 'A', min: 0, max: 10 })).toBe(0)
    expect(createDefaultFieldValue({ type: 'switch', key: 'a', label: 'A' })).toBe(false)
    expect(
      createDefaultFieldValue({
        type: 'select',
        key: 'a',
        label: 'A',
        options: [
          { label: '一', value: 'one' },
          { label: '二', value: 'two' },
        ],
      }),
    ).toBe('one')
  })

  it('list 默认空数组', () => {
    expect(createDefaultFieldValue({ type: 'list', key: 'a', label: 'A', itemFields: [] })).toEqual([])
  })
})

describe('debounce', () => {
  it('连续调用只在等待期结束后执行最后一次', () => {
    vi.useFakeTimers()
    const calls: number[] = []
    const fn = debounce((v: number) => calls.push(v), 100)
    fn(1)
    vi.advanceTimersByTime(50)
    fn(2)
    vi.advanceTimersByTime(50)
    expect(calls).toEqual([])
    vi.advanceTimersByTime(60)
    expect(calls).toEqual([2])
    vi.useRealTimers()
  })

  it('cancel 丢弃等待中的执行', () => {
    vi.useFakeTimers()
    const calls: number[] = []
    const fn = debounce((v: number) => calls.push(v), 100)
    fn(1)
    fn.cancel()
    vi.advanceTimersByTime(200)
    expect(calls).toEqual([])
    vi.useRealTimers()
  })
})

describe('formatDateTime', () => {
  it('单位数月/日/时/分补零', () => {
    expect(formatDateTime(new Date(2026, 0, 5, 3, 7).getTime())).toBe('2026-01-05 03:07')
  })
})
