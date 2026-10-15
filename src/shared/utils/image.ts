/**
 * 读取本地图片文件并压缩为 dataURL(默认最大宽度 750、jpeg 0.82),
 * 让无后端环境下也能把图片直接存进 Schema(localStorage 友好)。
 */
export function fileToCompressedDataUrl(
  file: File,
  maxWidth = 750,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('仅支持图片文件'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('当前环境不支持 Canvas'))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        // PNG 保留透明通道,其余统一 jpeg 控制体积
        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('图片解析失败'))
      img.src = String(reader.result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
