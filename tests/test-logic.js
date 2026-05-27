global.window = {};
require('../assets/js/tvmi-data.js');
require('../assets/js/tvmi-logic.js');
const L = global.window.TVMI_LOGIC;
const T = global.window.TVMI;

console.log("=== TVMI BESOROLÓ LOGIKA — TELJES MÁTRIX VALIDÁCIÓ ===\n");

// Egzakt visszafelé-ellenőrzés: minden R/M/T/K kombinációra kihúzzuk a logika és táblázat eredményt
const Rs = ['R1','R2','R3','R4','R5'];
const Ms_height = [{ m: 6,  env: 'nincs',     expected: 'M2' },
                   { m: 6,  env: 'csokkento', expected: 'M1' },
                   { m: 6,  env: 'fokozo',    expected: 'M3' },
                   { m: 25, env: 'nincs',     expected: 'M3' },
                   { m: 25, env: 'fokozo',    expected: 'M4' },
                   { m: 40, env: 'nincs',     expected: 'M4' }];

let pass = 0, fail = 0;
for (const r of Rs) {
  for (const heightSpec of Ms_height) {
    // T.a/T.I → T1, T.c/T.IV → T5
    for (const tetoComb of [['T.a','T.I','T1'], ['T.b','T.IV','T5'], ['T.c','T.III','T4']]) {
      for (const k of ['K1','K2','K3']) {
        const inp = {
          rendeltetes: r,
          magassag_m: heightSpec.m,
          kornyezet: heightSpec.env,
          teto_szerkezet: tetoComb[0],
          teto_fedes: tetoComb[1],
          koritofal: k,
          van_kulso_lps: true,
          lako_rendeltetes: false,
        };
        const result = L.besorol(inp);
        if (!result.ok) {
          console.error(`FAIL: ${r}/${heightSpec.m}m/${heightSpec.env}/${tetoComb[0]}/${tetoComb[1]}/${k} — ${result.message}`);
          fail++; continue;
        }
        // M ellenőrzés
        if (result.M.ertek !== heightSpec.expected) {
          console.error(`FAIL M: ${heightSpec.m}m/${heightSpec.env} → ${result.M.ertek}, várt ${heightSpec.expected}`);
          fail++; continue;
        }
        // T ellenőrzés
        if (result.T.ertek !== tetoComb[2]) {
          console.error(`FAIL T: ${tetoComb[0]}/${tetoComb[1]} → ${result.T.ertek}, várt ${tetoComb[2]}`);
          fail++; continue;
        }
        // V ellenőrzés: egyezzen a 4. táblázatbeli értékkel
        const expectedV = T.V.TABLAZAT[r][result.M.ertek][result.T.ertek].replace('*','');
        if (result.V.ertek !== expectedV && result.V.ertek !== expectedV.replace('*','')) {
          console.error(`FAIL V: ${r}/${result.M.ertek}/${result.T.ertek} → ${result.V.ertek}, várt ${expectedV}`);
          fail++; continue;
        }
        // L, F, B nem null
        if (result.L.ertek === undefined || result.F.ertek === undefined || result.B.ertek === undefined) {
          console.error(`FAIL: L/F/B hiányzik ${r}/${result.M.ertek}/${result.T.ertek}/${k}`);
          fail++; continue;
        }
        pass++;
      }
    }
  }
}
console.log(`\n=== ${pass} PASS, ${fail} FAIL ===`);
if (fail === 0) console.log("✅ Logika 100% konzisztens a 4-5-6. táblázatokkal.");

// Néhány konkrét reálisszámítás
console.log("\n=== KONKRÉT MINTAESETEK ===");
const real = [
  { nev: "Családi ház (R1), 6 m, K1, cseréptető", inp: { rendeltetes:"R1", magassag_m:6, kornyezet:"nincs", teto_szerkezet:"T.a", teto_fedes:"T.I", koritofal:"K1", van_kulso_lps:false, lako_rendeltetes:true } },
  { nev: "Iskola (R2), 12 m, K1, lapostető (T.a/T.I)", inp: { rendeltetes:"R2", magassag_m:12, kornyezet:"nincs", teto_szerkezet:"T.a", teto_fedes:"T.I", koritofal:"K1", van_kulso_lps:true, lako_rendeltetes:false } },
  { nev: "Asztalosműhely (R3), 8 m, K3, faszerk. T.b/T.IV (T5)", inp: { rendeltetes:"R3", magassag_m:8, kornyezet:"nincs", teto_szerkezet:"T.b", teto_fedes:"T.IV", koritofal:"K3", van_kulso_lps:true } },
  { nev: "Üzemanyagtöltő R4, 8 m, fokozó, K3, T.c/T.III (T4)", inp: { rendeltetes:"R4", magassag_m:8, kornyezet:"fokozo", teto_szerkezet:"T.c", teto_fedes:"T.III", koritofal:"K3", van_kulso_lps:true } },
];
for (const tc of real) {
  const r = L.besorol(tc.inp);
  console.log(`\n${tc.nev}`);
  console.log(`  ${r.fokozat_string}`);
  console.log(`  Indok M: ${r.M.indok}`);
  console.log(`  Indok V: ${r.V.indok}`);
  if (r.V.megjegyzesek?.length) {
    console.log('  ⓘ ' + r.V.megjegyzesek.join(' | '));
  }
}
