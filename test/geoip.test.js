/**
 * Tests drive the shipped geoip.js helpers against live api.ip.sb responses
 * and assert extension wiring (manifest + background) points at ip.sb only.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { geoipUrl, mapGeoResponse } = require('../geoip.js');

const ROOT = path.join(__dirname, '..');

function assertNoGeocodeSh(content, label) {
  assert.ok(
    !/geocode\.sh/.test(content),
    `${label} must not reference geocode.sh`
  );
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 Flaggy-test' }
  });
  assert.strictEqual(res.status, 200, `HTTP ${res.status} for ${url}`);
  return res.json();
}

async function run() {
  // --- URL shape used by the extension ---
  const url = geoipUrl('8.8.8.8');
  assert.strictEqual(url, 'https://api.ip.sb/geoip/8.8.8.8');
  assert.ok(!url.includes('?'), 'must use path form, not ?ip= query');
  assert.ok(!url.includes('geocode.sh'));

  // --- Live API + shipped mapper (real path) ---
  const raw = await fetchJson(url);
  assert.ok(raw.ip, 'live response must include ip');
  assert.ok(raw.country_code, 'live response must include country_code');

  const mapped = mapGeoResponse(raw, '8.8.8.8');
  assert.strictEqual(mapped.ip, raw.ip);
  assert.strictEqual(mapped.country, raw.country || 'Unknown');
  assert.strictEqual(mapped.country_code, raw.country_code || '');
  assert.strictEqual(mapped.city, raw.city || 'Unknown');
  assert.strictEqual(mapped.isp, raw.isp || 'Unknown');
  assert.strictEqual(mapped.organization, raw.organization || 'Unknown');
  assert.ok(
    mapped.asn === raw.asn || mapped.asn === 'Unknown',
    `asn should pass through: got ${mapped.asn}`
  );
  assert.strictEqual(mapped.timezone, raw.timezone || 'Unknown');

  // Second public IP (8.8.4.4 typically has full geo fields)
  const raw2 = await fetchJson(geoipUrl('8.8.4.4'));
  const mapped2 = mapGeoResponse(raw2, '8.8.4.4');
  assert.ok(mapped2.ip, '8.8.4.4 mapping must yield ip');
  assert.ok(mapped2.country_code, '8.8.4.4 mapping must yield country_code');

  // Partial live body (1.1.1.1 often omits country/city) still maps cleanly
  const rawPartial = await fetchJson(geoipUrl('1.1.1.1'));
  const mappedPartial = mapGeoResponse(rawPartial, '1.1.1.1');
  assert.strictEqual(mappedPartial.ip, rawPartial.ip || '1.1.1.1');
  assert.strictEqual(
    mappedPartial.country_code,
    rawPartial.country_code || ''
  );
  assert.strictEqual(mappedPartial.country, rawPartial.country || 'Unknown');

  // Missing optional fields fall back
  const sparse = mapGeoResponse({ ip: '0.0.0.0', country_code: 'XX' }, '0.0.0.0');
  assert.strictEqual(sparse.city, 'Unknown');
  assert.strictEqual(sparse.country, 'Unknown');
  assert.strictEqual(sparse.asn, 'Unknown');
  assert.strictEqual(sparse.country_code, 'XX');

  // Numeric ASN preserved (ip.sb often returns number)
  const withNumAsn = mapGeoResponse(
    { ip: '8.8.8.8', country_code: 'US', asn: 15169 },
    '8.8.8.8'
  );
  assert.strictEqual(withNumAsn.asn, 15169);

  // --- Structural: extension wiring ---
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')
  );
  assert.ok(
    manifest.permissions.includes('https://api.ip.sb/*'),
    'manifest must permit api.ip.sb'
  );
  assert.ok(
    !manifest.permissions.some((p) => /geocode\.sh/.test(p)),
    'manifest must not permit geocode.sh'
  );
  assert.deepStrictEqual(
    manifest.background.scripts,
    ['geoip.js', 'background.js'],
    'geoip.js must load before background.js'
  );

  const background = fs.readFileSync(path.join(ROOT, 'background.js'), 'utf8');
  assert.ok(
    /fetch\s*\(\s*geoipUrl\s*\(/.test(background),
    'background must fetch via geoipUrl()'
  );
  assertNoGeocodeSh(background, 'background.js');
  assertNoGeocodeSh(
    fs.readFileSync(path.join(ROOT, 'geoip.js'), 'utf8'),
    'geoip.js'
  );
  assertNoGeocodeSh(
    fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'),
    'manifest.json'
  );
  assertNoGeocodeSh(
    fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8'),
    'README.md'
  );

  console.log('ok - all geoip tests passed');
  console.log(
    JSON.stringify(
      {
        url,
        live_8_8_8_8: mapped,
        live_8_8_4_4: {
          ip: mapped2.ip,
          country_code: mapped2.country_code,
          country: mapped2.country
        },
        live_1_1_1_1_partial: {
          ip: mappedPartial.ip,
          country_code: mappedPartial.country_code,
          country: mappedPartial.country,
          asn: mappedPartial.asn
        }
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
