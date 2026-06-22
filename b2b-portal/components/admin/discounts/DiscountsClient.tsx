'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { applyDiscount } from '@/lib/types/database'

// ── Tipuri locale ────────────────────────────────────────────────────────────

type CircuitRow = {
  id: string
  external_id: string
  slug: string
  name: string
  continent: string
  is_active: boolean
  price_double: number | null
  price_single: number | null
  price_triple: number | null
  price_child: number | null
  is_discounted: boolean
  discount_percentage: number | null
  discount_valid_until: string | null
}

interface DiscountsClientProps {
  circuits: CircuitRow[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CONTINENT_LABELS: Record<string, string> = {
  europa:  '🌍 Europa',
  africa:  '🌍 Africa',
  asia:    '🌏 Asia',
  america: '🌎 America',
  oceania: '🌏 Oceania',
}

function formatDate(isoString: string | null): string {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

function formatPrice(price: number | null): string {
  if (!price) return '—'
  return `${price.toLocaleString('ro-RO')} €`
}

// ── Componenta principală ────────────────────────────────────────────────────

export function DiscountsClient({ circuits }: DiscountsClientProps) {
  const router = useRouter()

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch]                   = useState('')
  const [continentFilter, setContinentFilter] = useState('toate')
  const [statusFilter, setStatusFilter]       = useState('toate') // toate | reduse | normale
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen]         = useState(false)
  const [modalMode, setModalMode]             = useState<'apply' | 'remove'>('apply')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  // ── State modal aplicare ───────────────────────────────────────────────────
  const [discountPercent, setDiscountPercent] = useState<number>(10)
  const [hasExpiry, setHasExpiry]             = useState(false)
  const [expiryDate, setExpiryDate]           = useState('')

  // ── Circuite filtrate ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return circuits.filter(c => {
      const matchSearch    = c.name.toLowerCase().includes(search.toLowerCase())
      const matchContinent = continentFilter === 'toate' || c.continent === continentFilter
      const matchStatus    =
        statusFilter === 'toate'   ? true :
        statusFilter === 'reduse'  ? c.is_discounted :
        !c.is_discounted
      return matchSearch && matchContinent && matchStatus
    })
  }, [circuits, search, continentFilter, statusFilter])

  // ── Statistici rapide ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:   circuits.length,
    reduse:  circuits.filter(c => c.is_discounted).length,
    normale: circuits.filter(c => !c.is_discounted).length,
  }), [circuits])

  // ── Select / Deselect ──────────────────────────────────────────────────────
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  // ── Deschide modal ─────────────────────────────────────────────────────────
  const openApplyModal = (ids?: string[]) => {
    if (ids) setSelectedIds(new Set(ids))
    setModalMode('apply')
    setDiscountPercent(10)
    setHasExpiry(false)
    setExpiryDate('')
    setError(null)
    setIsModalOpen(true)
  }

  const openRemoveModal = (ids?: string[]) => {
    if (ids) setSelectedIds(new Set(ids))
    setModalMode('remove')
    setError(null)
    setIsModalOpen(true)
  }

  // ── Aplică reducere ────────────────────────────────────────────────────────
  const handleApply = async () => {
    if (selectedIds.size === 0) return
    if (discountPercent <= 0 || discountPercent >= 100) {
      setError('Procentul trebuie să fie între 1 și 99.')
      return
    }
    if (hasExpiry && !expiryDate) {
      setError('Selectează o dată de expirare.')
      return
    }
    if (hasExpiry && new Date(expiryDate) <= new Date()) {
      setError('Data de expirare trebuie să fie în viitor.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuitIds:         Array.from(selectedIds),
          discountPercentage: discountPercent,
          validUntil:         hasExpiry ? expiryDate : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare necunoscută')
      }

      setIsModalOpen(false)
      clearSelection()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Șterge reducere ────────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (selectedIds.size === 0) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circuitIds: Array.from(selectedIds) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare necunoscută')
      }

      setIsModalOpen(false)
      clearSelection()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Preview preț redus ─────────────────────────────────────────────────────
  // Afișat în modal când e selectat un singur circuit
  const singlePreview = useMemo(() => {
    if (selectedIds.size !== 1 || modalMode !== 'apply') return null
    const id = Array.from(selectedIds)[0]
    const circuit = circuits.find(c => c.id === id)
    if (!circuit?.price_double) return null
    const newPrice = applyDiscount(circuit.price_double, discountPercent)
    const economy  = circuit.price_double - (newPrice ?? 0)
    return { name: circuit.name, oldPrice: circuit.price_double, newPrice, economy }
  }, [selectedIds, discountPercent, modalMode, circuits])

  // ── Min date pentru datepicker (mâine) ────────────────────────────────────
  const minDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }, [])

  const continents = ['toate', ...Array.from(new Set(circuits.map(c => c.continent))).sort()]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm font-semibold text-gray-600 mt-1">Total Circuite</div>
            </div>
            <div className="text-4xl">🌍</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md border-2 border-orange-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-orange-600">{stats.reduse}</div>
              <div className="text-sm font-semibold text-gray-600 mt-1">Cu Reducere</div>
            </div>
            <div className="text-4xl">🏷️</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.normale}</div>
              <div className="text-sm font-semibold text-gray-600 mt-1">Fără Reducere</div>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* ── Filtre + Căutare ── */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 space-y-3">

        {/* Căutare */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Caută circuit după nume..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none font-medium"
          />
        </div>

        {/* Filtre */}
        <div className="flex flex-wrap gap-2">

          {/* Continent */}
          <div className="flex gap-1 flex-wrap">
            {continents.map(c => (
              <button
                key={c}
                onClick={() => setContinentFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  continentFilter === c
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c === 'toate' ? '🌐 Toate' : CONTINENT_LABELS[c] ?? c}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px bg-gray-200 mx-1" />

          {/* Status reducere */}
          {(['toate', 'reduse', 'normale'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'toate' ? 'Toate statusurile' : s === 'reduse' ? '🏷️ Reduse' : '💰 Normale'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk Actions ── */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-indigo-700 font-bold">
              ✓ {selectedIds.size} {selectedIds.size === 1 ? 'circuit selectat' : 'circuite selectate'}
            </span>
            <button
              onClick={clearSelection}
              className="text-sm text-indigo-500 hover:text-indigo-700 underline"
            >
              Deselectează tot
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openApplyModal()}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-amber-600 transition-all shadow-md"
            >
              🏷️ Aplică Reducere
            </button>
            <button
              onClick={() => openRemoveModal()}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold text-sm hover:from-red-600 hover:to-rose-600 transition-all shadow-md"
            >
              🗑️ Șterge Reducere
            </button>
          </div>
        </div>
      )}

      {/* ── Tabel circuite ── */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">

        {/* Header tabel */}
        <div className="bg-gray-50 border-b-2 border-gray-200 px-6 py-3 flex items-center gap-4">
          <input
            type="checkbox"
            checked={filtered.length > 0 && selectedIds.size === filtered.length}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-600">
            {filtered.length} circuite afișate
          </span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">Niciun circuit găsit pentru filtrele selectate.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(circuit => {
              const isSelected   = selectedIds.has(circuit.id)
              const discountedPrice = circuit.is_discounted
                ? applyDiscount(circuit.price_double, circuit.discount_percentage)
                : null

              return (
                <div
                  key={circuit.id}
                  className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-indigo-50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(circuit.id)}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer flex-shrink-0"
                  />

                  {/* Badge reducere */}
                  <div className="flex-shrink-0 w-8">
                    {circuit.is_discounted && (
                      <span className="text-lg" title="Circuit cu reducere">🏷️</span>
                    )}
                  </div>

                  {/* Nume + continent */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{circuit.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {CONTINENT_LABELS[circuit.continent] ?? circuit.continent}
                    </div>
                  </div>

                  {/* Prețuri */}
                  <div className="flex-shrink-0 text-right min-w-[140px]">
                    {circuit.is_discounted ? (
                      <>
                        <div className="text-sm text-gray-400 line-through">
                          {formatPrice(circuit.price_double)}
                        </div>
                        <div className="font-bold text-orange-600">
                          {formatPrice(discountedPrice)}
                        </div>
                      </>
                    ) : (
                      <div className="font-semibold text-gray-700">
                        {formatPrice(circuit.price_double)}
                      </div>
                    )}
                  </div>

                  {/* Reducere % */}
                  <div className="flex-shrink-0 w-20 text-center">
                    {circuit.is_discounted ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-bold">
                        -{circuit.discount_percentage}%
                      </span>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </div>

                  {/* Valabil până */}
                  <div className="flex-shrink-0 w-28 text-sm text-gray-500 text-center">
                    {circuit.is_discounted
                      ? circuit.discount_valid_until
                        ? formatDate(circuit.discount_valid_until)
                        : <span className="text-green-600 font-medium">Permanent</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </div>

                  {/* Acțiuni */}
                  <div className="flex-shrink-0 flex gap-2">
                    {circuit.is_discounted ? (
                      <>
                        <button
                          onClick={() => openApplyModal([circuit.id])}
                          title="Modifică reducerea"
                          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-all"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openRemoveModal([circuit.id])}
                          title="Șterge reducerea"
                          className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition-all"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openApplyModal([circuit.id])}
                        className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-all"
                      >
                        + Reducere
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal Aplicare / Ștergere ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header modal */}
            <div className={`px-6 py-5 ${
              modalMode === 'apply'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                : 'bg-gradient-to-r from-red-500 to-rose-500'
            }`}>
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'apply'
                  ? `🏷️ Aplică Reducere (${selectedIds.size} ${selectedIds.size === 1 ? 'circuit' : 'circuite'})`
                  : `🗑️ Șterge Reducere (${selectedIds.size} ${selectedIds.size === 1 ? 'circuit' : 'circuite'})`
                }
              </h2>
            </div>

            <div className="p-6 space-y-5">

              {/* ── Conținut modal APPLY ── */}
              {modalMode === 'apply' && (
                <>
                  {/* Procent */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Procent reducere
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={discountPercent}
                        onChange={e => setDiscountPercent(Number(e.target.value))}
                        className="w-24 px-4 py-2 border-2 border-gray-200 rounded-xl text-center text-xl font-bold focus:border-orange-400 focus:outline-none"
                      />
                      <span className="text-2xl font-bold text-gray-500">%</span>
                      {/* Shortcuts rapide */}
                      <div className="flex gap-1 ml-2">
                        {[5, 10, 15, 20, 25].map(p => (
                          <button
                            key={p}
                            onClick={() => setDiscountPercent(p)}
                            className={`px-2 py-1 rounded-lg text-sm font-semibold transition-all ${
                              discountPercent === p
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expirare */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-gray-700">
                        Dată expirare
                      </label>
                      <button
                        onClick={() => setHasExpiry(prev => !prev)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          hasExpiry ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          hasExpiry ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    {hasExpiry && (
                      <input
                        type="date"
                        min={minDate}
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none font-medium"
                      />
                    )}
                    {!hasExpiry && (
                      <p className="text-sm text-gray-500 italic">Fără expirare — reducerea rămâne până e ștearsă manual.</p>
                    )}
                  </div>

                  {/* Preview preț (doar pentru un circuit) */}
                  {singlePreview && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                      <div className="text-xs font-bold text-orange-600 uppercase mb-2">Preview</div>
                      <div className="font-semibold text-gray-800 text-sm mb-2 truncate">{singlePreview.name}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 line-through text-sm">{formatPrice(singlePreview.oldPrice)}</span>
                        <span className="text-orange-600 font-bold text-lg">→ {formatPrice(singlePreview.newPrice)}</span>
                        <span className="text-green-600 text-sm font-semibold">(-{formatPrice(singlePreview.economy)})</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Conținut modal REMOVE ── */}
              {modalMode === 'remove' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-gray-700 font-medium">
                    Ești sigur că vrei să ștergi reducerea pentru{' '}
                    <strong>{selectedIds.size} {selectedIds.size === 1 ? 'circuit' : 'circuite'}</strong>?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Prețurile vor reveni la valorile originale din scraping.
                  </p>
                </div>
              )}

              {/* Eroare */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
                  ❌ {error}
                </div>
              )}

              {/* Butoane */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setIsModalOpen(false); setError(null); }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Anulează
                </button>
                <button
                  onClick={modalMode === 'apply' ? handleApply : handleRemove}
                  disabled={loading}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50 ${
                    modalMode === 'apply'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                  }`}
                >
                  {loading
                    ? '⏳ Se procesează...'
                    : modalMode === 'apply' ? '✅ Aplică' : '🗑️ Șterge'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}