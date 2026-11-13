const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert.match(html, /TurfMate — Find your pitch/);
assert.match(html, /id="app"/);
assert.match(js, /function home\(/);
assert.match(js, /function explore\(/);
assert.match(js, /function venueModal\(/);
assert.match(js, /function checkout\(/);
assert.match(js, /localStorage\.setItem\('turfmate:favorites'/);
assert.match(js, /No booking or payment was made/);
assert.match(css, /prefers-reduced-motion/);
for (const file of ['assets/turfmate-mark.svg', 'styles.css', 'app.js']) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing ${file}`);
}
for (const route of ['/explore', '/saved', '/bookings', '/academy', '/community', '/tournaments', '/store', '/partner']) {
  assert.ok(js.includes(`'${route}'`) || js.includes(`"${route}"`), `Route missing: ${route}`);
}
console.log('TurfMate smoke tests passed.');
