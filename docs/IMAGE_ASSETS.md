# Rubies Cuisine — Image checklist

Photos and graphics still needed to finish the product look. Gradients are temporary placeholders until these are uploaded (menu) or dropped into `apps/web/public/` (static).

**Upload destination**

| Kind | Where |
|------|--------|
| Menu dish photos | Admin → Menu → **Upload image** (Neon bucket `food`) |
| App/static assets | `apps/web/public/` then restart/rebuild web |

**Preferred format:** JPEG or WebP · under **5 MB** · bright daylight food photography · no heavy watermarks.

---

## Priority 1 — Menu dishes (required)

| Dish | Slug | Status |
|------|------|--------|
| **Jollof Rice** | `jollof-rice` | Generated · in Neon + `public/menu/jollof-rice.png` |
| **Fufu and Soup** | `fufu-and-soup` | Generated · in Neon + `public/menu/fufu-and-soup.png` |
| **Banku and Soup** | `banku-and-soup` | Generated · in Neon + `public/menu/banku-and-soup.png` |
| **Grilled Chicken** | `grilled-chicken` | Generated · in Neon + `public/menu/grilled-chicken.png` |

Re-upload or replace anytime via Admin → Menu → Upload image.

**Tips**

- Shoot against a clean table / cream cloth; Rubies red napkin or bowl rim is a nice brand accent.
- Avoid busy restaurant clutter in frame.
- One hero angle is enough; same file is used for list cards and detail hero.

When you add more dishes later, upload a photo in the same admin flow before publishing.

---

## Priority 2 — Brand & shell (required for polish)

| Asset | File | Status |
|-------|------|--------|
| **Logo mark** | `logo-mark.png` (+ `.svg`) | Wired in splash, admin, dish detail |
| **Logo lockup** | `logo.png` / `logo.svg` | In `public/` |
| **Favicon / PWA** | `favicon-32.png`, `icon-192.png`, `icon-512.png`, `apple-icon.png` | Wired via `layout` metadata + `manifest.webmanifest` |

---

## Priority 3 — Home & discovery

| Asset | Suggested filename | Status |
|-------|--------------------|--------|
| **Delivery courier** | `delivery-rider.png` | Generated · `apps/web/public/delivery-rider.png` |
| **Category thumbnails** | `cat-rice.png`, `cat-swallow.png`, `cat-grill.png` | Generated · wired into menu category chips |

Courier art should match Rubies red/cream (not Foodora orange).

---

## Priority 4 — Onboarding slides (3)

| Slide | Theme | Status |
|-------|--------|--------|
| 1 | Home-cooked Ghanaian meals | `/onboarding/onboard-1.png` wired |
| 2 | Order your way | `/onboarding/onboard-2.png` wired |
| 3 | Closed Wednesdays | `/onboarding/onboard-3.png` wired |

---

## Priority 5 — Catering & event space carousel

| Ad | File | Status |
|----|------|--------|
| Event catering | `ad-events.png` | `/ads/ad-events.png` wired |
| Event space | `ad-event-space.png` | `/ads/ad-event-space.png` wired |

Optional detail heroes for `/catering` and `/event-space` pages still open if you want page-level banners later.

---

## Priority 6 — About / trust

| Asset | File | Status |
|-------|------|--------|
| Kitchen / team | `about/about-kitchen.png` | Wired on About hero |
| Plated hero | `about/about-food.png` | Wired below hero |

---

## Priority 7 — Offers & social

| Asset | File | Status |
|-------|------|--------|
| OG / link preview | `og-default.png` | Wired in root metadata |

Promo banners for specific codes (`RUBIES10` / `HUNGRY15`) still optional.

---

## Done when

- [x] All **4** seed dishes have photos in Neon (`food` bucket) via admin upload / generate script  
- [x] **Logo** (+ favicon) replaces placeholder “R”  
- [x] **`delivery-rider.png`** exists under `apps/web/public/`  
- [x] Onboarding has **3** slide images (or intentional illustration)  
- [x] Catering + event-space carousel ads have background photos  
- [x] About page has kitchen + plated photos  
- [x] Default OG / link-preview image is set  

Optional leftover: per-offer promo banners for `RUBIES10` / `HUNGRY15`.

---

## Naming convention (Neon keys)

Uploads already land as `menu/{slug-ish}-{id}.jpg`. Prefer filenames like:

```text
jollof-rice.jpg
fufu-and-soup.jpg
banku-and-soup.jpg
grilled-chicken.jpg
```

Static public assets (shipped):

```text
apps/web/public/
  logo.svg / logo.png / logo-mark.svg / logo-mark.png
  favicon-32.png / icon-192.png / icon-512.png / apple-icon.png
  delivery-rider.png
  onboarding/onboard-1.png … onboard-3.png
  ads/ad-events.png / ad-event-space.png
  about/about-kitchen.png / about-food.png
  og-default.png
  manifest.webmanifest
```
