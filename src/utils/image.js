// Compresión básica en el cliente antes de subir: redimensiona y re-codifica a WebP/JPEG.
export async function compressImage(file, { maxSize = 1280, quality = 0.82 } = {}) {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.')
  const bitmap = await loadBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const type = canvasSupports('image/webp') ? 'image/webp' : 'image/jpeg'
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob) throw new Error('No se pudo comprimir la imagen.')
  // Si la "compresión" salió más pesada que el original (raro), usa el original.
  return blob.size < file.size ? blob : file
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* fallback abajo */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

let webpSupport
function canvasSupports(type) {
  if (webpSupport === undefined) {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    webpSupport = c.toDataURL(type).startsWith(`data:${type}`)
  }
  return webpSupport
}

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}
