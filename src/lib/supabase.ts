import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.lemalaga.org'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_YTyGOimAhimBF6Ymn7yd4A_1StH_LXd'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const EXISTING_REPO_IMAGES = [
  'https://www.lemalaga.org/images/logo.png',
  'https://www.lemalaga.org/images/hero-bg.jpg',
  'https://www.lemalaga.org/images/flory1.jpg',
  'https://www.lemalaga.org/images/flory2.jpg',
  'https://www.lemalaga.org/images/tasi1.jpg',
  'https://www.lemalaga.org/images/tasi2.jpg',
  'https://www.lemalaga.org/images/juita.jpg',
  'https://www.lemalaga.org/images/zoom_meeting.jpg',
  'https://www.lemalaga.org/images/West_Auckland_1.png',
  'https://www.lemalaga.org/images/SinaVera_1.png',
  'https://www.lemalaga.org/images/Melissa_1.png',
  'https://www.lemalaga.org/images/Barry_1.png',
  'https://www.lemalaga.org/images/fiapai_1.png',
  'https://www.lemalaga.org/images/lisa_1.png',
  'https://www.lemalaga.org/images/Tania_1.png',
  'https://www.lemalaga.org/images/Chichi_1.png',
  'https://www.lemalaga.org/images/Pini1_1.png',
  'https://www.lemalaga.org/images/Jennifer_1.png',
  'https://www.lemalaga.org/images/Ruby_1.png',
]

export async function compressAndUploadImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const maxDim = 1600
  let width = bitmap.width
  let height = bitmap.height
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width)
      width = maxDim
    } else {
      width = Math.round((width * maxDim) / height)
      height = maxDim
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not initialize canvas')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image compression failed'))),
      'image/webp',
      0.85
    )
  })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '')
  const filePath = `uploads/${Date.now()}-${safeName}.webp`

  const { error } = await supabase.storage.from('site-media').upload(filePath, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from('site-media').getPublicUrl(filePath)
  return data.publicUrl
}
