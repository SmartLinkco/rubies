type BrandMarkProps = {
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
};

/** Square Rubies logo mark (red badge + R). */
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
      className={`object-contain ${className}`}
      draggable={false}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
