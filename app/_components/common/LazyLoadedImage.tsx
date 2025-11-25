import Image, { StaticImageData } from "next/image";

interface ILazyLoadedImageProps {
  width?: number;
  height: number;
  alt: string;
  src: string | StaticImageData;
  unoptimized?: boolean;
  priority?: boolean;
  className?: string;
  onClick?: () => void;
  quality?: number;
}

export default function LazyLoadedImage(props: ILazyLoadedImageProps) {
  const { quality = 85, priority, ...restProps } = props;
  
  // Check if src is a GIF (GIFs don't support blur placeholders)
  let isGif = false;
  if (typeof props.src === 'string') {
    isGif = props.src.toLowerCase().endsWith('.gif');
  } else {
    // For static imports, check the src property
    isGif = props.src.src.toLowerCase().endsWith('.gif');
  }
  
  const isStaticImport = typeof props.src !== 'string';
  
  // Get blurDataURL only for static imports that aren't GIFs
  let blurDataURL: string | undefined;
  if (isStaticImport && !isGif) {
    const staticSrc = props.src as StaticImageData;
    blurDataURL = staticSrc.blurDataURL;
  }
  
  // Build image props conditionally
  const imageProps: any = {
    ...restProps,
    alt: props.alt,
    quality,
    loading: priority ? "eager" : "lazy",
    sizes: priority ? "100vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  };
  
  // Only add blur placeholder for non-GIF images
  if (!isGif && blurDataURL) {
    imageProps.placeholder = "blur";
    imageProps.blurDataURL = blurDataURL;
  }
  
  return <Image {...imageProps} />;
}
