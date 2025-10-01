import { useState, useEffect } from 'react';
import { cld } from '../lib/cloudinary';
import { Delivery } from '@cloudinary/url-gen/actions/delivery';
import { format } from '@cloudinary/url-gen/actions/delivery';
import { auto } from '@cloudinary/url-gen/qualifiers/format';
import { quality } from '@cloudinary/url-gen/actions/delivery';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  placeholder?: boolean;
}

export const OptimizedImage = ({
  src,
  alt,
  className = '',
  width = 800,
  height,
  fallbackSrc = '/path/to/fallback-image.jpg',
  placeholder = true
}: OptimizedImageProps) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Extract public ID from Cloudinary URL
  const getPublicId = (url: string) => {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : '';
  };

  // Generate optimized URL using Cloudinary SDK
  const optimizedUrl = (() => {
    try {
      const publicId = getPublicId(src);
      if (!publicId) return src;

      const image = cld.image(publicId)
        .format(auto())
        .quality(autoQuality());

      if (width || height) {
        image.resize({
          width: width,
          height: height,
          aspectRatio: '1.0'
        });
      }

      return image.toURL();
    } catch (err) {
      // Silently fall back to original URL
      return src;
    }
  })();

  // Reset state if src changes
  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  if (error) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    );
  }

  return (
    <div className="relative">
      {placeholder && !loaded && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
          style={{ aspectRatio: width && height ? width / height : 'auto' }}
        />
      )}
      <img
        src={optimizedUrl}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};