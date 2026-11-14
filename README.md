# TurfMate

**Dhaka-first sports turf discovery and booking platform.**

TurfMate helps players discover football turfs, compare venues and plan a game. The website is being built first; the Android app will follow only after the website and shared booking backend are production-ready.

## Current release: v0.7 aerial-to-pitch football cinema

- Eight-chapter cinematic homepage inspired by the supplied Instagram/iStock visual direction: sports-intro typography → high aerial stadium view → steep camera dive into the pitch → low ball-follow camera → dribble and rising football shot → slow-motion net impact → final stadium reveal.
- The opening camera starts much higher above the stadium, dives toward the centre of the field, tightens its lens and hands off smoothly to a low football-follow camera. The ball dribbles across the grass, accelerates and rises toward the goal; the camera follows it and closes in during the goal moment. A procedural net flexes at impact and a restrained light pulse marks the finish.
- The sequence remains tied to native page scrolling across the homepage and reverses naturally when scrolling upward.
- Dynamic Three.js loading with a visible 2D cinematic photo-and-football fallback if WebGL or the external module cannot initialise; a licensed-free Pexels aerial stadium photo prevents a blank opening hero, and the 3D ground/stands/floodlights use a brighter matchday palette.
- Real Dhaka venue discovery seeded from public venue information, with official links and venue-photo sources where available.
- Venue discovery with area, sport, preferred-time, date and price filters.
- List and illustrative map views.
- Venue detail modal with sample session slots and demo checkout.
- Saved venue shortlist persisted locally on the current device.
- Academy, Community, Tournaments and Store information pages.
- Early turf-partner interest form (not connected to a server).
- Separate login and registration pages with local demo accounts (PBKDF2 password hashes; no plaintext password storage), account menu and logout.
- Booking enquiry forms, partner interest forms and tournament interest forms save prototype records locally in the current browser; they do not submit to venues or organisers.
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

Venue names, some locations, public ratings and listed prices are sourced from public venue pages and map listings. TurfMate does not yet have partner inventory or live slot synchronisation; availability is never represented as live. Venue photography is taken from TurfNation's public gallery, JAFF's public gallery and a public DBox venue listing where available. The homepage's cinematic stadium imagery is cropped from the TurfMate design references supplied by the project owner. Venues without a verified photo intentionally use the designed fallback rather than an unrelated stock image. No real-time venue inventory is connected. The checkout is a demonstration only; it does not take money, reserve a pitch or create a real booking. Authentication, partner forms, maps, payments, notifications, QR check-in and admin tools are not connected.

Do not use prototype values as customer-facing availability or payment claims. Before production, TurfMate needs verified partner agreements, a secure backend, database-level booking conflict prevention, payment-provider merchant approval, signed webhook verification, cancellation/refund rules, privacy and terms review, monitoring and operational testing.

## Product roadmap

See [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md). Reference-product research is documented in [docs/REFERENCE_ANALYSIS.md](docs/REFERENCE_ANALYSIS.md).

## Development approach

Work on feature branches and merge reviewed pull requests into `main`. Keep the booking journey reliable before expanding secondary modules. The future Android app must use the same backend, authentication, venue inventory, booking lifecycle and payment verification as the website.


## Step 3 — Player Dashboard & Football Community

- Player profile editor with position, preferred foot, area, experience level, bio, public-profile and availability preferences.
- Player dashboard with teams, local team invitations, friendly match planning, upcoming fixtures and match history.
- Community directory for public player profiles stored in the same browser.
- Prototype data is local to one browser/device. Team invitations are not emailed and the player directory is not a shared network. A secure backend is required for multi-device and real-time collaboration.


## Step 4 — Matchmaking & Live Match Centre

- Dedicated Match Centre at `#/matches` with open fixture discovery and filters for area, position needed and match level.
- Publish 5-a-side, 7-a-side or 11-a-side open matches; players can join either side, leave before kick-off and see squad capacity.
- Organisers can start matches, update a live scoreboard and save a final result.
- Formation and line-up editor supports 5v5, 7v7 and 11v11 formation presets and player position assignments.
- Personal match record summarises appearances, wins, draws and team goals in completed matches.
- This remains a local-browser prototype. A secure shared backend is required for public cross-device matchmaking, live synchronisation, identity verification and push notifications.
