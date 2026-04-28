# J'Info B2B Platform — Documentație API v1

## Introducere

Bună Alex,

Am implementat endpoint-urile API pe baza discuției noastre. Documentația de mai jos reflectă structura actuală a platformei, construită pe datele și logica de business pe care le gestionăm deja intern.

**Despre datele circuitelor:** În prezent, datele (prețuri, date de plecare, disponibilități) sunt populate prin scraping din jinfotours.ro și stocate într-o bază de date PostgreSQL. Pentru volumul actual (~101 circuite), procesul de actualizare este rapid și funcționează bine. Pe termen lung însă, un feed direct din qTravel ar fi mai eficient și ar elimina complet necesitatea scraping-ului — datele ar fi mereu sincronizate în timp real. Dacă există o astfel de posibilitate din partea voastră, suntem deschiși să discutăm.

Consideră această versiune un **punct de start** — nu o soluție finală. Suntem deschiși să adăugăm sau să scoatem câmpuri, să ajustăm formatul răspunsurilor, sau să intervenim în orice punct al API-ului pentru a ne sincroniza cât mai bine cu ceea ce QuickSell poate consuma și trimite.

Dacă ai sugestii, modificări sau câmpuri suplimentare de care ai nevoie, spune-ne și le implementăm.

---

## Autentificare

Toate request-urile necesită header-ul:

```
X-API-Key: {cheia_furnizata_de_jinfo}
```

Fără acest header, toate endpoint-urile returnează `401 Unauthorized`.

> **Notă:** Momentan folosim API Key simplu în header — simplu și robust pentru integrare server-to-server. Dacă preferi OAuth2 sau JWT, putem implementa.

---

## Base URL

```
https://b2b.jinfotours.ro/api/v1
```

---

## Endpoint-uri disponibile

---

### 1. Lista circuite active

```
GET /circuits
```

Returnează toate circuitele active cu prețuri și date de plecare disponibile.

**Query params opționali:**

| Param | Tip | Descriere |
|-------|-----|-----------|
| `continent` | string | Filtrează după continent: `europa`, `africa`, `america`, `asia`, `oceania` |
| `search` | string | Caută în numele circuitului |
| `page` | number | Pagina curentă (default: 1) |
| `limit` | number | Rezultate per pagină (default: 20, max: 100) |

**Exemplu request:**

```bash
curl -H "X-API-Key: {api_key}" \
  "https://b2b.jinfotours.ro/api/v1/circuits?continent=europa&page=1&limit=20"
```

**Exemplu răspuns:**

```json
{
  "success": true,
  "data": {
    "circuits": [
      {
        "id": "253",
        "slug": "andaluzia-5-nopti",
        "name": "Andaluzia - Circuit 5 nopți",
        "title": "Circuit Andaluzia - Circuit 5 nopți",
        "continent": "europa",
        "nights": "5 nopti",
        "url": "https://www.jinfotours.ro/circuite/detalii/andaluzia-5-nopti",
        "image": "http://ibe.jinfotours.ro/resources/7/items_images/78c86aa.jpg",
        "description": "Întâlnire cu reprezentantul J'Info Tours...",
        "prices": {
          "double": 1450,
          "single": 2110,
          "triple": 1450,
          "child": 3927,
          "options": [
            { "type": "Persoana in camera dubla", "price": 1450, "currency": "EUR", "info": "un adult" },
            { "type": "Loc in camera single", "price": 2110, "currency": "EUR", "info": "un adult" }
          ]
        },
        "discount": null,
        "departures": [
          {
            "id": "25247ab5-e7ad-4ba9-944f-edb2b969dd05",
            "departure_date": "2026-04-29",
            "return_date": "2026-05-04",
            "room_type": "double",
            "price": 1450,
            "status": "available",
            "available_spots": null
          }
        ],
        "last_updated": "2026-02-23T12:28:36.827Z"
      }
    ],
    "pagination": {
      "total": 101,
      "page": 1,
      "limit": 20,
      "pages": 6
    }
  }
}
```

---

### 2. Detalii circuit

```
GET /circuits/{slug}
```

Returnează toate detaliile unui circuit, inclusiv galeria foto și toate datele de plecare.

**Parametru URL:**

| Param | Descriere |
|-------|-----------|
| `slug` | Identificatorul unic al circuitului (ex: `andaluzia-5-nopti`) |

**Exemplu request:**

```bash
curl -H "X-API-Key: {api_key}" \
  "https://b2b.jinfotours.ro/api/v1/circuits/andaluzia-5-nopti"
```

**Exemplu răspuns:**

