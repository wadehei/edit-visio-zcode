/** 页面主题:一键换肤时按语义槽位重映射配色 */
export interface PageTheme {
  id: string
  name: string
  /** 页面背景 */
  pageBg: string
  /** 主色:按钮等强调位 */
  primary: string
  onPrimary: string
  /** 标题文字色(原深色文字映射到这) */
  titleColor: string
  /** 正文文字色(原浅色文字映射到这) */
  bodyColor: string
  /** 公告栏配色 */
  noticeBg: string
  noticeColor: string
}

export const PAGE_THEMES: PageTheme[] = [
  {
    id: 'clean',
    name: '极简白',
    pageBg: '#f5f6f8',
    primary: '#4f46e5',
    onPrimary: '#ffffff',
    titleColor: '#111827',
    bodyColor: '#333333',
    noticeBg: '#ff976a',
    noticeColor: '#ffffff',
  },
  {
    id: 'dark',
    name: '暗夜紫',
    pageBg: '#111827',
    primary: '#8b5cf6',
    onPrimary: '#ffffff',
    titleColor: '#f9fafb',
    bodyColor: '#d1d5db',
    noticeBg: '#6d28d9',
    noticeColor: '#ffffff',
  },
  {
    id: 'cny',
    name: '国潮红',
    pageBg: '#fff1f0',
    primary: '#e02020',
    onPrimary: '#ffffff',
    titleColor: '#7f1d1d',
    bodyColor: '#525252',
    noticeBg: '#e02020',
    noticeColor: '#ffffff',
  },
  {
    id: 'mint',
    name: '清新绿',
    pageBg: '#f0fdf4',
    primary: '#059669',
    onPrimary: '#ffffff',
    titleColor: '#064e3b',
    bodyColor: '#374151',
    noticeBg: '#10b981',
    noticeColor: '#ffffff',
  },
  {
    id: 'ocean',
    name: '海洋蓝',
    pageBg: '#eff6ff',
    primary: '#2563eb',
    onPrimary: '#ffffff',
    titleColor: '#1e3a5f',
    bodyColor: '#334155',
    noticeBg: '#3b82f6',
    noticeColor: '#ffffff',
  },
  {
    id: 'sunset',
    name: '落日橙',
    pageBg: '#fff7ed',
    primary: '#ea580c',
    onPrimary: '#ffffff',
    titleColor: '#7c2d12',
    bodyColor: '#44403c',
    noticeBg: '#f97316',
    noticeColor: '#ffffff',
  },
]
