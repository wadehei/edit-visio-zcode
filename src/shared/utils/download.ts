/** 过滤 Windows/Linux 文件名非法字符 */
function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'page'
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeFilename(filename)
  a.click()
  URL.revokeObjectURL(url)
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
