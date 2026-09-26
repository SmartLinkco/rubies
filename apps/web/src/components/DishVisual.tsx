import { AppImage } from "@/components/AppImage";
import { getDishVisual } from "@/lib/dish";

export function DishVisual({
  slug,
  imageUrl,
  className = "",
  compact = false,
  priority = false,
}: {
  slug: string;
  imageUrl?: string | null;
  className?: string;
  compact?: boolean;
  priority?: boolean;
}) {
  const visual = getDishVisual(slug);
  const sizes = compact
    ? "(max-width: 768px) 40vw, 160px"
    : "(max-width: 768px) 100vw, 480px";

  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-cream-deep ${className}`}>
        <AppImage
          src={imageUrl}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-3 pt-10">
          <span
            className={`font-display font-bold text-white ${
              compact ? "text-sm" : "text-lg"
            }`}
          >
            {visual.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: visual.gradient }}
    >
      <div
        className="absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-25"
        style={{ background: visual.accent }}
      />
      <div
        className="absolute -bottom-10 left-4 h-24 w-24 rounded-full opacity-20"
        style={{ background: visual.accent }}
      />
      <div
        className={`relative flex h-full items-end p-4 ${
          compact ? "p-3" : "p-5"
        }`}
      >
        <span
          className={`font-display font-bold text-white/95 ${
            compact ? "text-lg" : "text-2xl"
          }`}
        >
          {visual.label}
        </span>
      </div>
    </div>
  );
}
