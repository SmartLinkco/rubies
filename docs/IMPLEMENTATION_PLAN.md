# Rubies Cuisine — Implementation Plan

Lightweight single-restaurant webapp. Foodora flows/UX patterns; Rubies red/blue on a soft cream, rounded visual system.

## Locked decisions

| Area | Decision |
|------|----------|
| Product | Single restaurant (Rubies Cuisine). No multi-vendor Explore / QR marketplace |
| Ordering | In-app cart + checkout **and** Call / WhatsApp fallback |
| MVP surfaces | Onboarding, offers/coupons, order status tracking, order history, profile (addresses/payments), reviews, catering/bulk inquiry |
| Owner alerts | SMS and/or email (admin-configurable) **plus** live admin board alert |
| Payments | Cash on delivery + Paystack (GHS) |
| Delivery fees | Admin toggles **fixed fee** vs **distance-based**; closed Wednesdays (see UX below) |
| Menu v1 | 4 dishes @ **GHS 45**; admin CRUD thereafter |
| Auth | Guest checkout **and** accounts |
| Stack | Next.js (Vercel) · Express (Render) · PostgreSQL on **Neon** · Email via **Resend** · SMS provider TBD |
| Visual | Foodora soft cream / rounded cards · Rubies red + royal blue accents |

## Closed-day UX (recommendation)

- **Browse always on** — menu stays visible Wednesdays.
- **Order CTAs disabled** on Wednesdays with clear copy: “Closed Wednesdays — order again Thursday.”
- **Persistent home banner** when closed (and optionally Tue evening: “Last orders today before Wednesday close”).
- **Next available slot** shown on checkout (e.g. “Earliest delivery: Thursday”).
- Admin can override (force open / force closed) for holidays without code changes.

## Live tracking (pragmatic)

v1 = **status timeline** (Confirmed → Preparing → On the way → Delivered), updated by admin. Optional map pin of restaurant + customer address later — not GPS courier tracking unless you add driver location later.

---

## Phase 0 — Project foundation

**Goal:** Runnable monorepo-style layout, shared types, local Postgres, deploy stubs.

- Scaffold `apps/web` (Next.js App Router) and `apps/api` (Express + TypeScript)
- PostgreSQL schema migrations (Prisma) against **Neon**
- Env templates for Vercel + Render + Neon (`DATABASE_URL` + `DIRECT_URL`)
- Shared brand tokens: cream bg, Rubies red/blue, radii, type
- Health checks + CORS + basic error shape
- Seed: restaurant profile, closed-Wednesday rule, 4 menu items @ GHS 45

**Exit:** `web` and `api` run locally; Neon DB migrated + seeded; blank branded shell loads.

---

## Phase 1 — Brand shell & discovery (customer)

**Goal:** Lovely first impression; browse without ordering yet.

- Splash + short onboarding (skipable)
- Home: location/address prompt stub, search, categories, recommended cards, closed-day banner
- Menu list + item detail (photo, description, GHS 45, add affordance disabled or cart-local only)
- Sticky bottom nav adapted for single brand: **Home · Menu · Orders · Profile** (drop marketplace Explore/Scan; optional center “Call / WhatsApp”)
- Static Call / WhatsApp CTAs from flyer numbers
- Soft cream layouts, rounded cards, Rubies accent CTAs

**Exit:** Guest can browse the 4 dishes on mobile; brand feels Rubies, not Foodora-orange.

---

## Phase 2 — Auth & profile

**Goal:** Guest path works; accounts unlock history/saved data.

- Guest session (cookie/device id) for cart
- Sign up / login (email+password; **email OTP** for signup verify + forgot-password; login stays password-only)
- Profile: name, phone, saved addresses, payment method prefs (display only until Paystack)
- Logout; merge guest cart → user cart on login

**Exit:** Guest and logged-in users both reach cart; addresses save for logged-in users.

---

## Phase 3 — Cart, checkout & payments

**Goal:** Complete order placement.

- Cart: qty steppers, line totals, promo code field (wired in Phase 5)
- Checkout: address (saved or one-shot), delivery fee preview, payment method = COD | Paystack
- Closed-day gate on place-order
- Paystack Initialize + webhook verify (GHS); idempotent order create
- COD path creates order immediately as `pending_confirmation`
- Order success screen → link to status
- Call / WhatsApp still available from cart/checkout as escape hatch (prefilled message with cart summary)

