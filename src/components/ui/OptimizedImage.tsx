import { useState } from "react";

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: "eager" | "lazy";
  decoding?: "sync" | "async" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  width?: number;
  height?: number;
  sizes?: string;
  srcSet?: string;
};

export function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc,
  loading = "lazy",
  decoding = "async",
  fetchPriority = "auto",
  width,
  height,
  sizes,
  srcSet,
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      width={width}
      height={height}
      sizes={sizes}
      srcSet={srcSet}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
