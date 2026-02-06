'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import AgencyBookingCard from '@/components/agency/AgencyBookingCard';
import AgencyBookingCardHorizontal from '@/components/agency/AgencyBookingCardHorizontal';

interface AgencyBookingsClientProps {
  bookings: any[];
  successMessage?: string;
}

export default function AgencyBookingsClient({ bookings, successMessage }: AgencyBookingsClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Calculate payment status for each booking
  const bookingsWithPaymentStatus = useMemo(() => {
    return bookings.map((booking) => {
      const paidAmount = booking.payments?.reduce((sum: number, p: any) => sum + parseFloat(String(p.amount)), 0) || 0;
      let paymentStatus = 'unpaid';
      if (paidAmount === 0) paymentStatus = 'unpaid';
      else if (paidAmount >= booking.total_price) paymentStatus = 'paid';
      else paymentStatus = 'partial';

      return { ...booking, paymentStatus };
    });
  }, [bookings]);

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    let filtered = [...bookingsWithPaymentStatus];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((booking) => {
        return (
          booking.circuit?.name?.toLowerCase().includes(search) ||
          booking.booking_number?.toLowerCase().includes(search) ||
          booking.passengers?.some((p: any) => p.name?.toLowerCase().includes(search))
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter((b) => b.paymentStatus === paymentFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [bookingsWithPaymentStatus, searchTerm, statusFilter, paymentFilter, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const pending = bookings.filter(b => b.status === 'pending').length;
    const approved = bookings.filter(b => b.status === 'approved').length;
    const rejected = bookings.filter(b => b.status === 'rejected').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    
    return { pending, approved, rejected, cancelled, total: bookings.length };
  }, [bookings]);

  const statusFilters = [
    { value: 'all', label: 'Toate', count: bookings.length },
    { value: 'pending', label: 'În Așteptare', count: stats.pending },
    { value: 'approved', label: 'Aprobate', count: stats.approved },
    { value: 'rejected', label: 'Respinse', count: stats.rejected },
    { value: 'cancelled', label: 'Anulate', count: stats.cancelled },
  ];

  const paymentFilters = [
    { value: 'all', label: 'Toate' },
    { value: 'unpaid', label: 'Neplătite' },
    { value: 'partial', label: 'Parțial' },
    { value: 'paid', label: 'Plătite' },
  ];

  return (
    <div className="space-y-6">{/* Removed min-h-screen bg-gradient py-8 px-4 */}
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-2xl">✅</span>
              <div>
                <div className="font-bold text-green-800 mb-1">Pre-rezervare trimisă cu succes!</div>
                <div className="text-sm text-green-700">
                  Vei primi un răspuns de la J'Info Tours în maximum 24 ore.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">📋</div>
                <div>
                  <h1 className="text-2xl font-bold">Pre-Rezervările Mele</h1>
                  <p className="text-orange-100 text-sm">
                    Gestionează și monitorizează pre-rezervările tale
                  </p>
                </div>
              </div>
              
              <Link
                href="/"
                className="px-6 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold shadow-lg"
              >
                ➕ Rezervare nouă
              </Link>
            </div>
          </div>

          {/* Clickable Stats - Now act as filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gray-50">
            <button
              onClick={() => setStatusFilter('all')}
              className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                statusFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-200'
              }`}
            >
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-600 mt-1 font-semibold">Toate</div>
            </button>
            
            <button
              onClick={() => setStatusFilter('pending')}
              className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                statusFilter === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-yellow-200'
              }`}
            >
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-gray-600 mt-1 font-semibold">În așteptare</div>
            </button>
            
            <button
              onClick={() => setStatusFilter('approved')}
              className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                statusFilter === 'approved' ? 'border-green-500 ring-2 ring-green-200' : 'border-green-200'
              }`}
            >
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-xs text-gray-600 mt-1 font-semibold">Aprobate</div>
            </button>
            
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                statusFilter === 'rejected' ? 'border-red-500 ring-2 ring-red-200' : 'border-red-200'
              }`}
            >
              <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-gray-600 mt-1 font-semibold">Respinse</div>
            </button>
            
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`bg-white rounded-lg p-4 text-center border-2 transition-all hover:shadow-md ${
                statusFilter === 'cancelled' ? 'border-gray-500 ring-2 ring-gray-200' : 'border-gray-200'
              }`}
            >
              <div className="text-3xl font-bold text-gray-600">{stats.cancelled}</div>
              <div className="text-xs text-gray-600 mt-1 font-semibold">Anulate</div>
            </button>
          </div>
        </div>

        {/* Compact Filters & Controls */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="flex-1 w-full relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <Input
                placeholder="Caută după circuit, număr rezervare..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 focus:border-orange-500"
              />
            </div>
            
            {/* Payment Filter */}
            <div className="flex gap-2">
              <span className="text-sm font-semibold text-gray-700 self-center whitespace-nowrap">💰 Plată:</span>
              {paymentFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setPaymentFilter(filter.value)}
                  className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm whitespace-nowrap ${
                    paymentFilter === filter.value
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Sort & View Toggle */}
            <div className="flex gap-2">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="px-3 py-2 rounded-lg border-2 border-gray-200 bg-white font-semibold text-gray-700 text-sm cursor-pointer hover:border-orange-500 transition-all"
              >
                <option value="newest">↓ Noi</option>
                <option value="oldest">↑ Vechi</option>
              </select>

              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-sm ${
                    viewMode === 'grid'
                      ? 'bg-white text-orange-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid View"
                >
                  🔲
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-sm ${
                    viewMode === 'list'
                      ? 'bg-white text-orange-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  📋
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all') && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Afișare <span className="font-bold text-orange-600">{filteredBookings.length}</span> din{' '}
                <span className="font-bold">{bookings.length}</span> rezervări
              </div>
            </div>
          )}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">
              {bookings.length === 0 ? '📭' : '🔍'}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {bookings.length === 0 ? 'Nicio pre-rezervare încă' : 'Niciun rezultat'}
            </h3>
            <p className="text-gray-600 mb-6">
              {bookings.length === 0 
                ? 'Creează prima ta pre-rezervare pentru a începe'
                : 'Încearcă să modifici filtrele sau termenul de căutare'}
            </p>
            {bookings.length === 0 && (
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold shadow-lg"
              >
                Explorează circuitele →
              </Link>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredBookings.map((booking: any) => (
              viewMode === 'grid' ? (
                <AgencyBookingCard key={booking.id} booking={booking} />
              ) : (
                <AgencyBookingCardHorizontal key={booking.id} booking={booking} />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}