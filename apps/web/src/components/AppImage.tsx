import Image, { type ImageProps } from "next/image";

type AppImageProps = Omit<ImageProps, "alt"> & {
  alt?: string;
};

/** Soft cream placeholder while the photo decodes (avoids grey flash). */
const CREAM_BLUR =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#F3EBE1"/></svg>`,
  );

function isRemote(src: ImageProps["src"]) {
  return typeof src === "string" && /^https?:\/\//i.test(src);
}

/** Neon Object Storage public URLs — safe to run through next/image. */
function canOptimizeRemote(src: string) {
  try {
    const host = new URL(src).hostname.toLowerCase();
    return (
      host.endsWith(".neon.tech") ||
      host.endsWith(".aws.neon.tech") ||
      (host.includes("storage.") && host.includes("neon"))
    );
  } catch {
    return false;
  }
}

/**
 * next/image wrapper for menu / marketing photos.
 * Neon remotes go through the optimizer (cached, resized) so page switches
 * don't re-download full originals. Unknown remotes stay unoptimized.
 */
export function AppImage({
  alt = "",
  className,
  sizes,
  priority,
  fill,
  src,
  unoptimized: unoptimizedProp,
  placeholder,
  blurDataURL,
  loading,
  ...rest
}: AppImageProps) {
  const remote = isRemote(src);
  const optimize =
    !remote || (typeof src === "string" && canOptimizeRemote(src));
  const unoptimized = unoptimizedProp ?? !optimize;

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      priority={priority}
      fill={fill}
      unoptimized={unoptimized}
      placeholder={placeholder ?? "blur"}
      blurDataURL={blurDataURL ?? CREAM_BLUR}
      loading={priority ? undefined : loading ?? "lazy"}
      {...rest}
    />
  );
}
