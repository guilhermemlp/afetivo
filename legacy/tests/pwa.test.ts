import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('web app manifest is installable and references valid app icons', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('public/manifest.webmanifest', root), 'utf8'),
  );
  assert.equal(manifest.name, 'Afetivo — Diário de Humor');
  assert.equal(manifest.short_name, 'Afetivo');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#115e59');
  assert.deepEqual(
    manifest.icons.map((icon: { sizes: string }) => icon.sizes),
    ['192x192', '512x512'],
  );

  for (const icon of manifest.icons) {
    const bytes = await readFile(new URL(`public${icon.src}`, root));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    const expectedSize = Number(icon.sizes.split('x')[0]);
    assert.equal(bytes.readUInt32BE(16), expectedSize);
    assert.equal(bytes.readUInt32BE(20), expectedSize);
  }
});

test('HTML exposes PWA metadata and the service worker caches only static resources', async () => {
  const [html, worker, registration] = await Promise.all([
    readFile(new URL('index.html', root), 'utf8'),
    readFile(new URL('public/sw.js', root), 'utf8'),
    readFile(new URL('src/registerServiceWorker.ts', root), 'utf8'),
  ]);
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /name="theme-color" content="#115e59"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(worker, /assets\/afetivo\.js/);
  assert.match(worker, /cacheableDestinations/);
  assert.match(worker, /url\.origin !== self\.location\.origin/);
  assert.match(worker, /notificationclick/);
  assert.match(registration, /import\.meta\.env\.PROD/);
  assert.match(registration, /serviceWorker\.register\('\/sw\.js'\)/);
});
