import { Suspense } from 'react';
import { getAllAgencies, getAgenciesSummary } from '@/lib/services/agencies';
import { AgenciesTableClient } from '@/components/admin/agencies/AgenciesTableClient';
import { StatCard } from '@/components/admin/agencies/StatCard';
import { AgencyFilters } from '@/components/admin/agencies/AgencyFilters';
import { Building2, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  searchParams: {
    status?: string;
  };
}

export default async function AgenciesPage({ searchParams }: PageProps) {
  const statusFilter = searchParams.status || 'all';
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestionare Agenții</h1>
        <p className="text-muted-foreground mt-2">
          Administrează agențiile partenere, comisioanele și accesul la platformă
        </p>
      </div>

      {/* Statistics Cards */}
      <Suspense fallback={<StatsLoadingSkeleton />}>
        <AgenciesStats />
      </Suspense>

      {/* Filters */}
      <AgencyFilters currentStatus={statusFilter} />

      {/* Agencies Table */}
      <Suspense fallback={<TableLoadingSkeleton />}>
        <AgenciesTableWrapper statusFilter={statusFilter} />
      </Suspense>
    </div>
  );
}

async function AgenciesStats() {
  const summary = await getAgenciesSummary();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Agenții"
        value={summary.total}
        description="Toate agențiile înregistrate"
        icon={Building2}
      />
      <StatCard
        title="Active"
        value={summary.active}
        description="Agenții cu acces complet"
        icon={UserCheck}
      />
      <StatCard
        title="În Așteptare"
        value={summary.pending}
        description="Așteaptă aprobare"
        icon={AlertCircle}
      />
      <StatCard
        title="Suspendate"
        value={summary.suspended}
        description="Acces restricționat"
        icon={UserX}
      />
    </div>
  );
}

async function AgenciesTableWrapper({ statusFilter }: { statusFilter: string }) {
  const agencies = await getAllAgencies(statusFilter);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Listă Agenții
            {statusFilter !== 'all' && (
              <span className="text-muted-foreground text-base ml-2">
                ({agencies.length} rezultate)
              </span>
            )}
          </h2>
        </div>
      </div>

      <AgenciesTableClient agencies={agencies} />
    </div>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-[120px]" />
      ))}
    </div>
  );
}

function TableLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export const metadata = {
  title: 'Gestionare Agenții | Admin',
  description: 'Administrează agențiile partenere',
};
