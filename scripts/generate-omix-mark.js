// Generate a vector interpretation of the Omix Systems wireframe-knot mark.
//
// The maintenance experience references `public/omix-mark.svg` as the brand
// mark. If the original Omix Systems logo file is supplied later, drop it at
// `public/omix-systems-logo.jpeg` and set `brand.imageSrc` in
// src/config/maintenance.json — both pages will switch to it automatically.
//
// Run manually with:
//   node scripts/generate-omix-mark.js
const { writeFileSync } = require('fs');
const { join } = require('path');

// Parametric trefoil knot, tilted for a one-lobe-up composition.
const TILT_X = (parseFloat(process.env.KNOT_TILT_X) || 55) * (Math.PI / 180);
const TILT_Z = (parseFloat(process.env.KNOT_TILT_Z) || 120) * (Math.PI / 180);
const SCALE = 27;
const CENTER = 100;
const TUBE_R = 0.55; // knot units (× SCALE at projection ≈ 15px)

function knotPoint(t) {
  return [
    Math.sin(t) + 2 * Math.sin(2 * t),
    Math.cos(t) - 2 * Math.cos(2 * t),
    -Math.sin(3 * t),
  ];
}

function rotate([x, y, z]) {
  // Rotate around X, then Z (orthographic projection uses x/y afterwards).
  const cosX = Math.cos(TILT_X);
  const sinX = Math.sin(TILT_X);
  const y1 = y * cosX - z * sinX;
  const z1 = y * sinX + z * cosX;
  const cosZ = Math.cos(TILT_Z);
  const sinZ = Math.sin(TILT_Z);
  return [x * cosZ - y1 * sinZ, x * sinZ + y1 * cosZ, z1];
}

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function norm(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

const SEG = 180; // segments along the knot
const LINES = parseInt(process.env.KNOT_LINES) || 24; // longitudinal wireframe lines around the tube

// Sample the tilted curve + parallel-transport-ish frames.
const frames = [];
for (let i = 0; i < SEG; i++) {
  const t = (i / SEG) * Math.PI * 2;
  const p = rotate(knotPoint(t));
  const pNext = rotate(knotPoint(t + 0.01));
  const tangent = norm(sub(pNext, p));
  let n1 = cross(tangent, [0, 0, 1]);
  if (Math.hypot(...n1) < 0.05) n1 = cross(tangent, [0, 1, 0]);
  n1 = norm(n1);
  const n2 = norm(cross(tangent, n1));
  frames.push({ p, n1, n2 });
}

function project(v) {
  return [CENTER + v[0] * SCALE, CENTER + v[1] * SCALE];
}

function tubePoint(frame, angle) {
  const { p, n1, n2 } = frame;
  return [
    p[0] + TUBE_R * (Math.cos(angle) * n1[0] + Math.sin(angle) * n2[0]),
    p[1] + TUBE_R * (Math.cos(angle) * n1[1] + Math.sin(angle) * n2[1]),
    p[2] + TUBE_R * (Math.cos(angle) * n1[2] + Math.sin(angle) * n2[2]),
  ];
}

const fmt = (n) => Math.round(n).toString(); // integer coords: lossless at display size, ~30% smaller

let paths = '';
// Longitudinal lines (the dominant wireframe flow).
for (let k = 0; k < LINES; k++) {
  const angle = (k / LINES) * Math.PI * 2;
  let d = '';
  for (let i = 0; i <= SEG; i++) {
    const [x, y] = project(tubePoint(frames[i % SEG], angle));
    d += `${i === 0 ? 'M' : 'L'}${fmt(x)},${fmt(y)}`;
  }
  paths += `<path d="${d}Z" fill="none" stroke="url(#omixKnot)" stroke-width="0.7" opacity="0.9"/>`;
}
// Sparse cross-section rings for the woven mesh feel.
for (let i = 0; i < SEG; i += 15) {
  let d = '';
  for (let k = 0; k <= 16; k++) {
    const [x, y] = project(tubePoint(frames[i], (k / 16) * Math.PI * 2));
    d += `${k === 0 ? 'M' : 'L'}${fmt(x)},${fmt(y)}`;
  }
  paths += `<path d="${d}Z" fill="none" stroke="url(#omixKnot)" stroke-width="0.5" opacity="0.3"/>`;
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="Omix Systems logo">` +
  `<defs><linearGradient id="omixKnot" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">` +
  `<stop offset="0" stop-color="#2f6bff"/><stop offset="0.35" stop-color="#06b6d4"/>` +
  `<stop offset="0.62" stop-color="#34d399"/><stop offset="0.82" stop-color="#a855f7"/>` +
  `<stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>` +
  paths +
  `</svg>`;

const outputPath = process.env.KNOT_OUT || join(__dirname, '..', 'public', 'omix-mark.svg');
writeFileSync(outputPath, svg);
console.log(`Omix mark generated: public/omix-mark.svg (${Math.round(svg.length / 1024)} KB)`);
