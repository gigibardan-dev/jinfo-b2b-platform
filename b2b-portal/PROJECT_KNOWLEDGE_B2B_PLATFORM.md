# 🏢 JINFO TOURS - B2B PLATFORM - PROJECT KNOWLEDGE

## 📋 DESPRE PROIECT

### Context Business
**J'Info Tours** este o agenție de turism românească care oferă circuite organizate (95+ pachete) pe 5 continente. Compania folosește sistemul CRM **qTravel** (dezvoltat de Acqua Development) pentru gestionarea circuitelor și rezervărilor.

### Obiectiv Platformă B2B
Dezvoltăm un **portal dedicat pentru agenții de turism partenere** care să permită:
- Vizualizarea tuturor circuitelor disponibile
- Acces la prețuri speciale (cu comision dedus)
- Sistem de pre-rezervări cu validare manuală de către J'Info
- Management campanii și reduceri speciale pentru parteneri

### Date Cheie
- **Total circuite:** 95 (complet extrase și validate)
- **Continente:** Europa (36), Africa (24), Asia (23), America (19), Oceania (3)
- **Prețuri:** 4 variante per circuit (double, single, triple, child)
- **Plecări:** Multiple date per circuit, unele tentative, altele confirmate
- **Volumul așteptat:** <200 pre-rezervări/lună
- **Agenții pilot:** 2-3 pentru testare inițială

---

## 🏗️ ARHITECTURĂ TECH STACK

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Deployment:** Vercel (FREE Hobby tier)

### Backend
- **API:** Next.js API Routes (serverless)
- **Database:** Supabase PostgreSQL (FREE tier)
- **Authentication:** Supabase Auth (JWT-based)
- **Storage:** Supabase Storage (imagini)
- **Real-time:** Supabase Realtime (notificări)

### Additional Services
- **Email:** Resend API (FREE: 3,000 emails/lună)
- **Version Control:** GitHub
- **Monitoring:** Vercel Analytics (included)

### Costuri Totale
**$0/lună** pe FREE tier pentru:
- 95 circuite
- <200 pre-rezervări/lună
- 10-50 agenții
- 500MB database (Supabase)
- Unlimited deploys (Vercel)
- 3,000 emails/lună (Resend)

---

## 📁 STRUCTURA PROIECT

### Repository GitHub
**URL:** https://github.com/gigibardan/jinfo-b2b-platform

### Structura Directoare
```
jinfo-b2b-platform/
├── scraper/                          # Tools pentru extragere date
│   ├── scraper_v2_optimized.js      # Main scraper (rulează ~40-60 min)
│   ├── add_missing_circuits.js      # Pentru circuite care lipsesc din API
│   ├── test_3_circuits_simple.js    # Test tool (verifică 3 circuite)
│   ├── circuits_data_complete.json  # SURSA DE ADEVĂR (95 circuite)
│   ├── package.json
│   └── README.md
│
├── b2b-portal/                      # Next.js Application
│   ├── app/                         # Next.js 14 App Router
│   │   ├── (auth)/                 # Auth pages (login, register)
│   │   ├── (dashboard)/            # Protected pages
│   │   ├── (admin)/                # Admin dashboard
│   │   ├── api/                    # API routes
│   │   │   └── circuits/
│   │   │       └── route.ts        # GET /api/circuits
│   │   ├── circuits/               # Public circuit pages
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Circuit details
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Homepage
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   └── circuits/
│   │       └── CircuitCard.tsx     # Circuit display card
│   │
│   ├── lib/
│   │   ├── supabase/              # Supabase client config
│   │   ├── utils/                 # Helper functions
│   │   └── types/                 # TypeScript types
│   │
│   ├── data/
│   │   └── circuits_data.json     # Copy din scraper (seed data)
│   │
│   ├── public/
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── supabase/                        # Database schema & migrations
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
│
├── .gitignore
├── package.json                     # Root package (build scripts)
├── vercel.json                      # Vercel configuration
└── README.md
```

---

## 🗄️ DATABASE SCHEMA (Supabase PostgreSQL)

### Tabele Principale