```json
{
  "success": true,
  "data": {
    "circuit": {
      "id": "253",
      "slug": "andaluzia-5-nopti",
      "name": "Andaluzia - Circuit 5 nopți",
      "continent": "europa",
      "nights": "5 nopti",
      "image": "http://ibe.jinfotours.ro/resources/7/items_images/78c86aa.jpg",
      "gallery": [
        "http://ibe.jinfotours.ro/resources/7/items_images/78c86aa.jpg",
        "http://ibe.jinfotours.ro/resources/7/items_images/50ea9ab.jpg"
      ],
      "description": "Întâlnire cu reprezentantul J'Info Tours...",
      "prices": {
        "double": 1450,
        "single": 2110,
        "triple": 1450,
        "child": 3927,
        "options": []
      },
      "discount": null,
      "availability": {
        "total_departures": 3,
        "available_departures": 3,
        "next_departure": {
          "date": "2026-04-29",
          "return_date": "2026-05-04",
          "price": 1450,
          "status": "available"
        }
      },
      "departures": [
        {
          "id": "25247ab5-e7ad-4ba9-944f-edb2b969dd05",
          "departure_date": "2026-04-29",
          "return_date": "2026-05-04",
          "room_type": "double",
          "price": 1450,
          "status": "available",
          "available_spots": null,
          "min_participants": 10
        }
      ],
      "last_updated": "2026-02-23T12:28:36.827Z"
    }
  }
}
```

---

### 3. Creare rezervare

```
POST /bookings
```

Creează o pre-rezervare în platforma J'Info B2B. Rezervarea intră cu statusul `pending` și este procesată de echipa J'Info Tours.

**Headers:**

```
X-API-Key: {api_key}
Content-Type: application/json
```

**Body — câmpuri obligatorii:**

| Câmp | Tip | Descriere |
|------|-----|-----------|
| `departure_id` | string (UUID) | ID-ul plecării din `GET /circuits/{slug}` |
| `agency_email` | string | Email-ul agenției înregistrate în platformă |
| `num_adults` | number | Număr adulți (minim 1) |
| `room_type` | string | Tip cameră: `double`, `single`, `triple` |
| `passengers` | array | Lista pasagerilor |

**Body — câmpuri opționale:**

| Câmp | Tip | Descriere |
|------|-----|-----------|
| `num_children` | number | Număr copii (default: 0) |
| `agency_notes` | string | Notițe suplimentare |
| `qtravel_booking_id` | string | ID-ul rezervării din QuickSell (pentru tracking) |

**Format pasager:**

```json
{
  "name": "Ion Popescu",
  "age": "35",
  "passport": "RO123456"
}
```

**Exemplu request:**

```bash
curl -X POST "https://b2b.jinfotours.ro/api/v1/bookings" \
  -H "X-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "departure_id": "25247ab5-e7ad-4ba9-944f-edb2b969dd05",
    "agency_email": "agentie@example.com",
    "num_adults": 2,
    "num_children": 0,
    "room_type": "double",
    "passengers": [
      { "name": "Ion Popescu", "age": "35", "passport": "RO123456" },
      { "name": "Maria Popescu", "age": "32", "passport": "RO654321" }
    ],
    "agency_notes": "Preferință etaj superior",
    "qtravel_booking_id": "QT-2026-XXXXX"
  }'
```

**Exemplu răspuns succes (201):**

```json
{
  "success": true,
  "data": {
    "booking_number": "JI-2026-00011",
    "booking_id": "ea734b78-b879-46a9-868c-ffc8db305bc2",
    "status": "pending",
    "agency": "Nume Agenție SRL",
    "circuit_departure": "2026-04-29",
    "total_price": 2900,
    "agency_commission": 290,
    "created_at": "2026-04-28T15:45:26.743Z",
    "message": "Rezervarea a fost creată cu succes și așteaptă aprobare din partea J'Info Tours."
  }
}
```

---

### 4. Status rezervare

```
GET /bookings/{booking_number}
```

Returnează statusul complet al unei rezervări. Permite QuickSell să verifice în orice moment dacă o rezervare a fost aprobată, respinsă sau este în așteptare — fără a fi nevoie de comunicare telefonică.

**Parametru URL:**

| Param | Descriere |
|-------|-----------|
| `booking_number` | Numărul rezervării returnat la creare (ex: `JI-2026-00011`) |

> **Notă:** Câmpul este case-insensitive — `JI-2026-00011` și `ji-2026-00011` returnează același rezultat.

**Exemplu request:**

```bash
curl -H "X-API-Key: {api_key}" \
  "https://b2b.jinfotours.ro/api/v1/bookings/JI-2026-00011"
```

**Exemplu răspuns:**

