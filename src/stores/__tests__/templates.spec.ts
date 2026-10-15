import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const storage = new Map<string, string>()

import { useTemplatesStore } from '../templates'

describe('templates store', () => {
  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
      removeItem: (key: string) => void storage.delete(key),
    })
    setActivePinia(createPinia())
  })

  it('saveTemplate 持久化且深拷贝 props', () => {
    const templates = useTemplatesStore()
    const props = { images: [{ url: '/a.png' }] }
    const saved = templates.saveTemplate('轮播 A', 'carousel', props)
    expect(templates.templates).toHaveLength(1)

    props.images[0].url = '/changed.png'
    expect(templates.templates[0].props).toEqual({ images: [{ url: '/a.png' }] })

    const stored = JSON.parse(storage.get('visio:templates:v1') ?? '[]')
    expect(stored[0].id).toBe(saved.id)
  })

  it('removeTemplate 删除并持久化', () => {
    const templates = useTemplatesStore()
    const a = templates.saveTemplate('A', 'text', {})
    templates.saveTemplate('B', 'image', {})
    templates.removeTemplate(a.id)
    expect(templates.templates.map((t) => t.name)).toEqual(['B'])
    expect(JSON.parse(storage.get('visio:templates:v1') ?? '[]')).toHaveLength(1)
  })

  it('存储损坏时备份并降级为空列表', () => {
    storage.set('visio:templates:v1', 'not-json')
    const templates = useTemplatesStore()
    expect(templates.templates).toHaveLength(0)
    expect(Array.from(storage.keys()).filter((k) => k.includes(':corrupted:'))).toHaveLength(1)
  })
})