#### 1. circuits
```sql
CREATE TABLE circuits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,        -- ID din qTravel/API
  slug TEXT UNIQUE NOT NULL,               -- URL-friendly name
  name TEXT NOT NULL,
  continent TEXT NOT NULL,                 -- europa/africa/asia/america/oceania
  nights TEXT,                             -- "10 nopti", "12 nopti"
  title TEXT,
  url TEXT,                                -- Link către jinfotours.ro
  main_image TEXT,                         -- URL imagine principală
  gallery JSONB DEFAULT '[]',              -- Array de URL-uri imagini
  short_description TEXT,
  
  -- Prețuri (în EUR)
  price_double DECIMAL(10,2),              -- Preț per persoană cameră dublă
  price_single DECIMAL(10,2),              -- Preț cameră single
  price_triple DECIMAL(10,2),              -- Preț per persoană cameră triplă
  price_child DECIMAL(10,2),               -- Preț copil (cu 2 adulți)
  price_options JSONB DEFAULT '[]',        -- Toate variantele de preț
  
  -- Metadata
  last_scraped TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_circuits_continent ON circuits(continent);
CREATE INDEX idx_circuits_slug ON circuits(slug);
```

**Exemplu date:**
```json
{
  "id": "uuid",
  "external_id": "1355",
  "slug": "ecuador-galapagos",
  "name": "Ecuador - Galapagos",
  "continent": "america",
  "nights": "12 nopti",
  "price_double": 2706,
  "price_single": 3386,
  "price_triple": null,
  "price_child": 7722,
  "price_options": [
    {
      "type": "Persoana in camera dubla",
      "price": 2706,
      "currency": "EUR",
      "info": "un adult"
    }
  ]
}
```

---

#### 2. departures
```sql
CREATE TABLE departures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  room_type TEXT DEFAULT 'double',         -- double/single/triple
  price DECIMAL(10,2),
  status TEXT DEFAULT 'disponibil',        -- disponibil/tentativ/complet
  min_participants INTEGER DEFAULT 10,
  available_spots INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circuit_id, departure_date, room_type)
);

-- Indexes
CREATE INDEX idx_departures_circuit ON departures(circuit_id);
CREATE INDEX idx_departures_date ON departures(departure_date);
```

**Exemplu date:**
```json
{
  "id": "uuid",
  "circuit_id": "circuit-uuid",
  "departure_date": "2026-03-15",
  "return_date": "2026-03-27",
  "room_type": "double",
  "price": 2706,
  "status": "disponibil"
}
```

---

#### 3. agencies
```sql
CREATE TABLE agencies (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  
  -- Commission
  commission_rate DECIMAL(5,2) DEFAULT 10.00,  -- 10% default
  
  -- Status
  status TEXT DEFAULT 'pending',               -- pending/active/suspended
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Logica comisioane:**
```javascript
// Exemplu calcul preț pentru agenție
const publicPrice = 5000;           // EUR
const commissionRate = 10;          // %
const agencyPrice = publicPrice - (publicPrice * commissionRate / 100);
// agencyPrice = 4500 EUR

// Ce vede agenția:
// - Preț: 4500 EUR
// - Comision câștigat: 500 EUR (după confirmare)
```

---

#### 4. pre_bookings
```sql
CREATE TABLE pre_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  circuit_id UUID REFERENCES circuits(id) ON DELETE RESTRICT,
  departure_id UUID REFERENCES departures(id) ON DELETE RESTRICT,
  
  -- Booking details
  num_adults INTEGER NOT NULL DEFAULT 2,
  num_children INTEGER DEFAULT 0,
  room_type TEXT NOT NULL,                     -- double/single/triple
  
  -- Passenger details
  passengers JSONB NOT NULL,                   -- [{name, age, passport}]
  
  -- Pricing
  price_per_person DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  agency_commission DECIMAL(10,2),             -- Comisionul agenției
  
  -- Status workflow
  status TEXT DEFAULT 'pending',               -- pending/validated/rejected/confirmed/cancelled
  
  -- Validation
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID,                           -- J'Info admin user ID
  validation_notes TEXT,
  
  -- Notes
  agency_notes TEXT,
  admin_notes TEXT,
  
  -- External sync
  qtravel_booking_id TEXT,                     -- ID din qTravel când e confirmat
  synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prebookings_agency ON pre_bookings(agency_id);
