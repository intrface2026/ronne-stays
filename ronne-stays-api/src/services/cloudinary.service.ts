import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1400, crop: 'limit' }, { quality: 'auto:good' }],
      },
      (error, result) => {
        if (error) return reject(error)
        if (!result) return reject(new Error('Cloudinary upload failed: No result returned'))
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        })
      }
    )
    
    // Inject the buffer into the stream
    uploadStream.end(buffer)
  })
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId)
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary delete failed: ${result.result}`)
  }
}
