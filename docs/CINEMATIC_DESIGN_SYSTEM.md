# TurfMate cinematic design system — v0.7

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

## Aerial-to-pitch camera choreography

The opening is a deliberate drone-to-player transition, not a generic zoom on one still image:

1. **Establish the stadium:** begin from a high, wide aerial angle, with the entire bowl and pitch visible.
2. **Dive into the field:** move down toward the centre of the pitch while tightening the camera field of view. The aerial photo plate zooms and fades as the procedural 3D stadium becomes dominant.
3. **Find the football:** finish the dive just behind the ball at low pitch height, so the camera handoff into the ball-follow path feels continuous.
4. **Dribble and accelerate:** keep the ball near the centre of the frame while it moves across the grass with a subtle ground bounce.
5. **Lift the shot:** raise the ball toward the far goal and bring the camera closer for the final seconds.
6. **Land the goal:** flex the procedural net at impact, then crane back to a wide stadium reveal.

The camera uses scroll progress for position, aim and lens changes, so the whole shot reverses naturally when the visitor scrolls upward. The ball's dribble, flight and camera handoff are one continuous path, rather than separate animation cards.

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
- The aerial photo plate now uses a free-to-use Pexels aerial football-stadium photograph by David Pickup (https://www.pexels.com/photo/aerial-view-of-a-football-stadium-29070371/). The pitch-action plate remains the TurfMate project asset. Both crossfade as the camera descends; the 3D renderer and green fallback color remain visible if the external photo cannot load. The opening now begins at a much higher aerial angle and dives almost vertically toward the field before handing off to the ball-follow camera. The camera lens tightens during the descent.
- A 2D canvas fallback uses the same supplied image plates and a moving football if WebGL is unavailable.
- Reduced-motion preferences are respected; the site remains readable and usable without camera travel.
- The cinematic canvas is layered behind semantic HTML; navigation, booking controls and venue cards remain interactive.

## Player account and form behaviour
- Login and registration are separate routes (`#/login` and `#/register`).
- The static prototype stores a local player profile in browser storage and derives a PBKDF2-SHA-256 password hash with a per-account salt; it never stores the password itself.
- Booking enquiries, tournament interest and partner interest are local demo records. They are not transmitted to venues or organisers and do not create reservations.
- A production release still needs a server-side identity provider, account recovery, server-side form validation, a booking API and verified partner calendars.

## Honest limitations
The photo plates are still images animated with camera-style zoom and parallax, not recorded video. The main scene is real-time procedural 3D, not a photorealistic scanned stadium. A later production pass can replace procedural stands and lighting with optimized, licensed stadium models, higher-resolution textures, player rigs and real football motion capture.