CREATE INDEX idx_prebookings_status ON pre_bookings(status);
CREATE INDEX idx_prebookings_circuit ON pre_bookings(circuit_id);
```

**Status Flow:**
```
PENDING → VALIDATED → CONFIRMED → COMPLETED
   ↓           ↓
REJECTED   CANCELLED
```

**Exemplu date:**
```json
{
  "id": "uuid",
  "agency_id": "agency-uuid",
  "circuit_id": "circuit-uuid",
  "departure_id": "departure-uuid",
  "num_adults": 2,
  "num_children": 1,
  "room_type": "double",
  "passengers": [
    {"name": "Ion Popescu", "age": 45, "passport": "RO123456"},
    {"name": "Maria Popescu", "age": 42, "passport": "RO123457"},
    {"name": "Andrei Popescu", "age": 10, "passport": "RO123458"}
  ],
  "price_per_person": 2439,
  "total_price": 7317,
  "agency_commission": 813,
  "status": "pending",
  "agency_notes": "Client doreste loc la geam"
}
```

---

### Row Level Security (RLS)

Supabase folosește RLS pentru securitate la nivel de rând:

```sql
-- Circuits: Toate agențiile pot citi
CREATE POLICY "Circuits are viewable by authenticated agencies"
  ON circuits FOR SELECT
  TO authenticated
  USING (true);

-- Pre-bookings: Vezi doar pre-rezervările propriei agenții
CREATE POLICY "Agencies can view own pre-bookings"
  ON pre_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can create pre-bookings"
  ON pre_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = agency_id);
```

---

## 🔐 AUTENTIFICARE & ROLURI

### Supabase Auth
Folosim **Supabase Auth** built-in cu următoarele features:
- Email/password authentication
- JWT tokens
- Password reset
- Email confirmation (opțional pentru pilot)

### Roluri în sistem

#### 1. Agency User (Agenție Partner)
**Permissions:**
- ✅ Browse toate circuitele
- ✅ View prețuri cu comision aplicat
- ✅ Create pre-rezervări
- ✅ View propriile pre-rezervări
- ✅ Edit pre-rezervări în status "pending"
- ❌ NU poate vedea alte agenții
- ❌ NU poate valida/aproba

**Flow înregistrare:**
```
1. Completează formular → status: "pending"
2. J'Info Admin primește notificare
3. Admin verifică datele → Approve/Reject
4. Dacă approved → status: "active" + email către agenție
5. Agenția poate face login
```

#### 2. J'Info Admin
**Permissions:**
- ✅ View toate pre-rezervările (toate agențiile)
- ✅ Validate/Reject pre-rezervări
- ✅ Approve/Suspend agenții
- ✅ Edit commission rates
- ✅ View analytics & reports
- ✅ Manage campaigns (viitor)

---

## 📊 WORKFLOW PRE-REZERVĂRI

###Flow Complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. AGENȚIA: Browse & Select                                    │
│    - Caută circuit Ecuador-Galapagos                           │
│    - Vede preț: 2439 EUR/persoană (cu comision 10% dedus)     │
│    - Selectează plecare: 15 Mar 2026                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. AGENȚIA: Create Pre-booking                                 │
│    - Completează formular:                                     │
│      * 2 adulți + 1 copil                                      │
│      * Cameră dublă                                            │
│      * Date pasageri (nume, vârstă, pașaport)                 │
│      * Note speciale                                           │
│    - Sistem calculează automat: 7317 EUR total                │
│    - Submit → Status: PENDING                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. EMAIL NOTIFICATION → J'Info Admin                           │
│    Subject: "Nouă pre-rezervare #1234"                        │
│    - Circuit: Ecuador-Galapagos                               │
│    - Agenție: Travel Pro SRL                                   │
│    - Persoane: 2 adulți + 1 copil                             │
│    - Total: 7317 EUR                                           │
│    - Link: Dashboard pentru validare                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. J'INFO ADMIN: Review & Validate                            │
│    - Verifică disponibilitate în qTravel                      │
│    - Verifică istoric agenție                                 │
│    - Opțiuni:                                                 │
│      [✅ VALIDATE] → Status: VALIDATED + Email agenție        │
│      [❌ REJECT] → Status: REJECTED + Motiv + Email           │
│      [📧 REQUEST INFO] → Email cu întrebări                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. EMAIL → Agenție (dacă VALIDATED)                           │
│    Subject: "Pre-rezervare #1234 validată!"                   │
│    - Circuit confirmat                                         │
│    - Preț final: 7317 EUR                                     │
│    - Next steps: Confirmă cu clientul                         │
│    - Deadline: 48h pentru confirmare finală                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. AGENȚIA: Confirmă cu clientul                              │
│    - Primește avans de la client                              │
│    - Marchează în portal: "Client confirmed"                  │
│    - Status rămâne VALIDATED                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. J'INFO: Booking în qTravel                                 │
│    - Face rezervarea efectivă în qTravel                      │
│    - Primește booking ID (ex: QT-2026-001234)                 │
│    - Update în portal:                                         │
│      * Status: CONFIRMED                                       │
│      * qtravel_booking_id: "QT-2026-001234"                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. EMAIL FINAL → Agenție                                      │
│    Subject: "Rezervare confirmată #1234"                      │
│    - Booking ID qTravel: QT-2026-001234                       │
│    - Voucher atașat (PDF)                                     │
│    - Comision câștigat: 813 EUR                               │
└─────────────────────────────────────────────────────────────────┘
```

