# TurfMate cinematic design system — v0.5

## Visual direction
Use the supplied TurfMate reference images as the visual source of truth: night-match photography, dark forest-green/charcoal surfaces, vivid lime accents, realistic pitch lighting, glass-like information panels, strong condensed display typography and clear booking actions. Keep Academy, Community, Tournaments and Store in the same visual system.

## Video-reference direction
The owner supplied four iStock references. Their creative cues are translated into original, procedural website animation rather than copied stock footage:

| Reference cue | TurfMate treatment |
|---|---|
| Sport soccer intro | Condensed display typography, quick title reveal, live match-status microcopy and a bold first frame |
| Daytime aerial stadium | High, wide stadium approach that slowly descends toward the pitch; the supplied TurfMate image plate acts as the opening visual layer |
| Football flying across stadium | A rising curved ball trajectory across the field, with the camera tracking behind and slightly above the ball |
| Ball bending the net in slow motion | Close approach to the goal, scroll-controlled slow-motion rotation, a flexing procedural goal net and a subtle impact light pulse |

The stock URLs are references, not playable MP4 sources. Do not hotlink, scrape, or download iStock preview media. If the project owner purchases the clips, add the licensed MP4s under `assets/video/` and wire them as muted, autoplay, playsinline, looped decorative layers with the procedural 3D scene retained as the interactive camera/ball layer.

## Continuous scroll story
| Scroll chapter | Visual / camera | Homepage content |
|---|---|---|
| 01 — Sport intro | Kinetic condensed title reveal and match-status microcopy | TurfMate opening statement |
| 02 — Stadium approach | High aerial stadium reference image; slow forward push | Aerial venue view |
| 03 — Descend into the bowl | Aerial plate zooms toward the pitch; 3D stadium scene fades in | Search / booking strip |
| 04 — Enter the pitch | Camera drops to touchline height; stands, goals and floodlights gain depth | Real Dhaka venue cards |
| 05 — Follow the football | Camera chases the textured 3D ball as it accelerates and rises toward goal | How TurfMate works |
| 06 — Goal moment | Camera closes in as the ball reaches the goal; the net bends in scroll-controlled slow motion | Academy and Community |
| 07 — Matchday community | Camera continues the football route while the page reveals the ecosystem | Tournaments and Store |
| 08 — Final whistle | Camera cranes back to a wide stadium view | Turf-owner partnership CTA |

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
