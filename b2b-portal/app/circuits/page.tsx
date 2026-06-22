'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Circuit } from '@/lib/types/database';
import { applyDiscount, getAgencyCommission } from '@/lib/types/database';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function CircuitsPage() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyCommission, setAgencyCommission] = useState(8);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [nightsFilter, setNightsFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load circuits from Supabase
  useEffect(() => {
    async function loadCircuits() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('circuits')
          .select(`
            *,
            departures (
              id,
              departure_date,
              return_date,
              price,
              status
            )
          `)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) {
          console.error('Supabase error:', error);
          return;
        }

        setCircuits(data || []);

        // Fetch comision agenție logată
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: agency } = await supabase
            .from('agencies')
            .select('commission_rate')
            .eq('user_id', user.id)
            .single();

          if (agency?.commission_rate) {
            setAgencyCommission(agency.commission_rate);
          }
        }

      } catch (error) {
        console.error('Error loading circuits:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCircuits();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const continents = new Set(circuits.map(c => c.continent));
    const totalDepartures = circuits.reduce((sum, c) => sum + (c.departures?.length || 0), 0);
    return {
      totalCircuits: circuits.length,
      continents: continents.size,
      departures: totalDepartures,
    };
  }, [circuits]);

  // Filtered & Sorted Circuits
  const filteredCircuits = useMemo(() => {
    let filtered = circuits;

    // Search
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.continent.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Continent
    if (selectedContinent !== 'all') {
      filtered = filtered.filter(c =>
        c.continent.toLowerCase() === selectedContinent.toLowerCase()
      );
    }

    // Price Range — filtrăm după prețul efectiv (redus dacă e cazul)
    filtered = filtered.filter(c => {
      const effectivePrice = c.is_discounted
        ? (applyDiscount(c.price_double, c.discount_percentage) ?? 0)
        : (c.price_double ?? 0);
      return effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
    });

    // Nights
    if (nightsFilter !== 'all') {
      filtered = filtered.filter(c => {
        const nights = parseInt(c.nights?.match(/\d+/)?.[0] || '0');
        if (nightsFilter === '5-7') return nights >= 5 && nights <= 7;
        if (nightsFilter === '8-10') return nights >= 8 && nights <= 10;
        if (nightsFilter === '11+') return nights >= 11;
        return true;
      });
    }

    // Sort — sortăm după prețul efectiv
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-asc') {
        const pa = a.is_discounted ? (applyDiscount(a.price_double, a.discount_percentage) ?? 0) : (a.price_double ?? 0);
        const pb = b.is_discounted ? (applyDiscount(b.price_double, b.discount_percentage) ?? 0) : (b.price_double ?? 0);
        return pa - pb;
      }
      if (sortBy === 'price-desc') {
        const pa = a.is_discounted ? (applyDiscount(a.price_double, a.discount_percentage) ?? 0) : (a.price_double ?? 0);
        const pb = b.is_discounted ? (applyDiscount(b.price_double, b.discount_percentage) ?? 0) : (b.price_double ?? 0);
        return pb - pa;
      }
      if (sortBy === 'popular') return (b.departures?.length || 0) - (a.departures?.length || 0);
      return 0;
    });

    return filtered;
  }, [circuits, searchQuery, selectedContinent, priceRange, nightsFilter, sortBy]);

  // Reset Filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedContinent('all');
    setPriceRange([0, 10000]);
    setNightsFilter('all');
    setSortBy('name');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Se încarcă circuitele...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50">
      <Header />

      {/* Hero Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6">Portal B2B - Circuite Turistice</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.totalCircuits}</div>
              <div className="text-sm opacity-90">Circuite disponibile</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.continents}</div>
              <div className="text-sm opacity-90">Continente</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.departures}</div>
              <div className="text-sm opacity-90">Plecări disponibile</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{agencyCommission}%</div>
              <div className="text-sm opacity-90">Comision agenție</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="🔍 Caută după destinație sau țară..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pr-12 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🌍 Continent</label>
              <select
                value={selectedContinent}
                onChange={(e) => setSelectedContinent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-gray-900 font-medium bg-white"
              >
                <option value="all">Toate continentele</option>
                <option value="europa">Europa</option>
                <option value="africa">Africa</option>
                <option value="asia">Asia</option>
                <option value="america">America</option>
                <option value="oceania">Oceania</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">💰 Preț (EUR)</label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 text-center">0 - {priceRange[1]} EUR</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🌙 Nopți</label>
              <select
                value={nightsFilter}
                onChange={(e) => setNightsFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-gray-900 font-medium bg-white"
              >
                <option value="all">Toate</option>
                <option value="5-7">5-7 nopți</option>
                <option value="8-10">8-10 nopți</option>
                <option value="11+">11+ nopți</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Sortare</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-gray-900 font-medium bg-white"
              >
                <option value="name">Nume (A-Z)</option>
                <option value="price-asc">Preț (crescător)</option>
                <option value="price-desc">Preț (descrescător)</option>
                <option value="popular">Popularitate</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filteredCircuits.length}</span> circuite găsite
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                🔄 Resetează filtre
              </button>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 text-sm ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                >
                  ▦ Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                >
                  ☰ List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredCircuits.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Niciun circuit găsit</h3>
            <p className="text-gray-600 mb-6">Încearcă să modifici filtrele de căutare</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Resetează toate filtrele
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredCircuits.map((circuit) => {
              // ── Calcul prețuri cu suport reduceri ──────────────────────────
              const originalPrice  = circuit.price_double ?? 0
              const effectivePrice = circuit.is_discounted
                ? (applyDiscount(circuit.price_double, circuit.discount_percentage) ?? 0)
                : originalPrice
              const commission     = getAgencyCommission(effectivePrice, agencyCommission) ?? 0
              const agencyPrice    = Math.round(effectivePrice - commission)
              const nightsCount    = circuit.nights?.match(/\d+/)?.[0] || 'N/A'
              const priceOptionsCount = Array.isArray(circuit.price_options) ? circuit.price_options.length : 0

              // ── VIEW LIST ───────────────────────────────────────────────────
              if (viewMode === 'list') {
                return (
                  <Link
                    key={circuit.id}
                    href={`/circuits/${circuit.slug}`}
                    className="block bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                  >
                    <div className="flex">
                      <div className="relative w-64 h-48 flex-shrink-0">
                        {circuit.main_image && (
                          <Image
                            src={circuit.main_image}
                            alt={circuit.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        )}
                        {/* Badge reducere */}
                        {circuit.is_discounted && circuit.discount_percentage && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            🏷️ -{Math.round(circuit.discount_percentage)}%
                          </div>
                        )}
                        {/* Badge continent (jos dacă nu e reducere, sus dacă e) */}
                        {!circuit.is_discounted && (
                          <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {circuit.continent}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                            {circuit.name}
                          </h3>
                          <div className="flex flex-wrap gap-3 mb-4">
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              🌙 {nightsCount} nopți
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              📅 {circuit.departures?.length || 0} plecări
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              💰 {priceOptionsCount} opțiuni preț
                            </span>
                          </div>
                        </div>

                        <div className="flex items-end justify-between">
                          <div className="space-y-1">
                            {/* Preț listă — tăiat dacă e reducere */}
                            <div className="text-sm text-gray-500 line-through">
                              Preț listă: {originalPrice.toLocaleString('ro-RO')} EUR
                            </div>
                            {/* Preț redus — doar dacă e reducere */}
                            {circuit.is_discounted && (
                              <div className="text-sm font-semibold text-orange-600">
                                Preț redus: {effectivePrice.toLocaleString('ro-RO')} EUR
                              </div>
                            )}
                            {/* Prețul agenției */}
                            <div className="text-3xl font-bold text-orange-500">
                              {agencyPrice.toLocaleString('ro-RO')} EUR
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                              Comisionul tău: {commission.toLocaleString('ro-RO')} EUR ({agencyCommission}%)
                            </div>
                          </div>
                          <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
                            Vezi detalii →
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }

              // ── VIEW GRID ───────────────────────────────────────────────────
              return (
                <Link
                  key={circuit.id}
                  href={`/circuits/${circuit.slug}`}
                  className="block bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="relative h-56">
                    {circuit.main_image && (
                      <Image
                        src={circuit.main_image}
                        alt={circuit.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Badge reducere — sus stânga, cel mai prominent */}
                    {circuit.is_discounted && circuit.discount_percentage && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        🏷️ -{circuit.discount_percentage}%
                      </div>
                    )}

                    {/* Badge continent — sus stânga dacă nu e reducere */}
                    {!circuit.is_discounted && (
                      <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        {circuit.continent}
                      </div>
                    )}

                    {/* Badge nopți — sus dreapta */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-900 shadow-lg">
                      🌙 {nightsCount} nopți
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
                        {circuit.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        📅 {circuit.departures?.length || 0} plecări
                      </span>
                      <span className="flex items-center gap-1">
                        💰 {priceOptionsCount} opțiuni
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      {/* Preț listă */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Preț listă:</span>
                        <span className={`text-sm ${circuit.is_discounted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                          {originalPrice.toLocaleString('ro-RO')} EUR
                        </span>
                      </div>

                      {/* Preț redus — doar dacă e reducere */}
                      {circuit.is_discounted && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-orange-600">Preț redus:</span>
                          <span className="text-sm font-bold text-orange-600">
                            {effectivePrice.toLocaleString('ro-RO')} EUR
                          </span>
                        </div>
                      )}

                      {/* Prețul agenției */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">Prețul tău:</span>
                        <span className="text-2xl font-bold text-orange-500">
                          {agencyPrice.toLocaleString('ro-RO')} EUR
                        </span>
                      </div>

                      {/* Comision */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                        <span className="text-sm text-green-700 font-medium">
                          💚 Comisionul tău: {commission.toLocaleString('ro-RO')} EUR ({agencyCommission}%)
                        </span>
                      </div>
                    </div>

                    <button className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg group-hover:shadow-xl">
                      Vezi detalii și pre-rezervă →
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}