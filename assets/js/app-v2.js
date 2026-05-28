/**
 * app-v2.js — v2.0 funkciók (additív az app.js mellé)
 *
 * Sötét mód, fénykép-kezelés, bővített törzsadatok + logó, jegyzőkönyv sorszám,
 * dátumok, aláírás-canvas, email megosztás, verzióellenőrzés, changelog,
 * tömeges DOCX export, lenyíló betűhű TvMI-leírás panelek.
 *
 * Globális segéd: window.APPV2.collectExtrasInto(rec), afterSave(rec), photoKey()
 */
(function () {
  "use strict";

  const THEME_KEY = "nnv_theme";
  let _sigHasInk = false;

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initPhotos();
    initSettingsExtra();
    initLogo();
    initSorszamPreview();
    initDates();
    initSignature();
    initEmail();
    initVersion();
    initBulkExport();
    hookResultDetails();
  });

  /* ── SÖTÉT MÓD ─────────────────────────────────────────────────── */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
    updateThemeIcon();
    const btn = document.getElementById("btn-theme-toggle");
    if (btn) btn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) { document.documentElement.removeAttribute("data-theme"); localStorage.setItem(THEME_KEY, "light"); }
      else { document.documentElement.setAttribute("data-theme", "dark"); localStorage.setItem(THEME_KEY, "dark"); }
      updateThemeIcon();
    });
  }
  function updateThemeIcon() {
    const btn = document.getElementById("btn-theme-toggle");
    if (!btn) return;
    btn.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "☀" : "🌙";
  }

  /* ── FÉNYKÉPEK ─────────────────────────────────────────────────── */
  function photoKey() {
    // A jelenleg betöltött mentett rekord id-ja, vagy "_draft"
    return (window.__currentRecordId && window.__currentRecordId()) || "_draft";
  }
  function initPhotos() {
    const maxEl = document.getElementById("photo-max");
    if (maxEl && window.PHOTOS) maxEl.textContent = String(window.PHOTOS.MAX_PER_RECORD);
    const cam = document.getElementById("photo-camera");
    const file = document.getElementById("photo-file");
    if (cam) cam.addEventListener("change", e => handlePhotoFiles(e.target.files, e.target));
    if (file) file.addEventListener("change", e => handlePhotoFiles(e.target.files, e.target));
    renderGallery();
  }
  async function handlePhotoFiles(files, inputEl) {
    if (!files || !files.length || !window.PHOTOS) return;
    const key = photoKey();
    let added = 0;
    for (const f of files) {
      try { await window.PHOTOS.addFromFile(key, f, ""); added++; }
      catch (err) { toast("Fotó hiba: " + err.message, "error"); }
    }
    if (inputEl) inputEl.value = "";
    if (added) toast(`${added} fénykép hozzáadva.`, "ok");
    renderGallery();
  }
  async function renderGallery() {
    const gal = document.getElementById("photo-gallery");
    const hint = document.getElementById("photo-hint");
    if (!gal || !window.PHOTOS) return;
    let photos = [];
    try { photos = await window.PHOTOS.list(photoKey()); } catch (e) { return; }
    gal.innerHTML = "";
    if (!photos.length) { if (hint) hint.classList.remove("hidden"); return; }
    if (hint) hint.classList.add("hidden");
    photos.forEach((p, idx) => {
      const item = document.createElement("div");
      item.className = "photo-item";
      const img = document.createElement("img");
      img.className = "photo-thumb"; img.src = p.dataUrl; img.alt = p.felirat || `Fotó ${idx + 1}`;
      img.addEventListener("click", () => window.open(p.dataUrl, "_blank"));
      const cap = document.createElement("input");
      cap.className = "photo-caption"; cap.type = "text";
      cap.placeholder = `Képaláírás (${idx + 1}.)`; cap.value = p.felirat || "";
      cap.addEventListener("blur", () => window.PHOTOS.updateCaption(p.id, cap.value));
      const meta = document.createElement("div");
      meta.className = "photo-meta";
      meta.innerHTML = `<span>${p.w}×${p.h} · ${Math.round(p.bytes / 1024)} kB</span>`;
      const del = document.createElement("button");
      del.className = "photo-del"; del.type = "button"; del.textContent = "🗑";
      del.title = "Fotó törlése";
      del.addEventListener("click", async () => {
        if (!confirm("Törlöd ezt a fényképet?")) return;
        await window.PHOTOS.remove(p.id); renderGallery();
      });
      meta.appendChild(del);
      item.appendChild(img); item.appendChild(cap); item.appendChild(meta);
      gal.appendChild(item);
    });
    if (photos.length > window.PHOTOS.MAX_PER_RECORD) {
      toast(`Figyelem: ${photos.length} fotó (ajánlott max ${window.PHOTOS.MAX_PER_RECORD}).`, "warn");
    }
  }
  // Expose galéria-frissítés a fő app.js számára (mentés utáni reassign után)
  window.__renderGallery = renderGallery;

  /* ── BŐVÍTETT TÖRZSADATOK ──────────────────────────────────────── */
  function initSettingsExtra() {
    const meta = window.STORAGE.getMeta();
    const fields = ["tervezo_mmk", "tervezo_nevjegyzek", "ceg_nev", "ceg_szekhely",
                    "ceg_telefon", "ceg_email", "sorszam_prefix"];
    fields.forEach(f => {
      const el = document.getElementById("set-" + f);
      if (!el) return;
      el.value = meta[f] || "";
      el.addEventListener("blur", () => {
        const upd = {}; upd[f] = el.value.trim();
        window.STORAGE.setMeta(upd);
        if (f === "sorszam_prefix") { updateSorszamPreview(); }
      });
    });
  }

  /* ── LOGÓ ───────────────────────────────────────────────────────── */
  function initLogo() {
    const meta = window.STORAGE.getMeta();
    const fileEl = document.getElementById("set-ceg_logo-file");
    const wrap = document.getElementById("logo-preview-wrap");
    const img = document.getElementById("logo-preview");
    const rm = document.getElementById("btn-logo-remove");
    function show(dataUrl) {
      if (dataUrl) { img.src = dataUrl; wrap.classList.remove("hidden"); }
      else { wrap.classList.add("hidden"); img.removeAttribute("src"); }
    }
    show(meta.ceg_logo);
    if (fileEl) fileEl.addEventListener("change", e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const im = new Image();
      im.onload = () => {
        URL.revokeObjectURL(url);
        let w = im.width, h = im.height; const MAX = 400;
        if (w >= h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        else if (h > w && h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(im, 0, 0, w, h);
        const dataUrl = c.toDataURL("image/png");
        window.STORAGE.setMeta({ ceg_logo: dataUrl });
        show(dataUrl); toast("Logó mentve.", "ok");
      };
      im.onerror = () => toast("A logó nem tölthető be.", "error");
      im.src = url;
      e.target.value = "";
    });
    if (rm) rm.addEventListener("click", () => {
      window.STORAGE.setMeta({ ceg_logo: "" }); show(""); toast("Logó törölve.", "ok");
    });
  }

  /* ── SORSZÁM ELŐNÉZET ──────────────────────────────────────────── */
  function initSorszamPreview() { updateSorszamPreview(); }
  function updateSorszamPreview() {
    const next = window.STORAGE.peekSorszam ? window.STORAGE.peekSorszam() : "";
    const prev = document.getElementById("sorszam-preview");
    const jkv = document.getElementById("jkv-sorszam");
    if (prev) prev.value = next;
    if (jkv && !jkv.value) jkv.value = next;
  }

  /* ── DÁTUMOK ───────────────────────────────────────────────────── */
  function initDates() {
    const d = document.getElementById("jkv-datum");
    if (d && !d.value) d.value = new Date().toISOString().slice(0, 10);
  }

  /* ── ALÁÍRÁS CANVAS ────────────────────────────────────────────── */
  function initSignature() {
    const canvas = document.getElementById("signature-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#101010"; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    let drawing = false, last = null;
    function pos(ev) {
      const r = canvas.getBoundingClientRect();
      const sx = canvas.width / r.width, sy = canvas.height / r.height;
      const src = ev.touches ? ev.touches[0] : ev;
      return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy };
    }
    function start(ev) { ev.preventDefault(); drawing = true; last = pos(ev); }
    function move(ev) {
      if (!drawing) return; ev.preventDefault();
      const p = pos(ev);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; _sigHasInk = true;
    }
    function end() { drawing = false; }
    canvas.addEventListener("mousedown", start); canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);
    const clr = document.getElementById("btn-signature-clear");
    if (clr) clr.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); _sigHasInk = false;
    });
  }
  function signatureDataUrl() {
    const canvas = document.getElementById("signature-canvas");
    if (!canvas || !_sigHasInk) return null;
    return canvas.toDataURL("image/png");
  }

  /* ── EXTRA ADATOK A REKORDBA (mentés/export előtt) ─────────────── */
  function collectExtrasInto(rec) {
    const meta = window.STORAGE.getMeta();
    rec.jkv = rec.jkv || {};
    const sEl = document.getElementById("jkv-sorszam");
    const dEl = document.getElementById("jkv-datum");
    const kEl = document.getElementById("jkv-kov-felulvizsgalat");
    rec.jkv.sorszam = (sEl && sEl.value) || rec.jkv.sorszam || "";
    rec.jkv.datum = (dEl && dEl.value) || "";
    rec.jkv.kov_felulvizsgalat = (kEl && kEl.value) || "";
    const sig = signatureDataUrl();
    if (sig) rec.jkv.alairas_kep = sig;
    rec.ceg = {
      nev: meta.ceg_nev || "", szekhely: meta.ceg_szekhely || "",
      telefon: meta.ceg_telefon || "", email: meta.ceg_email || "",
      logo: meta.ceg_logo || "",
    };
    // tervező kiegészítő mezők
    rec.tervezo = rec.tervezo || {};
    if (meta.tervezo_mmk && !rec.tervezo.mmk) rec.tervezo.mmk = meta.tervezo_mmk;
    if (meta.tervezo_nevjegyzek && !rec.tervezo.nevjegyzek) rec.tervezo.nevjegyzek = meta.tervezo_nevjegyzek;
    rec._photoKey = photoKey();
    return rec;
  }
  async function afterSave(savedRec) {
    // draft fotók átkötése a mentett rekord id-jára + új sorszám kiadása
    if (window.PHOTOS && savedRec && savedRec.id) {
      try { await window.PHOTOS.reassignDraft(savedRec.id); } catch (e) {}
    }
    if (window.__renderGallery) window.__renderGallery();
  }

  window.APPV2 = Object.freeze({ collectExtrasInto, afterSave, photoKey, signatureDataUrl });

  /* ── EMAIL MEGOSZTÁS ───────────────────────────────────────────── */
  function initEmail() {
    const btn = document.getElementById("btn-email");
    if (btn) btn.addEventListener("click", shareEmail);
  }
  async function shareEmail() {
    const get = window.__currentExportRecord;
    const rec = get ? get() : null;
    if (!rec) { toast("Először végezz besorolást.", "warn"); return; }
    collectExtrasInto(rec);
    const fokozat = rec.eredmeny?.fokozat_string || "—";
    const sorszam = rec.jkv?.sorszam ? `Sorszám: ${rec.jkv.sorszam}\n` : "";
    const link = (window.STORAGE.makeShareLink && window.STORAGE.makeShareLink(rec)) || "";
    const subject = `Villámvédelmi besorolás: ${rec.epitmeny_neve || "építmény"} (${fokozat})`;
    const body =
      `${sorszam}Építmény: ${rec.epitmeny_neve || "—"}\n` +
      `Cím: ${rec.helyszin?.cim || "—"}\n` +
      `TvMI: ${window.TVMI?.META?.jel || ""}\n` +
      `Besorolás (TvMI 10.2.1.): ${fokozat}\n\n` +
      (link ? `Részletek (megnyitható linken):\n${link}\n\n` : "") +
      `— A jegyzőkönyv PDF/DOCX a "PDF"/"DOCX" gombbal tölthető le és csatolható.`;
    // Mobil: Web Share API (fájllal, ha lehet)
    if (navigator.share) {
      try {
        await navigator.share({ title: subject, text: body, url: link || undefined });
        return;
      } catch (e) { if (e.name === "AbortError") return; }
    }
    // Desktop: mailto
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast("Email előkészítve. A PDF/DOCX-et külön töltsd le és csatold.", "info", 7000);
  }

  /* ── VERZIÓ + FRISSÍTÉS ────────────────────────────────────────── */
  function initVersion() {
    if (!window.VERSION) return;
    const appEl = document.getElementById("ver-app");
    const tvmiEl = document.getElementById("ver-tvmi");
    if (appEl) appEl.textContent = "v" + window.VERSION.APP_VERSION;
    if (tvmiEl) tvmiEl.textContent = window.VERSION.TVMI_VERSION();
    renderChangelog();
    // Rekord-kompatibilitás
    try {
      const recs = window.STORAGE.list();
      const compat = window.VERSION.checkRecordCompat(recs);
      if (compat.incompatible.length) {
        toast(`${compat.incompatible.length} mentett besorolás eltérő TvMI-verzióval készült (aktuális: ${compat.current}).`, "warn", 8000);
      }
    } catch (e) {}
    // Online frissítés indításkor
    checkUpdate(false);
    const btn = document.getElementById("btn-check-update");
    if (btn) btn.addEventListener("click", () => checkUpdate(true));
  }
  async function checkUpdate(manual) {
    const st = document.getElementById("ver-update-status");
    if (!window.VERSION) return;
    if (st && manual) st.textContent = "Frissítés keresése…";
    const r = await window.VERSION.checkOnlineUpdate();
    if (!st) return;
    if (!r.ok) { st.innerHTML = manual ? "Nem sikerült ellenőrizni (offline?)." : st.innerHTML; return; }
    if (r.updateAvailable) {
      st.innerHTML = `<span class="update-badge">Új verzió: v${r.latest}</span> — <a href="${r.url}" target="_blank" rel="noopener">frissítés megtekintése</a>. Hard refresh (Ctrl/Cmd+Shift+R).`;
    } else {
      st.innerHTML = `<span class="update-ok">✓ Naprakész (v${r.current}).</span>`;
    }
  }
  function renderChangelog() {
    const el = document.getElementById("changelog-content");
    if (!el || !window.VERSION) return;
    el.innerHTML = "";
    window.VERSION.CHANGELOG.forEach(rel => {
      const h = document.createElement("h4");
      h.textContent = `v${rel.v} — ${rel.date}`;
      const ul = document.createElement("ul");
      rel.items.forEach(it => { const li = document.createElement("li"); li.textContent = it; ul.appendChild(li); });
      el.appendChild(h); el.appendChild(ul);
    });
  }

  /* ── TÖMEGES DOCX EXPORT ───────────────────────────────────────── */
  function initBulkExport() {
    const btn = document.getElementById("btn-export-bulk-docx");
    if (btn) btn.addEventListener("click", async () => {
      const recs = window.STORAGE.list();
      if (!recs.length) { toast("Nincs mentett besorolás.", "warn"); return; }
      if (!window.EXPORT.exportBulkDOCX) { toast("Tömeges export nem elérhető.", "error"); return; }
      btn.disabled = true; const orig = btn.textContent; btn.textContent = "Generálás…";
      try {
        await window.EXPORT.exportBulkDOCX(recs);
        toast(`${recs.length} besorolás exportálva egy DOCX-be.`, "ok");
      } catch (e) { toast("Tömeges export hiba: " + e.message, "error"); }
      finally { btn.disabled = false; btn.textContent = orig; }
    });
  }

  /* ── LENYÍLÓ BETŰHŰ LEÍRÁS PANELEK A RESULT-BAN ────────────────── */
  function hookResultDetails() {
    const btn = document.getElementById("btn-besorol");
    if (btn) btn.addEventListener("click", () => setTimeout(injectDetails, 120));
  }
  function injectDetails() {
    const card = document.getElementById("result-card");
    if (!card || card.classList.contains("hidden") || !window.TVMI) return;
    // töröljük a korábbi injektált paneleket
    card.querySelectorAll(".reszletek.auto").forEach(e => e.remove());
    const T = window.TVMI;
    const rows = card.querySelectorAll(".result-row");
    const get = window.__currentExportRecord ? window.__currentExportRecord() : null;
    const er = get?.eredmeny;
    if (!er || !er.ok) return;
    const map = [
      { code: er.R?.ertek, body: T.R?.find(x => x.kod === er.R?.ertek)?.leiras, forras: T.R?.find(x => x.kod === er.R?.ertek)?.forras },
      { code: er.M?.ertek, body: (T.M?.KORNYEZET && Object.values(T.M.KORNYEZET).map(k => k.cimke + ": " + k.feltetel).join("\n\n")), forras: "TvMI 7.7 10.1.2, 2. táblázat", extra: T.M?.BONTAS },
      { code: er.T?.ertek, body: tetoBody(T), forras: "TvMI 7.7 10.1.3, 3. táblázat" },
      { code: er.K?.ertek, body: T.K?.find(x => x.kod === er.K?.ertek)?.leiras, forras: T.K?.find(x => x.kod === er.K?.ertek)?.forras },
      { code: er.V?.ertek, body: T.V?.LEIRAS?.[er.V?.ertek]?.reszletek, forras: T.V?.LEIRAS?.[er.V?.ertek]?.forras, lab: vLab(T, er) },
      { code: er.L?.ertek, body: T.L?.LEIRAS?.[er.L?.ertek]?.reszletek, forras: T.L?.LEIRAS?.[er.L?.ertek]?.forras },
      { code: er.F?.ertek, body: fBody(T, er), forras: "TvMI 7.7 10.3.3" },
      { code: er.B?.ertek, body: bBody(T, er), forras: "TvMI 7.7 10.2.4, 6. táblázat" },
    ];
    rows.forEach((row, i) => {
      const m = map[i]; if (!m || !m.body) return;
      const det = document.createElement("details");
      det.className = "reszletek auto";
      const sum = document.createElement("summary");
      sum.textContent = "Részletek — TvMI betűhű szöveg";
      const body = document.createElement("div");
      body.className = "reszletek-body";
      body.textContent = m.body;
      if (m.extra) { const ex = document.createElement("div"); ex.className = "reszletek-lab"; ex.textContent = m.extra; body.appendChild(ex); }
      if (m.lab) { const lb = document.createElement("div"); lb.className = "reszletek-lab"; lb.textContent = m.lab; body.appendChild(lb); }
      if (m.forras) { const fr = document.createElement("span"); fr.className = "reszletek-forras"; fr.textContent = "Forrás: " + m.forras; body.appendChild(fr); }
      det.appendChild(sum); det.appendChild(body);
      row.appendChild(det);
    });
  }
  function tetoBody(T) {
    const sz = (T.T?.SZERKEZET || []).map(x => `${x.kod}: ${x.leiras}`).join("\n");
    const fd = (T.T?.FEDES || []).map(x => `${x.kod}:\n${x.leiras}`).join("\n\n");
    return "Tetőszerkezet (10.1.3.1):\n" + sz + "\n\nTetőfedés (10.1.3.2):\n" + fd;
  }
  function vLab(T, er) {
    if (String(er.V?.ertek).includes("3") && T.V?.LABJEGYZETEK?.V3_csillag) return T.V.LABJEGYZETEK.V3_csillag;
    if (er.V?.ertek === "V1" && T.V?.LABJEGYZETEK?.V1_lab) return T.V.LABJEGYZETEK.V1_lab;
    return null;
  }
  function fBody(T, er) {
    const base = T.F?.[er.F?.ertek?.replace("/r", "")]?.reszletek || "";
    const r = (er.F?.ertek || "").includes("/r") ? "\n\n" + (T.F?.r?.reszletek || "") : "";
    return base + r;
  }
  function bBody(T, er) {
    const key = er.B?.ertek;
    const direct = T.B?.LEIRAS?.[key];
    if (direct) return direct;
    const base = T.B?.LEIRAS?.[String(key).replace("e", "")] || "";
    const e = String(key).includes("e") ? "\n\n" + (T.B?.LEIRAS?.e || "") : "";
    return (base + e) || (er.B?.megjegyzes || "");
  }

  /* ── TOAST proxy ───────────────────────────────────────────────── */
  function toast(msg, kind, ms) {
    const tEl = document.getElementById("toast");
    if (!tEl) { console.log(`[${kind}]`, msg); return; }
    tEl.textContent = msg; tEl.className = `toast show ${kind || "info"}`;
    setTimeout(() => tEl.classList.remove("show"), ms || 4000);
  }
})();
