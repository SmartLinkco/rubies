import Image, { type ImageProps } from "next/image";

type AppImageProps = Omit<ImageProps, "alt"> & {
  alt?: string;
};

function isRemote(src: ImageProps["src"]) {
  return typeof src === "string" && /^https?:\/\//i.test(src);
}

/**
 * next/image wrapper with sensible defaults for menu / marketing photos.
 * Remote signed URLs skip the optimizer (query signatures + private hosts).
 */
export function AppImage({
  alt = "",
  className,
  sizes,
  priority,
  fill,
  src,
  ...rest
}: AppImageProps) {
  const remote = isRemote(src);
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      priority={priority}
      fill={fill}
      unoptimized={remote || rest.unoptimized}
      {...rest}
    />
  );
}