```json
{
  "success": true,
  "data": {
    "booking": {
      "booking_number": "JI-2026-00011",
      "booking_id": "ea734b78-b879-46a9-868c-ffc8db305bc2",
      "qtravel_booking_id": "QT-2026-TEST-001",
      "status": "pending",
      "status_message": "Rezervare în așteptare — echipa J'Info Tours o va procesa în curând.",
      "circuit": {
        "name": "Andaluzia - Circuit 5 nopți",
        "slug": "andaluzia-5-nopti",
        "continent": "europa",
        "nights": "5 nopti"
      },
      "departure": {
        "departure_date": "2026-04-29",
        "return_date": "2026-05-04",
        "price_per_person": 1450
      },
      "agency": {
        "name": "Nume Agenție SRL",
        "email": "agentie@example.com"
      },
      "travelers": {
        "num_adults": 2,
        "num_children": 0,
        "room_type": "double"
      },
      "financials": {
        "total_price": 2900,
        "agency_commission": 290,
        "advance_amount": 290,
        "amount_paid": 0,
        "balance_due": 2900,
        "advance_deadline": "2026-02-28",
        "final_deadline": "2026-03-15"
      },
      "notes": {
        "agency_notes": "Preferință etaj superior",
        "approval_notes": null,
        "rejection_reason": null
      },
      "timestamps": {
        "created_at": "2026-04-28T15:45:26.743Z",
        "updated_at": "2026-04-28T15:45:26.743Z",
        "approved_at": null,
        "rejected_at": null,
        "cancelled_at": null
      }
    }
  }
}
```

---

### 5. Documentație endpoint bookings

```
GET /bookings
```

Returnează descrierea endpoint-ului POST /bookings cu toate câmpurile acceptate.

---

## Coduri de răspuns

| Cod | Descriere |
|-----|-----------|
| `200` | Succes |
| `201` | Rezervare creată cu succes |
| `400` | Bad Request — câmpuri obligatorii lipsă sau invalide |
| `401` | Unauthorized — API Key lipsă sau invalid |
| `403` | Forbidden — agenție suspendată sau neaprobată |
| `404` | Not Found — circuit, plecare sau rezervare inexistentă |
| `409` | Conflict — plecarea este sold out |
| `422` | Unprocessable Entity — agenție neînregistrată în platformă |
| `500` | Internal Server Error |

---

## Fluxul de integrare recomandat

```
1. QuickSell apelează GET /circuits
   → obține lista circuitelor cu prețuri și disponibilități

2. Utilizatorul selectează un circuit în QuickSell
   → QuickSell apelează GET /circuits/{slug}
   → obține toate datele + departure_id-urile disponibile

3. Utilizatorul completează rezervarea în QuickSell
   → QuickSell apelează POST /bookings cu departure_id + agency_email + pasageri
   → Rezervarea intră automat în platforma J'Info B2B cu status pending
   → Se returnează booking_number

4. QuickSell verifică periodic statusul
   → GET /bookings/{booking_number}
   → Când status devine "approved" → agenția este notificată

5. Echipa J'Info Tours aprobă rezervarea în platforma B2B
   → Agenția primește confirmare
```

---

## Maparea agențiilor

Momentan, sistemul identifică agenția care face rezervarea după **adresa de email** trimisă în request (`agency_email`). Agenția trebuie să fie înregistrată în platforma B2B cu același email folosit în QuickSell.

Dacă o agenție din QuickSell nu este înregistrată în platforma noastră, endpoint-ul returnează `422` cu un mesaj explicit. În acest caz, agenția trebuie înregistrată de echipa J'Info Tours înainte de a putea face rezervări prin API.

> **Întrebare pentru echipa QuickSell:** Această abordare bazată pe email este soluția pe care am implementat-o ca punct de start. Dacă QuickSell are un identificator unic per agenție (ex: un ID intern, CUI, sau alt câmp) pe care îl puteți trimite în request, putem adapta maparea pentru a fi mai robustă. Ce sugerați?

---

## Note tehnice

- Toate prețurile sunt în **EUR**
- Datele sunt în format **ISO 8601** (ex: `2026-04-29`)
- Comunicarea este **server-to-server** — nu sunt necesare configurații CORS
- Comisionul agenției este calculat **server-side** pe baza ratei din platformă — nu se acceptă prețuri sau comisioane din exterior
- Câmpul `available_spots` este momentan `null` — disponibilitățile sunt gestionate manual de echipa J'Info Tours
- Datele circuitelor sunt actualizate periodic prin scraping — pentru ~101 circuite procesul este rapid; un feed direct din qTravel ar putea îmbunătăți sincronizarea pe termen lung

---

## Roadmap

- **Notificări webhook** — când o rezervare este aprobată/respinsă, platforma noastră poate trimite automat un POST către QuickSell cu statusul actualizat, eliminând necesitatea de polling. Pentru implementare avem nevoie de un URL de webhook din partea QuickSell și formatul acceptat de voi.
- Calcul preț copii separat față de adulți
- Endpoint `GET /bookings` — lista rezervărilor per agenție

---

*Documentație generată: aprilie 2026*
*Platformă: J'Info B2B — b2b.jinfotours.ro*
*Contact tehnic: online@jinfotours.ro*
