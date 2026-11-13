const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const cinema = fs.readFileSync(path.join(root, 'cinematic.mjs'), 'utf8');
assert.match(html, /TurfMate — Find your pitch/);
assert.match(html, /id="app"/);
assert.match(js, /function home\(/);
assert.ok(js.includes('data-scene-section="stadium"'));
assert.ok(js.includes('turfmate:page-rendered'));
assert.ok(cinema.includes('new THREE.WebGLRenderer'));
assert.ok(cinema.includes('ballPath.getPointAt'));
assert.ok(cinema.includes("addEventListener('scroll'"));
assert.ok(cinema.includes('prefers-reduced-motion'));
assert.ok(css.includes('turfmate-world-canvas'));
assert.ok(css.includes('cinematic-active'));
assert.match(js, /function explore\(/);
assert.match(js, /function venueModal\(/);
assert.match(js, /function checkout\(/);
assert.match(js, /localStorage\.setItem\('turfmate:favorites'/);
assert.match(js, /No booking or payment was made/);
assert.match(css, /prefers-reduced-motion/);
for (const file of ['assets/turfmate-mark.svg', 'styles.css', 'app.js', 'cinematic.mjs']) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing ${file}`);
}
for (const route of ['/explore', '/saved', '/bookings', '/academy', '/community', '/tournaments', '/store', '/partner']) {
  assert.ok(js.includes(`'${route}'`) || js.includes(`"${route}"`), `Route missing: ${route}`);
}
console.log('TurfMate smoke tests passed, including cinematic scroll checks.');

assert.match(js, /cinema-touchline/);
assert.match(js, /cinema-copy-four/);
assert.match(js, /requestAnimationFrame\(tick\)/);
assert.match(css, /perspective:1400px/);
assert.match(css, /prefers-reduced-motion/);
