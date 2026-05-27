// Mock window
global.window = {};
require('../assets/js/tvmi-data.js');
const TVMI = global.window.TVMI;
let errors = 0, checks = 0;
function check(c, m) { checks++; if (!c) { console.error('FAIL: ' + m); errors++; } }

const Rs = ['R1','R2','R3','R4','R5'];
const Ms = ['M1','M2','M3','M4'];
const Ts = ['T1','T2','T3','T4','T5'];
const Ks = ['K1','K2','K3'];

// 4. táblázat: minden R×M×T-re legyen V érték
for (const r of Rs) {
  for (const m of Ms) {
    for (const t of Ts) {
      const v = TVMI.V.TABLAZAT[r]?.[m]?.[t];
      check(v, `V hiányzik: ${r}/${m}/${t}`);
      if (v) {
        const clean = v.replace('*','');
        check(['V0','V1','V2','V3','V4','V5','V6'].includes(clean), `Hibás V érték: ${v} (${r}/${m}/${t})`);
      }
    }
  }
}

// 5. táblázat: minden R×M-re legyen sor
const covered = new Set();
for (const row of TVMI.L.TABLAZAT) {
  covered.add(`${row.R}/${row.M}`);
  for (const k of Ks) {
    if (row.K[k] !== null) {
      check(['L0','L1','L2','L3','L4','L5'].includes(row.K[k]), `Hibás L: ${row.K[k]}`);
    }
  }
  check(['F0','F2/r','F3/r','F4/r'].includes(row.F), `Hibás F: ${row.F}`);
}
for (const r of Rs) for (const m of Ms)
  check(covered.has(`${r}/${m}`), `L/F táblázat hiányzik: ${r}/${m}`);

// Sample lookups
console.log('R1/M1/T1 → V:', TVMI.V.TABLAZAT.R1.M1.T1);
console.log('R4/M3/T5 → V:', TVMI.V.TABLAZAT.R4.M3.T5);
console.log('R5/M4/T5 → V:', TVMI.V.TABLAZAT.R5.M4.T5);

// Magasság táblázat
console.log('M (≤20 m, nincs hatás):', TVMI.M.TABLAZAT.nincs['<=20']);
console.log('M (>35 m, fokozó):', TVMI.M.TABLAZAT.fokozo['>35']);

// Tető táblázat
console.log('T (T.a + T.I):', TVMI.T.TABLAZAT['T.a']['T.I']);
console.log('T (T.b + T.IV):', TVMI.T.TABLAZAT['T.b']['T.IV']);

console.log(`\n${checks} ellenőrzés, ${errors} hiba`);
if (errors === 0) console.log('PASS');