### Cazuri Speciale

#### Reject Pre-booking
```
Admin → [REJECT] → Selectează motiv:
  - Circuit sold-out
  - Preț modificat
  - Date invalide
  - Altul (free text)
  
→ Email către agenție cu explicații
→ Status: REJECTED
→ Agenția poate crea o nouă pre-rezervare
```

#### Cancel Pre-booking
```
Agenție → [CANCEL] (doar dacă status = PENDING sau VALIDATED)
→ Motiv: "Client a renunțat"
→ Status: CANCELLED
→ Email notificare către J'Info
```

---

## 🎨 UI/UX DESIGN PRINCIPLES

### Design System
- **Culori brand J'Info:**
  - Primary: `#2E3198` (albastru)
  - Secondary: `#F48022` (portocaliu)
  - Success: `#22C55E` (verde)
  - Warning: `#F59E0B` (galben)
  - Error: `#EF4444` (roșu)

- **Typography:**
  - Headings: Inter (sans-serif)
  - Body: Inter
  - Monospace: JetBrains Mono (pentru cod/IDs)

- **Spacing:** Tailwind default (4px base)

### Componente UI (shadcn/ui)
```typescript
// Instalate/De instalat:
- Button
- Card
- Badge
- Dialog
- Form
- Input
- Select
- Table
- Tabs
- Toast (notifications)
- Alert
- Skeleton (loading states)
```

### Responsive Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Page Layouts

#### Homepage (Public)
```
┌──────────────────────────────────────────┐
│  HEADER                                  │
│  [Logo]  Circuite  Contact  [Login]     │
├──────────────────────────────────────────┤
│                                          │
│  HERO SECTION                            │
│  Portal B2B pentru Agenții Partenere    │
│  [Înregistrează-te] [Login]             │
│                                          │
├──────────────────────────────────────────┤
│  FEATURES                                │
│  [Icon] 95 Circuite  [Icon] Comisioane  │
│  [Icon] Pre-rezervări  [Icon] Support   │
└──────────────────────────────────────────┘
```

#### Dashboard (Agency)
```
┌──────────────────────────────────────────┐
│  SIDEBAR          │  MAIN CONTENT        │
│                   │                      │
│  Dashboard        │  📊 Overview         │
│  Circuite         │  ─────────────       │
│  Pre-rezervări    │  Pending: 3          │
│  Rapoarte         │  Validated: 5        │
│  Profil           │  Confirmed: 12       │
│                   │                      │
│  [Logout]         │  📈 This Month       │
│                   │  Comisioane: 2.450€  │
└──────────────────────────────────────────┘
```

