import { Suspense } from 'react';
import { getAllAgencies, getAgenciesSummary } from '@/lib/services/agencies';
import { AgenciesTableClient } from '@/components/admin/agencies/AgenciesTableClient';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AgenciesPage({ searchParams }: PageProps) {
  const { status: statusFilter } = await searchParams;
  const filter = statusFilter || 'all';
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                🏢
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">
                  Gestionare Agenții
                </h1>
                <p className="text-purple-100 text-sm">
                  Administrează agențiile partenere și comisioanele
                </p>
              </div>
            </div>
            <Link
              href="/admin/create-agency"
              className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              ➕ Adaugă Agenție Nouă
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <Suspense fallback={<StatsLoadingSkeleton />}>
        <AgenciesStats />
      </Suspense>

      {/* Agencies Table with Filters */}
      <Suspense fallback={<TableLoadingSkeleton />}>
        <AgenciesTableWrapper statusFilter={filter} />
      </Suspense>
    </div>
  );
}

async function AgenciesStats() {
  const summary = await getAgenciesSummary();
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📊</span>
        <h2 className="text-xl font-bold text-gray-900">Statistici Generale</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-gray-200">
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                🏢
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{summary.total}</div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700">Total Agenții</div>
            <div className="text-xs text-gray-500 mt-1">Înregistrate în sistem</div>
          </div>
        </div>

        {/* Active */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-green-200">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                ✅
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{summary.active}</div>
                <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">Active</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700">Agenții Active</div>
            <div className="text-xs text-gray-500 mt-1">Cu acces complet</div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-yellow-200">
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                ⏳
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{summary.pending}</div>
                <div className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Pending</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700">În Așteptare</div>
            <div className="text-xs text-gray-500 mt-1">Necesită aprobare</div>
          </div>
        </div>

        {/* Suspended */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-red-200">
          <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                🚫
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{summary.suspended}</div>
                <div className="text-xs font-semibold text-red-600 uppercase tracking-wide">Suspended</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700">Suspendate</div>
            <div className="text-xs text-gray-500 mt-1">Acces restricționat</div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function AgenciesTableWrapper({ statusFilter }: { statusFilter: string }) {
  const agencies = await getAllAgencies(statusFilter);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h2 className="text-xl font-bold text-gray-900">
            Listă Agenții
            {statusFilter !== 'all' && (
              <span className="text-gray-500 text-base ml-2 font-normal">
                ({agencies.length} {agencies.length === 1 ? 'rezultat' : 'rezultate'})
              </span>
            )}
          </h2>
        </div>
      </div>

      <AgenciesTableClient agencies={agencies} initialStatus={statusFilter} />
    </div>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[140px] bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

function TableLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-[200px] bg-gray-100 rounded animate-pulse" />
      <div className="h-[500px] w-full bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );
}

export const metadata = {
  title: 'Gestionare Agenții | Admin',
  description: 'Administrează agențiile partenere',
};