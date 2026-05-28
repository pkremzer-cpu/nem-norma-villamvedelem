# Nem norma szerinti villámvédelem - besoroló alkalmazás

Browser-alapú besoroló alkalmazás a **TvMI 7.7:2026.02.01.** Tűzvédelmi Műszaki Irányelv **10. fejezete** szerinti **nem norma szerinti villámvédelem egységesített létesítési feltételrendszeréhez**.

**Live demo:** https://pkremzer-cpu.github.io/nem-norma-villamvedelem/

---

## ⚙ Funkciók

- **Wizard alapú kérdezés**: lépésenként kéri a rendeltetés (R), magasság (M), tető (T), körítőfal (K) jellemzőit
- **Normatív besorolás**: V/L/F/B fokozatok pontosan a 4-5-6. táblázat szerint
- **GPS helymeghatározás**: böngésző GPS + OpenStreetMap Nominatim reverse geocoding
- **Címkereső**: Nominatim forward geocoding (magyar nyelvű találatok)
- **Helyi tárolás**: minden adat a saját böngésződben (LocalStorage), nincs felhő, nincs fiók
- **Export**: PDF jegyzőkönyv (jsPDF), DOCX jegyzőkönyv (docx.js), JSON backup
- **Megosztható link**: base64-kódolt URL fragment — az egész besorolás egy linkben átküldhető
- **Mobilra optimalizált**: terepen használható, offline képes (a Nominatim hívásokon kívül)

## 🚀 Telepítés

### A. GitHub Pages (publikus hozzáférés)

```bash
git clone https://github.com/pkremzer-cpu/nem-norma-villamvedelem.git
cd nem-norma-villamvedelem
# GitHub-on: Settings → Pages → Source: main branch / root
```

A `.nojekyll` fájl letiltja a Jekyll preprocesszálást, így minden fájl változás nélkül kerül kiszolgálásra.

### B. Lokális futtatás

```bash
# Bármilyen statikus webserver
python3 -m http.server 8080
# vagy
npx serve .
```

Majd nyisd meg: `http://localhost:8080`

### C. Közvetlen `file://` használat

Néhány böngésző (különösen Chrome) tiltja a `file://` protokollon a `fetch()` hívásokat (a Nominatim API CORS okán). Lokális szerver ajánlott.

## 📚 Használat

### 1. Új besorolás

1. **Építmény adatai** (opcionális): név, cím
2. **GPS**: nyomd meg a `📍 Saját GPS` gombot a böngésző geolocation API használatára, vagy adj meg címet és nyomj `🔍 Cím keresése`-t
3. **R csoport**: válassz rendeltetést (R1–R5)
4. **Magasság + környezet**: méter + becsapási környezeti hatás
5. **Tető**: szerkezet (T.a/T.b/T.c) + fedés (T.I/T.II/T.III/T.IV) → kombinálva T1..T5
6. **Körítőfal**: K1/K2/K3
7. **Speciális paraméterek** (opcionális): külső LPS, lakó rendeltetés stb.
8. **▶ Besorolás futtatása** → eredmény panel

### 2. Eredmény

Az eredmény panel mutatja a **kombinált fokozatot** (pl. `V4-L4-F3/r-B3e`) + minden részfokozat indoklását és TvMI hivatkozását.

### 3. Mentés és megosztás

- **💾 Mentés**: tárolódik a böngészőben (`LocalStorage`)
- **🔗 Megosztó link**: vágólapra másol egy URL-t, ami az egész besorolást tartalmazza (base64 fragment)
- **📄 PDF / 📝 DOCX / { } JSON**: letölthető jegyzőkönyv

### 4. Mentett besorolások

A `Mentettek` tab-on minden korábbi besorolás látható. Lehetőségek: megnyitás, PDF/DOCX/JSON export, megosztás, törlés.

### 5. Beállítások

Default tervezői adatok (név, jogosultság, alpha-szám) eltárolhatók — minden új besorolásba automatikusan bekerülnek.

## 🗂 Projektstruktúra

```
nem-norma-villamvedelem/
├── index.html                  # UI shell
├── assets/
│   ├── css/style.css           # Design rendszer (industrial/utilitarian)
│   ├── js/
│   │   ├── tvmi-data.js        # Normatív táblázatok (R/M/T/K, 4-5-6. tbl.)
│   │   ├── tvmi-logic.js       # Besoroló motor + input/output gate
│   │   ├── geo.js              # OSM Nominatim + browser GPS
│   │   ├── storage.js          # LocalStorage CRUD + base64 share
│   │   ├── export.js           # PDF (jsPDF), DOCX (docx.js), JSON
│   │   └── app.js              # Wizard UI vezérlő
│   └── img/                    # ikonok, logók (opcionális)
├── docs/                       # TvMI PDF eredeti (referencia)
├── README.md
├── LICENSE                     # MIT
├── .gitignore
└── .nojekyll                   # GitHub Pages Jekyll OFF
```