#### Circuit Details
```
┌──────────────────────────────────────────┐
│  [← Back]    Ecuador - Galapagos        │
├──────────────────────────────────────────┤
│  [Gallery Carousel]                      │
├──────────────────────────────────────────┤
│  12 nopti | 5 continente                │
│                                          │
│  💰 PREȚURI (cu comisionul tău 10%)     │
│  ─────────────────────────────────       │
│  Cameră dublă:  2.439 EUR/pers          │
│  Cameră single: 3.047 EUR               │
│  Copil:         6.950 EUR               │
│                                          │
│  ℹ️ Comisionul tău: 271 EUR/persoană   │
│                                          │
│  📅 PLECĂRI DISPONIBILE                 │
│  ─────────────────────────────────       │
│  [Expand] 15 Mar - 27 Mar 2026          │
│    Status: Confirmat ✅                 │
│    Preț: 2.439 EUR                      │
│    [PRE-REZERVĂ]                        │
│                                          │
│  [Expand] 22 Apr - 04 Mai 2026          │
│    Status: Tentativ ⚠️                  │
│    Preț: 2.439 EUR                      │
│    [PRE-REZERVĂ]                        │
└──────────────────────────────────────────┘
```

---

## 🔄 SCRAPING & DATA SYNC

### Scraper Existent (v2_optimized)

**Locație:** `/scraper/scraper_v2_optimized.js`

**Ce face:**
- Extrage toate circuitele din 5 continente
- Parse prețuri românești (format: "5.650,00" → 5650)
- Extrage plecări din tabele
- Salvează galerii imagini
- Generează JSON structurat

**Rulare:**
```bash
cd scraper/
node scraper_v2_optimized.js
# Durată: ~40-60 minute
# Output: circuits_data_complete.json (95 circuite)
```

**Date extrase per circuit:**
```json
{
  "id": "1355",
  "name": "Ecuador - Galapagos",
  "slug": "ecuador-galapagos",
  "continent": "america",
  "url": "https://www.jinfotours.ro/circuite/detalii/ecuador-galapagos",
  "title": "Ecuador si Galapagos - Experienta in Jungla Amazonului",
  "nights": "12 nopti",
  "mainImage": "https://...",
  "gallery": ["url1", "url2", ...],
  "prices": {
    "double": 2706,
    "single": 3386,
    "triple": null,
    "child": 7722,
    "allOptions": [...]
  },
  "departures": [
    {
      "departureDate": "2026-03-15",
      "returnDate": "2026-03-27",
      "roomType": "double",
      "price": 2706,
      "status": "disponibil"
    }
  ],
  "shortDescription": "...",
  "lastScraped": "2026-01-20T10:30:00Z"
}
```

### Sync Strategy (Viitor)

**Opțiunea 1: Manual (pentru început)**
```bash
# Când apar circuite noi sau prețuri actualizate:
cd scraper/
node scraper_v2_optimized.js
node import_to_supabase.js  # Script de creat
```

**Opțiunea 2: Cron Job (automatizat)**
```javascript
// Vercel Cron (când e pe Pro plan)
// vercel.json
{
  "crons": [{
    "path": "/api/sync-circuits",
    "schedule": "0 2 * * *"  // Zilnic la 2 AM
  }]
}

// app/api/sync-circuits/route.ts
export async function GET(req: Request) {
  // Verifică auth (secret token)
  // Rulează scraper
  // Update Supabase
  // Return status
}
```

**Opțiunea 3: qTravel API (ideal, dacă devine disponibil)**
```typescript
// Dacă Acqua Development oferă API
const circuits = await fetch('https://qtravel.api/circuits')
const departures = await fetch('https://qtravel.api/departures')
// Sync direct în Supabase
```

---

## 🚀 DEPLOYMENT & CI/CD

### Vercel Configuration

**vercel.json**
```json
{
  "buildCommand": "cd b2b-portal && npm run build",
  "outputDirectory": "b2b-portal/.next",
  "installCommand": "cd b2b-portal && npm install",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./b2b-portal"
}
```

