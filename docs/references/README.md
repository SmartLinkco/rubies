# Rubies Cuisine — Design References

Saved for planning and implementation. Do not treat Foodora visuals as brand; use them for **flow/UX patterns only**. Brand comes from the Rubies flyer.

## Files

| File | What it is |
|------|------------|
| `01-foodora-ui-kit-screens.jpg` | Foodora UI kit marketing spread (home, restaurant, offer, onboarding, track, cart) |
| `02-foodora-app-map.jpg` | Foodora app map (IA / screen hierarchy) |
| `03-foodora-user-flow.jpg` | Foodora user flows (onboarding → explore / cart / tracking / offers / profile / orders) |
| `04-foodora-screen-set.jpg` | Broader Foodora screen set (discovery → checkout → profile) |
| `06-home-hero-inspiration.png` | Home delivery hero card reference (Foodora-style; Rubies colors in product) |
| `07-profile-inspiration.png` | Profile screen reference (header + settings list) |
| `08-delivery-rider.png` | Generated courier illustration for home hero card |

## Brand facts (from flyer)

- **Name:** Rubies Cuisine
- **Tagline vibe:** “Are you hungry? Don’t wait!”
- **Colors:** Bright red, royal blue, white
- **Logo:** Chef silhouette + utensils emblem
- **Sample menu:** Jollof Rice, Fufu and Soup, Banku and Soup, Grilled Chicken (shown at ₵20 on flyer)
- **Services:** Daily delivery; catering (corporate & individuals); bulk cooking for families
- **Closed:** Wednesdays
- **Phones:** 027-749-1795, 059-393-3901
- **Location:** Rubies Cuisine, MMX5+9C2, Achiaman (Greater Accra, Ghana)

## UX inspiration (from Foodora — adapt, don’t copy)

- Mobile-first, rounded cards, strong food photography
- Core journeys: browse → item → cart → checkout → order status
- Secondary: offers, profile/addresses, order history
- Marketplace patterns (multi-restaurant Explore, QR scan) are **out of scope**

## Product decisions (2026-09-26)

See [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) for the full phased plan.

- In-app order **and** Call/WhatsApp · single restaurant · guest + accounts
- COD + Paystack (GHS) · menu CRUD in admin · 4 dishes @ GHS 45 to start
- Delivery: admin fixed fee **or** distance · closed Wednesdays (browse on, order CTAs off)
- Stack: Next.js → Vercel · Express → Render · PostgreSQL
- Visual: Foodora cream/rounded + Rubies red/blue
