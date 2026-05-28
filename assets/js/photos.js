/**
 * photos.js — Fénykép modul a jegyzőkönyvekhez
 *
 * - IndexedDB tárolás (nagy kapacitás, a localStorage 5 MB korlátja helyett)
 * - Automatikus kliensoldali átméretezés (max 1600 px hosszabb él, JPEG q0.72)
 * - Fotó CRUD rekordhoz kötve (recordId), képaláírással (felirat)
 * - Base64 dataURL visszaadás export-hoz (PDF/DOCX beágyazás)
 *
 * Adatmodell (IndexedDB "photos" store):
 *   { id, recordId, dataUrl, felirat, w, h, bytes, created }
 *
 * window.PHOTOS API:
 *   init() -> Promise
 *   addFromFile(recordId, file, felirat) -> Promise<photo>
 *   list(recordId) -> Promise<photo[]>
 *   get(id) -> Promise<photo>
 *   updateCaption(id, felirat) -> Promise<bool>
 *   remove(id) -> Promise<bool>
 *   removeByRecord(recordId) -> Promise
 *   count(recordId) -> Promise<number>
 */
(function () {
  "use strict";

  const DB_NAME = "nnv_photos_db";
  const DB_VERSION = 1;
  const STORE = "photos";

  // Átméretezési paraméterek
  const MAX_EDGE = 1600;     // px, hosszabb él
  const JPEG_QUALITY = 0.72; // JPEG minőség
  const MAX_PER_RECORD = 12; // gyakorlati ajánlás (figyelmeztetés felette)

  let _db = null;

  function init() {
    return new Promise((resolve, reject) => {
      if (_db) return resolve(_db);
      if (!window.indexedDB) {
        return reject(new Error("Az IndexedDB nem érhető el ebben a böngészőben."));
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const os = db.createObjectStore(STORE, { keyPath: "id" });
          os.createIndex("recordId", "recordId", { unique: false });
        }
      };
      req.onsuccess = (ev) => { _db = ev.target.result; resolve(_db); };
      req.onerror = (ev) => reject(ev.target.error || new Error("IndexedDB megnyitás sikertelen."));
    });
  }

  function _tx(mode) {
    if (!_db) throw new Error("PHOTOS.init() nem futott le.");
    return _db.transaction(STORE, mode).objectStore(STORE);
  }

  function _uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  /**
   * Kép átméretezése + JPEG tömörítés Canvas-szal.
   * @returns {Promise<{dataUrl, w, h, bytes}>}
   */
  function _resizeImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith("image/")) {
        return reject(new Error("A kiválasztott fájl nem kép."));
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width: w, height: h } = img;
        if (w >= h && w > MAX_EDGE) { h = Math.round(h * MAX_EDGE / w); w = MAX_EDGE; }
        else if (h > w && h > MAX_EDGE) { w = Math.round(w * MAX_EDGE / h); h = MAX_EDGE; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        } catch (e) {
          return reject(new Error("Kép feldolgozása sikertelen: " + e.message));
        }
        const bytes = Math.round((dataUrl.length - (dataUrl.indexOf(",") + 1)) * 3 / 4);
        resolve({ dataUrl, w, h, bytes });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("A kép nem tölthető be.")); };
      img.src = url;
    });
  }

  async function addFromFile(recordId, file, felirat) {
    await init();
    const resized = await _resizeImage(file);
    const photo = {
      id: _uuid(),
      recordId: recordId || "_draft",
      dataUrl: resized.dataUrl,
      felirat: (felirat || "").trim(),
      w: resized.w, h: resized.h, bytes: resized.bytes,
      created: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const req = _tx("readwrite").add(photo);
      req.onsuccess = () => resolve(photo);
      req.onerror = (ev) => reject(ev.target.error || new Error("Fotó mentése sikertelen."));
    });
  }

  function list(recordId) {
    return init().then(() => new Promise((resolve, reject) => {
      const idx = _tx("readonly").index("recordId");
      const req = idx.getAll(recordId || "_draft");
      req.onsuccess = () => {
        const arr = (req.result || []).sort((a, b) => (a.created < b.created ? -1 : 1));
        resolve(arr);
      };
      req.onerror = (ev) => reject(ev.target.error);
    }));
  }

  function get(id) {
    return init().then(() => new Promise((resolve, reject) => {
      const req = _tx("readonly").get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (ev) => reject(ev.target.error);
    }));
  }

  function updateCaption(id, felirat) {
    return get(id).then(photo => {
      if (!photo) return false;
      photo.felirat = (felirat || "").trim();
      return new Promise((resolve, reject) => {
        const req = _tx("readwrite").put(photo);
        req.onsuccess = () => resolve(true);
        req.onerror = (ev) => reject(ev.target.error);
      });
    });
  }

  function remove(id) {
    return init().then(() => new Promise((resolve, reject) => {
      const req = _tx("readwrite").delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = (ev) => reject(ev.target.error);
    }));
  }

  async function removeByRecord(recordId) {
    const photos = await list(recordId);
    for (const p of photos) { await remove(p.id); }
    return photos.length;
  }

  function count(recordId) {
    return list(recordId).then(arr => arr.length);
  }

  /**
   * Áthelyezi a "_draft" fotókat egy mentett rekord id-jára.
   * Mentéskor hívandó, amikor a draft végleges id-t kap.
   */
  async function reassignDraft(newRecordId) {
    const drafts = await list("_draft");
    for (const p of drafts) {
      p.recordId = newRecordId;
      await new Promise((resolve, reject) => {
        const req = _tx("readwrite").put(p);
        req.onsuccess = () => resolve();
        req.onerror = (ev) => reject(ev.target.error);
      });
    }
    return drafts.length;
  }

  window.PHOTOS = Object.freeze({
    init, addFromFile, list, get, updateCaption, remove, removeByRecord,
    count, reassignDraft,
    MAX_PER_RECORD, MAX_EDGE, JPEG_QUALITY,
  });
})();
