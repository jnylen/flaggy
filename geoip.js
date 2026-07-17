/**
 * ip.sb GeoIP helpers — pure functions shared by the extension and tests.
 * API: https://api.ip.sb/geoip/<ip>
 */

function geoipUrl(ip) {
  return `https://api.ip.sb/geoip/${ip}`;
}

/**
 * Normalize an ip.sb GeoIP JSON body into the shape the toolbar/popup use.
 * @param {object} data - Parsed JSON from api.ip.sb
 * @param {string} fallbackIp - IP used for the request if response omits ip
 */
function mapGeoResponse(data, fallbackIp) {
  const asn =
    data.asn !== undefined && data.asn !== null && data.asn !== ''
      ? data.asn
      : 'Unknown';

  return {
    ip: data.ip || fallbackIp,
    country: data.country || 'Unknown',
    country_code: data.country_code || '',
    city: data.city || 'Unknown',
    isp: data.isp || 'Unknown',
    organization: data.organization || 'Unknown',
    asn: asn,
    timezone: data.timezone || 'Unknown'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { geoipUrl, mapGeoResponse };
}
