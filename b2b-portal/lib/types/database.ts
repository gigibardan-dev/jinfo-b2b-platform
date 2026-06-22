export type Departure = {
  id: string
  circuit_id: string
  departure_date: string
  return_date: string
  room_type: string
  price: number | null
  status: string
  min_participants: number
  available_spots: number | null
  created_at: string
  updated_at: string
}

export type Circuit = {
  id: string
  external_id: string
  slug: string
  name: string
  continent: string
  nights: string | null
  title: string | null
  url: string | null
  main_image: string | null
  gallery: string[]
  short_description: string | null
  price_double: number | null
  price_single: number | null
  price_triple: number | null
  price_child: number | null
  price_options: any[]
  // ── Sistem reduceri ──────────────────────────────
  is_discounted: boolean            // true dacă are reducere activă
  discount_percentage: number | null // ex: 10 = 10%, null dacă fără reducere
  discount_valid_until: string | null // ISO string, null = fără expirare
  // ─────────────────────────────────────────────────
  is_active: boolean
  last_scraped: string | null
  created_at: string
  updated_at: string
  departures?: Departure[]
}

export type CircuitWithDepartures = Circuit & {
  departures: Departure[]
}

// ── Helpers pentru calculul prețurilor reduse ────────────────────────────────
// Rotunjire matematică standard (0.5 → sus)
export function applyDiscount(price: number | null, discountPercentage: number | null): number | null {
  if (!price || !discountPercentage) return price
  return Math.round(price * (1 - discountPercentage / 100))
}

// Returnează prețurile efective (reduse dacă e cazul)
export function getEffectivePrices(circuit: Circuit) {
  const disc = circuit.is_discounted ? circuit.discount_percentage : null
  return {
    double: applyDiscount(circuit.price_double, disc),
    single: applyDiscount(circuit.price_single, disc),
    triple: applyDiscount(circuit.price_triple, disc),
    child:  applyDiscount(circuit.price_child,  disc),
  }
}

// Calculează comisionul agenției din prețul redus (nu din cel original)
export function getAgencyCommission(
  price: number | null,
  commissionRate: number // ex: 10 = 10%
): number | null {
  if (!price) return null
  return Math.round(price * commissionRate / 100)
}