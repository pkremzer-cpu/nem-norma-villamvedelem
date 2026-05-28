/**
 * version.js — Verziókövetés és verzióellenőrzés
 *
 * Három funkció (a felhasználó döntése: mindhárom):
 *  A) App-verzió changelog (verziótörténet a UI-ban)
 *  B) Mentett rekord <-> TvMI-verzió kompatibilitás-figyelés
 *  C) Online frissítés-ellenőrzés GitHubról (raw VERSION.json)
 *
 * window.VERSION API:
 *   APP_VERSION : string
 *   TVMI_VERSION: string (az aktuális adatfájlból)
 *   CHANGELOG   : array
 *   checkRecordCompat(records) -> { incompatible:[], current:string }
 *   checkOnlineUpdate() -> Promise<{current, latest, updateAvailable, url}>
 */
(function () {
  "use strict";

  // ── App verzió (SemVer) ──
  const APP_VERSION = "2.0.0";

  // ── Online ellenőrzés forrása (GitHub raw) ──
  // A repo gyökerében lévő VERSION.json-t kéri le.
  const REMOTE_VERSION_URL =
    "https://raw.githubusercontent.com/pkremzer-cpu/nem-norma-villamvedelem/main/VERSION.json";
  const REPO_RELEASES_URL =
    "https://github.com/pkremzer-cpu/nem-norma-villamvedelem/commits/main";

  // ── Changelog (legújabb elöl) ──
  const CHANGELOG = Object.freeze([
    {
      v: "2.0.0", date: "2026-05-28",
      items: [
        "Fénykép-melléklet: mobil kamera + fájl, IndexedDB tárolás, auto-átméretezés, képaláírás",
        "Fotók beágyazása a PDF és DOCX jegyzőkönyvbe",
        "Törzsadatok (tervező, jogosultság, MMK, cégadatok, logó) mentése és automatikus betöltése",
        "Jegyzőkönyv sorszámozás (prefix törzsadatból, évszám automatikus, évente növekvő sorszám)",
        "Aláírás-mező (rajzolható), GPS-koordináta, dátum + következő felülvizsgálat dátuma",
        "Email megosztás (mobil: Web Share API, desktop: mailto + megosztó-link)",
        "Verzióellenőrzés indításkor (changelog + TvMI-kompatibilitás + online frissítés)",
        "Minden besorolási tényezőhöz lenyíló, betűhű TvMI-leírás panel + lábjegyzetek",
        "PWA: offline használat + telepíthető ikon",
        "Sötét mód + nyomtatóbarát nézet, tömeges export (több besorolás egy fájlba)",
        "DOCX export javítás (CDN útvonal: unpkg 404 -> jsDelivr)",
      ],
    },
    {
      v: "1.1.0", date: "2026-05-27",
      items: [
        "TvMI 7.7:2026.02.01. 10. fejezet sorról-sorra betűhű audit (12 MAJOR javítás)",
        "Betűhű leírások: R, M, T, K, V, L, F, B + V3*/V1 lábjegyzetek",
        "Fokozat-jelölés (10.2.1) és felülvizsgálat (10.4) betűhű szövege",
      ],
    },
    {
      v: "1.0.0", date: "2026-02-01",
      items: [
        "Első kiadás: TvMI 7.7 nem norma szerinti villámvédelmi besoroló",
        "R/M/T/K bemenet, V/L/F/B besorolás, PDF/DOCX/JSON export, GPS, megosztó link",
      ],
    },
  ]);

  function TVMI_VERSION() {
    return (window.TVMI && window.TVMI.META && window.TVMI.META.jel) || "ismeretlen";
  }

  /**
   * B) Kompatibilitás-ellenőrzés: mely mentett rekordok készültek
   *    az aktuálistól eltérő TvMI-verzióval.
   */
  function checkRecordCompat(records) {
    const current = TVMI_VERSION();
    const incompatible = [];
    (records || []).forEach(r => {
      const recVer = r.tvmi_verzio || r.eredmeny?.tvmi_verzio || null;
      if (recVer && recVer !== current) {
        incompatible.push({
          id: r.id,
          nev: r.epitmeny_neve || "(névtelen)",
          rekordVerzio: recVer,
          aktualisVerzio: current,
        });
      }
    });
    return { incompatible, current, total: (records || []).length };
  }

  /**
   * C) Online frissítés-ellenőrzés. Hálózati hiba esetén csendben false.
   */
  async function checkOnlineUpdate(timeoutMs = 5000) {
    const result = {
      current: APP_VERSION, latest: null, updateAvailable: false,
      url: REPO_RELEASES_URL, ok: false, error: null,
    };
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const resp = await fetch(REMOTE_VERSION_URL + "?t=" + Date.now(), {
        cache: "no-store", signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      result.latest = data.app_version || data.version || null;
      result.ok = true;
      if (result.latest && _semverGt(result.latest, APP_VERSION)) {
        result.updateAvailable = true;
      }
    } catch (e) {
      result.error = e.message || String(e);
    }
    return result;
  }

  function _semverGt(a, b) {
    const pa = String(a).split(".").map(n => parseInt(n, 10) || 0);
    const pb = String(b).split(".").map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return true;
      if ((pa[i] || 0) < (pb[i] || 0)) return false;
    }
    return false;
  }

  window.VERSION = Object.freeze({
    APP_VERSION,
    TVMI_VERSION,
    CHANGELOG,
    REPO_RELEASES_URL,
    checkRecordCompat,
    checkOnlineUpdate,
  });
})();