**Environment Variables (Vercel Dashboard)**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # SECRET!

# Resend (Email)
RESEND_API_KEY=re_xxx  # SECRET!

# App
NEXT_PUBLIC_APP_URL=https://jinfo-b2b-platform.vercel.app

# Admin (pentru testing)
ADMIN_EMAIL=admin@jinfotours.ro
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/agency-dashboard
# ... develop ...
git add .
git commit -m "feat: add agency dashboard"
git push origin feature/agency-dashboard

# Create PR on GitHub
# Review & merge to main
# Vercel auto-deploys main → production
```

### Deployment URLs

**Production:** https://jinfo-b2b-platform.vercel.app
**Preview:** https://jinfo-b2b-platform-git-[branch].vercel.app (auto pentru fiecare PR)

---

## 📧 EMAIL TEMPLATES (Resend)

### Template 1: Pre-booking Created (către J'Info)
```html
Subject: 🔔 Nouă Pre-rezervare #{{booking_id}}

Agenția {{agency_name}} a creat o nouă pre-rezervare:

Circuit: {{circuit_name}}
Plecare: {{departure_date}}
Persoane: {{num_adults}} adulți + {{num_children}} copii
Total: {{total_price}} EUR
Comision agenție: {{commission}} EUR

[Validează Pre-rezervarea] [Vezi Detalii]
```

### Template 2: Pre-booking Validated (către Agenție)
```html
Subject: ✅ Pre-rezervare #{{booking_id}} Validată

Bună {{agency_name}},

Pre-rezervarea ta pentru {{circuit_name}} a fost validată!

Detalii:
- Plecare: {{departure_date}}
- Return: {{return_date}}
- Persoane: {{num_adults}} adulți + {{num_children}} copii
- Preț total: {{total_price}} EUR
- Comisionul tău: {{commission}} EUR

Next steps:
1. Confirmă cu clientul în următoarele 48h
2. Primește avansul
3. Anunță-ne pentru confirmare finală

[Vezi Pre-rezervarea] [Contact Support]
```

### Template 3: Pre-booking Rejected
```html
Subject: ❌ Pre-rezervare #{{booking_id}} Respinsă

Din păcate, pre-rezervarea ta nu a putut fi validată.

Motiv: {{rejection_reason}}

Poți crea o nouă pre-rezervare sau ne poți contacta pentru detalii.

[Caută Alt Circuit] [Contact Support]
```

---

## 📊 ANALYTICS & REPORTING

### Metrics pentru J'Info Admin

**Dashboard Overview:**
```
┌──────────────────────────────────────────┐
│  📊 TODAY                                │
│  Pre-rezervări: 5                        │
│  Validări: 3                             │
│  Confirmate: 2                           │
│  Revenue estimate: 15.000 EUR            │
├──────────────────────────────────────────┤
│  📈 THIS MONTH                           │
│  Pre-rezervări: 47                       │
│  Conversion rate: 68%                    │
│  Top agenție: Travel Pro (12 bookings)  │
│  Top circuit: Bali (8 bookings)         │
└──────────────────────────────────────────┘
```

**Reports:**
- Pre-rezervări per agenție (săptămânal/lunar)
- Circuite cele mai solicitate
- Conversion rate (pre-booking → confirmed)
- Comisioane plătite/de plătit
- Revenue forecast

### Metrics pentru Agenții

```
┌──────────────────────────────────────────┐
│  💰 COMISIOANE LUNA ACEASTA              │
│  Confirmate: 2.450 EUR                   │
│  Pending: 650 EUR                        │
│  Total estimate: 3.100 EUR               │
├──────────────────────────────────────────┤
│  📊 PRE-REZERVĂRI                        │
│  Pending: 3                              │
│  Validated: 5                            │
│  Confirmed: 12                           │
│  Rejected: 1                             │
└──────────────────────────────────────────┘
```

---

## 🧪 TESTING STRATEGY

### Unit Tests (Viitor)
```typescript
// Jest + React Testing Library
// Exemple de ce trebuie testat:

