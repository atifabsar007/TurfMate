# TurfMate

**Dhaka-first sports turf discovery and booking platform.**

TurfMate helps players discover football turfs, compare venues and plan a game. The website is being built first; the Android app will follow only after the website and shared booking backend are production-ready.

## Current release: v0.3 cinematic night-mode website

- Cinematic night-mode landing page with a four-chapter, scroll-driven 3D camera journey: aerial venue view → stands and floodlights → pitch-side view → kick-off.
- Scroll-synchronised curved football movement, smooth camera easing, horizontal parallax, depth transforms and responsive reduced-motion fallback.
- Real Dhaka venue discovery seeded from public venue information, with official links and venue-photo sources where available.
- Venue discovery with area, sport, preferred-time, date and price filters.
- List and illustrative map views.
- Venue detail modal with sample session slots and demo checkout.
- Saved venue shortlist persisted locally on the current device.
- Academy, Community, Tournaments and Store information pages.
- Early turf-partner interest form (not connected to a server).
- Accessible modal behaviour, keyboard dismissal and reduced-motion support.
- GitHub Actions syntax and smoke tests.

## Deploy preview with GitHub Pages

After merging to `main`, enable **Settings → Pages → Build and deployment → GitHub Actions**. The included workflow publishes the static website. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Run locally

Requirements: Python 3 or Node.js 20+.

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173>.

Run checks:

```bash
npm test
```

## Prototype limitations

Venue names, some locations, public ratings and listed prices are sourced from public venue pages and map listings. TurfMate does not yet have partner inventory or live slot synchronisation; availability is never represented as live. Venue photography is taken from TurfNation's public gallery, JAFF's public gallery and a public DBox venue listing where available. Venues without a verified photo intentionally use the designed fallback rather than an unrelated stock image. No real-time venue inventory is connected. The checkout is a demonstration only; it does not take money, reserve a pitch or create a real booking. Authentication, partner forms, maps, payments, notifications, QR check-in and admin tools are not connected.

Do not use prototype values as customer-facing availability or payment claims. Before production, TurfMate needs verified partner agreements, a secure backend, database-level booking conflict prevention, payment-provider merchant approval, signed webhook verification, cancellation/refund rules, privacy and terms review, monitoring and operational testing.

## Product roadmap

See [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md). Reference-product research is documented in [docs/REFERENCE_ANALYSIS.md](docs/REFERENCE_ANALYSIS.md).

## Development approach

Work on feature branches and merge reviewed pull requests into `main`. Keep the booking journey reliable before expanding secondary modules. The future Android app must use the same backend, authentication, venue inventory, booking lifecycle and payment verification as the website.
