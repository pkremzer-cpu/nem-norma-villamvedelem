/**
 * Tárolás modul — LocalStorage CRUD + megosztható link kódolás
 *
 * Adat-séma (Besorolás rekord):
 * {
 *   id: "uuid-szerű string",
 *   epitmeny_neve: string,
 *   helyszin: { cim, lat, lng, address_parts, ... },
 *   tervezo: { nev, jogosultsag, alpha_szam, dolgozott }, // opcionális
 *   input: {... TvMI input}, // ami a besoroló logikába megy
 *   eredmeny: {... besorol() return value},
 *   tvmi_verzio: "TvMI 7.7:2026.02.01.",
 *   letrehozva: ISO string,
 *   modositva: ISO string,
 *   megjegyzes: string,
 *   tag: string[] (opcionális címkék),
 * }
 */

(function () {
  const STORAGE_KEY = "nnv_besorolas_v1"; // nem-norma villámvédelem v1
  const META_KEY = "nnv_meta_v1";

  /* ──────────────────────────────────────────────────────────────────
   *  UUID generálás (RFC4122 v4 - egyszerű implementáció)
   * ────────────────────────────────────────────────────────────────── */
  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /* ──────────────────────────────────────────────────────────────────
   *  CRUD műveletek
   * ────────────────────────────────────────────────────────────────── */
  function _loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      console.error("LocalStorage olvasási hiba:", e);
      return {};
    }
  }

  function _saveAll(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("LocalStorage írási hiba (lehet, hogy tele van):", e);
      return false;
    }
  }

  function list() {
    const all = _loadAll();
    return Object.values(all).sort((a, b) => {
      const da = a.modositva || a.letrehozva || "";
      const db = b.modositva || b.letrehozva || "";
      return db.localeCompare(da); // legfrissebb előre
    });
  }

  function get(id) {
    const all = _loadAll();
    return all[id] || null;
  }

  function save(record) {
    const all = _loadAll();
    if (!record.id) {
      record.id = uuid();
      record.letrehozva = new Date().toISOString();
    }
    record.modositva = new Date().toISOString();
    if (!record.tvmi_verzio) {
      record.tvmi_verzio = window.TVMI?.META?.jel || "TvMI 7.7:2026.02.01.";
    }
    all[record.id] = record;
    return _saveAll(all) ? record : null;
  }

  function remove(id) {
    const all = _loadAll();
    if (!all[id]) return false;
    delete all[id];
    return _saveAll(all);
  }

  function clear() {
    return _saveAll({});
  }

  function stats() {
    const all = _loadAll();
    const records = Object.values(all);
    let totalSize = 0;
    try { totalSize = (localStorage.getItem(STORAGE_KEY) || "").length; } catch (e) {}
    return {
      count: records.length,
      size_bytes: totalSize,
      size_kb: (totalSize / 1024).toFixed(2),
      oldest: records.length > 0 ? records.reduce((acc, r) => (r.letrehozva < acc ? r.letrehozva : acc), records[0].letrehozva) : null,
      newest: records.length > 0 ? records.reduce((acc, r) => (r.modositva > acc ? r.modositva : acc), records[0].modositva || records[0].letrehozva) : null,
    };
  }

  /* ──────────────────────────────────────────────────────────────────
   *  Megosztható link (base64-encoded JSON URL fragmentben)
   *
   *  URL forma: https://example.com/#share=<base64>
   *
   *  UTF-8 biztonságos base64 encode/decode
   * ────────────────────────────────────────────────────────────────── */
  function _utf8ToBase64(str) {
    // encodeURIComponent + unescape trükk UTF-8 kezeléshez
    return btoa(unescape(encodeURIComponent(str)));
  }

  function _base64ToUtf8(b64) {
    return decodeURIComponent(escape(atob(b64)));
  }

  function makeShareLink(record) {
    if (!record) return null;
    // Tisztított rekord — ne menjen ki a teljes "all" objektum, csak ez az egy
    const payload = {
      v: 1, // schema version
      r: record,
    };
    const json = JSON.stringify(payload);
    const b64 = _utf8ToBase64(json);
    const base = window.location.origin + window.location.pathname;
    return `${base}#share=${b64}`;
  }

  function parseShareFragment() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith("#share=")) return null;
    const b64 = hash.slice("#share=".length);
    try {
      const json = _base64ToUtf8(b64);
      const payload = JSON.parse(json);
      if (payload.v !== 1) {
        console.warn("Ismeretlen share schema verzió:", payload.v);
      }
      return payload.r;
    } catch (e) {
      console.error("Share link dekódolási hiba:", e);
      return null;
    }
  }

  function clearShareFragment() {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } else {
      window.location.hash = "";
    }
  }

  /* ──────────────────────────────────────────────────────────────────
   *  JSON Export / Import
   * ────────────────────────────────────────────────────────────────── */
  function exportJSON(ids = null) {
    const all = _loadAll();
    const records = ids ? ids.map(id => all[id]).filter(Boolean) : Object.values(all);
    return {
      app: "nem-norma-villamvedelem",
      schema_version: 1,
      tvmi_verzio: window.TVMI?.META?.jel,
      exported_at: new Date().toISOString(),
      count: records.length,
      besorolas: records,
    };
  }

  function exportJSONString(ids = null) {
    return JSON.stringify(exportJSON(ids), null, 2);
  }

  function importJSON(jsonData, opts = {}) {
    let data;
    if (typeof jsonData === "string") {
      try { data = JSON.parse(jsonData); }
      catch (e) { throw new Error("Hibás JSON: " + e.message); }
    } else {
      data = jsonData;
    }
    if (!data || data.schema_version !== 1) {
      throw new Error("Ismeretlen schema verzió vagy hibás formátum.");
    }
    if (!Array.isArray(data.besorolas)) {
      throw new Error("'besorolas' tömb hiányzik a JSON-ból.");
    }
    const all = _loadAll();
    let imported = 0, skipped = 0;
    for (const rec of data.besorolas) {
      if (!rec.id) {
        rec.id = uuid();
        rec.letrehozva = rec.letrehozva || new Date().toISOString();
      }
      if (all[rec.id] && !opts.overwrite) {
        skipped++;
        continue;
      }
      rec.modositva = new Date().toISOString();
      all[rec.id] = rec;
      imported++;
    }
    _saveAll(all);
    return { imported, skipped };
  }

  /* ──────────────────────────────────────────────────────────────────
   *  Felhasználói preferenciák (default tervezői adatok stb.)
   * ────────────────────────────────────────────────────────────────── */
  function getMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function setMeta(updates) {
    const meta = getMeta();
    Object.assign(meta, updates);
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
      return true;
    } catch (e) { return false; }
  }

  /* ──────────────────────────────────────────────────────────────────
   *  PUBLIC API
   * ────────────────────────────────────────────────────────────────── */
  window.STORAGE = Object.freeze({
    uuid,
    list, get, save, remove, clear, stats,
    makeShareLink, parseShareFragment, clearShareFragment,
    exportJSON, exportJSONString, importJSON,
    getMeta, setMeta,
  });
})();
