export type DishVisual = {
  gradient: string;
  accent: string;
  label: string;
};

const visuals: Record<string, DishVisual> = {
  "jollof-rice": {
    gradient: "linear-gradient(145deg, #c45c2a 0%, #e8a04a 45%, #7a2e12 100%)",
    accent: "#fff3e6",
    label: "Jollof",
  },
  "fufu-and-soup": {
    gradient: "linear-gradient(145deg, #8b5a2b 0%, #d4a574 40%, #3d2914 100%)",
    accent: "#f7efe4",
    label: "Fufu",
  },
  "banku-and-soup": {
    gradient: "linear-gradient(145deg, #5c6b3a 0%, #c4b07a 42%, #2f3a1c 100%)",
    accent: "#f3f0e4",
    label: "Banku",
  },
  "grilled-chicken": {
    gradient: "linear-gradient(145deg, #8f1d1d 0%, #d4783a 48%, #3b1010 100%)",
    accent: "#ffe8dc",
    label: "Grill",
  },
};

export function getDishVisual(slug: string): DishVisual {
  return (
    visuals[slug] ?? {
      gradient: "linear-gradient(145deg, #1b3a9c 0%, #e10600 100%)",
      accent: "#fff7f2",
      label: "Meal",
    }
  );
}

export function categoryForSlug(slug: string, fallback = "Meals") {
  if (slug.includes("jollof") || slug.includes("rice")) return "Rice";
  if (slug.includes("fufu") || slug.includes("banku")) return "Swallow";
  if (slug.includes("grill") || slug.includes("chicken")) return "Grill";
  return fallback;
}
