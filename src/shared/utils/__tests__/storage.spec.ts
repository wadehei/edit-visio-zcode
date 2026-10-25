import { beforeEach, describe, expect, it, vi } from 'vitest'

import { backupCorrupted, loadJsonCollection } from '../storage'
import { createLocalStorageStub } from '@/stores/__tests__/storage-stub'

const KEY = 'visio:test:v1'
const isString = (v: unknown): v is string => typeof v === 'string'

describe('backupCorrupted', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
  })

  it('备份到 <key>:corrupted:<时间戳>', () => {
    backupCorrupted(KEY, '{bad')
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(`${KEY}:corrupted:`))
    expect(keys).toHaveLength(1)
    expect(localStorage.getItem(keys[0]!)).toBe('{bad')
  })

  it('超过 3 份时删除最旧的', () => {
    vi.useFakeTimers()
    backupCorrupted(KEY, 'a')
    vi.advanceTimersByTime(1)
    backupCorrupted(KEY, 'b')
    vi.advanceTimersByTime(1)
    backupCorrupted(KEY, 'c')
    vi.advanceTimersByTime(1)
    backupCorrupted(KEY, 'd')
    vi.useRealTimers()
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(`${KEY}:corrupted:`)).sort()
    expect(keys).toHaveLength(3)
    expect(keys.map((k) => localStorage.getItem(k))).toEqual(['b', 'c', 'd'])
  })
})

describe('loadJsonCollection', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub())
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('正常数据过滤脏条目', () => {
    localStorage.setItem(KEY, JSON.stringify(['ok', 1, null, 'good']))
    expect(loadJsonCollection(KEY, isString, '测试')).toEqual(['ok', 'good'])
  })

  it('损坏数据备份后降级为空数组', () => {
    localStorage.setItem(KEY, '{broken!!')
    expect(loadJsonCollection(KEY, isString, '测试')).toEqual([])
    expect(
      Object.keys(localStorage).some((k) => k.startsWith(`${KEY}:corrupted:`)),
    ).toBe(true)
  })

  it('空存储返回空数组且不写入', () => {
    expect(loadJsonCollection(KEY, isString, '测试')).toEqual([])
    expect(Object.keys(localStorage)).toHaveLength(0)
  })
})
