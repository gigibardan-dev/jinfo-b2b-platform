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
  discount_percentage: number
  discount_valid_from: string | null
  discount_valid_until: string | null
  is_active: boolean
  last_scraped: string | null
  created_at: string
  updated_at: string
  departures?: Departure[]  // ← ADAUGĂ ASTA (opțional, vine din join)
}

export type CircuitWithDepartures = Circuit & {
  departures: Departure[]
}