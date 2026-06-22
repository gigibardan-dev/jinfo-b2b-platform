import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { DiscountsClient } from '@/components/admin/discounts/DiscountsClient';

export default async function DiscountsPage() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
              🏷️
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Reduceri Circuite
              </h1>
              <p className="text-purple-100 text-sm">
                Aplică și gestionează reduceri procentuale pe circuite
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Suspense fallback={<DiscountsLoadingSkeleton />}>
        <DiscountsWrapper />
      </Suspense>

    </div>
  );
}

async function DiscountsWrapper() {
  const supabase = await createClient();

  const { data: circuits, error } = await supabase
    .from('circuits')
    .select(`
      id,
      external_id,
      slug,
      name,
      continent,
      is_active,
      price_double,
      price_single,
      price_triple,
      price_child,
      is_discounted,
      discount_percentage,
      discount_valid_until
    `)
    .eq('is_active', true)
    .order('continent', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Eroare la încărcare</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return <DiscountsClient circuits={circuits ?? []} />;
}

function DiscountsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-16 w-full bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-[600px] w-full bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );
}

export const metadata = {
  title: 'Reduceri Circuite | Admin',
  description: 'Gestionează reducerile pentru circuitele J\'Info Tours',
};