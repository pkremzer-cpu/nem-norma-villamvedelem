/**
 * Geocoding modul — OpenStreetMap Nominatim alapon
 *
 * Funkciók:
 *  - GPS lekérés (browser geolocation)
 *  - Cím → koordináta (forward geocoding)
 *  - Koordináta → cím (reverse geocoding)
 *  - POI keresés (közelben, kulcsszó alapján)
 *
 * FONTOS: A Nominatim közösségi szerver max 1 req/sec, ezért debounce-olunk
 * és HEADER `Accept-Language: hu` küldéssel magyar nyelvű választ kérünk.
 *
 * Nominatim Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
 *  - Max 1 request/sec
 *  - User-Agent header kell (de browser-ben ezt nem tudjuk állítani — Referer megy)
 *  - Ne tömeges processzálásra
 */

(function () {
  const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
  let lastRequest = 0;
  const RATE_LIMIT_MS = 1100; // 1.1 sec biztos

  // Egyszerű throttle
  async function throttle() {
    const now = Date.now();
    const wait = lastRequest + RATE_LIMIT_MS - now;
    if (wait > 0) {
      await new Promise(r => setTimeout(r, wait));
    }
    lastRequest = Date.now();
  }

  /* ──────────────────────────────────────────────────────────────────
   *  GPS LEKÉRÉS
   * ────────────────────────────────────────────────────────────────── */
  function getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("A böngésző nem támogatja a geolocation API-t."));
        return;
      }
      const opts = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
        ...options,
      };
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          timestamp: pos.timestamp,
        }),
        err => {
          let msg;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              msg = "A helymeghatározáshoz hozzáférés megtagadva. Engedélyezd a böngésző beállításaiban.";
              break;
            case err.POSITION_UNAVAILABLE:
              msg = "Helymeghatározás nem elérhető (gyenge GPS jel vagy hálózat).";
              break;
            case err.TIMEOUT:
              msg = "Helymeghatározás időtúllépés.";
              break;
            default:
              msg = `Helymeghatározási hiba: ${err.message}`;
          }
          reject(new Error(msg));
        },
        opts
      );
    });
  }

  /* ──────────────────────────────────────────────────────────────────
   *  FORWARD GEOCODING (cím → koordináta + cím-részek)
   * ────────────────────────────────────────────────────────────────── */
  async function geocode(query, opts = {}) {
    if (!query || query.trim().length < 3) {
      throw new Error("A keresési kifejezés túl rövid (min. 3 karakter).");
    }
    await throttle();
    const params = new URLSearchParams({
      q: query.trim(),
      format: "jsonv2",
      addressdetails: "1",
      limit: String(opts.limit || 5),
      "accept-language": "hu",
    });
    if (opts.countryCodes) {
      params.set("countrycodes", opts.countryCodes); // pl. "hu"
    }
    const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
    let resp;
    try {
      resp = await fetch(url, {
        headers: { "Accept-Language": "hu,en" },
      });
    } catch (e) {
      throw new Error(`Hálózati hiba a Nominatim szolgáltatás elérésekor: ${e.message}`);
    }
    if (!resp.ok) {
      throw new Error(`Nominatim hibakód: ${resp.status}`);
    }
    const data = await resp.json();
    return data.map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      name: item.name,
      type: item.type,
      class: item.class,
      address: item.address || {},
      bbox: item.boundingbox,
      osm_id: item.osm_id,
      osm_type: item.osm_type,
      importance: item.importance,
    }));
  }

  /* ──────────────────────────────────────────────────────────────────
   *  REVERSE GEOCODING (koordináta → cím)
   * ────────────────────────────────────────────────────────────────── */
  async function reverseGeocode(lat, lng, opts = {}) {
    if (typeof lat !== "number" || typeof lng !== "number") {
      throw new Error("Érvényes lat/lng szükséges.");
    }
    await throttle();
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "jsonv2",
      addressdetails: "1",
      zoom: String(opts.zoom || 18),
      "accept-language": "hu",
    });
    const url = `${NOMINATIM_BASE}/reverse?${params.toString()}`;
    let resp;
    try {
      resp = await fetch(url, {
        headers: { "Accept-Language": "hu,en" },
      });
    } catch (e) {
      throw new Error(`Hálózati hiba: ${e.message}`);
    }
    if (!resp.ok) {
      throw new Error(`Nominatim hibakód: ${resp.status}`);
    }
    const data = await resp.json();
    if (!data || data.error) {
      throw new Error(`Nominatim error: ${data?.error || "ismeretlen"}`);
    }
    return {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      display_name: data.display_name,
      name: data.name,
      address: data.address || {},
      osm_id: data.osm_id,
      osm_type: data.osm_type,
    };
  }

  /* ──────────────────────────────────────────────────────────────────
   *  POI KERESÉS (helyszín-közeli keresés)
   *  Nominatim támogatja a viewbox + bounded paramétert
   * ────────────────────────────────────────────────────────────────── */
  async function searchNearby(lat, lng, query, opts = {}) {
    const radius_km = opts.radius_km || 1.0;
    // BBOX ~ lat/lng ± (radius_km / 111)
    const dlat = radius_km / 111.0;
    const dlng = radius_km / (111.0 * Math.cos(lat * Math.PI / 180));
    const left = lng - dlng;
    const right = lng + dlng;
    const top = lat + dlat;
    const bottom = lat - dlat;

    await throttle();
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: String(opts.limit || 10),
      viewbox: `${left},${top},${right},${bottom}`,
      bounded: "1",
      "accept-language": "hu",
    });
    const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
    let resp;
    try {
      resp = await fetch(url, { headers: { "Accept-Language": "hu,en" } });
    } catch (e) {
      throw new Error(`Hálózati hiba: ${e.message}`);
    }
    if (!resp.ok) throw new Error(`Nominatim hibakód: ${resp.status}`);
    const data = await resp.json();
    return data.map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      name: item.name,
      type: item.type,
      address: item.address || {},
    }));
  }

  /* ──────────────────────────────────────────────────────────────────
   *  HELPER: cím formázása magyar tipográfia szerint
   * ────────────────────────────────────────────────────────────────── */
  function formatHungarianAddress(addr) {
    if (!addr) return "";
    const parts = [];
    // Irányítószám + város
    const psz = addr.postcode || "";
    const varos = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
    if (psz || varos) parts.push(`${psz} ${varos}`.trim());
    // Utca + házszám
    const utca = addr.road || addr.pedestrian || addr.path || "";
    const hsz = addr.house_number || "";
    if (utca) parts.push(`${utca}${hsz ? " " + hsz : ""}`);
    // Régió/megye (csak ha nincs város)
    if (!varos && (addr.state || addr.county)) parts.push(addr.state || addr.county);
    // Ország
    if (addr.country) parts.push(addr.country);
    return parts.join(", ");
  }

  /* ──────────────────────────────────────────────────────────────────
   *  HELPER: koordináta formázás (DD.dddd)
   * ────────────────────────────────────────────────────────────────── */
  function formatCoord(coord, precision = 6) {
    return Number(coord).toFixed(precision);
  }

  /* ──────────────────────────────────────────────────────────────────
   *  PUBLIC API
   * ────────────────────────────────────────────────────────────────── */
  window.GEO = Object.freeze({
    getCurrentPosition,
    geocode,
    reverseGeocode,
    searchNearby,
    formatHungarianAddress,
    formatCoord,
    NOMINATIM_ATTRIBUTION: "© OpenStreetMap közreműködői (Nominatim)",
  });
})();
