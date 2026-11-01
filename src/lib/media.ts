// Shrinks a phone photo before upload so it works on slow mobile data (max 1280px, JPEG).
export async function compressImage(file: File, max = 1280): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return await new Promise<Blob>((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('compress')), 'image/jpeg', 0.72))
}
export const baseType = (b: Blob) => b.type.split(';')[0] || 'application/octet-stream'
export const audioExt = (b: Blob) => (baseType(b).includes('mp4') ? 'm4a' : 'webm')
