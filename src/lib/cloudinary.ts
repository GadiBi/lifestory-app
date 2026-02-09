import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadImage(file: string, folder: string = 'lifestory') {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: 'auto',
  });
  return result;
}

export async function deleteImage(publicId: string) {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
}

export function getOptimizedUrl(publicId: string, options: {
  width?: number;
  height?: number;
  quality?: string;
  format?: string;
} = {}) {
  return cloudinary.url(publicId, {
    fetch_format: options.format || 'auto',
    quality: options.quality || 'auto',
    width: options.width,
    height: options.height,
    crop: options.width || options.height ? 'fill' : undefined,
  });
}
