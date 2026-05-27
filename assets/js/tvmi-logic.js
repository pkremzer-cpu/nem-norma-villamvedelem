/**
 * TvMI 7.7:2026.02.01. - Besoroló motor
 *
 * INPUT: felhasználói válaszok (épület jellemzők)
 * OUTPUT: R/M/T/K osztály + V/L/F/B fokozat + indoklás (TvMI hivatkozással)
 *
 * Validáció: minden lépésnél input gate. Ha hiányos vagy ellentmondásos → HARD FAIL.
 */

(function () {
  const TVMI = window.TVMI;
  if (!TVMI) {
    console.error("TVMI adattár nem található. Töltsd be tvmi-data.js-t előbb.");
    return;
  }

  /* ──────────────────────────────────────────────────────────────────
   *  INPUT MODELL
   * ──────────────────────────────────────────────────────────────────
   *
   *  Az input objektum mezői a wizard kérdéseinek megfelelően:
   *
   *  {
   *    // 1. RENDELTETÉS
   *    rendeltetes: "R1"|"R2"|"R3"|"R4"|"R5",
   *
   *    // 2. MAGASSÁG
   *    magassag_m: number (méter),
   *    kornyezet: "csokkento"|"nincs"|"fokozo",
   *
   *    // 3. TETŐ
   *    teto_szerkezet: "T.a"|"T.b"|"T.c",
   *    teto_fedes: "T.I"|"T.II"|"T.III"|"T.IV",
   *    teto_eghetoseg_60pct: boolean (legalább 60% éghető-e, 9.2.5 alapján),
   *
   *    // 4. KÖRÍTŐFAL
   *    koritofal: "K1"|"K2"|"K3",
   *
   *    // 5. KÜLSŐ VILLÁMVÉDELEM (csak R1-hez releváns - 6. tbl.)
   *    van_kulso_lps: boolean,
   *
   *    // 6. RÉGI MEGLÉVŐ V2 FELFOGÓ MARADHAT-E (4. tbl. * lábjegyzet)
   *    lako_rendeltetes: boolean,
   *    meglevo_v2_megtartando: boolean,
   *
   *    // 7. METAADAT (nem befolyásolja a besorolást)
   *    helyszin: { cim, lat, lng, ... },
   *    tervezo: { ... },
   *    epitmeny_neve: string,
   *  }
   */

  /* ──────────────────────────────────────────────────────────────────
   *  INPUT GATE - validáció
   * ────────────────────────────────────────────────────────────────── */
  function validateInput(input) {
    const errors = [];
    const warnings = [];

    if (!input || typeof input !== "object") {
      errors.push({ mezo: "input", uzenet: "Az input objektum hiányzik." });
      return { ok: false, errors, warnings };
    }

    // Rendeltetés
    const R_valid = ["R1","R2","R3","R4","R5"];
    if (!R_valid.includes(input.rendeltetes)) {
      errors.push({ mezo: "rendeltetes", uzenet: "Rendeltetés (R1..R5) kötelező." });
    }

    // Magasság
    if (typeof input.magassag_m !== "number" || isNaN(input.magassag_m) || input.magassag_m <= 0) {
      errors.push({ mezo: "magassag_m", uzenet: "Magasság (pozitív szám, méter) kötelező." });
    } else if (input.magassag_m > 500) {
      warnings.push({ mezo: "magassag_m", uzenet: `Magasság (${input.magassag_m} m) szokatlanul nagy — ellenőrizd.` });
    }

    // Környezet
    const ENV_valid = ["csokkento","nincs","fokozo"];
    if (!ENV_valid.includes(input.kornyezet)) {
      errors.push({ mezo: "kornyezet", uzenet: "Becsapási környezet (csökkentő/nincs/fokozó) kötelező." });
    }

    // Tetőszerkezet
    const TS_valid = ["T.a","T.b","T.c"];
    if (!TS_valid.includes(input.teto_szerkezet)) {
      errors.push({ mezo: "teto_szerkezet", uzenet: "Tetőszerkezet (T.a/T.b/T.c) kötelező." });
    }

    // Tetőfedés
    const TF_valid = ["T.I","T.II","T.III","T.IV"];
    if (!TF_valid.includes(input.teto_fedes)) {
      errors.push({ mezo: "teto_fedes", uzenet: "Tetőfedés (T.I..T.IV) kötelező." });
    }

    // Körítőfal
    const K_valid = ["K1","K2","K3"];
    if (!K_valid.includes(input.koritofal)) {
      errors.push({ mezo: "koritofal", uzenet: "Körítőfal (K1/K2/K3) kötelező." });
    }

    // Boolean mezők (default false ha undefined)
    if (typeof input.van_kulso_lps !== "boolean") {
      warnings.push({ mezo: "van_kulso_lps", uzenet: "Külső villámvédelem létezésének megadása ajánlott (default: nincs)." });
    }

    // Konzisztencia: ha rendeltetes R3 és nincs korlátozott robbanás feltételek bejelölve - figyelmeztetés
    if (input.rendeltetes === "R3" && input.korlatozott_robbanas_ervenyes === false) {
      warnings.push({ mezo: "rendeltetes", uzenet: "R3 választva, de a korlátozott robbanásveszély feltételei nincsenek ellenőrizve. Lehet, hogy R4 a helyes." });
    }

    // Konzisztencia: lapos tető + V2 lehetetlen → ezt majd az besoroláskor adunk vissza
    // (a 10.3.1.1. szerint V2 lapostetős vagy bonyolult geometriájú építményre nem alkalmazható)

    return { ok: errors.length === 0, errors, warnings };
  }

  /* ──────────────────────────────────────────────────────────────────
   *  KOMBINÁLT T MEGÁLLAPÍTÁSA (T1..T5)
   *  3. táblázat: tetőszerkezet × tetőfedés
   * ────────────────────────────────────────────────────────────────── */
  function calcTetoCsoport(teto_szerkezet, teto_fedes) {
    const t = TVMI.T.TABLAZAT[teto_szerkezet]?.[teto_fedes];
    if (!t) {
      throw new Error(`Tető-besorolás nem létezik: ${teto_szerkezet} × ${teto_fedes}`);
    }
    return {
      ertek: t,
      indok: `3. táblázat: ${teto_szerkezet} (${TVMI.T.SZERKEZET.find(x=>x.kod===teto_szerkezet)?.leiras?.substring(0,60)}…) × ${teto_fedes} → ${t}`,
      hivatkozas: "TvMI 7.7 10.1.3.3 (3. táblázat)",
    };
  }

  /* ──────────────────────────────────────────────────────────────────
   *  MAGASSÁGI CSOPORT (M1..M4)
   *  2. táblázat
   * ────────────────────────────────────────────────────────────────── */
  function calcMagassagiCsoport(magassag_m, kornyezet) {
    let key;
    if (magassag_m <= 20) key = "<=20";
    else if (magassag_m <= 35) key = "20-35";
    else key = ">35";

    const m = TVMI.M.TABLAZAT[kornyezet]?.[key];
    if (!m) {
      throw new Error(`Magasság-besorolás nem létezik: ${magassag_m} m, környezet=${kornyezet}`);
    }
    const kHumanaz = magassag_m <= 20 ? "≤20 m" : (magassag_m <= 35 ? "20–35 m" : ">35 m");
    const envCimke = TVMI.M.KORNYEZET[kornyezet.toUpperCase()]?.cimke || kornyezet;
    return {
      ertek: m,
      indok: `2. táblázat: magasság ${magassag_m} m (${kHumanaz}) × ${envCimke} → ${m}`,
      hivatkozas: "TvMI 7.7 10.1.2.3 (2. táblázat)",
    };
  }

  /* ──────────────────────────────────────────────────────────────────
   *  FELFOGÓ FOKOZAT (V0..V6) - 4. táblázat
   * ────────────────────────────────────────────────────────────────── */
  function calcFelfogoFokozat(R, M, T_, opts) {
    let v = TVMI.V.TABLAZAT[R]?.[M]?.[T_];
    if (!v) {
      throw new Error(`Felfogó-fokozat nem létezik a táblázatban: ${R}/${M}/${T_}`);
    }

    const megjegyzesek = [];

    // V3* kezelése (4. tbl. lábjegyzet 1.)
    let v_final = v;
    let v_alt = null;
    if (v.endsWith("*")) {
      const v_alap = v.replace("*","");
      const lako_ok = opts.lako_rendeltetes === true;
      const v2_megtartando = opts.meglevo_v2_megtartando === true;
      const v3_kotelezo = opts.atalakitas_v3_kotelez === true; // bővítés/tetőfelújítás

      if (lako_ok && v2_megtartando && !v3_kotelezo) {
        v_final = "V2";
        v_alt = v_alap;
        megjegyzesek.push(`${v} fokozatú felfogórendszer szükséges, de a meglévő V2 megtartható: lakó rendeltetés + nincs tetőfelújítás/átépítés. 4. táblázat 1. lábjegyzet.`);
      } else {
        v_final = v_alap;
        megjegyzesek.push(`${v} = ${v_alap} fokozat. Csillagos érték: csak lakó rendeltetésű épület esetén (10.3.1.1. szerinti tetőgeometria) és tetőátépítés híján maradhat V2; egyéb esetben ${v_alap}.`);
      }
    }

    // V1 → magasabb fokozatú esetén (4. tbl. lábjegyzet 2.) - csak megjegyzés
    if (v_final === "V1") {
      megjegyzesek.push(`V1 természetes felfogó. Helyette csak az építmény R és M csoportjának megfelelő, de a T3–T5 csoportnak megfelelő MAGASABB fokozatú felfogórendszer használható (4. táblázat 2. lábjegyzet).`);
    }

    // V2 alkalmazhatóság ellenőrzése (10.3.1.1: lapos/bonyolult tetőre nem)
    if (v_final === "V2" && opts.lapos_vagy_bonyolult_teto) {
      megjegyzesek.push(`⚠️ FIGYELEM: lapostetős vagy bonyolult tetőgeometriájú építményre V2 NEM alkalmazható (10.3.1.1.). Tervezőnek mérlegelnie kell.`);
    }

    return {
      ertek: v_final,
      eredeti: v,
      alternativa: v_alt,
      indok: `4. táblázat: ${R} × ${M} × ${T_} → ${v}`,
      megjegyzesek,
      hivatkozas: "TvMI 7.7 10.2.2 (4. táblázat)",
    };
  }

  /* ──────────────────────────────────────────────────────────────────
   *  LEVEZETŐ + FÖLDELŐ FOKOZAT (L0..L5, F0..F4) - 5. táblázat
   *  A 5. táblázat sorai a felfogó fokozata szerint differenciálnak:
   *    - "v0"     → ha V=V0
   *    - "v2"     → ha V=V2
   *    - "v3v1"   → ha V=V3 vagy V=V1 (R1 M4 sorban)
   *    - "egyeb"  → fent kivülieknél (V3, V4, stb.)
   *    - "mind"   → minden V
   * ────────────────────────────────────────────────────────────────── */
  function calcLevezetoFoldelo(R, M, V_, K) {
    const rows = TVMI.L.TABLAZAT.filter(r => r.R === R && r.M === M);
    if (rows.length === 0) {
      throw new Error(`5. táblázatban nincs sor: ${R}/${M}`);
    }

    // Megfelelő sor kiválasztása felfogó fokozata szerint
    const V_clean = V_.replace("*","");
    let chosen = null;
    for (const row of rows) {
      if (row.felfogoFeltetel === "mind") { chosen = row; break; }
      if (row.felfogoFeltetel === "v0" && V_clean === "V0") { chosen = row; break; }
      if (row.felfogoFeltetel === "v2" && V_clean === "V2") { chosen = row; break; }
      if (row.felfogoFeltetel === "v3v1" && (V_clean === "V3" || V_clean === "V1")) { chosen = row; break; }
    }
    // Ha nincs specifikus → "egyeb"
    if (!chosen) {
      chosen = rows.find(r => r.felfogoFeltetel === "egyeb");
    }
    if (!chosen) {
      throw new Error(`Nincs megfelelő L/F sor: ${R}/${M}, V=${V_}`);
    }

    const L = chosen.K[K];
    const F = chosen.F;
    const megjegyzesek = [];
    if (L === null) {
      megjegyzesek.push(`⚠️ ${chosen.felfogoFeltetel} sorban ${K}-hoz nincs L érték (nincs alkalmazható kombináció). Egy másik felfogó-fokozatot kell választani.`);
    }
    if (L === "L1" && K !== "K2") {
      megjegyzesek.push(`L1 természetes levezetőként alkalmazható: K2 jellegű körítőfal esetén közvetlenül. Az adott K=${K} esetén ez gyakran nem teljesül — mesterséges levezetőt kell létesíteni.`);
    }

    return {
      L: { ertek: L, indok: `5. táblázat (${chosen.felfogoFeltetel} sor): ${R}/${M}/${K} → ${L}` },
      F: { ertek: F, indok: `5. táblázat: ${R}/${M} → ${F}` },
      megjegyzesek,
      hivatkozas: "TvMI 7.7 10.2.3 (5. táblázat)",
    };
  }

  /* ──────────────────────────────────────────────────────────────────
   *  MÁSODLAGOS HATÁS (B + e) - 6. táblázat
   * ────────────────────────────────────────────────────────────────── */
  function calcMasodlagos(R, van_kulso_lps) {
    if (R === "R1") {
      const key = van_kulso_lps ? "R1_van_kulso" : "R1_nincs_kulso";
      const entry = TVMI.B.TABLAZAT[key];
      return {
        ertek: entry.B,
        indok: `6. táblázat: ${R}, külső villámvédelem ${van_kulso_lps ? "VAN" : "NINCS"} → ${entry.B}`,
        megjegyzes: entry.megjegyzes,
        hivatkozas: "TvMI 7.7 10.2.4 (6. táblázat)",
      };
    }
    const entry = TVMI.B.TABLAZAT[R];
    return {
      ertek: entry.B,
      indok: `6. táblázat: ${R} → ${entry.B}`,
      megjegyzes: entry.megjegyzes,
      hivatkozas: "TvMI 7.7 10.2.4 (6. táblázat)",
    };
  }

  /* ──────────────────────────────────────────────────────────────────
   *  FŐ BESOROLÓ FÜGGVÉNY
   *  Input → {R, M, T, K, V, L, F, B, indoklás[]}
   * ────────────────────────────────────────────────────────────────── */
  function besorol(input) {
    // 1. Input gate
    const v = validateInput(input);
    if (!v.ok) {
      return {
        ok: false,
        errors: v.errors,
        warnings: v.warnings,
        message: "Input gate FAIL — hiányzó/hibás mezők.",
      };
    }

    try {
      // 2. R (direkt)
      const R = input.rendeltetes;
      const R_data = TVMI.R.find(x => x.kod === R);

      // 3. M
      const M = calcMagassagiCsoport(input.magassag_m, input.kornyezet);

      // 4. T
      const T_ = calcTetoCsoport(input.teto_szerkezet, input.teto_fedes);

      // 5. K
      const K = input.koritofal;

      // 6. V (felfogó)
      const V = calcFelfogoFokozat(R, M.ertek, T_.ertek, {
        lako_rendeltetes: !!input.lako_rendeltetes,
        meglevo_v2_megtartando: !!input.meglevo_v2_megtartando,
        atalakitas_v3_kotelez: !!input.atalakitas_v3_kotelez,
        lapos_vagy_bonyolult_teto: !!input.lapos_vagy_bonyolult_teto,
      });

      // 7. L + F
      const LF = calcLevezetoFoldelo(R, M.ertek, V.ertek, K);

      // 8. B
      const B = calcMasodlagos(R, !!input.van_kulso_lps);

      // 9. Kombinált fokozat-jel (TvMI 10.2.1.)
      const fokozat_string = `${V.ertek}-${LF.L.ertek || "?"}-${LF.F.ertek}-${B.ertek}`;

      // 10. Output gate
      const outputCheck = {
        teljes: V.ertek && LF.L.ertek && LF.F.ertek && B.ertek,
        hianyzo: [],
      };
      if (!V.ertek) outputCheck.hianyzo.push("V");
      if (!LF.L.ertek) outputCheck.hianyzo.push("L");
      if (!LF.F.ertek) outputCheck.hianyzo.push("F");
      if (!B.ertek) outputCheck.hianyzo.push("B");

      return {
        ok: true,
        // Csoport-besorolások
        R: { ertek: R, leiras: R_data?.rovid, forras: R_data?.forras },
        M: M,
        T: T_,
        K: { ertek: K, leiras: TVMI.K.find(x=>x.kod===K)?.leiras?.substring(0,80) + "…" },
        // Fokozatok
        V: V,
        L: LF.L,
        F: LF.F,
        B: B,
        // Összefoglaló
        fokozat_string,
        // Diagnosztika
        warnings: v.warnings.concat(V.megjegyzesek.map(m => ({mezo:"V", uzenet:m}))).concat(LF.megjegyzesek.map(m=>({mezo:"L/F", uzenet:m}))),
        outputCheck,
        // Meta
        tvmi: TVMI.META,
        idopont: new Date().toISOString(),
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ mezo: "calc", uzenet: e.message }],
        warnings: v.warnings,
        message: "Számítási hiba.",
      };
    }
  }

  /* ──────────────────────────────────────────────────────────────────
   *  PUBLIC API
   * ────────────────────────────────────────────────────────────────── */
  window.TVMI_LOGIC = Object.freeze({
    besorol,
    validateInput,
    calcTetoCsoport,
    calcMagassagiCsoport,
    calcFelfogoFokozat,
    calcLevezetoFoldelo,
    calcMasodlagos,
  });
})();