**Exit:** Test COD order + test Paystack (test keys) both create orders in DB.

---

## Phase 4 — Orders, status & history

**Goal:** Customer confidence after purchase.

- My Orders list (active / past)
- Order detail + status timeline (admin-driven transitions)
- Reorder from history
- Email/SMS to customer on status change (when providers ready); stub adapters until then
- Reviews: rate + short comment after `delivered`

**Exit:** Customer can follow an order from placed → delivered and leave a review.

---

## Phase 5 — Offers, catering & content

**Goal:** Marketing and non-menu revenue paths.

- Offers list + detail + redeem rules (min order, expiry, code)
- Apply coupon on cart (server-validated)
- Catering / bulk inquiry form → owner email/SMS + admin inbox item
- Simple “About / contact / hours / location” from flyer

**Exit:** Promo code changes total; catering inquiry reaches owner channel.

---

## Phase 6 — Admin board (core ops)

**Goal:** Owner runs the restaurant without touching code.

Auth-separated admin (role `admin`).

- **Dashboard:** new-order alerts (websocket or polling), counts, closed-day indicator
- **Orders:** list, detail, status transitions, mark paid (COD)
- **Menu CRUD:** add / edit / remove / availability toggle; price; image upload
- **Delivery settings:** mode = fixed | distance; fixed amount; distance rules (e.g. base + per-km, max radius); currency GHS
- **Hours / closures:** Wednesday closed default; override dates
- **Notifications config:** toggle SMS/email for new order, status events; recipient list
- **Offers CRUD**
- **Reviews moderation** (optional hide)
- **Catering inquiries** inbox

**Exit:** Owner can fulfill a full day: see alert → update status → edit a menu item → change delivery fee mode.

---

## Phase 7 — Notifications hardening

**Goal:** Reliable owner + customer messaging.

- Pluggable SMS provider (interface ready; wire when API docs arrive)
- Transactional email via **Resend** (`RESEND_API_KEY` + `RESEND_FROM_EMAIL`)
- **Web Push (PWA):** opt-in everyone; twice-daily Accra slots + offer/dish events; deep links to menu/offers/dish; Android + iOS (Home Screen); first-visit prompt + Profile → Notifications
- Admin config respected per event type
- Retry / failure logging; no duplicate blasts on webhook retries

**Exit:** New order notifies owner by configured channels; customer gets status pings + optional meal reminders.

---

## Phase 8 — Polish, QA & launch

**Goal:** Production on Vercel + Render.

- Mobile UX pass (thumb reach, loading/empty/error states, motion sparingly)
- Accessibility basics; image optimization
- Paystack live keys + webhook URL on Render
- Env/secrets on Vercel & Render; Postgres on Render (or managed)
- Seed production menu @ GHS 45; real phone/WhatsApp links
- Basic analytics (optional): order funnel
- Runbook: how owner logs in, marks status, closes a day

**Exit:** Public URL; owner trained on admin; first real COD + Paystack order smoke-tested.

---

## Suggested data model (high level)

- `users` (guest flag / role)
- `addresses`
- `menu_items` (name, description, price_ghs, image_url, available, sort)
- `offers` / `offer_redemptions`
- `orders` / `order_items` / `order_status_events`
- `payments` (provider, reference, status, method: cod|paystack)
- `reviews`
- `catering_inquiries`
- `restaurant_settings` (fees mode, fixed fee, distance config, hours, notification toggles)
- `admin_alert_reads` (optional)

---

## Out of scope for v1 (explicit)

- Multi-restaurant marketplace, QR dine-in scan hub
- Real-time GPS driver tracking
- Native mobile apps
- Complex loyalty program beyond coupons

---

## Phase order (build sequence)

```
0 Foundation → 1 Shell/Browse → 2 Auth/Profile → 3 Cart/Pay
→ 4 Orders/Reviews → 5 Offers/Catering → 6 Admin → 7 Notifications → 8 Launch
```

Phases 5 and 6 can overlap once Phase 3–4 APIs exist (admin menu CRUD unblocks content independence early — **consider starting Admin Menu CRUD as soon as Phase 1 seed exists**, even as a thin Phase 6a).

---

## Open follow-ups (non-blocking)

- SMS provider docs (Phase 7)
- Exact WhatsApp business number vs flyer lines
- Distance fee: Google/Mapbox vs haversine from pinned restaurant coords
- Primary auth: phone OTP vs email for v1
