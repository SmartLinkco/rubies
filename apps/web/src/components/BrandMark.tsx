type BrandMarkProps = {
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
};

/** Official Rubies Cuisine logo (red field, rounded corners). */
export function BrandMark({
  size = 40,
  className = "",
  alt = "Rubies Cuisine",
  priority = false,
}: BrandMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark.webp"
      alt={alt}
      width={size}
      height={size}
      className={`rounded-[22%] object-cover ${className}`}
      draggable={false}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
