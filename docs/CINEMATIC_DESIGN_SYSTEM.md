# TurfMate cinematic design system — v0.5

## Visual direction
Use the supplied TurfMate reference images as the visual source of truth: night-match photography, dark forest-green/charcoal surfaces, vivid lime accents, realistic pitch lighting, glass-like information panels, strong condensed display typography and clear booking actions. Keep Academy, Community, Tournaments and Store in the same visual system.

## Continuous scroll story
| Scroll chapter | Visual / camera | Homepage content |
|---|---|---|
| 01 — Stadium approach | High aerial stadium reference image; slow forward push | TurfMate opening statement |
| 02 — Descend into the bowl | Aerial plate zooms toward the pitch; 3D stadium scene fades in | Search / booking strip |
| 03 — Enter the pitch | Camera drops to touchline height; stands, goals and floodlights gain depth | Real Dhaka venue cards |
| 04 — Follow the football | Camera chases the textured 3D ball along a curved pitch route | How TurfMate works |
| 05 — Cross the field | Camera banks and tracks from one side of the pitch to the other | Academy and Community |
| 06 — Matchday community | Camera continues the football route while the page reveals the ecosystem | Tournaments and Store |
| 07 — Final whistle | Camera cranes back to a wide stadium view | Turf-owner partnership CTA |

The scene progress is tied to the entire homepage scroll range, including the footer. Native scrolling remains in control; the experience reverses when scrolling upward.

## Technical implementation
- Existing static HTML/CSS/JavaScript and GitHub Pages deployment are retained.
- Three.js is loaded dynamically so a CDN or WebGL failure does not stop the rest of the experience.
- A persistent transparent WebGL canvas renders the procedural stadium, instanced crowd, pitch markings, goals, floodlights, city silhouettes and a textured football.
- The aerial and pitch-action photo plates are cropped from the project owner's supplied TurfMate visual references and crossfade as the camera descends.
- A 2D canvas fallback uses the same supplied image plates and a moving football if WebGL is unavailable.
- Reduced-motion preferences are respected; the site remains readable and usable without camera travel.
- The cinematic canvas is layered behind semantic HTML; navigation, booking controls and venue cards remain interactive.

## Honest limitations
The photo plates are still images animated with camera-style zoom and parallax, not recorded video. The main scene is real-time procedural 3D, not a photorealistic scanned stadium. A later production pass can replace procedural stands and lighting with optimized, licensed stadium models, higher-resolution textures, player rigs and real football motion capture.
