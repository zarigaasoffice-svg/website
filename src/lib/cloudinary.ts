import { Cloudinary } from '@cloudinary/url-gen';

const config = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  folder: "samples/ecommerce"  // Match the asset folder path from your preset
};

// Initialize Cloudinary instance
export const cld = new Cloudinary({
  cloud: {
    cloudName: config.cloudName
  },
  url: {
    secure: true // Force HTTPS
  }
});

export const uploadImage = async (file: File) => {
  if (!file) throw new Error('No file provided');

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("folder", config.folder);  // Use the configured folder directly
  formData.append("timestamp", String(Math.floor(Date.now() / 1000)));
  
  // Let Cloudinary generate a unique public ID as configured in the preset
  formData.append("use_filename", "false");

  try {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    console.log('Uploading to:', uploadUrl);
    console.log('Upload preset:', config.uploadPreset);
    
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Helper function to get optimized image URL
export const getOptimizedImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
} = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;

  const base = url.split('/upload/')[0] + '/upload/';
  const transformations = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);

  // Add automatic optimization
  if (transformations.length === 0) {
    transformations.push('q_auto', 'f_auto');
  }

  const transformation = transformations.join(',') + '/';
  const imagePath = url.split('/upload/')[1];

  return `${base}${transformation}${imagePath}`;
};

export default config;