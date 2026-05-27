/**
 * TvMI 7.7:2026.02.01. - Nem norma szerinti villámvédelem besoroló adatbázis
 *
 * FORRÁS: BM OKF Tűzvédelmi Műszaki Irányelv TvMI 7.7:2026.02.01.
 * 10. fejezet: A nem norma szerinti villámvédelem egységesített létesítési feltételrendszere
 *
 * Hatályos: 2026.02.01-től
 * Letöltés: https://www.katasztrofavedelem.hu/application/uploads/documents/2025-12/86701.pdf
 *
 * MINDEN táblázat-bejegyzés a TvMI eredeti szövegéből származik. SEMMI nem feltételezés.
 */

/* ──────────────────────────────────────────────────────────────────────────
 *  TvMI METADATA
 * ────────────────────────────────────────────────────────────────────────── */
const TVMI_META = Object.freeze({
  jel: "TvMI 7.7:2026.02.01.",
  cim: "Villamos berendezések, villámvédelem és elektrosztatikus feltöltődés elleni védelem",
  hatalyos: "2026-02-01",
  kibocsato: "BM Országos Katasztrófavédelmi Főigazgatóság",
  url: "https://www.katasztrofavedelem.hu/application/uploads/documents/2025-12/86701.pdf",
  elozo: "TvMI 7.6:2024.02.01.",
  fejezet: "10. A nem norma szerinti villámvédelem egységesített létesítési feltételrendszere",
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.1.1.  RENDELTETÉS SZERINTI CSOPORT (R1..R5)
 *  TvMI 7.7 10. fejezet 1. táblázat
 * ────────────────────────────────────────────────────────────────────────── */
const R_RENDELTETES = Object.freeze([
  {
    kod: "R1",
    rovid: "Általános építmény",
    leiras: "R2..R5 csoportba nem tartozó építmény (ideértve a gyárkéményt, fémtartályt).",
    pelda: "Egylakásos családi ház, kis raktár, gazdasági épület, normál iroda ≤500 fő, fémtartály általában.",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R1 sor",
  },
  {
    kod: "R2",
    rovid: "Közösségi / kulturális / tömegtartózkodás",
    leiras: "R3..R5 csoportba nem tartozó: közösségi épület tűzszakaszonként >500 fő; tömegtartózkodásra szolgáló építmény; talajszint feletti nagy forgalmú épület; földfeletti közműépítmény; tudományos, történelmi és művészeti értékű épület (szobor, emlékmű is).",
    pelda: "Színház, mozi, koncertterem, sportcsarnok >500 fő, plázák, közmű alállomások, múzeum, műemlékvédett épület.",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R2 sor",
  },
  {
    kod: "R3",
    rovid: "Korlátozott robbanásveszély / mérsékelt tűzveszély",
    leiras: "A 9.6. szerinti „Korlátozott mértékű robbanásveszéllyel” rendelkező épületek, valamint olyan ipari vagy tárolási rendeltetésű épületek, amelyekben „mérsékelten tűzveszélyes” tűzveszélyességi osztályú anyagokat állítanak elő, dolgoznak fel, használnak, tárolnak.",
    pelda: "Asztalosműhely, papírraktár, festőműhely (korlátozott Ex2/Ex22 zónával), kis akkumulátortöltő helyiség.",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R3 sor",
  },
  {
    kod: "R4",
    rovid: "Fokozottan tűz- és robbanásveszélyes",
    leiras: "Rendeltetésüket tekintve „fokozottan tűz- és robbanásveszélyes” tűzveszélyességi osztályba tartozó anyagok előállítására, feldolgozására, használatára, tárolására szolgáló építmények, és olyan, robbanásveszélyes térrészeket tartalmazó építmények, amelyek nem tartoznak az R3 csoportba.",
    pelda: "Üzemanyagtöltő állomás, oldószerraktár, lakkozó, vegyipari technológia (Ex1 zóna jelentős kiterjedéssel).",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R4 sor",
  },
  {
    kod: "R5",
    rovid: "Katasztrófával fenyegető",
    leiras: "Katasztrófával fenyegető építmény, amely robbanás, vagy a környezetbe kijutó veszélyes anyagok révén, villámcsapás esetén a vonatkozó jogszabály szerinti katasztrófahelyzetet idézhet elő.",
    pelda: "Veszélyes üzem SEVESO II/III. szerint, nagykiterjedésű vegyipari telephely, atomerőmű építményei.",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R5 sor",
  },
]);

/* ──────────────────────────────────────────────────────────────────────────
 *  10.1.2.  MAGASSÁG SZERINTI CSOPORT (M1..M4)
 *  TvMI 7.7 10. fejezet 2. táblázat + 10.1.2.1 - 10.1.2.2 körülmények
 * ────────────────────────────────────────────────────────────────────────── */
const KORNYEZET_HATAS = Object.freeze({
  CSOKKENTO: {
    kod: "csokkento",
    cimke: "Becsapási veszélyt csökkentő környezet",
    feltetel: "20 m-es körzetben, legalább két ellenkező oldalról olyan épületek/építmények/tárgyak veszik közre az építményt, amelyek magassága legfeljebb 2 m-rel kisebb, VAGY a terepszint e távolságon belül az építmény legmagasabb pontjával azonos szintre emelkedik.",
    forras: "TvMI 7.7 10.1.2.1",
  },
  NINCS: {
    kod: "nincs",
    cimke: "Nincs különleges környezeti hatás",
    feltetel: "Sem csökkentő, sem fokozó környezet feltételei nem teljesülnek.",
    forras: "TvMI 7.7 10.1.2.3",
  },
  FOKOZO: {
    kod: "fokozo",
    cimke: "Becsapási veszélyt fokozó környezet",
    feltetel: "Az építmény hegytetőn / hegygerincen önmagában áll, VAGY sík területen 100 m-es körzeten belül magában áll és magassága meghaladja a 10 métert.",
    forras: "TvMI 7.7 10.1.2.2",
  },
});

// 2. táblázat: magasság (M) × környezet → M1..M4
//   sorrendben: ≤20 m, 20-35 m, >35 m
//   oszlopok: csokkento, nincs, fokozo
const M_TABLAZAT = Object.freeze({
  csokkento: { "<=20": "M1", "20-35": "M2", ">35": "M3" },
  nincs:     { "<=20": "M2", "20-35": "M3", ">35": "M4" },
  fokozo:    { "<=20": "M3", "20-35": "M4", ">35": "M4" },
});

const M_LEIRAS = Object.freeze({
  M1: "Alacsony becsapási kockázat",
  M2: "Normál becsapási kockázat",
  M3: "Emelt becsapási kockázat",
  M4: "Kiemelt becsapási kockázat",
});

// Magasság-szétbontási szabály (10.1.2 bevezető 5 m-es szabály)
const MAGASSAG_BONTAS_SZABALY = "Magasság szerinti besoroláskor külön épületnek lehet tekinteni azokat az egy épülethez tartozó részeket, amelyeknek magassága legalább 5 m-rel különbözik egymástól. Műtárgyakra ez nem alkalmazható. A rendeltetés szerinti besoroláskor azonban egy épületnek kell tekinteni. Tetőn lévő gépészet/kémény/antenna esetén a tetőfelület magassága a mértékadó.";

/* ──────────────────────────────────────────────────────────────────────────
 *  10.1.3.  TETŐ ANYAGA ÉS SZERKEZETE (T1..T5)
 *  TvMI 7.7 10.1.3.1, 10.1.3.2, 10.1.3.3 (3. táblázat)
 * ────────────────────────────────────────────────────────────────────────── */

// Tetőfödém / tetőszerkezet (10.1.3.1)
const TETOSZERKEZET = Object.freeze([
  {
    kod: "T.a",
    leiras: "„A1” és „A2” vagy „B” és „C” tűzvédelmi osztályba tartozó anyag, fém alkatrészek nélkül.",
    forras: "TvMI 7.7 10.1.3.1 a",
  },
  {
    kod: "T.b",
    leiras: "Bármilyen anyag fém alkatrészekkel, kivéve a tetőfelület alatt 50 cm-nél nagyobb távolságra levő, „A1” besorolású anyagba ágyazott fémszerkezetet (különösen betonvasat).",
    forras: "TvMI 7.7 10.1.3.1 b",
  },
  {
    kod: "T.c",
    leiras: "Egyéb anyag, fém alkatrészek nélkül.",
    forras: "TvMI 7.7 10.1.3.1 c",
  },
]);

// Tetőfelület / tetőfedés (10.1.3.2)
const TETOFEDES = Object.freeze([
  {
    kod: "T.I",
    leiras: "„A1” és „A2” anyag, vagy legalább „Broof (t1)” anyag fém alkatrészek nélkül. Vagy fémlemezzel borított A1/A2/Broof(t1) éghető anyag, ha a fémlemez: <0,5 mm; VAGY <1,0 mm és olvadáspont <800°C; VAGY <3,0 mm és olvadáspont <500°C.",
    forras: "TvMI 7.7 10.1.3.2 T.I",
  },
  {
    kod: "T.II",
    leiras: "Fém egyedül; VAGY fém A1/A2 anyaggal vagy legfeljebb Broof(t1) anyaggal; VAGY fémlemezzel borított C/D/E/F minősítésű anyag, ha a fémlemez: ≥0,5 mm és olvadáspont ≥800°C; VAGY ≥1,0 mm és olvadáspont ≥500°C; VAGY ≥3,0 mm és olvadáspont <500°C.",
    forras: "TvMI 7.7 10.1.3.2 T.II",
  },
  {
    kod: "T.III",
    leiras: "„C”, „D”, „E” és „F” tűzvédelmi osztályba tartozó, 400 °C-nál alacsonyabb gyulladási hőmérsékletű anyag fém alkatrészek nélkül.",
    forras: "TvMI 7.7 10.1.3.2 T.III",
  },
  {
    kod: "T.IV",
    leiras: "„C”, „D”, „E”, „F” osztályba tartozó, 400°C alatti gyulladási hőmérsékletű anyag fém alkatrészekkel, amelyek nem alkotnak zárt burkolatot; VAGY ilyen anyag fémlemezzel borítva, de a fémlemez NEM felel meg a T.II követelményeinek (pl. cinklemez attika alatt éghető réteg).",
    forras: "TvMI 7.7 10.1.3.2 T.IV",
  },
]);

// 3. táblázat: tetőszerkezet × tetőfedés → T1..T5 (10.1.3.3)
const T_TABLAZAT = Object.freeze({
  "T.a": { "T.I": "T1", "T.II": "T2", "T.III": "T4", "T.IV": "T5" },
  "T.b": { "T.I": "T2", "T.II": "T2", "T.III": "T5", "T.IV": "T5" },
  "T.c": { "T.I": "T3", "T.II": "T2", "T.III": "T4", "T.IV": "T5" },
});

const T_LEIRAS = Object.freeze({
  T1: "Teljesen nem éghető tető",
  T2: "Nem éghető tető fémmel",
  T3: "Speciális nem éghető tető fém alkatrész nélkül",
  T4: "Éghető tető (alacsonyabb veszély)",
  T5: "Éghető tető (legmagasabb veszély)",
});

// Fémtartály-specifikus besorolás (10.1.3.4)
const FEMTARTALY_BESOROLAS = Object.freeze({
  T2_feltetel: "R1 csoportú tartály; VAGY R3-R5 csoportú fémtartály, ha teteje legalább 10 mm vastag, 500°C feletti olvadáspontú VAGY legalább 5 mm vastag, 800°C feletti olvadáspontú fémlemezből készült, és nem alakul ki fölötte robbanóképes légtér.",
  T4_feltetel: "Olyan fémtartályok, amelyek tetejének vastagsága és anyaga nem elégíti ki a T2 feltételeket.",
  T5_feltetel: "Olyan fémtartályok, amelyek felett robbanóképes légtér kialakulásával kell számolni.",
  forras: "TvMI 7.7 10.1.3.4",
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.1.4.  KÖRÍTŐFALAK SZERINTI CSOPORT (K1..K3)
 * ────────────────────────────────────────────────────────────────────────── */
const K_KORITOFAL = Object.freeze([
  {
    kod: "K1",
    leiras: "„A1” és „A2” tűzvédelmi osztályba tartozó anyagokból készült falszerkezet.",
    pelda: "Tégla, vasbeton, mészhomok, gázbeton falazat fémfegyverzet nélkül.",
    forras: "TvMI 7.7 10.1.4 K1",
  },
  {
    kod: "K2",
    leiras: "Az a függőlegesen összefüggő, villamosan vezetőképesen összekötött: legalább 50 mm² keresztmetszetű fémszerkezetet tartalmazó falszerkezet; VAGY legalább 0,5 mm vastag fémlemezzel burkolt körítőfal; VAGY fémtartály legalább 0,5 mm vastag fémlemez oldalfala; VAGY olyan fal, amelyben a magasságuknál kisebb távolságban függőleges acéloszlopok, pillérek vagy összefüggő acélbetéttel ellátott betonpillérek futnak végig, és ezek legalább fölül fémesen össze vannak kötve egymással.",
    pelda: "Acélvázas csarnok trapézlemez borítással, fémtartály oldalfala, vasbeton vázas épület összekötött pillérekkel.",
    forras: "TvMI 7.7 10.1.4 K2",
  },
  {
    kod: "K3",
    leiras: "Nem K1, vagy K2 csoportba tartozó fal.",
    pelda: "Faszerkezetű épület, könnyűszerkezetes sandwich panel fém fegyverzet nélkül, panelos rendszer hézagos kötéssel.",
    forras: "TvMI 7.7 10.1.4 K3",
  },
]);

/* ──────────────────────────────────────────────────────────────────────────
 *  10.2.2.  4. TÁBLÁZAT - FELFOGÓ FOKOZATA (V0..V6)
 *  R × M × T → V
 *
 *  Megjegyzés a táblázathoz (4. tbl. lábjegyzet):
 *   * V3* = „V3 fokozatú felfogórendszer kialakítása szükséges, de a meglévő, V2 fokozatú
 *     felfogórendszer is megtartható, amennyiben az építmény lakó rendeltetésű és a 10.3.1.1.
 *     pontnak megfelel, VAGY a villámvédelmi felfogórendszer átalakítása nem szükséges."
 *   * „V1” fokozatú felfogórendszer helyett csak az építmény R és M csoportjának megfelelő,
 *     de csak a T3–T5 csoportnak megfelelő, magasabb fokozatú felfogórendszer használható.
 * ────────────────────────────────────────────────────────────────────────── */
const FELFOGO_TABLAZAT = Object.freeze({
  R1: {
    M1: { T1: "V0", T2: "V0", T3: "V0", T4: "V0", T5: "V0" },
    M2: { T1: "V0", T2: "V1", T3: "V0", T4: "V0", T5: "V3*" },
    M3: { T1: "V3*", T2: "V1", T3: "V3*", T4: "V3*", T5: "V3*" },
    M4: { T1: "V3", T2: "V1", T3: "V3", T4: "V3", T5: "V3" },
  },
  R2: {
    M1: { T1: "V0", T2: "V1", T3: "V0", T4: "V3*", T5: "V3*" },
    M2: { T1: "V3*", T2: "V1", T3: "V3*", T4: "V3*", T5: "V3" },
    M3: { T1: "V3", T2: "V1", T3: "V3", T4: "V3", T5: "V3" },
    M4: { T1: "V3", T2: "V1", T3: "V3", T4: "V3", T5: "V3" },
  },
  R3: {
    M1: { T1: "V3", T2: "V1", T3: "V3", T4: "V3", T5: "V3" },
    M2: { T1: "V3", T2: "V1", T3: "V3", T4: "V3", T5: "V4" },
    M3: { T1: "V3", T2: "V1", T3: "V4", T4: "V4", T5: "V4" },
    M4: { T1: "V4", T2: "V1", T3: "V4", T4: "V4", T5: "V4" },
  },
  R4: {
    M1: { T1: "V4", T2: "V1", T3: "V4", T4: "V4", T5: "V4" },
    M2: { T1: "V4", T2: "V1", T3: "V4", T4: "V5", T5: "V5" },
    M3: { T1: "V5", T2: "V1", T3: "V5", T4: "V5", T5: "V5" },
    M4: { T1: "V5", T2: "V1", T3: "V5", T4: "V5", T5: "V6" },
  },
  R5: {
    M1: { T1: "V4", T2: "V1", T3: "V4", T4: "V5", T5: "V5" },
    M2: { T1: "V4", T2: "V1", T3: "V5", T4: "V5", T5: "V6" },
    M3: { T1: "V5", T2: "V1", T3: "V5", T4: "V6", T5: "V6" },
    M4: { T1: "V5", T2: "V1", T3: "V5", T4: "V6", T5: "V6" },
  },
});

const V_LEIRAS = Object.freeze({
  V0: { szint: "Nincs villámvédelem", reszletek: "Sem természetes, sem mesterséges felfogórendszer nincs." },
  V1: { szint: "Természetes felfogó", reszletek: "Természetes felfogók rendszere: fémből készült tető, vagy a tetőfödém/tetőszerkezet fém alkatrészeinek/tetőfelületen lévő egyéb fémrészeknek olyan összekötött rendszere, amelytől a tető egyik pontja sincs 5 m-nél távolabb." },
  V2: { szint: "Egyszerűsített", reszletek: "Egyetlen felfogórúd legalább 2 m magas a 20°-nál meredekebb sátortetőn; vagy egyetlen felfogóvezető a 20°-nál meredekebb tető legmagasabb gerincén. Lapostetős vagy bonyolult tetőgeometriájú építményre NEM alkalmazható." },
  V3: { szint: "Normál", reszletek: "Felfogórudak/felfogóvezetők/természetes felfogók olyan rendszere, amely kielégíti: R=100 m gördülő gömb; vagy d=20 m átmérőjű körlap; vagy ≤40 m magasságban védőszög α=45°. Védőszöges szerkesztés >40 m esetén NEM alkalmazható." },
  V4: { szint: "Biztonsági", reszletek: "Felfogórendszer R=80 m gördülő gömb / d=15 m körlap / α=30° védőszög paraméterekkel." },
  V5: { szint: "Növelt biztonságú", reszletek: "R=45 m. KIZÁRÓLAG gördülő gömbös szerkesztés alkalmazható." },
  V6: { szint: "Különleges biztonságú", reszletek: "R=20 m. KIZÁRÓLAG gördülő gömbös szerkesztés alkalmazható." },
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.2.3.  5. TÁBLÁZAT - LEVEZETŐ ÉS FÖLDELŐ FOKOZATA (L0..L5, F0..F4)
 *  R × M × Felfogó kialakítás × K → {L, F}
 *
 *  Lekódolva soronként a TvMI 5. táblázatából, pontos szöveggel.
 * ────────────────────────────────────────────────────────────────────────── */
const LEVEZETO_FOLDELO_TABLAZAT = Object.freeze([
  // ─── R1 ───
  { R: "R1", M: "M1", felfogoFeltetel: "v0", K: { K1: "L0", K2: "L0", K3: "L0" }, F: "F0" },
  { R: "R1", M: "M2", felfogoFeltetel: "v0", K: { K1: "L0", K2: "L0", K3: "L0" }, F: "F0" },
  { R: "R1", M: "M2", felfogoFeltetel: "v2", K: { K1: "L2", K2: null, K3: "L2" }, F: "F2/r" },
  { R: "R1", M: "M2", felfogoFeltetel: "egyeb", K: { K1: "L3", K2: "L1", K3: "L3" }, F: "F3/r" },
  { R: "R1", M: "M3", felfogoFeltetel: "v2", K: { K1: "L2", K2: null, K3: "L2" }, F: "F2/r" },
  { R: "R1", M: "M3", felfogoFeltetel: "egyeb", K: { K1: "L3", K2: "L1", K3: "L3" }, F: "F3/r" },
  { R: "R1", M: "M4", felfogoFeltetel: "v3v1", K: { K1: "L4", K2: "L1", K3: "L4" }, F: "F3/r" },
  // ─── R2 ───
  { R: "R2", M: "M1", felfogoFeltetel: "v0", K: { K1: "L0", K2: "L0", K3: "L0" }, F: "F0" },
  { R: "R2", M: "M1", felfogoFeltetel: "v2", K: { K1: "L2", K2: null, K3: "L2" }, F: "F2/r" },
  { R: "R2", M: "M1", felfogoFeltetel: "egyeb", K: { K1: "L3", K2: "L1", K3: "L3" }, F: "F3/r" },
  { R: "R2", M: "M2", felfogoFeltetel: "v2", K: { K1: "L2", K2: null, K3: "L2" }, F: "F2/r" },
  { R: "R2", M: "M2", felfogoFeltetel: "egyeb", K: { K1: "L3", K2: "L1", K3: "L3" }, F: "F3/r" },
  { R: "R2", M: "M3", felfogoFeltetel: "mind", K: { K1: "L4", K2: "L1", K3: "L4" }, F: "F3/r" },
  { R: "R2", M: "M4", felfogoFeltetel: "mind", K: { K1: "L5", K2: "L1", K3: "L5" }, F: "F3/r" },
  // ─── R3 ───
  { R: "R3", M: "M1", felfogoFeltetel: "mind", K: { K1: "L3", K2: "L1", K3: "L3" }, F: "F3/r" },
  { R: "R3", M: "M2", felfogoFeltetel: "mind", K: { K1: "L3", K2: "L1", K3: "L4" }, F: "F3/r" },
  { R: "R3", M: "M3", felfogoFeltetel: "mind", K: { K1: "L4", K2: "L1", K3: "L5" }, F: "F4/r" },
  { R: "R3", M: "M4", felfogoFeltetel: "mind", K: { K1: "L5", K2: "L1", K3: "L5" }, F: "F4/r" },
  // ─── R4 ───
  { R: "R4", M: "M1", felfogoFeltetel: "mind", K: { K1: "L4", K2: "L1", K3: "L4" }, F: "F4/r" },
  { R: "R4", M: "M2", felfogoFeltetel: "mind", K: { K1: "L4", K2: "L1", K3: "L4" }, F: "F4/r" },
  { R: "R4", M: "M3", felfogoFeltetel: "mind", K: { K1: "L5", K2: "L1", K3: "L5" }, F: "F4/r" },
  { R: "R4", M: "M4", felfogoFeltetel: "mind", K: { K1: "L5", K2: "L1", K3: "L5" }, F: "F4/r" },
  // ─── R5 ───
  { R: "R5", M: "M1", felfogoFeltetel: "mind", K: { K1: "L4", K2: "L1", K3: "L4" }, F: "F4/r" },
  { R: "R5", M: "M2", felfogoFeltetel: "mind", K: { K1: "L4", K2: "L1", K3: "L4" }, F: "F4/r" },
  { R: "R5", M: "M3", felfogoFeltetel: "mind", K: { K1: "L5", K2: "L1", K3: "L5" }, F: "F4/r" },
  { R: "R5", M: "M4", felfogoFeltetel: "mind", K: { K1: "L5", K2: "L1", K3: "L5" }, F: "F4/r" },
]);

const L_LEIRAS = Object.freeze({
  L0: { szint: "Nincs levezető", reszletek: "Sem természetes, sem mesterséges levezető nincs. Csak V0 felfogóval kombinálható." },
  L1: { szint: "Természetes levezető", reszletek: "Csak természetes levezető: fémből készült/fémmel burkolt fal; összefüggő fémszerkezet; vasbeton acélbetétje. Csak K2 körítőfal esetén alkalmazható ÖNMAGÁBAN." },
  L2: { szint: "Egyetlen levezető", reszletek: "Egyetlen levezető olyan helyen, hogy a felfogó bármely pontjától a levezetőig vezetőment vízszintes vetülete ≤ 20 m." },
  L3: { szint: "Legalább kettő, 15 m", reszletek: "Legalább két levezető úgy, hogy a felfogó bármely pontjától a legközelebbi levezetőig a vezető menti vízszintes vetület (vagy eredő) ≤ 15 m." },
  L4: { szint: "Legalább kettő, 10 m", reszletek: "Legalább két levezető úgy, hogy az áramút vízszintes vetülete (vagy eredő) ≤ 10 m." },
  L5: { szint: "Legalább kettő, 10 m + felső + közbenső összekötés", reszletek: "L4 kialakítás + minden levezető felül vízszintesen összekötött 2 m-en belül + 20 m-nél hosszabb levezetőkön közbenső vízszintes összekötés (max 20 m-enként)." },
});

const F_LEIRAS = Object.freeze({
  F0: { szint: "Nincs földelő", reszletek: "Sem természetes, sem mesterséges földelő nincs." },
  F2: { szint: "Egyetlen földelő", reszletek: "Egyetlen földelő. „F2/r” = földelési ellenállás követelménnyel: R ≤ 10 Ω VAGY R ≤ 6·ρ/√A Ω (egyedi földelő)." },
  F3: { szint: "Legalább két földelő", reszletek: "Legalább két földelő, lehetnek különállóak vagy csoportosan összekötöttek. „F3/r” földelési ellenállás követelménnyel: R ≤ 10 Ω VAGY R ≤ 3·ρ/√A Ω (eredő)." },
  F4: { szint: "Földelőrendszer", reszletek: "Földelőrendszer: gyűrűsföldelő, keretföldelő, földelőháló vagy építmények betonalapföldelése (szükség esetén egyedi földelőkkel kiegészítve). Eredő: R ≤ 10 Ω VAGY R ≤ 3·ρ/√A Ω." },
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.2.4.  6. TÁBLÁZAT - VILLÁMVÉDELMI POTENCIÁLKIEGYENLÍTÉS ÉS
 *                          KOORDINÁLT TÚLFESZÜLTSÉG-VÉDELEM (B0..B4 + e)
 * ────────────────────────────────────────────────────────────────────────── */
const MASODLAGOS_TABLAZAT = Object.freeze({
  R1_nincs_kulso: { B: "B0*", megjegyzes: "MSZ HD 60364-4-443 és MSZ HD 60364-5-534 ebben az esetben is írhat elő potenciálkiegyenlítési intézkedéseket." },
  R1_van_kulso:   { B: "B2",  megjegyzes: "Külső villámvédelemmel rendelkező R1 építmény." },
  R2:             { B: "B2e", megjegyzes: "Közösségi, kulturális építmény: potenciálkiegyenlítés + koordinált túlfeszültség-védelem." },
  R3:             { B: "B3e", megjegyzes: "Korlátozott robbanásveszély vagy mérsékelt tűzveszély." },
  R4:             { B: "B4e", megjegyzes: "Fokozottan tűz- és robbanásveszélyes." },
  R5:             { B: "B4e", megjegyzes: "Katasztrófával fenyegető." },
});

const B_LEIRAS = Object.freeze({
  "B0":  "Nem szükséges a csatlakozóvezetékek villámvédelmi potenciálkiegyenlítése.",
  "B0*": "Nem szükséges villámvédelmi potenciálkiegyenlítés, DE az MSZ HD 60364-4-443 és -5-534 előírhat más címen.",
  "B2":  "Fémes csatlakozóvezetékek közvetlen földelése. Nem földelhetők esetén T1/D típusú túlfeszültség-védelem LPL III-IV szintre = 100 kA (energiaátviteli: 12,5 kA/pólus).",
  "B3":  "Mint B2, de méretezés LPL II szintre = 150 kA (energiaátviteli: 17,5 kA/pólus).",
  "B4":  "Mint B2, de méretezés LPL I szintre = 200 kA (energiaátviteli: 25 kA/pólus).",
  "e":   "A villamos rendszer átalakításának, bővítésének körében koordinált túlfeszültség-védelem kialakítása szükséges (1+2 típus betáplálásnál, 2-es típus alelosztókban, 3-as típus tűzvédelmi funkciójú jelző/vezérlő áramkörnél).",
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.4. FELÜLVIZSGÁLAT
 * ────────────────────────────────────────────────────────────────────────── */
const FELULVIZSGALAT = Object.freeze({
  szabaly: "Az időszakos, valamint az átépítést, bővítést követő felülvizsgálatot az OTSZ és a „Ellenőrzés, felülvizsgálat és karbantartás” TvMI előírásai szerint kell elvégezni, dokumentálni.",
  forras: "TvMI 7.7 10.4.1",
});

/* ──────────────────────────────────────────────────────────────────────────
 *  9.1.5 - 9.1.7  ÚJ KOCKÁZATKEZELÉS VAGY ÚJ BESOROLÁS SZÜKSÉGES, HA…
 * ────────────────────────────────────────────────────────────────────────── */
const UJ_KOCKAZATKEZELES_FELTETELEK = Object.freeze([
  { id: "rendeltetes",   leiras: "Az építmény vagy önálló építményrész rendeltetésének változásakor.", forras: "9.1.7 a" },
  { id: "kockazat",      leiras: "Az építmény mértékadó kockázati osztályának változásakor.", forras: "9.1.7 b" },
  { id: "teto_eghet",    leiras: "A tető éghetőségének változásakor (szigorúbb irányba).", forras: "9.1.7 c" },
  { id: "magassag_20pct",leiras: "Az építmény magasságának ≥20%-os változásakor.", forras: "9.1.7 d/da" },
  { id: "magassag_15m",  leiras: "Az építmény magassága eléri a 15 m-t (változással).", forras: "9.1.7 d/db" },
  { id: "robbanas_uj",   leiras: "Eredetileg nem robbanásveszélyes építményben olyan átalakítás történik, amelynek révén robbanásveszélyes térrészek alakulnak ki, és a robbanásveszély jelentős mértékben növeli a kockázatot.", forras: "9.1.7 e" },
]);

/* ──────────────────────────────────────────────────────────────────────────
 *  9.6.1.1  KORLÁTOZOTT MÉRTÉKŰ ROBBANÁSVESZÉLY FELTÉTELEI
 * ────────────────────────────────────────────────────────────────────────── */
const KORLATOZOTT_ROBBANAS_FELTETELEK = Object.freeze([
  { id: "teto_zona",  leiras: "A tető feletti szabad légtérben CSAK Ex 1, Ex 2, Ex 21, Ex 22 zóna van.", forras: "9.6.1.1 -1" },
  { id: "homlokzat_zona", leiras: "A homlokzaton CSAK Ex 1, Ex 2, Ex 21, Ex 22 zóna van.", forras: "9.6.1.1 -2" },
  { id: "teto_ex2",   leiras: "A tetőn és a homlokzat felső 20%-án (≥6 m függőlegesen) megjelenő Ex 2, Ex 22 zóna összesített vetülete ≤ a tető vetületének 20%-a.", forras: "9.6.1.1 -3" },
  { id: "helyiseg_20pct", leiras: "A robbanásveszélyes helyiségek (Robbanás elleni védelem TvMI 6.3.1 szerint) összesített alapterülete ≤ az épület nettó alapterületének 20%-a.", forras: "9.6.1.1 -4" },
  { id: "alatti_ex",  leiras: "Az épület alatti (felszín feletti) Ex 2, Ex 22 zónák összesített vetülete ≤ az épület függőleges vetületi alapterületének 20%-a.", forras: "9.6.1.1 -5" },
]);

const KORLATOZOTT_ROBBANAS_KOVETKEZMENY = "Ha minden feltétel teljesül: a 9.6.2 és 9.6.3 alkalmazható. Az épület kockázatkezeléssel megállapított LPS fokozata legalább LPS IV, az LPS kialakítás teljesíti a 9.6.3.2-t. EBBEN AZ ESETBEN AZ R3 BESOROLÁS ALKALMAZHATÓ. Ha bármely feltétel NEM teljesül → R4/R5 besorolás vagy norma szerinti villámvédelem.";

/* ──────────────────────────────────────────────────────────────────────────
 *  EXPORT: minden a window objektumon keresztül érhető el (no module bundler)
 * ────────────────────────────────────────────────────────────────────────── */
window.TVMI = Object.freeze({
  META: TVMI_META,
  R: R_RENDELTETES,
  M: { TABLAZAT: M_TABLAZAT, LEIRAS: M_LEIRAS, KORNYEZET: KORNYEZET_HATAS, BONTAS: MAGASSAG_BONTAS_SZABALY },
  T: { SZERKEZET: TETOSZERKEZET, FEDES: TETOFEDES, TABLAZAT: T_TABLAZAT, LEIRAS: T_LEIRAS, FEMTARTALY: FEMTARTALY_BESOROLAS },
  K: K_KORITOFAL,
  V: { TABLAZAT: FELFOGO_TABLAZAT, LEIRAS: V_LEIRAS },
  L: { TABLAZAT: LEVEZETO_FOLDELO_TABLAZAT, LEIRAS: L_LEIRAS },
  F: F_LEIRAS,
  B: { TABLAZAT: MASODLAGOS_TABLAZAT, LEIRAS: B_LEIRAS },
  FELULVIZSGALAT: FELULVIZSGALAT,
  UJ_KOCKAZATKEZELES: UJ_KOCKAZATKEZELES_FELTETELEK,
  KORLATOZOTT_ROBBANAS: { FELTETELEK: KORLATOZOTT_ROBBANAS_FELTETELEK, KOVETKEZMENY: KORLATOZOTT_ROBBANAS_KOVETKEZMENY },
});
