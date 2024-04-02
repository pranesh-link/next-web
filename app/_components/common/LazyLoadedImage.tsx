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
}
export default function LazyLoadedImage(props: ILazyLoadedImageProps) {
  return (
    <Image
      {...props}
      alt={props.alt}
      loading={props.priority ? "eager" : "lazy"}
    />
  );
}
