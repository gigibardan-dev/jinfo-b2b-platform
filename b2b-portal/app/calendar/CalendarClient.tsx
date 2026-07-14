'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DayPicker } from 'react-day-picker';
import { ro } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface Departure {
    id: string;
    departure_date: string;
    return_date: string;
    status: string;
    circuit_id: string;
    circuits: {
        id: string;
        slug: string;
        name: string;
        continent: string;
        nights: string | null;
        main_image: string | null;
        price_double: number | null;
        discount_percentage: number | null;
    };
}

interface CalendarClientProps {
    departures: Departure[];
}

const CONTINENT_COLORS: Record<string, string> = {
    europa: 'bg-blue-100 text-blue-800 border-blue-200',
    africa: 'bg-orange-100 text-orange-800 border-orange-200',
    asia: 'bg-red-100 text-red-800 border-red-200',
    america: 'bg-green-100 text-green-800 border-green-200',
    oceania: 'bg-purple-100 text-purple-800 border-purple-200',
};

const CONTINENT_DOT: Record<string, string> = {
    europa: 'bg-blue-500',
    africa: 'bg-orange-500',
    asia: 'bg-red-500',
    america: 'bg-green-500',
    oceania: 'bg-purple-500',
};

export default function CalendarClient({ departures }: CalendarClientProps) {
    const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
    const [continentFilter, setContinentFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    // Map departure_date → array of departures
    const departuresByDate = useMemo(() => {
        const map: Record<string, Departure[]> = {};
        departures.forEach((dep) => {
            const key = dep.departure_date; // "2026-07-14"
            if (!map[key]) map[key] = [];
            map[key].push(dep);
        });
        return map;
    }, [departures]);

    // Zile care au plecări (pentru highlight în calendar)
    const departureDays = useMemo(() => {
        return Object.keys(departuresByDate).map((d) => new Date(d + 'T12:00:00'));
    }, [departuresByDate]);

    // Plecările pentru ziua selectată
    const selectedDayDepartures = useMemo(() => {
        if (!selectedDay) return [];
        // Fix timezone: folosim ora locală, nu UTC
        const year = selectedDay.getFullYear();
        const month = String(selectedDay.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDay.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;
        const deps = departuresByDate[key] || [];
        if (continentFilter === 'all') return deps;
        return deps.filter((d) => d.circuits.continent.toLowerCase() === continentFilter);
    }, [selectedDay, departuresByDate, continentFilter]);

    // Plecările lunii curente (pentru view list)
    const monthDepartures = useMemo(() => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const deps = departures.filter((dep) => {
            const d = new Date(dep.departure_date + 'T12:00:00');
            return d.getFullYear() === year && d.getMonth() === month;
        });
        if (continentFilter === 'all') return deps;
        return deps.filter((d) => d.circuits.continent.toLowerCase() === continentFilter);
    }, [departures, selectedMonth, continentFilter]);

    // Stats luna curentă
    const monthStats = useMemo(() => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const monthDeps = departures.filter((dep) => {
            const d = new Date(dep.departure_date + 'T12:00:00');
            return d.getFullYear() === year && d.getMonth() === month;
        });
        const continents = new Set(monthDeps.map((d) => d.circuits.continent));
        return {
            total: monthDeps.length,
            continents: continents.size,
            days: new Set(monthDeps.map((d) => d.departure_date)).size,
        };
    }, [departures, selectedMonth]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('ro-RO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatShortDate = (dateStr: string) => {
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'short',
        });
    };

    const getEffectivePrice = (dep: Departure) => {
        const price = dep.circuits.price_double ?? 0;
        const disc = dep.circuits.discount_percentage ?? 0;
        if (disc > 0) return Math.round(price * (1 - disc / 100));
        return price;
    };

    const monthName = selectedMonth.toLocaleDateString('ro-RO', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">

            {/* Hero Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 rounded-2xl p-8 mb-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">📅 Calendar Plecări</h1>
                        <p className="text-blue-100 text-lg">
                            Vizualizează toate plecările disponibile și planifică rezervările
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                            <div className="text-3xl font-bold">{departures.length}</div>
                            <div className="text-xs text-blue-100 mt-1">Total plecări</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                            <div className="text-3xl font-bold">{monthStats.total}</div>
                            <div className="text-xs text-blue-100 mt-1">Luna aceasta</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                            <div className="text-3xl font-bold">{monthStats.days}</div>
                            <div className="text-xs text-blue-100 mt-1">Zile cu plecări</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-6 flex flex-wrap items-center gap-4">
                {/* Continent filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">🌍 Continent:</span>
                    <div className="flex gap-1 flex-wrap">
                        {[
                            { value: 'all', label: 'Toate', icon: '🌐' },
                            { value: 'europa', label: 'Europa', icon: '🏰' },
                            { value: 'africa', label: 'Africa', icon: '🦁' },
                            { value: 'asia', label: 'Asia', icon: '🏯' },
                            { value: 'america', label: 'America', icon: '🗽' },
                            { value: 'oceania', label: 'Oceania', icon: '🦘' },
                        ].map((c) => (
                            <button
                                key={c.value}
                                onClick={() => setContinentFilter(c.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${continentFilter === c.value
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                                    }`}
                            >
                                {c.icon} {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${viewMode === 'calendar'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        📅 Calendar
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${viewMode === 'list'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        ☰ Listă
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Calendar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sticky top-24">
                            <style>{`
                .rdp {
                  --rdp-accent-color: #f97316;
                  --rdp-background-color: #fff7ed;
                  margin: 0;
                  width: 100%;
                }
                .rdp-months {
                  width: 100%;
                }
                .rdp-month {
                  width: 100%;
                }
                .rdp-table {
                  width: 100%;
                  max-width: 100%;
                }
                .rdp-day_selected {
                  background-color: #f97316 !important;
                  color: white !important;
                  font-weight: bold;
                }
                .rdp-day_selected:hover {
                  background-color: #ea580c !important;
                }
                .rdp-day.has-departures {
                  position: relative;
                }
                .rdp-caption_label {
                  font-size: 1rem;
                  font-weight: 700;
                  text-transform: capitalize;
                }
                .rdp-nav_button {
                  color: #f97316;
                }
                .rdp-day {
                  border-radius: 8px;
                  width: 36px;
                  height: 36px;
                  font-size: 0.85rem;
                }
              `}</style>

                            <DayPicker
                                mode="single"
                                selected={selectedDay}
                                onSelect={(day) => {
                                    setSelectedDay(day);
                                    if (day) setSelectedMonth(day);
                                }}
                                onMonthChange={setSelectedMonth}
                                month={selectedMonth}
                                locale={ro}
                                modifiers={{
                                    hasDepartures: departureDays,
                                }}
                                modifiersStyles={{
                                    hasDepartures: {
                                        fontWeight: 'bold',
                                        border: '2px solid #f97316',
                                        borderRadius: '8px',
                                        color: '#c2410c',
                                    },
                                }}
                                startMonth={new Date()}
                                footer={
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                            <div className="w-4 h-4 border-2 border-orange-400 rounded" />
                                            <span>Zile cu plecări disponibile</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="w-4 h-4 bg-orange-500 rounded" />
                                            <span>Ziua selectată</span>
                                        </div>
                                    </div>
                                }
                            />

                            {/* Luna stats */}
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
                                <div className="text-center bg-blue-50 rounded-xl p-2">
                                    <div className="text-xl font-bold text-blue-600">{monthStats.total}</div>
                                    <div className="text-xs text-gray-500">Plecări</div>
                                </div>
                                <div className="text-center bg-orange-50 rounded-xl p-2">
                                    <div className="text-xl font-bold text-orange-600">{monthStats.days}</div>
                                    <div className="text-xs text-gray-500">Zile</div>
                                </div>
                                <div className="text-center bg-green-50 rounded-xl p-2">
                                    <div className="text-xl font-bold text-green-600">{monthStats.continents}</div>
                                    <div className="text-xs text-gray-500">Continente</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Departures Panel */}
                    <div className="lg:col-span-2">
                        {!selectedDay ? (
                            /* Dacă nu e selectată o zi — arătăm toate plecările lunii */
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📋</div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 capitalize">{monthName}</h2>
                                        <p className="text-sm text-gray-500">{monthDepartures.length} plecări — click pe o zi pentru detalii</p>
                                    </div>
                                </div>

                                {monthDepartures.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                        <div className="text-5xl mb-4">🗓️</div>
                                        <h3 className="text-xl font-bold text-gray-700 mb-2">Nicio plecare în această lună</h3>
                                        <p className="text-gray-500">Navighează la o altă lună sau schimbă filtrul de continent</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {monthDepartures.map((dep) => (
                                            <DepartureCard key={dep.id} dep={dep} formatShortDate={formatShortDate} getEffectivePrice={getEffectivePrice} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Ziua selectată */
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">📅</div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 capitalize">
                                                {formatDate(selectedDay.toISOString().split('T')[0])}
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                {selectedDayDepartures.length} {selectedDayDepartures.length === 1 ? 'plecare' : 'plecări'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDay(undefined)}
                                        className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        ✕ Dezelectează
                                    </button>
                                </div>

                                {selectedDayDepartures.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                        <div className="text-5xl mb-4">🔍</div>
                                        <h3 className="text-xl font-bold text-gray-700 mb-2">Nicio plecare în această zi</h3>
                                        <p className="text-gray-500">
                                            {continentFilter !== 'all'
                                                ? 'Încearcă să schimbi filtrul de continent'
                                                : 'Selectează o altă zi din calendar'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedDayDepartures.map((dep) => (
                                            <DepartureCard key={dep.id} dep={dep} formatShortDate={formatShortDate} getEffectivePrice={getEffectivePrice} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* View Listă — toate plecările grupate pe luni */
                <ListViewAll
                    departures={departures}
                    continentFilter={continentFilter}
                    formatShortDate={formatShortDate}
                    getEffectivePrice={getEffectivePrice}
                />
            )}
        </div>
    );
}

/* ── Card plecare ─────────────────────────────────────────── */
function DepartureCard({
    dep,
    formatShortDate,
    getEffectivePrice,
}: {
    dep: Departure;
    formatShortDate: (d: string) => string;
    getEffectivePrice: (d: Departure) => number;
}) {
    const price = getEffectivePrice(dep);
    const hasDiscount = (dep.circuits.discount_percentage ?? 0) > 0;
    const continentKey = dep.circuits.continent.toLowerCase();
    const colorClass = CONTINENT_COLORS[continentKey] || 'bg-gray-100 text-gray-800 border-gray-200';
    const dotClass = CONTINENT_DOT[continentKey] || 'bg-gray-400';

    return (
        <Link href={`/circuits/${dep.circuits.slug}`}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 overflow-hidden group cursor-pointer">
                <div className="flex">
                    {/* Imagine */}
                    {dep.circuits.main_image && (
                        <div className="relative w-28 h-24 flex-shrink-0">
                            <Image
                                src={dep.circuits.main_image}
                                alt={dep.circuits.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
                                {dep.circuits.name}
                            </h3>
                            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
                                {dep.circuits.continent}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    ✈️ <strong className="text-gray-700">{formatShortDate(dep.departure_date)}</strong>
                                </span>
                                <span>→</span>
                                <span>{formatShortDate(dep.return_date)}</span>
                                {dep.circuits.nights && (
                                    <span className="flex items-center gap-1">🌙 {dep.circuits.nights?.match(/\d+/)?.[0]}n</span>
                                )}
                            </div>
                            <div className="text-right flex-shrink-0">
                                {hasDiscount && (
                                    <div className="text-xs text-gray-400 line-through">
                                        {dep.circuits.price_double?.toLocaleString('ro-RO')} EUR
                                    </div>
                                )}
                                <div className="font-bold text-orange-500 text-sm">
                                    {price.toLocaleString('ro-RO')} EUR
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

/* ── View Listă toate lunile ──────────────────────────────── */
function ListViewAll({
    departures,
    continentFilter,
    formatShortDate,
    getEffectivePrice,
}: {
    departures: Departure[];
    continentFilter: string;
    formatShortDate: (d: string) => string;
    getEffectivePrice: (d: Departure) => number;
}) {
    const filtered = continentFilter === 'all'
        ? departures
        : departures.filter((d) => d.circuits.continent.toLowerCase() === continentFilter);

    // Grupăm pe lună
    const grouped = useMemo(() => {
        const map: Record<string, Departure[]> = {};
        filtered.forEach((dep) => {
            const date = new Date(dep.departure_date + 'T12:00:00');
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!map[key]) map[key] = [];
            map[key].push(dep);
        });
        return map;
    }, [filtered]);

    const monthKeys = Object.keys(grouped).sort();

    if (monthKeys.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Nicio plecare găsită</h3>
                <p className="text-gray-500">Încearcă să schimbi filtrul de continent</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {monthKeys.map((monthKey) => {
                const [year, month] = monthKey.split('-');
                const monthLabel = new Date(parseInt(year), parseInt(month) - 1, 1)
                    .toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
                const deps = grouped[monthKey];

                return (
                    <div key={monthKey}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold capitalize shadow-sm">
                                📅 {monthLabel}
                            </div>
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-sm text-gray-500 font-medium">{deps.length} plecări</span>
                        </div>
                        <div className="space-y-3">
                            {deps.map((dep) => (
                                <DepartureCard key={dep.id} dep={dep} formatShortDate={formatShortDate} getEffectivePrice={getEffectivePrice} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}