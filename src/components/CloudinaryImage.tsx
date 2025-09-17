import { useState } from 'react';
import { getOptimizedImageUrl } from '../lib/cloudinary';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
}

export const CloudinaryImage = ({
  src,
  alt,
  className = '',
  width = 800,
  height,
  fallbackSrc = 'https://images.pexels.com/photos/7673219/pexels-photo-7673219.jpeg?auto=compress&cs=tinysrgb&w=600'
}: CloudinaryImageProps) => {
  const [error, setError] = useState(false);

  // Get optimized URL from Cloudinary
  const optimizedUrl = getOptimizedImageUrl(src, {
    width,
    height,
    quality: 80,
    format: 'auto'
  });

  return (
    <img
      src={error ? fallbackSrc : optimizedUrl}
      alt={alt}
      className={className}
      onError={() => {
        console.error(`Failed to load image: ${src}`);
        setError(true);
      }}
      loading="lazy"
    />
  );
};