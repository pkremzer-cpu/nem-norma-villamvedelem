/**
 * TvMI 7.7:2026.02.01. - Nem norma szerinti villámvédelem besoroló adatbázis
 *
 * FORRÁS: BM OKF Tűzvédelmi Műszaki Irányelv TvMI 7.7:2026.02.01.
 * 10. fejezet: A nem norma szerinti villámvédelem egységesített létesítési feltételrendszere
 *
 * Hatályos: 2026.02.01-től
 * Letöltés: https://www.katasztrofavedelem.hu/application/uploads/documents/2025-12/86701.pdf
 *
 * MINDEN `leiras` és `feltetel` mező a TvMI EREDETI BETŰHŰ szövege.
 * A `rovid`, `pelda` mezők saját szakmai kiegészítések (csak UI segédlet, nem TvMI szöveg).
 *
 * v1.1 (2026-05-27): Sorról-sorra betűhű audit + javítás 12 MAJOR ponton.
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
  verzio_data: "v1.1 (2026-05-27 betűhű audit)",
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.1.1.  RENDELTETÉS SZERINTI CSOPORT (R1..R5)  — 1. táblázat
 *  Forrás: TvMI 7.7 10.1.1, 1. táblázat — BETŰHŰ SZÖVEG
 * ────────────────────────────────────────────────────────────────────────── */
const R_RENDELTETES = Object.freeze([
  {
    kod: "R1",
    rovid: "Általános építmény",
    leiras: "R2..R5 csoportba nem tartozó építmény (ideértve a gyárkéményt, fémtartályt)",
    pelda: "Egylakásos családi ház, kis raktár, gazdasági épület, normál iroda ≤500 fő, fémtartály általában. (Példa — saját kiegészítés)",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R1 sor",
  },
  {
    kod: "R2",
    rovid: "Közösségi / kulturális / tömegtartózkodás",
    leiras: "Az alábbiakban részletezett, az R3..R5 csoportba nem tartozó építmény:\n- az a közösségi épület, amelyben bármelyik tűzszakasz befogadóképessége meghaladja az 500 főt\n- a tömegtartózkodásra szolgáló építmény,\n- a talajszint feletti nagy forgalmú épület,\n- földfeletti közműépítmény,\n- tudományos, történelmi és művészeti értékű épület, ide értve a szobrokat, az emlékműveket",
    pelda: "Színház, mozi, koncertterem, sportcsarnok >500 fő, plázák, közmű alállomások, múzeum, műemlékvédett épület. (Példa — saját kiegészítés)",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R2 sor",
  },
  {
    kod: "R3",
    rovid: "Korlátozott robbanásveszély / mérsékelt tűzveszély",
    leiras: "A Villamos TvMI alapján „Korlátozott mértékű robbanásveszéllyel” rendelkező épületek, valamint olyan ipari vagy tárolási rendeltetésű épületek, amelyekben „mérsékelten tűzveszélyes” tűzveszélyességi osztályú anyagokat állítanak elő, dolgoznak fel, használnak, tárolnak.",
    pelda: "Asztalosműhely, papírraktár, festőműhely (korlátozott Ex2/Ex22 zónával), kis akkumulátortöltő helyiség. (Példa — saját kiegészítés)",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R3 sor",
  },
  {
    kod: "R4",
    rovid: "Fokozottan tűz- és robbanásveszélyes",
    leiras: "Rendeltetésüket tekintve „fokozottan tűz- és robbanásveszélyes” tűzveszélyességi osztályba tartozó anyagok előállítására, feldolgozására, használatára, tárolására szolgáló építmények, és olyan, robbanásveszélyes térrészeket tartalmazó építmények, amelyek nem tartoznak az R3 csoportba",
    pelda: "Üzemanyagtöltő állomás, oldószerraktár, lakkozó, vegyipari technológia (Ex1 zóna jelentős kiterjedéssel). (Példa — saját kiegészítés)",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R4 sor",
  },
  {
    kod: "R5",
    rovid: "Katasztrófával fenyegető",
    leiras: "Katasztrófával fenyegető építmény, amely robbanás, vagy a környezetbe kijutó veszélyes anyagok révén, villámcsapás esetén a vonatkozó jogszabály szerinti katasztrófahelyzetet idézhet elő",
    pelda: "Veszélyes üzem SEVESO II/III. szerint, nagykiterjedésű vegyipari telephely, atomerőmű építményei. (Példa — saját kiegészítés)",
    forras: "TvMI 7.7 10.1.1. 1. táblázat R5 sor",
  },
]);

/* ──────────────────────────────────────────────────────────────────────────
 *  10.1.2.  MAGASSÁG SZERINTI CSOPORT (M1..M4) — 2. táblázat
 * ────────────────────────────────────────────────────────────────────────── */