// 1. Commission calculation
test('calculates agency price correctly', () => {
  const publicPrice = 5000;
  const commissionRate = 10;
  const agencyPrice = calculateAgencyPrice(publicPrice, commissionRate);
  expect(agencyPrice).toBe(4500);
});

// 2. Pre-booking total
test('calculates total price for family', () => {
  const pricePerAdult = 2439;
  const priceChild = 6950;
  const total = calculateTotal(2, 1, pricePerAdult, priceChild);
  expect(total).toBe(11828); // 2*2439 + 6950
});

// 3. Date validation
test('validates departure date is in future', () => {
  const departureDate = '2026-03-15';
  expect(isValidDepartureDate(departureDate)).toBe(true);
});
```

### Integration Tests
```typescript
// 1. Auth flow
test('agency can register and login', async () => {
  await registerAgency({email, password, companyName});
  // Status should be 'pending'
  
  await adminApproveAgency(agencyId);
  // Status should be 'active'
  
  const user = await login(email, password);
  expect(user.status).toBe('active');
});

// 2. Pre-booking flow
test('creates pre-booking successfully', async () => {
  const booking = await createPreBooking({
    circuitId,
    departureId,
    numAdults: 2
  });
  
  expect(booking.status).toBe('pending');
  // Email should be sent to admin
});
```

### Manual Testing Checklist

**Pre-launch:**
- [ ] Register agenție → approve → login
- [ ] Browse circuite → filtre funcționează
- [ ] Create pre-booking → validare → confirmare
- [ ] Reject pre-booking → email trimis
- [ ] Cancel pre-booking
- [ ] Admin dashboard → toate metrics afișate
- [ ] Mobile responsive (toate paginile)
- [ ] Email notifications (toate tipurile)

---

## 🔒 SECURITATE & BEST PRACTICES

### Security Checklist

**Authentication:**
- ✅ JWT tokens (Supabase Auth)
- ✅ Password hashing (bcrypt via Supabase)
- ✅ Email verification (opțional pentru pilot)
- ✅ Rate limiting pe login (Supabase built-in)

**Authorization:**
- ✅ Row Level Security (RLS) în Supabase
- ✅ API routes protected cu middleware
- ✅ Admin routes extra-protected

**Data Protection:**
- ✅ Environment variables pentru secrets
- ✅ HTTPS only (Vercel default)
- ✅ CORS configured
- ✅ SQL injection prevention (Supabase parameterized queries)
- ✅ XSS prevention (React auto-escaping)

**Privacy:**
- ✅ GDPR compliant (data deletion on request)
- ✅ Passenger data encrypted at rest (Supabase default)
- ✅ Audit log pentru acțiuni admin

### Error Handling

```typescript
// Example: API route error handling
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    if (!body.circuitId) {
      return Response.json(
        { error: 'Circuit ID required' },
        { status: 400 }
      );
    }
    
    // Business logic
    const booking = await createPreBooking(body);
    
    return Response.json(booking, { status: 201 });
    
  } catch (error) {
    console.error('Create booking error:', error);
    
    // Don't expose internal errors to client
    return Response.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
```

---

## 📚 RESOURCES & DOCUMENTATION

### External Documentation
- **Next.js:** https://nextjs.org/docs
- **Supabase:** https://supabase.com/docs
- **Vercel:** https://vercel.com/docs
- **Resend:** https://resend.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs

### Internal Documentation (De creat)
- [ ] API Documentation (toate endpoint-urile)
- [ ] Database Schema Diagram
- [ ] User Guides:
  - [ ] Ghid Agenții: Cum folosești platforma
  - [ ] Ghid Admin: Workflow validări
- [ ] Troubleshooting Guide
- [ ] FAQ pentru agenții

---

## 🎯 ROADMAP & PRIORITIES

### FAZA 1: ✅ COMPLETĂ (Data Scraping)
- ✅ Scraper funcțional pentru toate continentele
- ✅ 95 circuite extrase complet
- ✅ JSON structurat și validat
- ✅ Git repository setup
- ✅ Deployment Vercel basic

### FAZA 2: 🔄 ÎN CURS (Infrastructure)
**Săptămâna 1-2: Setup**
- [ ] Supabase project setup
- [ ] Database schema migration
- [ ] Seed database cu circuite
- [ ] Next.js project cu TypeScript
- [ ] shadcn/ui installation
- [ ] Environment variables configuration

**Săptămâna 3-4: Portal B2B**
- [ ] Auth pages (login, register)
- [ ] Circuits browse page
- [ ] Circuit details page
- [ ] Pre-booking form
- [ ] My bookings page

**Săptămâna 5-6: Admin Panel**
- [ ] Admin dashboard
- [ ] Pre-bookings management
- [ ] Agency management
- [ ] Analytics & reports

**Săptămâna 7: Testing**
- [ ] Manual testing checklist
- [ ] Bug fixing
- [ ] Performance optimization
- [ ] Security audit

**Săptămâna 8: Pilot Launch**
- [ ] Training 2-3 agenții pilot
- [ ] User guide documentation
- [ ] Monitor & collect feedback
- [ ] Iterate based on feedback

### FAZA 3: Post-MVP (3-6 luni)
- [ ] PDF export pre-rezervări
- [ ] Advanced filters (multi-select)
- [ ] Favorite circuits
- [ ] Bulk operations admin
- [ ] SMS notifications (Twilio)
- [ ] Mobile app (React Native)

### FAZA 4: Advanced (6-12 luni)
- [ ] qTravel API integration (dacă devine disponibil)
- [ ] Dynamic pricing & campaigns
- [ ] Loyalty program
- [ ] Multi-currency support
- [ ] White-label pentru agenții mari

---

## 🐛 KNOWN ISSUES & LIMITATIONS

### Current Limitations

**Data Sync:**
- Manual re-scraping când apar circuite noi
- Prețurile pot fi outdated între scraping-uri
- Plecări tentative pot deveni confirmate fără update

**Workaround:** Re-scraping săptămânal sau când J'Info anunță modificări

**qTravel Integration:**
- Nu avem API direct (doar scraping)
- Booking-urile finale se fac manual în qTravel
- ID-uri din qTravel se adaugă manual în portal

**Workaround:** Proces manual până când/dacă API devine disponibil

**Email Delivery:**
- FREE tier Resend: 3,000 emails/lună
- Dacă depășim limita, trebuie upgrade la $20/lună

**Workaround:** Monitor usage, upgrade când e necesar

### Bug Tracking

**Folosim GitHub Issues pentru:**
- Bugs raportate
- Feature requests
- Technical debt

**Labels:**
- `bug` - Funcționalitate spartă
- `enhancement` - Feature nou
- `documentation` - Lipsă documentație
- `priority:high` - Urgent
- `priority:low` - Nice to have

---

## 💬 SUPPORT & CONTACT

### Development Team
- **Lead Developer:** Gigi Bardan
- **Tech Stack:** Claude AI (Anthropic)
- **Project Management:** GitHub Projects

### J'Info Tours Contact
- **Website:** https://www.jinfotours.ro
- **Email:** info@jinfotours.ro
- **Phone:** (contact info)

### Acqua Development (qTravel)
- **Pentru API access/documentation**
- **Contact:** (când e necesar)

---

## 📝 CHANGELOG

### [2026-01-20] - Project Initialization
- Created project structure
- Setup Git repository
- Deployed basic Next.js to Vercel
- Documented complete architecture

### [Coming Soon] - Supabase Setup
- Database migration
- Seed circuits data
- Auth configuration

---

## 🎓 LEARNING RESOURCES

### Pentru dezvoltatori noi pe proiect:

**Must Read:**
1. Acest document (PROJECT_KNOWLEDGE.md)
2. Next.js App Router tutorial
3. Supabase quick start
4. TypeScript basics

**Recommended:**
- React Server Components
- Tailwind CSS fundamentals
- PostgreSQL basics
- JWT authentication

**Tools:**
- VS Code cu extensii: ESLint, Prettier, Tailwind IntelliSense
- GitHub Desktop (optional)
- Postman/Insomnia pentru API testing

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-20  
**Maintained By:** Gigi Bardan  
**Status:** Living Document (va fi actualizat periodic)