## 🧪 Validáció és tesztek

A `test-data.js` és `test-logic.js` Node.js-kompatibilis teszt scriptek:

```bash
node test-data.js   # 320 strukturális check (R/M/T/K kombináció + 4-5-6. tbl)
node test-logic.js  # 270 funkcionális check (teljes mátrix R×M×T×K → V/L/F/B)
```

**Eredmény (v1.0 megjelenéskor):** 590/590 PASS.

## 📖 Normatív háttér

| Tétel | Forrás |
|---|---|
| Jel | TvMI 7.7:2026.02.01. |
| Cím | Villamos berendezések, villámvédelem és elektrosztatikus feltöltődés elleni védelem |
| Hatály | 2026-02-01-től |
| Kibocsátó | BM Országos Katasztrófavédelmi Főigazgatóság |
| Letöltés | https://www.katasztrofavedelem.hu/application/uploads/documents/2025-12/86701.pdf |
| Előző verzió | TvMI 7.6:2024.02.01. |

### Bevezető fejezetek (9.)

A 9. fejezet a **9.1.7** szerint felsorolja, mikor kell **új kockázatkezelést vagy új besorolást** végezni (rendeltetésváltozás, kockázati osztály változás, tető éghetőség változás, magasság ±20%, robbanásveszély új kialakulása).

A **9.6.1.1** felsorolja a **korlátozott mértékű robbanásveszély** feltételeit (5 db) — ha mind teljesül, R3 alkalmazható; egyébként R4/R5 vagy norma szerinti villámvédelem.

### Besoroló fejezet (10.)

| Lépés | Eredmény | Forrás |
|---|---|---|
| Rendeltetés | R1..R5 | 10.1.1. (1. tbl.) |
| Magasság + környezet | M1..M4 | 10.1.2. (2. tbl.) |
| Tetőszerkezet × tetőfedés | T1..T5 | 10.1.3. (3. tbl.) |
| Körítőfalak | K1..K3 | 10.1.4. |
| R × M × T → Felfogó fokozat | V0..V6 | 10.2.2. (4. tbl.) |
| R × M × V × K → Levezető és földelő | L0..L5, F0..F4 | 10.2.3. (5. tbl.) |
| R + külső LPS → Másodlagos (potenciálkiegyenlítés + túlfeszültség) | B0..B4 + e | 10.2.4. (6. tbl.) |

### Felülvizsgálat (10.4.)

Időszakos és átépítést követő felülvizsgálatot az OTSZ és az „Ellenőrzés, felülvizsgálat és karbantartás" TvMI szerint kell elvégezni — ez az alkalmazás csak az **alaposztály-besorolást** támogatja, nem a felülvizsgálati protokollt.

## ⚖ Jogi nyilatkozat

- Az alkalmazás eredménye a **tervező/felülvizsgáló felelősségére** mértékadó.
- Az alkalmazás SEMMILYEN garanciát nem vállal a normatív megfelelőségért.
- A felhasználó köteles a **TvMI eredeti szövegével és a vonatkozó MSZ EN 62305-3 szabvánnyal** ellenőrizni a részletes tervezést.
- A táblázat-implementáció a TvMI 7.7:2026.02.01. szöveg alapján készült; bárminemű eltérésért a fejlesztő nem felel.

## 🛠 Műszaki háttér

| Komponens | Verzió | Licenc |
|---|---|---|
| jsPDF | 2.5.1 | MIT |
| docx.js | 8.5.0 | MIT |
| FileSaver.js | 2.0.5 | MIT |
| OSM Nominatim | API | ODbL |
| IBM Plex Sans / JetBrains Mono | Google Fonts | OFL |

Mindegyik **CDN-ről töltődik be**, így nincs `npm install`, nincs build step.

## 🌐 Hálózati hívások

Az alkalmazás csak az alábbi domain-eket éri el:

| Domain | Cél | Adatkör |
|---|---|---|
| `cdnjs.cloudflare.com` | jsPDF, FileSaver | csak `GET` script |
| `unpkg.com` | docx.js | csak `GET` script |
| `fonts.googleapis.com`, `fonts.gstatic.com` | webfont | csak `GET` font |
| `nominatim.openstreetmap.org` | geocoding | a keresési kifejezés + lat/lng |

**Nincs analytics, nincs tracking, nincs felhasználói adatküldés.**

## 📄 Licenc

[MIT](LICENSE) © 2026 Kremzer Péter

---

**Bug report / feature request:** https://github.com/pkremzer-cpu/nem-norma-villamvedelem/issues