const KORNYEZET_HATAS = Object.freeze({
  CSOKKENTO: {
    kod: "csokkento",
    cimke: "Becsapási veszélyt csökkentő környezet",
    feltetel: "Becsapási veszélyt csökkentő környezet hatásával lehet számolni az olyan építmény esetében, amelyet 20 m-es körzetben, legalább két ellenkező oldalról\n- olyan épületek, építmények vagy tárgyak (műtárgyak, illetve tereptárgyak) vesznek közre, amelyeknek a magassága legfeljebb 2 m-rel kisebb, vagy\n- a terepszint e távolságon belül az épület, illetve egyéb építmény legmagasabb pontjával azonos szintre emelkedik.",
    forras: "TvMI 7.7 10.1.2.1",
  },
  NINCS: {
    kod: "nincs",
    cimke: "Nincs különleges környezeti hatás",
    feltetel: "Sem csökkentő, sem fokozó környezet feltételei nem teljesülnek (2. táblázat alapsora).",
    forras: "TvMI 7.7 10.1.2.3 (2. táblázat „Nincs” sor)",
  },
  FOKOZO: {
    kod: "fokozo",
    cimke: "Becsapási veszélyt fokozó környezet",
    feltetel: "Becsapási veszélyt fokozó környezet hatásával kell számolni az olyan építmény esetében, amely\n- hegytetőn, hegygerincen önmagában áll, vagy\n- sík területen 100 m-es körzeten belül magában áll és magassága meghaladja a 10 métert.",
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

// M1-M4 csak kód — a TvMI nem ad rájuk szöveges leírást. Itt csak UI helper.
const M_LEIRAS = Object.freeze({
  M1: "M1 magassági csoport (a 2. táblázat szerint)",
  M2: "M2 magassági csoport (a 2. táblázat szerint)",
  M3: "M3 magassági csoport (a 2. táblázat szerint)",
  M4: "M4 magassági csoport (a 2. táblázat szerint)",
});

// 10.1.2. bevezető szabályok — BETŰHŰ
const MAGASSAG_BONTAS_SZABALY = "A magasság szerinti besoroláskor külön épületnek lehet tekinteni azokat az egy épülethez tartozó részeket, amelyeknek magassága legalább 5 méterrel különbözik egymástól. Nem épületnek minősülő építmények (műtárgyak) esetén ez a szétbontás nem alkalmazható. A magasság szerinti besorolás szempontjából külön kezelt épületrészeket a rendeltetés szerinti besoroláskor egy épületnek kell tekinteni.\n\nAmennyiben a tetőn gépészeti, vagy egyéb berendezés (klímaberendezés, kémény, antenna stb.) is van, a tetőfelület magasságát kell az épület magasságának tekinteni.";

/* ──────────────────────────────────────────────────────────────────────────
 *  10.1.3.  TETŐ ANYAGA ÉS SZERKEZETE (T1..T5)
 *  Forrás: TvMI 7.7 10.1.3.1, 10.1.3.2, 10.1.3.3 (3. táblázat) — BETŰHŰ
 * ────────────────────────────────────────────────────────────────────────── */

// Tetőfödém / tetőszerkezet (10.1.3.1)
const TETOSZERKEZET = Object.freeze([
  {
    kod: "T.a",
    leiras: "„A1” és „A2” vagy „B” és „C” tűzvédelmi osztályba tartozó anyag, fém alkatrészek nélkül",
    forras: "TvMI 7.7 10.1.3.1 első felsorolás",
  },
  {
    kod: "T.b",
    leiras: "Bármilyen anyag fém alkatrészekkel, kivéve a tetőfelület alatt 50 cm-nél nagyobb távolságra levő, „A1” besorolású anyagba ágyazott fémszerkezetet (különösen betonvasat)",
    forras: "TvMI 7.7 10.1.3.1 második felsorolás",
  },
  {
    kod: "T.c",
    leiras: "Egyéb anyag, fém alkatrészek nélkül",
    forras: "TvMI 7.7 10.1.3.1 harmadik felsorolás",
  },
]);

// Tetőfelület / tetőfedés (10.1.3.2) — BETŰHŰ TvMI szöveg
const TETOFEDES = Object.freeze([
  {
    kod: "T.I",
    leiras: "- „A1” és „A2” anyag, vagy legalább „Broof (t1)” anyag fém alkatrészek nélkül,\n- fémlemezzel borított „A1” és „A2” anyag vagy legalább „Broof (t1)” éghető anyag, ha a fémlemez:\n  - vastagsága kisebb, mint 0,5 mm,\n  - vastagsága kisebb, mint 1,0 mm és olvadáspontja 800 °C alatti,\n  - vastagsága kisebb, mint 3,0 mm és olvadáspontja 500 °C alatti",
    forras: "TvMI 7.7 10.1.3.2 T.I.",
  },
  {
    kod: "T.II",
    leiras: "- fém egyedül,\n- fém „A1” és „A2” anyaggal vagy legfeljebb „Broof (t1)” anyaggal,\n- fémlemezzel borított „C”, „D”, „E”, „F” minősítésű anyag, ha a fémlemez:\n  - vastagsága legalább 0,5 mm és olvadáspontja legalább 800 °C,\n  - vastagsága legalább 1,0 mm és olvadáspontja legalább 500 °C,\n  - vastagsága legalább 3,0 mm és olvadáspontja 500 °C alatti",
    forras: "TvMI 7.7 10.1.3.2 T.II.",
  },
  {
    kod: "T.III",
    leiras: "„C”, „D”, „E” és „F” tűzvédelmi osztályba tartozó, 400 °C-nál alacsonyabb gyulladási hőmérsékletű anyag fém alkatrészek nélkül.",
    forras: "TvMI 7.7 10.1.3.2 T.III.",
  },
  {
    kod: "T.IV",
    leiras: "- „C”, „D”, „E” és „F” tűzvédelmi osztályba tartozó, 400 °C-nál alacsonyabb gyulladási hőmérsékletű anyag fém alkatrészekkel, amelyek nem alkotnak zárt burkolatot,\n- „C”, „D”, „E”, „F” tűzvédelmi osztályba tartozó anyag fémlemezzel borítva, de az nem felel meg a T.II pontban előírt követelményeknek.\n\nMegjegyzés: Általában T.IV. csoportba tartozik a cinklemez (horganylemez) attikaburkolat, amennyiben alatta éghető anyagú rétegek találhatók, vagy éghető anyagú réteg (pl. bitumenes lemez) van rá felhajtva.",
    forras: "TvMI 7.7 10.1.3.2 T.IV.",
  },
]);

// 3. táblázat: tetőszerkezet × tetőfedés → T1..T5 (10.1.3.3)
const T_TABLAZAT = Object.freeze({
  "T.a": { "T.I": "T1", "T.II": "T2", "T.III": "T4", "T.IV": "T5" },
  "T.b": { "T.I": "T2", "T.II": "T2", "T.III": "T5", "T.IV": "T5" },
  "T.c": { "T.I": "T3", "T.II": "T2", "T.III": "T4", "T.IV": "T5" },
});

// T1-T5 csak kód — a TvMI nem ad rájuk szöveges leírást. Itt csak UI helper.
const T_LEIRAS = Object.freeze({
  T1: "T1 tető-csoport (3. táblázat szerint)",
  T2: "T2 tető-csoport (3. táblázat szerint)",
  T3: "T3 tető-csoport (3. táblázat szerint)",
  T4: "T4 tető-csoport (3. táblázat szerint)",
  T5: "T5 tető-csoport (3. táblázat szerint)",
});

// 10.1.3.4 Fémtartály-specifikus besorolás — BETŰHŰ
const FEMTARTALY_BESOROLAS = Object.freeze({
  T2_feltetel: "T2 csoportba kell sorolni:\n- az R1 csoportba tartozó tartályokat,\n- az R3, R4, R5 csoportba tartozó fémtartályt, ha teteje:\n  - legalább 10 mm vastag, 500 °C feletti olvadáspontú, vagy\n  - legalább 5 mm vastag, 800 °C feletti olvadáspontú fémlemezből készült\n  és nem alakul ki fölötte robbanóképes légtér.",
  T4_feltetel: "T4 csoportba kell sorolni azokat a fémtartályokat, amelyek tetejének vastagsága és anyaga nem elégíti ki az előző pontban T2 csoportra meghatározott feltételeket.",
  T5_feltetel: "T5 csoportba kell sorolni azokat a fémtartályokat, amelyek felett robbanóképes légtér kialakulásával kell számolni.",
  forras: "TvMI 7.7 10.1.3.4",
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.1.4.  KÖRÍTŐFALAK SZERINTI CSOPORT (K1..K3) — BETŰHŰ
 * ────────────────────────────────────────────────────────────────────────── */
const K_KORITOFAL = Object.freeze([
  {
    kod: "K1",
    leiras: "„A1” és „A2”, tűzvédelmi osztályba tartozó anyagokból készült falszerkezet",
    pelda: "Tégla, vasbeton, mészhomok, gázbeton falazat fémfegyverzet nélkül. (Példa — saját kiegészítés)",
    forras: "TvMI 7.7 10.1.4 K1",
  },
  {
    kod: "K2",
    leiras: "Az a függőlegesen összefüggő, villamos szempontból vezetőképesen összekötött:\n- legalább 50 mm² keresztmetszetű fémszerkezetet tartalmazó falszerkezet,\n- legalább 0,5 mm vastag fémlemezzel burkolt körítőfal,\n- fémtartály legalább 0,5 mm vastag fémlemez oldalfala,\n- olyan fal, amelyben a magasságuknál kisebb távolságban függőleges acéloszlopok, pillérek vagy összefüggő acélbetéttel ellátott betonpillérek futnak végig, és ezek a fémszerkezetek legalább fölül fémesen össze vannak kötve egymással",
    pelda: "Acélvázas csarnok trapézlemez borítással, fémtartály oldalfala, vasbeton vázas épület összekötött pillérekkel. (Példa — saját kiegészítés)",
    forras: "TvMI 7.7 10.1.4 K2",
  },
  {
    kod: "K3",
    leiras: "Nem K1, vagy K2 csoportba tartozó fal",
    pelda: "Faszerkezetű épület, könnyűszerkezetes sandwich panel fém fegyverzet nélkül, panelos rendszer hézagos kötéssel. (Példa — saját kiegészítés)",
    forras: "TvMI 7.7 10.1.4 K3",
  },
]);

/* ──────────────────────────────────────────────────────────────────────────
 *  10.2.2.  4. TÁBLÁZAT - FELFOGÓ FOKOZATA (V0..V6)
 *  R × M × T → V
 * ────────────────────────────────────────────────────────────────────────── */
const FELFOGO_TABLAZAT = Object.freeze({
  R1: {
    M1: { T1: "V0",  T2: "V0", T3: "V0",  T4: "V0",  T5: "V0"  },
    M2: { T1: "V0",  T2: "V1", T3: "V0",  T4: "V0",  T5: "V3*" },
    M3: { T1: "V3*", T2: "V1", T3: "V3*", T4: "V3*", T5: "V3*" },
    M4: { T1: "V3",  T2: "V1", T3: "V3",  T4: "V3",  T5: "V3"  },
  },
  R2: {
    M1: { T1: "V0",  T2: "V1", T3: "V0",  T4: "V3*", T5: "V3*" },
    M2: { T1: "V3*", T2: "V1", T3: "V3*", T4: "V3*", T5: "V3"  },
    M3: { T1: "V3",  T2: "V1", T3: "V3",  T4: "V3",  T5: "V3"  },
    M4: { T1: "V3",  T2: "V1", T3: "V3",  T4: "V3",  T5: "V3"  },
  },
  R3: {
    M1: { T1: "V3",  T2: "V1", T3: "V3",  T4: "V3",  T5: "V3"  },
    M2: { T1: "V3",  T2: "V1", T3: "V3",  T4: "V3",  T5: "V4"  },
    M3: { T1: "V3",  T2: "V1", T3: "V4",  T4: "V4",  T5: "V4"  },
    M4: { T1: "V4",  T2: "V1", T3: "V4",  T4: "V4",  T5: "V4"  },
  },
  R4: {
    M1: { T1: "V4",  T2: "V1", T3: "V4",  T4: "V4",  T5: "V4"  },
    M2: { T1: "V4",  T2: "V1", T3: "V4",  T4: "V5",  T5: "V5"  },
    M3: { T1: "V5",  T2: "V1", T3: "V5",  T4: "V5",  T5: "V5"  },
    M4: { T1: "V5",  T2: "V1", T3: "V5",  T4: "V5",  T5: "V6"  },
  },
  R5: {
    M1: { T1: "V4",  T2: "V1", T3: "V4",  T4: "V5",  T5: "V5"  },
    M2: { T1: "V4",  T2: "V1", T3: "V5",  T4: "V5",  T5: "V6"  },
    M3: { T1: "V5",  T2: "V1", T3: "V5",  T4: "V6",  T5: "V6"  },
    M4: { T1: "V5",  T2: "V1", T3: "V5",  T4: "V6",  T5: "V6"  },
  },
});

// 4. táblázat lábjegyzetei — BETŰHŰ
const FELFOGO_TABLAZAT_LABJEGYZETEK = Object.freeze({
  V3_csillag: "*„V3” fokozatú felfogórendszer kialakítása szükséges, de a meglévő, „V2” fokozatú felfogórendszer is megtartható, amennyiben\n- az építmény lakó rendeltetésű épület és az épület tetőgeometriája megfelel a 10.3.1.1. pontban leírtaknak, vagy\n- a villámvédelmi felfogórendszer átalakítása nem szükséges (nem történik: tető felújítás, tető átépítés)\n\nMegjegyzés: Új gépészeti berendezés tetőre telepítése esetén villámvédelmi tervezői mérlegelés javasolt a meglévő V2 helyett V3 fokozat alkalmazásával kapcsolatban.",
  V1_lab: "A „V1” fokozatú felfogórendszer helyett csak az építmény „R” és „M” csoportjának megfelelő, de csak a „T3–T5” csoportnak megfelelő, magasabb fokozatú felfogórendszer használható.",
});

// V0..V6 leírás — BETŰHŰ TvMI 10.3.1.1 alapján
const V_LEIRAS = Object.freeze({
  V0: {
    szint: "V0",
    reszletek: "Sem természetes, sem mesterséges felfogórendszer nincs.",
    forras: "TvMI 7.7 10.3.1.1 V0",
  },
  V1: {
    szint: "V1 — természetes felfogók rendszere",
    reszletek: "Természetes felfogók rendszere, amely\n- az építmény fémből készült teteje lehet vagy\n- a tetőfödém vagy a tetőszerkezet fém alkatrészeinek, vagy a tetőfelületen lévő egyéb fémrészeknek egymással összekötött olyan rendszere, amelytől a tető egyik pontja sincs 5 m-nél távolabb.",
    forras: "TvMI 7.7 10.3.1.1 V1",
  },
  V2: {
    szint: "V2 — egyszerűsített felfogórendszer",
    reszletek: "Egyszerűsített felfogórendszer, amely\n- egyetlen, legalább 2 m magas felfogórúd a 20°-nál meredekebb lejtésű sátortető (gúla, kúp) legmagasabb pontján, függetlenül a tető kiterjedésétől,\n- egyetlen felfogóvezető a 20°-nál meredekebb lejtésű tető legmagasabb élén (a tető gerincén), függetlenül a tető szélességétől.\n\nLapostetős vagy bonyolult tetőgeometriájú építmény védelmére V2 fokozat nem alkalmazható.",
    forras: "TvMI 7.7 10.3.1.1 V2",
  },
  V3: {
    szint: "V3 — normál felfogórendszer",
    reszletek: "Normál felfogórendszer, amely felfogórudak, felfogóvezetők vagy természetes felfogók olyan rendszere, amely kielégíti a következő szerkesztési követelmények valamelyikét:\n- nem lehet egy R = 100 m sugarú gördülő gömböt a felfogó érintése nélkül a védendő felülettel kívülről érintkezésbe hozni,\n- nem lehet a védendő felületre egy d = 20 m átmérőjű képzeletbeli körlapot a felfogó érintése nélkül ráhelyezni;\n- az építmény legfeljebb 40 m magasságban lévő bármelyik pontján (különösen a tető szélén) a védőszög mindenütt kisebb, mint α = 45°; a védőszöges szerkesztés M = 40 m-nél magasabb építmény esetén nem alkalmazható.",
    forras: "TvMI 7.7 10.3.1.1 V3",
  },
  V4: {
    szint: "V4 — biztonsági felfogórendszer",
    reszletek: "Biztonsági felfogórendszer, a következő szerkesztési paraméterekkel:\n- R = 80 m,\n- d = 15 m,\n- α = 30°.",
    forras: "TvMI 7.7 10.3.1.1 V4",
  },
  V5: {
    szint: "V5 — növelt biztonságú felfogórendszer",
    reszletek: "Növelt biztonságú felfogórendszer, a következő szerkesztési paraméterekkel:\n- R = 45 m\n- Kizárólag a gördülő gömbös szerkesztési módszer alkalmazható.",
    forras: "TvMI 7.7 10.3.1.1 V5",
  },
  V6: {
    szint: "V6 — különleges biztonságú felfogórendszer",
    reszletek: "Különleges biztonságú felfogórendszer, a következő szerkesztési paraméterekkel:\n- R = 20 m\n- Kizárólag a gördülő gömbös szerkesztési módszer alkalmazható.",
    forras: "TvMI 7.7 10.3.1.1 V6",
  },
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.2.3.  5. TÁBLÁZAT - LEVEZETŐ ÉS FÖLDELŐ FOKOZATA (L0..L5, F0..F4)
 *  R × M × Felfogó kialakítás × K → {L, F}
 * ────────────────────────────────────────────────────────────────────────── */
const LEVEZETO_FOLDELO_TABLAZAT = Object.freeze([
  // ─── R1 ───
  { R: "R1", M: "M1", felfogoFeltetel: "v0",    K: { K1: "L0", K2: "L0",  K3: "L0" }, F: "F0"   },
  { R: "R1", M: "M2", felfogoFeltetel: "v0",    K: { K1: "L0", K2: "L0",  K3: "L0" }, F: "F0"   },
  { R: "R1", M: "M2", felfogoFeltetel: "v2",    K: { K1: "L2", K2: null,  K3: "L2" }, F: "F2/r" },
  { R: "R1", M: "M2", felfogoFeltetel: "egyeb", K: { K1: "L3", K2: "L1",  K3: "L3" }, F: "F3/r" },
  { R: "R1", M: "M3", felfogoFeltetel: "v2",    K: { K1: "L2", K2: null,  K3: "L2" }, F: "F2/r" },
  { R: "R1", M: "M3", felfogoFeltetel: "egyeb", K: { K1: "L3", K2: "L1",  K3: "L3" }, F: "F3/r" },
  { R: "R1", M: "M4", felfogoFeltetel: "v3v1",  K: { K1: "L4", K2: "L1",  K3: "L4" }, F: "F3/r" },
  // ─── R2 ───
  { R: "R2", M: "M1", felfogoFeltetel: "v0",    K: { K1: "L0", K2: "L0",  K3: "L0" }, F: "F0"   },
  { R: "R2", M: "M1", felfogoFeltetel: "v2",    K: { K1: "L2", K2: null,  K3: "L2" }, F: "F2/r" },
  { R: "R2", M: "M1", felfogoFeltetel: "egyeb", K: { K1: "L3", K2: "L1",  K3: "L3" }, F: "F3/r" },
  { R: "R2", M: "M2", felfogoFeltetel: "v2",    K: { K1: "L2", K2: null,  K3: "L2" }, F: "F2/r" },
  { R: "R2", M: "M2", felfogoFeltetel: "egyeb", K: { K1: "L3", K2: "L1",  K3: "L3" }, F: "F3/r" },
  { R: "R2", M: "M3", felfogoFeltetel: "mind",  K: { K1: "L4", K2: "L1",  K3: "L4" }, F: "F3/r" },
  { R: "R2", M: "M4", felfogoFeltetel: "mind",  K: { K1: "L5", K2: "L1",  K3: "L5" }, F: "F3/r" },
  // ─── R3 ───
  { R: "R3", M: "M1", felfogoFeltetel: "mind",  K: { K1: "L3", K2: "L1",  K3: "L3" }, F: "F3/r" },
  { R: "R3", M: "M2", felfogoFeltetel: "mind",  K: { K1: "L3", K2: "L1",  K3: "L4" }, F: "F3/r" },
  { R: "R3", M: "M3", felfogoFeltetel: "mind",  K: { K1: "L4", K2: "L1",  K3: "L5" }, F: "F4/r" },
  { R: "R3", M: "M4", felfogoFeltetel: "mind",  K: { K1: "L5", K2: "L1",  K3: "L5" }, F: "F4/r" },
  // ─── R4 ───
  { R: "R4", M: "M1", felfogoFeltetel: "mind",  K: { K1: "L4", K2: "L1",  K3: "L4" }, F: "F4/r" },
  { R: "R4", M: "M2", felfogoFeltetel: "mind",  K: { K1: "L4", K2: "L1",  K3: "L4" }, F: "F4/r" },
  { R: "R4", M: "M3", felfogoFeltetel: "mind",  K: { K1: "L5", K2: "L1",  K3: "L5" }, F: "F4/r" },
  { R: "R4", M: "M4", felfogoFeltetel: "mind",  K: { K1: "L5", K2: "L1",  K3: "L5" }, F: "F4/r" },
  // ─── R5 ───
  { R: "R5", M: "M1", felfogoFeltetel: "mind",  K: { K1: "L4", K2: "L1",  K3: "L4" }, F: "F4/r" },
  { R: "R5", M: "M2", felfogoFeltetel: "mind",  K: { K1: "L4", K2: "L1",  K3: "L4" }, F: "F4/r" },
  { R: "R5", M: "M3", felfogoFeltetel: "mind",  K: { K1: "L5", K2: "L1",  K3: "L5" }, F: "F4/r" },
  { R: "R5", M: "M4", felfogoFeltetel: "mind",  K: { K1: "L5", K2: "L1",  K3: "L5" }, F: "F4/r" },
]);

// 5. táblázat magyarázatai — BETŰHŰ
const LEVEZETO_FOLDELO_MAGYARAZAT = Object.freeze({
  L2_L4_magasabb: "Az „L2–L4” fokozat helyett a levezetők elhelyezésének rendszere mindig lehet magasabb fokozatú is.",
  L1_helyett:     "Az „L1” fokozatú levezetők helyett csak az építmény „R” és „M” csoportjának megfelelő fokozatú, de az eredeti „K2” helyett a „K1” vagy „K3” csoportnak megfelelő levezetőrendszer használható.",
  L0_csak_V0:     "„L0” fokozat csak abban az esetben állapítható meg, ha a felfogó fokozata „V0”, tehát villámvédelem nincs.",
  V3_minimum_L3:  "V3 fokozatú felfogórendszerhez legalább L3 fokozatú levezetőrendszer tartozhat.",
  foldeles_egyezo_sor: "A földelés fokozatának megállapításakor figyelembe kell venni a levezető megállapított fokozatát is, ezért a földelés fokozata csak a levezető fokozatával azonos sorban lévő változatok közül választható.",
  F2_F3_magasabb: "Az „F2” és „F3” fokozatú földelőrendszer helyett mindig lehet magasabb fokozatú földelőrendszert is használni.",
  szigetelt_LPS:  "Az építményen elhelyezett villámvédelmi rendszer helyett létesíthető villamosan szigetelt, vagy építménytől független villámvédelmi rendszer is.",
});

// L0..L5 leírás — BETŰHŰ TvMI 10.3.2.1
const L_LEIRAS = Object.freeze({
  L0: {
    szint: "L0",
    reszletek: "Sem természetes, sem mesterséges levezető nincs.",
    forras: "TvMI 7.7 10.3.2.1 L0",
  },
  L1: {
    szint: "L1 — csak természetes levezető",
    reszletek: "Csak természetes levezető van, amely\n- az építmény fémből készült vagy fémmel burkolt fala,\n- olyan, fémből készült összefüggő épületszerkezet, amelynek függőlegesen végigfutó elemei (különösen oszlopok, pillérek, függőleges vázszerkezeti elemek) között a magasságuknál kisebb távolság van,\n- vasbeton épületszerkezet fémesen összefüggő acélbetétje.",
    forras: "TvMI 7.7 10.3.2.1 L1",
  },
  L2: {
    szint: "L2",
    reszletek: "Egyetlen levezető olyan helyen, ahol a felfogónak bármely pontjától a levezetőig – a vezetők mentén – mért áramút vízszintes vetülete nem hosszabb 20 m-nél.",
    forras: "TvMI 7.7 10.3.2.1 L2",
  },
  L3: {
    szint: "L3",
    reszletek: "Legalább két levezető olyan elrendezésben, hogy a felfogónak bármely pontjától legközelebbi levezetőig a vezető mentén mért áramút vízszintes vetülete vagy a levezetőkig mért (több) áramút vízszintes vetületének eredője nem hosszabb 15 m-nél.",
    forras: "TvMI 7.7 10.3.2.1 L3",
  },
  L4: {
    szint: "L4",
    reszletek: "Legalább két levezető az „L3” fokozatnak megfelelő feltételekkel, ha a legközelebbi levezetőig a vezető mentén mért áramút vízszintes vetülete vagy a levezetőkig mért (több) áramút vízszintes vetületének eredője nem hosszabb 10 m-nél.",
    forras: "TvMI 7.7 10.3.2.1 L4",
  },
  L5: {
    szint: "L5",
    reszletek: "A levezetők olyan elrendezése, amely megfelel az „L4” fokozatnak, és\n- minden levezető felül (vízszintesen) össze van kötve egymással, a felfogóhoz való csatlakozástól 2 m-nél nem nagyobb távolságra;\n- a 20 m-nél hosszabb levezetők közben is össze vannak kötve (vízszintesen) egymással úgy, hogy az összekötések között a levezető mentén mért távolság 20 m-nél nagyobb nem lehet.",
    forras: "TvMI 7.7 10.3.2.1 L5",
  },
});

// F0..F4 leírás — BETŰHŰ TvMI 10.3.3.1 és 10.3.3.2 (NINCS F1!)
const F_LEIRAS = Object.freeze({
  F0: {
    szint: "F0",
    reszletek: "Sem természetes, sem mesterséges földelő nincs.",
    forras: "TvMI 7.7 10.3.3.1 F0",
  },
  F2: {
    szint: "F2",
    reszletek: "Egyetlen földelő van.",
    forras: "TvMI 7.7 10.3.3.1 F2",
  },
  F3: {
    szint: "F3",
    reszletek: "Legalább két földelő, amelyek lehetnek különállóak vagy csoportosan egymással összekötöttek.",
    forras: "TvMI 7.7 10.3.3.1 F3",
  },
  F4: {
    szint: "F4",
    reszletek: "Földelőrendszer, amely gyűrűsföldelő, keretföldelő, földelőháló vagy építmények betonalapföldelése vagy – szükség esetén – ezekkel összekötött egyedi földelők rendszere.",
    forras: "TvMI 7.7 10.3.3.1 F4",
  },
  "r": {
    szint: "/r — földelési ellenállás követelmény",
    reszletek: "A földelési ellenállás értéke a következő követelményeket elégítse ki:\n- egyetlen földelő („F2” fokozat), vagy földelőrendszerhez tartozó, vizsgáló összekötővel leválasztható egyedi földelő vagy földelőcsoport esetén: R ≤ 10 Ω vagy R ≤ 6·ρ/√A Ω\n- az építmény földelőrendszerének eredő értéke: R ≤ 10 Ω vagy R ≤ 3·ρ/√A Ω\n\nahol „ρ” – a talaj fajlagos ellenállása [Ωm]; „A” – az építmény alapterülete [m²]\n\nA talaj fajlagos ellenállását a vonatkozó követelmények szerint végzett mérésekkel javasolt megállapítani. Amennyiben a talaj fajlagos ellenállása nem ismert, úgy általánosan (sziklás, kavicsos talajok kivételével) 300 Ωm-nek vehető.\n\nMegjegyzés: A fenti számítástól függetlenül telepítéskor egyedi földelők esetén javasolt az 50 Ohm alatti földelési ellenállás elérése.",
    forras: "TvMI 7.7 10.3.3.2",
  },
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.2.4.  6. TÁBLÁZAT - VILLÁMVÉDELMI POTENCIÁLKIEGYENLÍTÉS ÉS
 *                          KOORDINÁLT TÚLFESZÜLTSÉG-VÉDELEM (B0..B4 + e)
 * ────────────────────────────────────────────────────────────────────────── */
const MASODLAGOS_TABLAZAT = Object.freeze({
  R1_nincs_kulso: { B: "B0*", megjegyzes: "R1 (nincs külső villámvédelem). *Az MSZ HD 60364-4-443, MSZ HD 60364-5-534 szabványok ebben az esetben is írhatnak elő potenciálkiegyenlítési intézkedéseket." },
  R1_van_kulso:   { B: "B2",  megjegyzes: "R1 (van külső villámvédelem)." },
  R2:             { B: "B2e", megjegyzes: "R2 csoport — villámvédelmi potenciálkiegyenlítés (B2) + koordinált túlfeszültség-védelem (e)." },
  R3:             { B: "B3e", megjegyzes: "R3 csoport — B3 + e." },
  R4:             { B: "B4e", megjegyzes: "R4 csoport — B4 + e." },
  R5:             { B: "B4e", megjegyzes: "R5 csoport — B4 + e." },
});

// 6. táblázat magyarázat — BETŰHŰ
const MASODLAGOS_MAGYARAZAT = "Az adott körülmények figyelembevételével a táblázatában meghatározott fokozatnál magasabb fokozat is megállapítható.";

// B leírások — BETŰHŰ TvMI 10.3.4.3.1 és 10.3.4.3.2
const B_LEIRAS = Object.freeze({
  "B0":  "Nem szükséges a csatlakozóvezetékek villámvédelmi potenciálkiegyenlítése.",
  "B0*": "B0 — Nem szükséges a csatlakozóvezetékek villámvédelmi potenciálkiegyenlítése. *Az MSZ HD 60364-4-443, MSZ HD 60364-5-534 szabványok ebben az esetben is írhatnak elő potenciálkiegyenlítési intézkedéseket.",
  "B2":  "Az építményhez csatlakozó fémes csatlakozóvezetékeket közvetlenül földelni kell. A közvetlenül nem földelhető, vagy nem földpotenciálú csatlakozóvezetékek villámvédelmi potenciálkiegyenlítését túlfeszültség-védelmi eszközök segítségével kell biztosítani, amelyeket LPL III-IV szintre, azaz 100 kA-re (energiaátviteli hálózaton pólusonként 12,5 kA-re) kell méretezni.",
  "B3":  "Az építményhez csatlakozó fémes csatlakozóvezetékeket közvetlenül földelni kell. A közvetlenül nem földelhető, vagy nem földpotenciálú csatlakozóvezetékek villámvédelmi potenciálkiegyenlítését túlfeszültség-védelmi eszközök segítségével kell biztosítani, amelyeket LPL II szintre, azaz 150 kA-re (energiaátviteli hálózaton pólusonként 17,5 kA-re) kell méretezni.",
  "B4":  "Az építményhez csatlakozó fémes csatlakozóvezetékeket közvetlenül földelni kell. A közvetlenül nem földelhető, vagy nem földpotenciálú csatlakozóvezetékek villámvédelmi potenciálkiegyenlítését túlfeszültség-védelmi eszközök segítségével kell biztosítani, amelyeket LPL I szintre, azaz 200 kA-re (energiaátviteli hálózaton pólusonként 25 kA-re) kell méretezni.",
  "e":   "„e” — A villamos rendszer átalakításának, bővítésének körében koordinált túlfeszültség-védelem kialakítása szükséges. (Megjegyzés: A tervező dönthet úgy, hogy a teljes építmény villamos berendezésének koordinált túlfeszültség-védelmét előírja.)",
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.2.1.  VILLÁMVÉDELMI RENDSZER JELÖLÉSE — BETŰHŰ
 * ────────────────────────────────────────────────────────────────────────── */
const FOKOZAT_JELOLES = Object.freeze({
  szabaly: "A felfogó jele „V” betűjel. Ezt követi a felfogó általános elrendezésének fokozatát kifejező 0-tól 6-ig terjedő szám-fokozatjel.\nA levezető jele „L” betűjel. Ezt követi a levezetők általános elrendezésének fokozatát kifejező 0-tól 5-ig terjedő szám-fokozatjel.\nA földelés jele „F” betűjel. Ezt követi a földelés általános elrendezésének fokozatát kifejező 0-tól 4-ig terjedő szám-fokozatjel és a földelési ellenállásra utaló „r” betűjel.\nA másodlagos hatások elleni védelem jele „B” betűjel. Ezt követi villámvédelmi potenciálkiegyenlítési intézkedések fokozatát kifejező 0, és 2-től 4-ig terjedő szám-fokozatjel és a koordinált túlfeszültség-védelemre vonatkozó „e” betűjel.\nA felfogóra, a levezetőre, a földelésre vonatkozó jelcsoportokat e felsorolás sorrendjében, egymástól kötőjellel elválasztva kell közölni.\nA „0” fokozatjel azt jelöli, hogy villámvédelmi berendezés nincs. A villámvédelmi berendezés nélküli építmény jele: „V0-L0-F0”.\nA természetes felfogó vagy levezető fokozatjele az általános elrendezés szempontjából 1-es számjel.",
  forras: "TvMI 7.7 10.2.1",
});

/* ──────────────────────────────────────────────────────────────────────────
 *  10.4. FELÜLVIZSGÁLAT — BETŰHŰ
 * ────────────────────────────────────────────────────────────────────────── */
const FELULVIZSGALAT = Object.freeze({
  szabaly: "Az időszakos, valamint az átépítést, bővítést követő felülvizsgálatot az OTSZ és a „Ellenőrzés, felülvizsgálat és karbantartás” TvMI előírásai szerint kell elvégezni, dokumentálni.",
  forras: "TvMI 7.7 10.4.1",
});

/* ──────────────────────────────────────────────────────────────────────────
 *  9.1.7  ÚJ KOCKÁZATKEZELÉS FELTÉTELEI — BETŰHŰ
 * ────────────────────────────────────────────────────────────────────────── */
const UJ_KOCKAZATKEZELES_FELTETELEK = Object.freeze([
  { id: "rendeltetes",    leiras: "az építmény vagy önálló építményrész rendeltetésének változásakor;", forras: "TvMI 7.7 9.1.7 a" },
  { id: "kockazat",       leiras: "az építmény mértékadó kockázati osztályának változásakor;", forras: "TvMI 7.7 9.1.7 b" },
  { id: "teto_eghet",     leiras: "a tető éghetőségének változásakor; (Az az eset tartozik ide, amikor a tető egészét jellemző paramétert – a jelen TvMI alapján – a szigorúbb irányban kell változtatni.)", forras: "TvMI 7.7 9.1.7 c" },
  { id: "magassag_20pct", leiras: "az építmény magasságának változásakor, feltéve, hogy a változás meghaladja a 20%-ot,", forras: "TvMI 7.7 9.1.7 d/da" },
  { id: "magassag_15m",   leiras: "az építmény magasságának változásakor, feltéve, hogy a magasság eléri a 15 m-t;", forras: "TvMI 7.7 9.1.7 d/db" },
  { id: "robbanas_uj",    leiras: "az eredetileg nem robbanásveszélyes építményben olyan átalakítás történik, amelynek révén az építményben robbanásveszélyes térrészek alakulnak ki, és a robbanásveszély jelentős mértékben növeli a kockázatot.", forras: "TvMI 7.7 9.1.7 e" },
]);

/* ──────────────────────────────────────────────────────────────────────────
 *  9.6.1.1  KORLÁTOZOTT MÉRTÉKŰ ROBBANÁSVESZÉLY FELTÉTELEI — BETŰHŰ
 * ────────────────────────────────────────────────────────────────────────── */
const KORLATOZOTT_ROBBANAS_FELTETELEK = Object.freeze([
  { id: "teto_zona",      leiras: "A tető feletti szabad légtérben csak Ex 1, Ex 2, Ex 21, Ex 22 zóna van.", forras: "TvMI 7.7 9.6.1.1 (1)" },
  { id: "homlokzat_zona", leiras: "A homlokzaton csak Ex 1, Ex 2, Ex 21, Ex 22 zóna van.", forras: "TvMI 7.7 9.6.1.1 (2)" },
  { id: "teto_ex2",       leiras: "A tetőn és a homlokzat felső 20 %-án, de legalább 6 méter függőleges kiterjedésű homlokzati részen megjelenő Ex 2, Ex 22 zóna összesített kiterjedése (vetülete) – a tető felülnézeti vetületében – a tető vetületének legfeljebb 20 %-a.", forras: "TvMI 7.7 9.6.1.1 (3)" },
  { id: "helyiseg_20pct", leiras: "Az épületen belül robbanásveszélyes technológia, berendezés, illetve térrész található, de a Robbanás elleni védelem című TvMI 6.3.1. pontja szerint meghatározott robbanásveszélyesnek minősített helyiségek összesített alapterülete nem nagyobb, mint az épület nettó alapterületének 20 %-a.", forras: "TvMI 7.7 9.6.1.1 (4)" },
  { id: "alatti_ex",      leiras: "Az épület alatti (de felszín feletti) robbanásveszélyes térrész esetén (pld. épület alatti üzemanyagtöltő állomás) az Ex 2, Ex 22 zónába tartozó robbanásveszélyes térrészek összesített kiterjedése (vetülete) az épület függőleges vetületi alapterületének legfeljebb 20 %-a.", forras: "TvMI 7.7 9.6.1.1 (5)" },
]);

const KORLATOZOTT_ROBBANAS_KOVETKEZMENY = "Korlátozott mértékű a robbanásveszélyes térrészek kiterjedése, ha az épület egészéhez képest a fenti feltételek EGYÜTTESEN teljesülnek. Ekkor a 9.6.2. és 9.6.3. szakaszban leírtak alkalmazása kielégíti az OTSZ követelményét, és az építmény az R3 csoportba sorolható. Bármely feltétel sérülése esetén az építményt R4 (vagy R5) csoportba kell sorolni, illetve norma szerinti villámvédelem mérlegelendő. (Forrás: TvMI 7.7 9.6.1, 9.6.2, 9.6.3)";

/* ──────────────────────────────────────────────────────────────────────────
 *  EXPORT: window.TVMI
 * ────────────────────────────────────────────────────────────────────────── */
window.TVMI = Object.freeze({
  META: TVMI_META,
  R: R_RENDELTETES,
  M: { TABLAZAT: M_TABLAZAT, LEIRAS: M_LEIRAS, KORNYEZET: KORNYEZET_HATAS, BONTAS: MAGASSAG_BONTAS_SZABALY },
  T: { SZERKEZET: TETOSZERKEZET, FEDES: TETOFEDES, TABLAZAT: T_TABLAZAT, LEIRAS: T_LEIRAS, FEMTARTALY: FEMTARTALY_BESOROLAS },
  K: K_KORITOFAL,
  V: { TABLAZAT: FELFOGO_TABLAZAT, LEIRAS: V_LEIRAS, LABJEGYZETEK: FELFOGO_TABLAZAT_LABJEGYZETEK },
  L: { TABLAZAT: LEVEZETO_FOLDELO_TABLAZAT, LEIRAS: L_LEIRAS, MAGYARAZAT: LEVEZETO_FOLDELO_MAGYARAZAT },
  F: F_LEIRAS,
  B: { TABLAZAT: MASODLAGOS_TABLAZAT, LEIRAS: B_LEIRAS, MAGYARAZAT: MASODLAGOS_MAGYARAZAT },
  FOKOZAT_JELOLES: FOKOZAT_JELOLES,
  FELULVIZSGALAT: FELULVIZSGALAT,
  UJ_KOCKAZATKEZELES: UJ_KOCKAZATKEZELES_FELTETELEK,
  KORLATOZOTT_ROBBANAS: { FELTETELEK: KORLATOZOTT_ROBBANAS_FELTETELEK, KOVETKEZMENY: KORLATOZOTT_ROBBANAS_KOVETKEZMENY },
});
