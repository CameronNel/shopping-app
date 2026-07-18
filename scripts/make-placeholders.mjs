/**
 * Writes 1x1 transparent PNG placeholders so Metro can resolve the asset
 * require()s before the real art is dropped in. Overwrite these files with the
 * actual images — nothing else needs to change.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Smallest valid PNG: 1x1, fully transparent.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const FILES = [
  'assets/icon.png',
  'assets/splash.png',
  'assets/adaptive-icon.png',
  'assets/favicon.png',
  'assets/bg-theme.png',
  'assets/mascot/wave.png',
  'assets/mascot/basket.png',
  'assets/mascot/thinking.png',
  'assets/mascot/thumbsup.png',
];

for (const rel of FILES) {
  const path = resolve(ROOT, rel);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, PNG);
  console.log(`placeholder → ${rel}`);
}
