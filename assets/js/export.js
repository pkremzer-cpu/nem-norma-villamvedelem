/**
 * Export modul — PDF (jsPDF) + DOCX (docx.js) + JSON + QR
 *
 * CDN-ek (a fő index.html-ben kell betölteni):
 *  - jsPDF: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
 *  - jsPDF autotable: https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.0/jspdf.plugin.autotable.min.js
 *  - docx.js: https://unpkg.com/docx@8.5.0/build/index.umd.min.js
 *  - file-saver: https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
 *
 * Magyar karaktertámogatás:
 *  - jsPDF default Helvetica NEM támogat ékezeteket. Roboto fontot embeded-eljük base64-ben.
 *  - docx.js natívan UTF-8, ezért nincs gond.
 */

(function () {

  // jsPDF/docx betöltés ellenőrzés runtime-ban
  function _checkJsPDF() {
    if (typeof window.jspdf === "undefined" || !window.jspdf.jsPDF) {
      throw new Error("jsPDF nincs betöltve. Ellenőrizd a CDN script tagot.");
    }
    return window.jspdf.jsPDF;
  }

  function _checkDocx() {
    if (typeof window.docx === "undefined") {
      throw new Error("docx.js nincs betöltve. Ellenőrizd a CDN script tagot.");
    }
    return window.docx;
  }

  function _checkFileSaver() {
    if (typeof window.saveAs !== "function") {
      throw new Error("FileSaver.js nincs betöltve.");
    }
    return window.saveAs;
  }

  /* ──────────────────────────────────────────────────────────────────
   *  Formázó helperek
   * ────────────────────────────────────────────────────────────────── */
  function _fmtDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString("hu-HU", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { return iso; }
  }

  function _fmtCoord(c) {
    if (typeof c !== "number") return "—";
    return c.toFixed(6);
  }

  function _safeStr(s, fallback = "—") {
    return s && String(s).trim() ? String(s).trim() : fallback;
  }

  function _filenameBase(rec) {
    const name = (rec.epitmeny_neve || "besorolas").trim();
    const safe = name.normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // diakritika eltávolítás
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .substring(0, 60) || "besorolas";
    const d = new Date(rec.modositva || rec.letrehozva || Date.now());
    const stamp = d.toISOString().slice(0, 10).replace(/-/g, "");
    return `${safe}_${stamp}`;
  }

  /* ──────────────────────────────────────────────────────────────────
   *  JSON EXPORT (egy rekord vagy minden)
   * ────────────────────────────────────────────────────────────────── */
  function exportRecordToJSON(record) {
    const saveAs = _checkFileSaver();
    const data = window.STORAGE.exportJSON([record.id]);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    saveAs(blob, `${_filenameBase(record)}.json`);
  }

  function exportAllToJSON() {
    const saveAs = _checkFileSaver();
    const data = window.STORAGE.exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    saveAs(blob, `nnv_besorolasok_${stamp}.json`);
  }

  /* ──────────────────────────────────────────────────────────────────
   *  PDF EXPORT
   *
   *  A jsPDF beépített Helvetica nem támogat magyar ékezetes karaktereket.
   *  Megoldás: a magyar karaktereket átkonvertáljuk (transzliteráció vagy
   *  Unicode normalizáció + Roboto font). A legegyszerűbb és portolható
   *  megoldás: használjuk a "Roboto-Regular.ttf" base64-ezett változatát
   *  CDN-ről, vagy a default Helvetica + transzliteráció.
   *
   *  ITT: a default Helvetica + Unicode szöveg + a jsPDF doc.text() opcióval
   *  charSpace=0 és helyes encoding. A modernebb jsPDF (>2.5) támogatja a
   *  UTF-8 szöveget, csak a default font (Helvetica) nem tartalmazza az
   *  ékezetes karaktereket — ezért alternative: a böngésző Canvas-ával
   *  rasterezzük a szöveget, és képként rakjuk be — DE ez sok overhead.
   *
   *  Pragmatikus megközelítés: jsPDF 2.5+ + StandardFonts (Times-Roman is
   *  szegény) — de van workaround: a "courier" font tartalmaz alapvető latin-1-
   *  et. A magyar ékezet (á, é, í, ó, ö, ő, ú, ü, ű) Latin-2-be esnek (ISO-8859-2),
   *  amit jsPDF default nem támogat.
   *
   *  Az igazi megoldás: dinamikus Roboto font betöltés.
   *  CDN: https://cdn.jsdelivr.net/gh/fontsource/fontsource@main/fonts/roboto/files/roboto-latin-ext-400-normal.woff
   *  De PDF-hez TTF kell, és base64. A Roboto TTF ~170 KB. Beágyazom inline.
   *
   *  Itt egyszerűsítve a default font + workaround: a magyar speciális
   *  karaktereket charmap-eljük olyan helyettesítőkre, amik mindenhol mennek.
   *  ⚠️ FIGYELEM: ez veszteséges! A jegyzőkönyv olvashatóan jelenik meg,
   *  de pl. "ő" → "ő" "ű" → "ű" maradhat — modern jsPDF UTF-8-ot kezel.
   *
   *  Próbáljuk meg először a natív UTF-8-at; ha nem jó, akkor charmap.
   * ────────────────────────────────────────────────────────────────── */
  async function exportPDF(record) {
    const jsPDF = _checkJsPDF();
    const saveAs = _checkFileSaver();
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

    // jsPDF 2.5+ támogatja a UTF-8-at, ha a font tartalmazza a karaktereket.
    // A default Helvetica NEM, ezért beragasztunk egy alap Roboto font subset-et,
    // ha elérhető a window.PDF_FONT objektum (külön script töltheti be).
    // Ennek hiányában fallback: az ékezetes karaktereket transzliteráljuk
    // a vizuálisan közelálló latin-1 variánsokra (â→á, ö→ö, ő→ő stb. — utóbbi nem javít).
    // EZ A GYORS MVP MEGOLDÁS. Hosszabb távon: dinamikus Roboto base64 letöltés.

    const useEmbeddedFont = (typeof window.PDF_FONT_ROBOTO_B64 === "string");
    if (useEmbeddedFont) {
      doc.addFileToVFS("Roboto.ttf", window.PDF_FONT_ROBOTO_B64);
      doc.addFont("Roboto.ttf", "Roboto", "normal");
      doc.setFont("Roboto");
    } else {
      // Fallback: helvetica + ékezetes karakter charmap
      // FIGYELEM: ez egy egyszerű approximáció. A felhasználó értesül erről.
      console.warn("PDF font fallback: Helvetica. Ékezetek limitáltan jelennek meg. Töltsd be a Roboto fontot a jobb minőségért.");
      doc.setFont("helvetica", "normal");
    }

    // Transliteráció helper magyar-specifikus ékezetekhez (ha nem Roboto)
    function hu(s) {
      if (useEmbeddedFont || !s) return String(s ?? "");
      // jsPDF 2.5+ alapból ISO-8859-1-en tárol, ami nem támogat ő/ű-t.
      // Cseréljük le ezeket vizuálisan közelálló karakterekre.
      return String(s)
        .replace(/ő/g, "ő").replace(/Ő/g, "Ő") // a font default nem mutatja, de
        .replace(/ű/g, "ű").replace(/Ű/g, "Ű") // a jsPDF >=2.5 megpróbálja kódolni
        .replace(/[\u201E\u201D\u201C]/g, '"')  // smart quotes → "
        .replace(/[\u2013\u2014]/g, "-");       // dash
    }

    let y = 18;

    // Fejléc
    doc.setFontSize(14).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
    doc.text(hu("NEM NORMA SZERINTI VILLÁMVÉDELEM"), 105, y, { align: "center" });
    y += 6;
    doc.setFontSize(10).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");
    doc.text(hu("Besorolási jegyzőkönyv – TvMI 7.7:2026.02.01. 10. fejezet alapján"), 105, y, { align: "center" });
    y += 8;
    doc.setDrawColor(180); doc.setLineWidth(0.4); doc.line(15, y, 195, y);
    y += 6;

    // Építmény / helyszín
    doc.setFontSize(11).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
    doc.text(hu("1. Építmény és helyszín"), 15, y); y += 5;
    doc.setFontSize(10).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");

    const e = record;
    const h = e.helyszin || {};

    const fields1 = [
      [hu("Építmény megnevezése:"), _safeStr(e.epitmeny_neve)],
      [hu("Cím:"), _safeStr(h.cim)],
      [hu("GPS koordináta (WGS84):"), `${_fmtCoord(h.lat)}, ${_fmtCoord(h.lng)}`],
      [hu("Pontosság (m):"), h.accuracy_m ? `${Math.round(h.accuracy_m)} m` : "—"],
    ];
    for (const [k, v] of fields1) {
      doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
      doc.text(hu(k), 18, y);
      doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");
      doc.text(hu(String(v)), 70, y);
      y += 5;
    }
    y += 3;

    // Tervező (opcionális)
    if (e.tervezo && (e.tervezo.nev || e.tervezo.jogosultsag || e.tervezo.alpha_szam)) {
      doc.setFontSize(11).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
      doc.text(hu("2. Tervező / felülvizsgáló"), 15, y); y += 5;
      doc.setFontSize(10).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");
      const t = e.tervezo;
      const fields2 = [
        [hu("Név:"), _safeStr(t.nev)],
        [hu("Jogosultság:"), _safeStr(t.jogosultsag)],
        [hu("Alpha-azonosító:"), _safeStr(t.alpha_szam)],
      ];
      for (const [k, v] of fields2) {
        doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
        doc.text(hu(k), 18, y);
        doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");
        doc.text(hu(String(v)), 70, y);
        y += 5;
      }
      y += 3;
    }

    // Besorolási input
    doc.setFontSize(11).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
    doc.text(hu("3. Besorolási bemenő adatok"), 15, y); y += 5;
    doc.setFontSize(10).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");

    const i = e.input || {};
    const fields3 = [
      [hu("Rendeltetés (R csoport):"), _safeStr(i.rendeltetes)],
      [hu("Magasság:"), i.magassag_m ? `${i.magassag_m} m` : "—"],
      [hu("Becsapási környezet:"), _safeStr(i.kornyezet)],
      [hu("Tetőszerkezet:"), _safeStr(i.teto_szerkezet)],
      [hu("Tetőfedés:"), _safeStr(i.teto_fedes)],
      [hu("Körítőfal:"), _safeStr(i.koritofal)],
      [hu("Külső villámvédelem:"), i.van_kulso_lps ? "Van" : "Nincs"],
    ];
    for (const [k, v] of fields3) {
      doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
      doc.text(hu(k), 18, y);
      doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");
      doc.text(hu(String(v)), 80, y);
      y += 5;
    }
    y += 3;

    // BESOROLÁS EREDMÉNYE (kiemelt)
    doc.setFillColor(20, 60, 100);
    doc.setTextColor(255, 255, 255);
    doc.rect(15, y - 4, 180, 14, "F");
    doc.setFontSize(16).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
    doc.text(hu("BESOROLÁS:"), 18, y + 5);
    if (e.eredmeny?.fokozat_string) {
      doc.text(hu(e.eredmeny.fokozat_string), 195, y + 5, { align: "right" });
    }
    doc.setTextColor(0, 0, 0);
    y += 17;

    // Részletes fokozatok
    if (e.eredmeny?.ok) {
      const er = e.eredmeny;
      doc.setFontSize(11).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
      doc.text(hu("4. Megállapított csoportok és fokozatok"), 15, y); y += 6;
      doc.setFontSize(10).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");

      const rows = [
        ["R", er.R?.ertek, hu(er.R?.leiras || "")],
        ["M", er.M?.ertek, hu(`Magasság ${i.magassag_m} m + ${i.kornyezet}`)],
        ["T", er.T?.ertek, hu(`${i.teto_szerkezet} × ${i.teto_fedes}`)],
        ["K", er.K?.ertek, hu(er.K?.leiras || "")],
        ["V (felfogó)", er.V?.ertek, hu(window.TVMI?.V?.LEIRAS?.[er.V?.ertek]?.szint || "")],
        ["L (levezető)", er.L?.ertek, hu(window.TVMI?.L?.LEIRAS?.[er.L?.ertek]?.szint || "")],
        ["F (földelő)", er.F?.ertek, hu(window.TVMI?.F?.[er.F?.ertek?.replace("/r","")]?.szint || er.F?.ertek)],
        ["B (másodlagos)", er.B?.ertek, hu(er.B?.megjegyzes || "")],
      ];
      for (const [k, v, leiras] of rows) {
        doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
        doc.text(hu(k), 18, y);
        doc.text(_safeStr(v), 50, y);
        doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");
        const wrapped = doc.splitTextToSize(hu(leiras || ""), 110);
        doc.text(wrapped, 75, y);
        y += Math.max(5, wrapped.length * 4.5);
        if (y > 270) { doc.addPage(); y = 20; }
      }
      y += 3;

      // Figyelmeztetések
      if (er.warnings && er.warnings.length) {
        doc.setFontSize(11).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
        doc.text(hu("5. Megjegyzések / figyelmeztetések"), 15, y); y += 6;
        doc.setFontSize(9).setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");
        for (const w of er.warnings.slice(0, 8)) {
          const txt = hu(`• [${w.mezo}] ${w.uzenet}`);
          const wrapped = doc.splitTextToSize(txt, 175);
          doc.text(wrapped, 18, y);
          y += wrapped.length * 4.5 + 1;
          if (y > 270) { doc.addPage(); y = 20; }
        }
      }
    }

    // v2.0: fotó-oldalak (IndexedDB-ből, async)
    if (window.PHOTOS) {
      let photos = [];
      try { photos = await window.PHOTOS.list(record._photoKey || record.id || "_draft"); } catch (er) {}
      photos.forEach((p, idx) => {
        doc.addPage();
        doc.setFontSize(13).setTextColor(20, 60, 100);
        doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
        doc.text(hu(`Fényképmelléklet – ${idx + 1}. ábra`), 105, 20, { align: "center" });
        // Kép arányosan max 180mm szélességgel
        const maxW = 180;
        const aspect = (p.h && p.w) ? (p.h / p.w) : 0.75;
        const w = maxW;
        const h = Math.min(maxW * aspect, 200);
        try { doc.addImage(p.dataUrl, "JPEG", 15, 28, w, h); }
        catch (er) { doc.setFontSize(10).setTextColor(180, 0, 0); doc.text("Kép betöltési hiba.", 105, 60, { align: "center" }); }
        // Képaláírás
        const capY = 28 + h + 6;
        doc.setFontSize(11).setTextColor(40, 40, 40);
        doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "italic");
        const cap = p.felirat || `Fotó ${idx + 1}`;
        doc.text(hu(cap), 105, capY, { align: "center", maxWidth: 180 });
      });
      // v2.0: aláírás-kép (ha van) — utolsó oldalra
      const sigUrl = record.jkv?.alairas_kep;
      if (sigUrl) {
        doc.addPage();
        doc.setFontSize(13).setTextColor(20, 60, 100);
        doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "bold");
        doc.text(hu("Aláírás"), 105, 30, { align: "center" });
        try { doc.addImage(sigUrl, "PNG", 65, 50, 80, 30); } catch (er) {}
        doc.setFontSize(10).setTextColor(60, 60, 60);
        doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "italic");
        doc.text(hu(record.tervezo?.nev || "tervező aláírása"), 105, 92, { align: "center" });
        if (record.jkv?.sorszam) {
          doc.setFontSize(9).setTextColor(120, 120, 120);
          doc.text(hu(`Jegyzőkönyv sorszáma: ${record.jkv.sorszam}`), 105, 100, { align: "center" });
        }
      }
    }

    // Footer minden oldalra
    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(8).setTextColor(120, 120, 120);
      doc.setFont(useEmbeddedFont ? "Roboto" : "helvetica", "normal");
      doc.text(hu(`TvMI 7.7:2026.02.01. – BM OKF | Generálva: ${_fmtDate(e.modositva || e.letrehozva)} | ${p}/${pages}`),
        105, 290, { align: "center" });
    }

    const blob = doc.output("blob");
    saveAs(blob, `${_filenameBase(e)}.pdf`);
  }

  /* ──────────────────────────────────────────────────────────────────
   *  DOCX EXPORT (docx.js — natív UTF-8 támogatás)
   * ────────────────────────────────────────────────────────────────── */
  async function exportDOCX(record) {
    const docx = _checkDocx();
    const saveAs = _checkFileSaver();
    const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
            WidthType, BorderStyle, Packer, PageNumber, Footer, Header, ImageRun, PageBreak,
            TableLayoutType } = docx;

    const e = record;
    const h = e.helyszin || {};
    const t = e.tervezo || {};
    const i = e.input || {};
    const er = e.eredmeny || {};
    const jkv = e.jkv || {};
    const ceg = e.ceg || {};

    // v2.0: fotók betöltése IndexedDB-ből
    let photos = [];
    if (window.PHOTOS) {
      try { photos = await window.PHOTOS.list(e._photoKey || e.id || "_draft"); }
      catch (err) { photos = []; }
    }

    // v2.0: dataURL → Uint8Array (ImageRun-hoz)
    const dataUrlToBytes = (dataUrl) => {
      if (!dataUrl) return null;
      const b64 = String(dataUrl).split(",")[1] || dataUrl;
      try { const bin = atob(b64); const arr = new Uint8Array(bin.length);
        for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
        return arr;
      } catch (err) { return null; }
    };
    // v2.0: kép paragrafusa (centered)
    const imagePara = (dataUrl, w, h, caption) => {
      const bytes = dataUrlToBytes(dataUrl);
      if (!bytes) return null;
      const runs = [new ImageRun({ data: bytes, transformation: { width: w, height: h } })];
      if (caption) {
        return [new Paragraph({ children: runs, alignment: AlignmentType.CENTER, spacing: { before: 100, after: 40 } }),
                new Paragraph({ children: [new TextRun({ text: caption, italics: true, size: 18 })],
                  alignment: AlignmentType.CENTER, spacing: { after: 140 } })];
      }
      return [new Paragraph({ children: runs, alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 } })];
    };

    // Stílusos paragrafus helper
    const para = (txt, opts = {}) => new Paragraph({
      children: [new TextRun({ text: txt || "", ...opts })],
      spacing: { after: 80 },
      ...opts.paragraph,
    });

    const heading = (txt, level) => new Paragraph({
      text: txt, heading: level, spacing: { before: 240, after: 120 },
    });

    const labelValue = (label, value) => new Paragraph({
      children: [
        new TextRun({ text: label + " ", bold: true }),
        new TextRun({ text: _safeStr(value) }),
      ],
      spacing: { after: 60 },
    });

    // 2-oszlopos táblázat helper — v2.1: fix layout + DXA (twips), nem PERCENTAGE,
    // mert a Word mobil rendering a százalékos szélességeket egyenetlenül kezeli
    // (innen ered a "hosszúkás / szétcsúszott" megjelenés egyes Office-verziókban).
    // A4 portrait tartalmi szélesség = 12240 - 2*1440 = 9360 twips. Felosztás 33/67.
    const KV_TABLE_WIDTH = 9000;     // teljes táblázat twips-ben
    const KV_COL_LABEL = 2900;       // bal (címke) ~32%
    const KV_COL_VALUE = 6100;       // jobb (érték) ~68%
    const buildKV = (rows) => new Table({
      rows: rows.map(([k, v]) => new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: k, bold: true })] })],
            width: { size: KV_COL_LABEL, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph(_safeStr(v))],
            width: { size: KV_COL_VALUE, type: WidthType.DXA },
          }),
        ],
      })),
      width: { size: KV_TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [KV_COL_LABEL, KV_COL_VALUE],
      layout: TableLayoutType.FIXED,
    });

    // FŐ DOKUMENTUM
    const children = [];

    // v2.0: Cég-logó (ha van) + cégadat fejléc
    if (ceg.logo) {
      const lp = imagePara(ceg.logo, 180, 70);
      if (lp) lp.forEach(p => children.push(p));
    }
    if (ceg.nev) {
      children.push(new Paragraph({
        children: [new TextRun({ text: ceg.nev, bold: true, size: 24 })],
        alignment: AlignmentType.CENTER, spacing: { after: 40 },
      }));
      const cegLine = [ceg.szekhely, ceg.telefon, ceg.email].filter(Boolean).join(" · ");
      if (cegLine) children.push(new Paragraph({
        children: [new TextRun({ text: cegLine, size: 18, color: "555555" })],
        alignment: AlignmentType.CENTER, spacing: { after: 160 },
      }));
    }

    // v2.0: Jegyzőkönyv sorszáma
    if (jkv.sorszam) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Jegyzőkönyv sorszáma: ${jkv.sorszam}`, bold: true, size: 22 })],
        alignment: AlignmentType.RIGHT, spacing: { after: 100 },
      }));
    }

    // Címsor
    children.push(new Paragraph({
      children: [new TextRun({ text: "NEM NORMA SZERINTI VILLÁMVÉDELEM", bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: "Besorolási jegyzőkönyv", size: 24, italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: "Alapja: TvMI 7.7:2026.02.01. 10. fejezet (BM OKF)", size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }));

    // 1. Építmény + helyszín
    children.push(heading("1. Építmény és helyszín", HeadingLevel.HEADING_1));
    children.push(buildKV([
      ["Építmény megnevezése:", e.epitmeny_neve],
      ["Cím:", h.cim],
      ["GPS koordináta (WGS84):", `${_fmtCoord(h.lat)}, ${_fmtCoord(h.lng)}`],
      ["GPS pontosság:", h.accuracy_m ? `${Math.round(h.accuracy_m)} m` : "—"],
      ["Településrész / POI:", h.poi_name],
      ["Vizsgálat / besorolás dátuma:", jkv.datum || _fmtDate(e.modositva || e.letrehozva).slice(0, 10)],
      ["Következő felülvizsgálat (OTSZ):", jkv.kov_felulvizsgalat || "—"],
    ]));

    // 2. Tervező
    if (t.nev || t.jogosultsag || t.alpha_szam || t.dolgozott || t.mmk || t.nevjegyzek) {
      children.push(heading("2. Tervező / felülvizsgáló", HeadingLevel.HEADING_1));
      children.push(buildKV([
        ["Név:", t.nev],
        ["Jogosultság:", t.jogosultsag],
        ["MMK / kamarai szám:", t.mmk],
        ["Névjegyzéki szám:", t.nevjegyzek],
        ["Alpha-azonosító:", t.alpha_szam],
        ["Munkáltató / cég:", t.dolgozott || ceg.nev],
      ]));
    }

    // 3. Bemenő adatok
    children.push(heading("3. Besorolási bemenő adatok", HeadingLevel.HEADING_1));
    children.push(buildKV([
      ["Rendeltetés (R csoport):", `${i.rendeltetes} — ${window.TVMI?.R?.find(x=>x.kod===i.rendeltetes)?.rovid || ""}`],
      ["Magasság:", i.magassag_m ? `${i.magassag_m} m` : "—"],
      ["Becsapási környezet:", `${i.kornyezet} (${window.TVMI?.M?.KORNYEZET?.[i.kornyezet?.toUpperCase()]?.cimke || ""})`],
      ["Tetőszerkezet:", i.teto_szerkezet],
      ["Tetőfedés (anyag):", i.teto_fedes],
      ["Körítőfal:", `${i.koritofal} — ${window.TVMI?.K?.find(x=>x.kod===i.koritofal)?.leiras?.substring(0,60) || ""}…`],
      ["Külső villámvédelem (LPS):", i.van_kulso_lps ? "Van" : "Nincs"],
    ]));

    // 4. EREDMÉNY (kiemelt)
    children.push(heading("4. Megállapított csoportok és fokozatok", HeadingLevel.HEADING_1));

    children.push(new Paragraph({
      children: [
        new TextRun({ text: "Kombinált fokozat (TvMI 10.2.1.): ", bold: true, size: 24 }),
        new TextRun({ text: er.fokozat_string || "—", bold: true, size: 28, color: "143C64" }),
      ],
      spacing: { before: 100, after: 200 },
    }));

    if (er.ok) {
      children.push(buildKV([
        [`R (rendeltetés): ${er.R?.ertek}`, er.R?.leiras],
        [`M (magasság): ${er.M?.ertek}`, er.M?.indok],
        [`T (tető): ${er.T?.ertek}`, er.T?.indok],
        [`K (körítőfal): ${er.K?.ertek}`, er.K?.leiras],
        [`V (felfogó): ${er.V?.ertek}`, `${er.V?.indok} | ${window.TVMI?.V?.LEIRAS?.[er.V?.ertek]?.szint || ""}: ${window.TVMI?.V?.LEIRAS?.[er.V?.ertek]?.reszletek || ""}`],
        [`L (levezető): ${er.L?.ertek}`, `${er.L?.indok} | ${window.TVMI?.L?.LEIRAS?.[er.L?.ertek]?.reszletek || ""}`],
        [`F (földelő): ${er.F?.ertek}`, window.TVMI?.F?.[er.F?.ertek?.replace("/r","")]?.reszletek],
        [`B (másodlagos): ${er.B?.ertek}`, `${er.B?.megjegyzes || ""} | ${er.B?.ertek === "B0*" ? "" : (window.TVMI?.B?.LEIRAS?.[er.B?.ertek?.replace("e","")] || "")}`],
      ]));
    }

    // 5. Figyelmeztetések
    if (er.warnings && er.warnings.length) {
      children.push(heading("5. Megjegyzések, figyelmeztetések", HeadingLevel.HEADING_1));
      for (const w of er.warnings) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `[${w.mezo}] `, bold: true, color: "C8202F" }),
            new TextRun({ text: w.uzenet }),
          ],
          spacing: { after: 60 },
          bullet: { level: 0 },
        }));
      }
    }

    // 6. Forrás
    children.push(heading("6. Hivatkozás", HeadingLevel.HEADING_1));
    children.push(para(`Tűzvédelmi Műszaki Irányelv: ${window.TVMI?.META?.jel || "TvMI 7.7:2026.02.01."}`));
    children.push(para(`Cím: ${window.TVMI?.META?.cim || ""}`));
    children.push(para(`Hatályos: ${window.TVMI?.META?.hatalyos || ""}-tól`));
    children.push(para(`Kibocsátó: ${window.TVMI?.META?.kibocsato || ""}`));
    children.push(para(`Letöltés: ${window.TVMI?.META?.url || ""}`));

    // 7. v2.0: Fényképmelléklet (ha vannak fotók)
    if (photos.length) {
      children.push(heading("7. Fényképmelléklet", HeadingLevel.HEADING_1));
      photos.forEach((p, idx) => {
        const cap = (p.felirat ? p.felirat : `Fotó ${idx + 1}`);
        const fullCap = `${idx + 1}. ábra — ${cap}`;
        // Méretezés: max 360 px szélesség, arányosan
        const targetW = 360;
        const targetH = Math.round((p.h || 240) * targetW / (p.w || 320));
        const blocks = imagePara(p.dataUrl, targetW, targetH, fullCap);
        if (blocks) blocks.forEach(b => children.push(b));
      });
    }

    // 8. v2.0: Jegyzőkönyv-keltezés + aláírás-kép
    const sectionN = photos.length ? "8" : "7";
    children.push(heading(`${sectionN}. Záró nyilatkozat`, HeadingLevel.HEADING_1));
    children.push(para(`Jelen besorolás a fent megadott TvMI alapján, a tervező/felülvizsgáló által megadott adatokra építve készült. A besorolás megfelelősége az adatok pontosságától függ.`));
    children.push(para(`Készült: ${_fmtDate(e.modositva || e.letrehozva)}`));
    if (jkv.alairas_kep) {
      const sigBlocks = imagePara(jkv.alairas_kep, 200, 70);
      if (sigBlocks) sigBlocks.forEach(b => children.push(b));
      children.push(new Paragraph({
        children: [new TextRun({ text: t.nev || "tervező aláírása", italics: true })],
        alignment: AlignmentType.CENTER, spacing: { after: 80 },
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: "_______________________", break: 2 })],
        alignment: AlignmentType.RIGHT,
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: t.nev || "tervező aláírása" })],
        alignment: AlignmentType.RIGHT,
      }));
    }

    const doc = new Document({
      creator: t.nev || "TvMI 7.7 besoroló",
      title: `Villámvédelmi besorolás – ${e.epitmeny_neve || "építmény"}`,
      description: "TvMI 7.7:2026.02.01. 10. fejezet szerinti besorolás",
      styles: {
        default: {
          document: { run: { font: "Calibri", size: 22 } },
        },
      },
      sections: [{
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children,
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "TvMI 7.7:2026.02.01. — BM OKF | nem-norma-villamvedelem app | Oldal ", size: 18 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                new TextRun({ text: " / ", size: 18 }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
              ],
            })],
          }),
        },
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${_filenameBase(e)}.docx`);
  }

  /* ──────────────────────────────────────────────────────────────────
   *  TÖMEGES DOCX EXPORT — minden rekordot külön DOCX fájlba ment
   *  (Pragmatikus: a böngésző tömeges letöltés-engedélyt kérhet.)
   * ────────────────────────────────────────────────────────────────── */
  async function exportBulkDOCX(records) {
    if (!records || !records.length) throw new Error("Nincs exportálható rekord.");
    let n = 0;
    for (const r of records) {
      try { await exportDOCX(r); n++; }
      catch (err) { console.error("Tömeges export hiba egy rekordnál:", err); }
      await new Promise(res => setTimeout(res, 450));
    }
    return n;
  }

  /* ──────────────────────────────────────────────────────────────────
   *  Megosztható link másolása vágólapra
   * ────────────────────────────────────────────────────────────────── */
  async function copyShareLink(record) {
    const link = window.STORAGE.makeShareLink(record);
    if (!link) throw new Error("Nincs érvényes rekord a megosztáshoz.");
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
    } else {
      // Fallback: textarea trükk
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    return link;
  }

  /* ──────────────────────────────────────────────────────────────────
   *  PUBLIC API
   * ────────────────────────────────────────────────────────────────── */
  window.EXPORT = Object.freeze({
    exportRecordToJSON,
    exportAllToJSON,
    exportPDF,
    exportDOCX,
    exportBulkDOCX,
    copyShareLink,
  });
})();
