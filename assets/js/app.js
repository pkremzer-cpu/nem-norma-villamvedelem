/**
 * app.js — UI wizard vezérlő
 *
 * Felelős:
 *  - Tab navigáció (Új besorolás | Mentettek | Beállítások | Hivatkozás)
 *  - Wizard lépésenkénti kérdezőflow (R → M → T → K → speciális)
 *  - Eredmény panel megjelenítés
 *  - Mentés / Megosztás / Export műveletek
 *  - Share-link betöltés URL fragmentből
 */

(function () {
  // Várjuk meg amíg a DOM kész
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  let currentDraft = null;   // épülő besorolás
  let currentResult = null;  // számított eredmény
  let currentRecord = null;  // mentett rekord (id-vel)

  /* ──────────────────────────────────────────────────────────────────
   *  INIT
   * ────────────────────────────────────────────────────────────────── */
  function init() {
    // Globális hibakezelés
    window.addEventListener("error", (e) => {
      console.error("Hiba:", e.error);
      showToast("Hiba: " + (e.error?.message || e.message), "error");
    });

    // Tab navigáció
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    // Wizard
    setupWizard();
    setupSavedList();
    setupSettings();

    // Share link betöltés URL-ből
    const shared = window.STORAGE.parseShareFragment();
    if (shared) {
      loadSharedRecord(shared);
      window.STORAGE.clearShareFragment();
    } else {
      // Default tab
      switchTab("uj");
      // Új draft inicializálása
      newDraft();
    }

    // Frissítjük a mentett lista számlálót
    updateSavedCount();
  }

  /* ──────────────────────────────────────────────────────────────────
   *  TAB
   * ────────────────────────────────────────────────────────────────── */
  function switchTab(name) {
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.tab === name);
    });
    document.querySelectorAll(".tab-panel").forEach(p => {
      p.classList.toggle("active", p.dataset.tab === name);
    });
    if (name === "mentett") refreshSavedList();
    if (name === "hivatkozas") refreshReferences();
  }

  /* ──────────────────────────────────────────────────────────────────
   *  ÚJ DRAFT
   * ────────────────────────────────────────────────────────────────── */
  function newDraft() {
    currentDraft = {
      epitmeny_neve: "",
      helyszin: { cim: "", lat: null, lng: null },
      tervezo: {},
      input: {
        rendeltetes: null,
        magassag_m: null,
        kornyezet: null,
        teto_szerkezet: null,
        teto_fedes: null,
        koritofal: null,
        van_kulso_lps: false,
        lako_rendeltetes: false,
      },
    };
    currentResult = null;
    currentRecord = null;
    renderWizard();
    document.getElementById("result-card")?.classList.add("hidden");
  }

  /* ──────────────────────────────────────────────────────────────────
   *  WIZARD RENDER
   * ────────────────────────────────────────────────────────────────── */
  function setupWizard() {
    document.getElementById("btn-uj").addEventListener("click", () => {
      newDraft();
      switchTab("uj");
    });

    document.getElementById("btn-besorol").addEventListener("click", calculate);
    document.getElementById("btn-mentes").addEventListener("click", saveRecord);
    document.getElementById("btn-megoszt").addEventListener("click", copyShare);
    document.getElementById("btn-pdf").addEventListener("click", () => downloadFile("pdf"));
    document.getElementById("btn-docx").addEventListener("click", () => downloadFile("docx"));
    document.getElementById("btn-json").addEventListener("click", () => downloadFile("json"));

    // GPS gomb
    document.getElementById("btn-gps").addEventListener("click", fetchGPS);
    document.getElementById("btn-cim-keres").addEventListener("click", searchAddress);

    // R csoport rádió
    document.querySelectorAll('input[name="r-csoport"]').forEach(r => {
      r.addEventListener("change", e => {
        currentDraft.input.rendeltetes = e.target.value;
        updateDraftSummary();
      });
    });

    // Magasság
    document.getElementById("magassag-m").addEventListener("input", e => {
      const v = parseFloat(e.target.value);
      currentDraft.input.magassag_m = isNaN(v) ? null : v;
      updateDraftSummary();
    });

    // Környezet
    document.querySelectorAll('input[name="kornyezet"]').forEach(r => {
      r.addEventListener("change", e => {
        currentDraft.input.kornyezet = e.target.value;
        updateDraftSummary();
      });
    });

    // Tetőszerkezet
    document.querySelectorAll('input[name="teto-szerkezet"]').forEach(r => {
      r.addEventListener("change", e => {
        currentDraft.input.teto_szerkezet = e.target.value;
        updateDraftSummary();
      });
    });

    // Tetőfedés
    document.querySelectorAll('input[name="teto-fedes"]').forEach(r => {
      r.addEventListener("change", e => {
        currentDraft.input.teto_fedes = e.target.value;
        updateDraftSummary();
      });
    });

    // Körítőfal
    document.querySelectorAll('input[name="koritofal"]').forEach(r => {
      r.addEventListener("change", e => {
        currentDraft.input.koritofal = e.target.value;
        updateDraftSummary();
      });
    });

    // Egyéb input mezők
    document.getElementById("epitmeny-neve").addEventListener("input", e => {
      currentDraft.epitmeny_neve = e.target.value;
    });
    document.getElementById("cim").addEventListener("input", e => {
      currentDraft.helyszin.cim = e.target.value;
    });

    // Checkboxok
    document.getElementById("van-kulso-lps").addEventListener("change", e => {
      currentDraft.input.van_kulso_lps = e.target.checked;
      updateDraftSummary();
    });
    document.getElementById("lako-rendeltetes").addEventListener("change", e => {
      currentDraft.input.lako_rendeltetes = e.target.checked;
      updateDraftSummary();
    });
    document.getElementById("lapos-vagy-bonyolult").addEventListener("change", e => {
      currentDraft.input.lapos_vagy_bonyolult_teto = e.target.checked;
      updateDraftSummary();
    });

    // Tervezői opcionális mezők
    document.getElementById("tervezo-nev").addEventListener("input", e => {
      currentDraft.tervezo.nev = e.target.value;
    });
    document.getElementById("tervezo-jogosultsag").addEventListener("input", e => {
      currentDraft.tervezo.jogosultsag = e.target.value;
    });
    document.getElementById("tervezo-alpha").addEventListener("input", e => {
      currentDraft.tervezo.alpha_szam = e.target.value;
    });
    document.getElementById("tervezo-dolgozott").addEventListener("input", e => {
      currentDraft.tervezo.dolgozott = e.target.value;
    });
  }

  function renderWizard() {
    if (!currentDraft) return;
    document.getElementById("epitmeny-neve").value = currentDraft.epitmeny_neve || "";
    document.getElementById("cim").value = currentDraft.helyszin?.cim || "";
    document.getElementById("magassag-m").value = currentDraft.input.magassag_m ?? "";

    // R csoport
    document.querySelectorAll('input[name="r-csoport"]').forEach(r => {
      r.checked = r.value === currentDraft.input.rendeltetes;
    });
    // Környezet
    document.querySelectorAll('input[name="kornyezet"]').forEach(r => {
      r.checked = r.value === currentDraft.input.kornyezet;
    });
    // Tetőszerkezet
    document.querySelectorAll('input[name="teto-szerkezet"]').forEach(r => {
      r.checked = r.value === currentDraft.input.teto_szerkezet;
    });
    // Tetőfedés
    document.querySelectorAll('input[name="teto-fedes"]').forEach(r => {
      r.checked = r.value === currentDraft.input.teto_fedes;
    });
    // Körítőfal
    document.querySelectorAll('input[name="koritofal"]').forEach(r => {
      r.checked = r.value === currentDraft.input.koritofal;
    });
    // Checkboxok
    document.getElementById("van-kulso-lps").checked = !!currentDraft.input.van_kulso_lps;
    document.getElementById("lako-rendeltetes").checked = !!currentDraft.input.lako_rendeltetes;
    document.getElementById("lapos-vagy-bonyolult").checked = !!currentDraft.input.lapos_vagy_bonyolult_teto;

    // Tervezői (default a STORAGE.getMeta-ból)
    const meta = window.STORAGE.getMeta();
    if (!currentDraft.tervezo?.nev && meta.tervezo_nev) {
      currentDraft.tervezo.nev = meta.tervezo_nev;
    }
    if (!currentDraft.tervezo?.jogosultsag && meta.tervezo_jogosultsag) {
      currentDraft.tervezo.jogosultsag = meta.tervezo_jogosultsag;
    }
    if (!currentDraft.tervezo?.alpha_szam && meta.tervezo_alpha) {
      currentDraft.tervezo.alpha_szam = meta.tervezo_alpha;
    }
    if (!currentDraft.tervezo?.dolgozott && meta.tervezo_dolgozott) {
      currentDraft.tervezo.dolgozott = meta.tervezo_dolgozott;
    }

    document.getElementById("tervezo-nev").value = currentDraft.tervezo.nev || "";
    document.getElementById("tervezo-jogosultsag").value = currentDraft.tervezo.jogosultsag || "";
    document.getElementById("tervezo-alpha").value = currentDraft.tervezo.alpha_szam || "";
    document.getElementById("tervezo-dolgozott").value = currentDraft.tervezo.dolgozott || "";

    updateDraftSummary();
  }

  function updateDraftSummary() {
    const i = currentDraft.input;
    const sumEl = document.getElementById("draft-summary");
    if (!sumEl) return;
    const parts = [];
    if (i.rendeltetes) parts.push(`R: ${i.rendeltetes}`);
    if (i.magassag_m) parts.push(`H: ${i.magassag_m} m`);
    if (i.kornyezet) parts.push(`Körny: ${i.kornyezet}`);
    if (i.teto_szerkezet && i.teto_fedes) parts.push(`T: ${i.teto_szerkezet}/${i.teto_fedes}`);
    if (i.koritofal) parts.push(`K: ${i.koritofal}`);
    sumEl.textContent = parts.length ? parts.join(" · ") : "—";

    // "Besorolás" gomb aktiválás
    const btn = document.getElementById("btn-besorol");
    const valid = i.rendeltetes && i.magassag_m && i.kornyezet && i.teto_szerkezet && i.teto_fedes && i.koritofal;
    btn.disabled = !valid;
    btn.classList.toggle("primary", !!valid);
  }

  /* ──────────────────────────────────────────────────────────────────
   *  CALCULATE
   * ────────────────────────────────────────────────────────────────── */
  function calculate() {
    const result = window.TVMI_LOGIC.besorol(currentDraft.input);
    currentResult = result;
    if (!result.ok) {
      showToast(`Bemenő adatok hibája: ${result.errors?.[0]?.uzenet || result.message}`, "error");
      return;
    }
    renderResult(result);
    document.getElementById("result-card")?.classList.remove("hidden");
    document.getElementById("result-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderResult(r) {
    document.getElementById("res-fokozat").textContent = r.fokozat_string;
    document.getElementById("res-r").textContent = `${r.R.ertek} — ${r.R.leiras || ""}`;
    document.getElementById("res-m").textContent = `${r.M.ertek}`;
    document.getElementById("res-m-indok").textContent = r.M.indok;
    document.getElementById("res-t").textContent = `${r.T.ertek}`;
    document.getElementById("res-t-indok").textContent = r.T.indok;
    document.getElementById("res-k").textContent = `${r.K.ertek}`;
    document.getElementById("res-v").textContent = r.V.ertek;
    document.getElementById("res-v-leiras").textContent =
      (window.TVMI?.V?.LEIRAS?.[r.V.ertek]?.szint || "") + ": " +
      (window.TVMI?.V?.LEIRAS?.[r.V.ertek]?.reszletek || "");
    document.getElementById("res-l").textContent = r.L.ertek;
    document.getElementById("res-l-leiras").textContent = window.TVMI?.L?.LEIRAS?.[r.L.ertek]?.reszletek || "";
    document.getElementById("res-f").textContent = r.F.ertek;
    document.getElementById("res-f-leiras").textContent =
      window.TVMI?.F?.[r.F.ertek?.replace("/r","")]?.reszletek || "";
    document.getElementById("res-b").textContent = r.B.ertek;
    document.getElementById("res-b-leiras").textContent = r.B.megjegyzes || "";

    // Figyelmeztetések
    const wEl = document.getElementById("res-warnings");
    wEl.innerHTML = "";
    if (r.warnings && r.warnings.length) {
      r.warnings.forEach(w => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>[${escapeHtml(w.mezo)}]</strong> ${escapeHtml(w.uzenet)}`;
        wEl.appendChild(li);
      });
      document.getElementById("res-warnings-block").classList.remove("hidden");
    } else {
      document.getElementById("res-warnings-block").classList.add("hidden");
    }

    // Action gombok aktiválása
    document.getElementById("btn-mentes").disabled = false;
    document.getElementById("btn-megoszt").disabled = false;
    document.getElementById("btn-pdf").disabled = false;
    document.getElementById("btn-docx").disabled = false;
    document.getElementById("btn-json").disabled = false;
  }

  /* ──────────────────────────────────────────────────────────────────
   *  MENTÉS
   * ────────────────────────────────────────────────────────────────── */
  function saveRecord() {
    if (!currentResult || !currentResult.ok) {
      showToast("Először végezz besorolást.", "warn");
      return;
    }
    const rec = {
      id: currentRecord?.id,
      epitmeny_neve: currentDraft.epitmeny_neve || "Névtelen besorolás",
      helyszin: { ...currentDraft.helyszin },
      tervezo: { ...currentDraft.tervezo },
      input: { ...currentDraft.input },
      eredmeny: currentResult,
    };
    const saved = window.STORAGE.save(rec);
    if (saved) {
      currentRecord = saved;
      showToast(`Mentve: ${saved.epitmeny_neve} (${saved.eredmeny.fokozat_string})`, "ok");
      updateSavedCount();
    } else {
      showToast("Mentés sikertelen (tárhely tele).", "error");
    }
  }

  /* ──────────────────────────────────────────────────────────────────
   *  MEGOSZTÁS
   * ────────────────────────────────────────────────────────────────── */
  async function copyShare() {
    if (!currentResult?.ok) return;
    const rec = currentRecord || {
      id: window.STORAGE.uuid(),
      epitmeny_neve: currentDraft.epitmeny_neve || "Megosztott",
      helyszin: { ...currentDraft.helyszin },
      tervezo: { ...currentDraft.tervezo },
      input: { ...currentDraft.input },
      eredmeny: currentResult,
      letrehozva: new Date().toISOString(),
      modositva: new Date().toISOString(),
      tvmi_verzio: window.TVMI?.META?.jel,
    };
    try {
      const link = await window.EXPORT.copyShareLink(rec);
      showToast("Megosztó link a vágólapra másolva.", "ok");
      // Mutassuk meg a linket
      const linkBox = document.getElementById("share-link-display");
      if (linkBox) {
        linkBox.textContent = link;
        linkBox.classList.remove("hidden");
      }
    } catch (e) {
      showToast("Másolás sikertelen: " + e.message, "error");
    }
  }

  /* ──────────────────────────────────────────────────────────────────
   *  EXPORT (PDF / DOCX / JSON)
   * ────────────────────────────────────────────────────────────────── */
  function downloadFile(format) {
    if (!currentResult?.ok) {
      showToast("Először végezz besorolást.", "warn");
      return;
    }
    const rec = currentRecord || {
      id: window.STORAGE.uuid(),
      epitmeny_neve: currentDraft.epitmeny_neve || "Besorolás",
      helyszin: { ...currentDraft.helyszin },
      tervezo: { ...currentDraft.tervezo },
      input: { ...currentDraft.input },
      eredmeny: currentResult,
      letrehozva: new Date().toISOString(),
      modositva: new Date().toISOString(),
      tvmi_verzio: window.TVMI?.META?.jel,
    };
    try {
      if (format === "pdf") {
        window.EXPORT.exportPDF(rec);
        showToast("PDF letöltése elindult.", "ok");
      } else if (format === "docx") {
        window.EXPORT.exportDOCX(rec).then(() => showToast("DOCX letöltése elindult.", "ok"));
      } else if (format === "json") {
        window.EXPORT.exportRecordToJSON(rec);
        showToast("JSON letöltése elindult.", "ok");
      }
    } catch (e) {
      console.error(e);
      showToast(`Export sikertelen: ${e.message}`, "error");
    }
  }

  /* ──────────────────────────────────────────────────────────────────
   *  GPS / CÍMKERESÉS
   * ────────────────────────────────────────────────────────────────── */
  async function fetchGPS() {
    const btn = document.getElementById("btn-gps");
    btn.disabled = true;
    btn.textContent = "GPS lekérése…";
    try {
      const pos = await window.GEO.getCurrentPosition();
      currentDraft.helyszin.lat = pos.lat;
      currentDraft.helyszin.lng = pos.lng;
      currentDraft.helyszin.accuracy_m = pos.accuracy_m;

      // Reverse geocode
      try {
        const addr = await window.GEO.reverseGeocode(pos.lat, pos.lng);
        const formatted = window.GEO.formatHungarianAddress(addr.address);
        currentDraft.helyszin.cim = formatted;
        currentDraft.helyszin.address_parts = addr.address;
        document.getElementById("cim").value = formatted;
      } catch (e) {
        console.warn("Reverse geocode hiba:", e);
      }

      document.getElementById("gps-info").textContent =
        `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)} (±${Math.round(pos.accuracy_m)} m)`;
      showToast("GPS pozíció lekérve.", "ok");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "📍 Saját GPS";
    }
  }

  async function searchAddress() {
    const q = document.getElementById("cim").value.trim();
    if (q.length < 3) {
      showToast("Adj meg legalább 3 karaktert a kereséshez.", "warn");
      return;
    }
    const btn = document.getElementById("btn-cim-keres");
    btn.disabled = true;
    btn.textContent = "Keresés…";
    try {
      const results = await window.GEO.geocode(q, { countryCodes: "hu", limit: 5 });
      if (results.length === 0) {
        showToast("Nincs találat.", "warn");
        return;
      }
      // Egyszerűsített: az első találatot vesszük; később lista-popup lehetne
      const r = results[0];
      currentDraft.helyszin.lat = r.lat;
      currentDraft.helyszin.lng = r.lng;
      currentDraft.helyszin.cim = r.display_name;
      currentDraft.helyszin.address_parts = r.address;
      document.getElementById("cim").value = r.display_name;
      document.getElementById("gps-info").textContent =
        `${r.lat.toFixed(6)}, ${r.lng.toFixed(6)} — ${r.type || ""}`;
      showToast(`Találat: ${r.display_name.substring(0, 80)}…`, "ok");
    } catch (e) {
      showToast(`Keresési hiba: ${e.message}`, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "🔍 Cím keresése";
    }
  }

  /* ──────────────────────────────────────────────────────────────────
   *  MENTETT LISTA
   * ────────────────────────────────────────────────────────────────── */
  function setupSavedList() {
    document.getElementById("btn-export-all").addEventListener("click", () => {
      window.EXPORT.exportAllToJSON();
      showToast("Teljes export elindult.", "ok");
    });
    document.getElementById("btn-import").addEventListener("click", () => {
      document.getElementById("file-import").click();
    });
    document.getElementById("file-import").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const result = window.STORAGE.importJSON(text);
        showToast(`Importálva: ${result.imported}, kihagyva: ${result.skipped}`, "ok");
        refreshSavedList();
        updateSavedCount();
      } catch (err) {
        showToast(`Import hiba: ${err.message}`, "error");
      }
      e.target.value = "";
    });
  }

  function refreshSavedList() {
    const records = window.STORAGE.list();
    const listEl = document.getElementById("saved-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    if (records.length === 0) {
      listEl.innerHTML = "<li class='empty'>Még nincs mentett besorolás.</li>";
      return;
    }
    records.forEach(r => {
      const li = document.createElement("li");
      li.className = "saved-item";
      const fokozat = r.eredmeny?.fokozat_string || "?";
      const h = r.helyszin || {};
      li.innerHTML = `
        <div class="saved-main">
          <div class="saved-name">${escapeHtml(r.epitmeny_neve || "Névtelen")}</div>
          <div class="saved-meta">
            <span class="fokozat-chip">${escapeHtml(fokozat)}</span>
            <span class="addr">${escapeHtml((h.cim || "—").substring(0, 80))}</span>
          </div>
          <div class="saved-date">Módosítva: ${formatDate(r.modositva || r.letrehozva)}</div>
        </div>
        <div class="saved-actions">
          <button class="ghost" data-action="load">Megnyitás</button>
          <button class="ghost" data-action="pdf">PDF</button>
          <button class="ghost" data-action="docx">DOCX</button>
          <button class="ghost" data-action="json">JSON</button>
          <button class="ghost" data-action="share">Megosztás</button>
          <button class="ghost danger" data-action="delete">Törlés</button>
        </div>
      `;
      li.querySelectorAll("button").forEach(b => {
        b.addEventListener("click", () => handleSavedAction(b.dataset.action, r));
      });
      listEl.appendChild(li);
    });
  }

  async function handleSavedAction(action, rec) {
    switch (action) {
      case "load":
        currentDraft = {
          epitmeny_neve: rec.epitmeny_neve,
          helyszin: { ...rec.helyszin },
          tervezo: { ...rec.tervezo },
          input: { ...rec.input },
        };
        currentResult = rec.eredmeny;
        currentRecord = rec;
        switchTab("uj");
        renderWizard();
        if (currentResult?.ok) {
          renderResult(currentResult);
          document.getElementById("result-card").classList.remove("hidden");
        }
        showToast(`Betöltve: ${rec.epitmeny_neve}`, "ok");
        break;
      case "pdf": window.EXPORT.exportPDF(rec); break;
      case "docx": await window.EXPORT.exportDOCX(rec); break;
      case "json": window.EXPORT.exportRecordToJSON(rec); break;
      case "share":
        try {
          await window.EXPORT.copyShareLink(rec);
          showToast("Link a vágólapon.", "ok");
        } catch (e) { showToast(e.message, "error"); }
        break;
      case "delete":
        if (confirm(`Biztosan törlöd: ${rec.epitmeny_neve}?`)) {
          window.STORAGE.remove(rec.id);
          refreshSavedList();
          updateSavedCount();
          showToast("Törölve.", "ok");
        }
        break;
    }
  }

  function updateSavedCount() {
    const c = window.STORAGE.list().length;
    const el = document.getElementById("saved-count");
    if (el) el.textContent = c;
  }

  /* ──────────────────────────────────────────────────────────────────
   *  BEÁLLÍTÁSOK
   * ────────────────────────────────────────────────────────────────── */
  function setupSettings() {
    const meta = window.STORAGE.getMeta();
    const fields = ["tervezo_nev", "tervezo_jogosultsag", "tervezo_alpha", "tervezo_dolgozott"];
    fields.forEach(f => {
      const el = document.getElementById("set-" + f);
      if (el) {
        el.value = meta[f] || "";
        el.addEventListener("blur", () => {
          const updates = {};
          updates[f] = el.value.trim();
          window.STORAGE.setMeta(updates);
        });
      }
    });
    document.getElementById("btn-clear-all")?.addEventListener("click", () => {
      if (!confirm("Biztosan törölsz minden mentett besorolást? Ez nem visszavonható!")) return;
      window.STORAGE.clear();
      refreshSavedList();
      updateSavedCount();
      showToast("Minden adat törölve.", "ok");
    });
  }

  /* ──────────────────────────────────────────────────────────────────
   *  HIVATKOZÁS PANEL
   * ────────────────────────────────────────────────────────────────── */
  function refreshReferences() {
    const meta = window.TVMI?.META;
    if (meta) {
      document.getElementById("ref-jel").textContent = meta.jel;
      document.getElementById("ref-cim").textContent = meta.cim;
      document.getElementById("ref-hatalyos").textContent = meta.hatalyos;
      document.getElementById("ref-url").href = meta.url;
      document.getElementById("ref-url").textContent = meta.url;
    }
  }

  /* ──────────────────────────────────────────────────────────────────
   *  SHARED RECORD LOAD
   * ────────────────────────────────────────────────────────────────── */
  function loadSharedRecord(rec) {
    currentDraft = {
      epitmeny_neve: rec.epitmeny_neve,
      helyszin: { ...rec.helyszin },
      tervezo: { ...rec.tervezo },
      input: { ...rec.input },
    };
    currentResult = rec.eredmeny;
    currentRecord = null; // nem mentett, csak megosztott
    switchTab("uj");
    renderWizard();
    if (currentResult?.ok) {
      renderResult(currentResult);
      document.getElementById("result-card").classList.remove("hidden");
    }
    showToast("Megosztott besorolás betöltve — mentsd el ha meg akarod tartani.", "ok", 8000);
  }

  /* ──────────────────────────────────────────────────────────────────
   *  TOAST + HELPERS
   * ────────────────────────────────────────────────────────────────── */
  function showToast(message, kind = "info", ms = 4000) {
    const tEl = document.getElementById("toast");
    if (!tEl) { console.log(`[${kind}]`, message); return; }
    tEl.textContent = message;
    tEl.className = `toast show ${kind}`;
    setTimeout(() => tEl.classList.remove("show"), ms);
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString("hu-HU", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { return iso; }
  }
})();
