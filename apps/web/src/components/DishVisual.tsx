import { getDishVisual } from "@/lib/dish";

export function DishVisual({
  slug,
  className = "",
  compact = false,
}: {
  slug: string;
  className?: string;
  compact?: boolean;
}) {
  const visual = getDishVisual(slug);

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
