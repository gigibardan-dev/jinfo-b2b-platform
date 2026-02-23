# 🔄 Ghid Actualizare Circuite - J'Info B2B Platform

## 📋 Când trebuie să actualizezi circuitele?

- ✅ Când se schimbă prețurile pe site
- ✅ Când apar circuite noi
- ✅ Când se modifică datele de plecare
- ✅ Periodic (lunar/săptămânal) pentru a menține datele fresh

---

## 🚀 Procesul complet de actualizare

### PASUL 1: Scraping (Extrage datele de pe site)

```bash
cd ~/Desktop/Jinfo\ Projects/jinfo\ b2b/jinfo-b2b-platform/scraper

# Rulează scraper-ul (durează ~50-90 minute)
node scraper_v2_optimized.js
```

**Ce face:**
- Extrage toate circuitele din cele 5 continente
- Capturează prețurile actualizate (double, single, triple, child)
- Extrage datele de plecare și imagini
- Salvează totul în `circuits_data_complete.json`
- Generează raport în `SCRAPING_REPORT.txt`

**Output:**
- ✅ `circuits_data_complete.json` - datele noi
- ✅ `SCRAPING_REPORT.txt` - raport cu statistici

---

### PASUL 2: Import în Supabase

#### 🆕 PRIMA DATĂ (sau când nu ai bookings reale):

```bash
cd ~/Desktop/Jinfo\ Projects/jinfo\ b2b/jinfo-b2b-platform/migration

# 1. Șterge datele vechi
node clear_circuits.js

# 2. Importă datele noi
node import_circuits.js
```

**⚠️ ATENȚIE:** Asta șterge TOATE circuitele și booking-urile de test!

---

#### ♻️ PENTRU VIITOR (când ai bookings reale):

```bash
cd ~/Desktop/Jinfo\ Projects/jinfo\ b2b/jinfo-b2b-platform/migration

# Folosește versiunea UPSERT (nu șterge nimic!)
node import_circuits_upsert.js
```

**Ce face UPSERT:**
- ✅ Actualizează circuitele existente (prețuri, plecări, etc.)
- ✅ Adaugă circuitele noi (dacă au apărut)
- ✅ PĂSTREAZĂ booking-urile existente (nu le șterge!)
- ✅ PĂSTREAZĂ UUID-urile Supabase (FK-uri rămân valide)

---

## 📁 Structura fișierelor

```
jinfo-b2b-platform/
│
├── scraper/
│   ├── scraper_v2_optimized.js      ← Scriptul de scraping
│   ├── circuits_data_complete.json  ← Output: datele extrase
│   └── SCRAPING_REPORT.txt          ← Raport scraping
│
└── migration/
    ├── clear_circuits.js            ← Șterge tot (prima dată)
    ├── import_circuits.js           ← Import simplu (prima dată)
    └── import_circuits_upsert.js    ← Update inteligent (viitor)
```

---

## 🔑 Diferențe importante

### `clear_circuits.js` + `import_circuits.js`
- ❌ Șterge TOATE circuitele vechi
- ❌ Șterge TOATE booking-urile
- ❌ ID-urile Supabase se regenerează
- ✅ Folosește DOAR prima dată sau când nu ai bookings reale

### `import_circuits_upsert.js`
- ✅ Actualizează circuitele existente
- ✅ Păstrează booking-urile
- ✅ Păstrează ID-urile Supabase
- ✅ Folosește în PRODUCȚIE când ai bookings reale

---

## 🎯 Workflow recomandat

### Prima dată / Testing:
```bash
# 1. Scraping
cd scraper/
node scraper_v2_optimized.js

# 2. Clear + Import
cd ../migration/
node clear_circuits.js
node import_circuits.js
```

### În producție (lunar/săptămânal):
```bash
# 1. Scraping
cd scraper/
node scraper_v2_optimized.js

# 2. Update (nu clear!)
cd ../migration/
node import_circuits_upsert.js
```

---

## 🔍 Verificare după import

### În terminal:
```bash
# Verifică numărul de circuite
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('circuits').select('id', { count: 'exact', head: true })
  .then(({ count }) => console.log('Circuite în DB:', count || 0));
"
```

### În Supabase Dashboard:
1. Du-te la https://supabase.com/dashboard
2. Selectează proiectul
3. Mergi la **Table Editor** → `circuits`
4. Verifică că ai ~99 circuite
5. Verifică câteva prețuri random să fie corecte

---

## ⚠️ Probleme comune

### Eroare: "violates foreign key constraint"
**Cauză:** Încerci să ștergi departures dar există bookings care le referă.

**Soluție:** Folosește `clear_circuits.js` actualizat (șterge în ordine: bookings → departures → circuits)

---

### Eroare: "duplicate key value violates unique constraint"
**Cauză:** Încerci să inserezi un circuit care există deja (același `external_id`)

**Soluție:** Folosește `import_circuits_upsert.js` în loc de `import_circuits.js`

---

### Scraping-ul durează prea mult (>2 ore)
**Cauză:** Site-ul e lent sau Playwright are probleme

**Soluție:** 
- Verifică conexiunea la internet
- Restart scraper-ul
- Verifică în `SCRAPING_REPORT.txt` ce circuite au eșuat

---

## 📞 Notițe importante

### Environment Variables (.env)
Asigură-te că ai:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # SECRET! Nu anon key!
```

### Dependencies
```bash
# În folderul scraper/
npm install axios cheerio playwright

# Instalează browser-ele Playwright
npx playwright install chromium

# În folderul migration/
npm install @supabase/supabase-js dotenv
```

---

## 🎓 Concepte cheie

### `external_id` vs `id`
- **`id`** = UUID generat de Supabase (ex: `123e4567-e89b-12d3-a456-426614174000`)
- **`external_id`** = ID din CRM/scraper (ex: `"270"` pentru Algeria-Tunisia)
- UPSERT se bazează pe `external_id` pentru a identifica circuitele

### UPSERT
```
Dacă găsește external_id → UPDATE (actualizează)
Dacă NU găsește external_id → INSERT (circuit nou)
```

### Foreign Keys
```
pre_bookings → departure_id → departures
departures → circuit_id → circuits
```
Ordinea de ștergere: pre_bookings → departures → circuits

---

## ✅ Checklist rapid

- [ ] Am rulat `scraper_v2_optimized.js`?
- [ ] Există `circuits_data_complete.json` cu datele noi?
- [ ] Am verificat `SCRAPING_REPORT.txt` pentru erori?
- [ ] Am ales scriptul corect (clear sau upsert)?
- [ ] Am variabilele de mediu setate?
- [ ] După import, am verificat în Supabase că datele sunt ok?

---

**Ultima actualizare:** Februarie 2026  
**Autor:** Gigi + Claude  
**Versiune:** 1.0