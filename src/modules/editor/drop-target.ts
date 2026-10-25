export interface RectLike {
  top: number
  height: number
}

/**
 * 计算垂直列表的拖放落点下标:clientY 落在第 i 个条目中线之上 → i,
 * 越过全部条目 → 列表长度(追加到末尾)。
 *
 * 从 CanvasArea 抽出的纯几何逻辑,便于单元/属性测试;
 * 调用方负责收集条目的 getBoundingClientRect()。zoom 缩放下
 * getBoundingClientRect 返回的即是屏幕坐标,与 clientY 同一坐标系。
 */
export function calcVerticalDropIndex(clientY: number, rects: RectLike[]): number {
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i]!
    if (clientY < rect.top + rect.height / 2) return i
  }
  return rects.length
}
