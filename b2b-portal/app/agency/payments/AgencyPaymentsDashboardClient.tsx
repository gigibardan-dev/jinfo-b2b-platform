'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import PaymentBadge from '@/components/payments/PaymentBadge';
import Link from 'next/link';
import type { PaymentStatus } from '@/lib/types/payment';

interface AgencyPaymentsDashboardClientProps {
  bookings: any[];
  payments: any[];
  stats: {
    totalPaid: number;
    totalOutstanding: number;
    bookingsFullyPaid: number;
    bookingsPending: number;
  };
}

export default function AgencyPaymentsDashboardClient({ bookings, payments, stats }: AgencyPaymentsDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'payments' | 'bookings'>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');

  const filteredPayments = payments.filter((payment) => {
    const search = searchTerm.toLowerCase();
    return (
      payment.booking_number?.toLowerCase().includes(search) ||
      payment.circuit_name?.toLowerCase().includes(search) ||
      payment.confirmation_notes?.toLowerCase().includes(search)
    );
  });

  const filteredBookings = bookings.filter((booking) => {
    const search = bookingSearchTerm.toLowerCase();
    return (
      booking.booking_number?.toLowerCase().includes(search) ||
      booking.circuit?.name?.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMethod = (method: string) => {
    const methods: Record<string, string> = {
      bank_transfer: 'Transfer Bancar',
      cash: 'Numerar',
      card: 'Card',
      other: 'Altele'
    };
    return methods[method] || method;
  };

  const getPaymentStatus = (booking: any): PaymentStatus => {
    if (booking.total_paid === 0) return 'pending';
    if (booking.remaining_amount <= 0) return 'paid';
    return 'partial';
  };

  const getPaymentDeadline = (departureDate: string) => {
    const departure = new Date(departureDate);
    const deadline = new Date(departure);
    deadline.setDate(deadline.getDate() - 45);

    const today = new Date();
    const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return { daysRemaining };
  };

  const getDeadlineWarning = (booking: any) => {
    if (booking.remaining_amount <= 0) {
      return {
        text: '✓ Plătit',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }

    const { daysRemaining } = getPaymentDeadline(booking.departure?.departure_date);

    if (daysRemaining > 10) {
      return {
        text: `✓ ${daysRemaining} zile`,
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }

    if (daysRemaining >= 5 && daysRemaining <= 10) {
      return {
        text: `⚠️ ${daysRemaining} zile`,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    }

    if (daysRemaining > 0 && daysRemaining < 5) {
      return {
        text: `🚨 ${daysRemaining} zile!`,
        className: 'bg-red-100 text-red-800 border-red-200'
      };
    }

    return {
      text: '❌ Depășit',
      className: 'bg-red-100 text-red-800 border-red-200'
    };
  };

  const collectionRate = bookings.length > 0
    ? ((stats.bookingsFullyPaid / bookings.length) * 100)
    : 0;

  return (
    <div className="space-y-6">{/* Removed min-h-screen bg-gradient py-8 px-4 */}
      <div className="max-w-7xl mx-auto space-y-6">{/* Kept max-w for content constraint */}
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-blue-600 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                💰
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">
                  Dashboard Plăți
                </h1>
                <p className="text-orange-100 text-sm">
                  Monitorizează toate plățile și statusul financiar al rezervărilor tale
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📊</span>
            <h2 className="text-xl font-bold text-gray-900">Statistici Generale</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Paid */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-green-200">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                    💵
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{stats.totalPaid.toFixed(0)} €</div>
                    <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">Încasat</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Total Plătit</div>
                <div className="text-xs text-gray-500 mt-1">{payments.length} plăți înregistrate</div>
              </div>
            </div>

            {/* Outstanding Amount */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-orange-200">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                    ⏳
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{stats.totalOutstanding.toFixed(0)} €</div>
                    <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Restant</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Rămas de Plată</div>
                <div className="text-xs text-gray-500 mt-1">În așteptare</div>
              </div>
            </div>

            {/* Fully Paid Bookings */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-blue-200">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                    ✅
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{stats.bookingsFullyPaid}</div>
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Complete</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Rezervări Plătite</div>
                <div className="text-xs text-gray-500 mt-1">din {bookings.length} total</div>
              </div>
            </div>

            {/* Collection Rate */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-purple-200">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                    📈
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{collectionRate.toFixed(1)}%</div>
                    <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Rată</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">Rată de Plată</div>
                <div className="text-xs text-gray-500 mt-1">Rezervări plătite complet</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-md border border-gray-200 p-2">
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            💳 Istoric Plăți ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'bookings'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Status Rezervări ({bookings.length})
          </button>
        </div>

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b-2 border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <h2 className="text-xl font-bold text-gray-900">Plăți Primite</h2>
                </div>
                <div className="relative w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <Input
                    placeholder="Caută după referință sau circuit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-orange-200 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💸</div>
                  <p className="text-gray-600 font-semibold">Nu s-au găsit plăți</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {searchTerm ? `Niciun rezultat pentru "${searchTerm}"` : 'Nu există plăți înregistrate'}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data Plată</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rezervare</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Circuit</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Sumă</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Metodă</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Referință</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(payment.paid_at)}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-900">
                          #{payment.booking_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {payment.circuit_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-green-600">
                            {parseFloat(payment.amount).toFixed(2)} €
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                            {formatMethod(payment.payment_method)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {payment.confirmation_notes || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/agency/bookings/${payment.pre_booking_id}`}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold text-sm"
                          >
                            Vezi Rezervare
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <h2 className="text-xl font-bold text-gray-900">Status Plăți Rezervări</h2>
                </div>
                <div className="relative w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <Input
                    placeholder="Caută după număr sau circuit..."
                    value={bookingSearchTerm}
                    onChange={(e) => setBookingSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600 font-semibold">Nu s-au găsit rezervări</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {bookingSearchTerm ? `Niciun rezultat pentru "${bookingSearchTerm}"` : 'Nu există rezervări'}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Rezervare</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[200px]">Circuit</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Plecare</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Total</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Plătit</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Rămas</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Deadline</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map((booking) => {
                      const deadlineWarning = getDeadlineWarning(booking);
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 font-mono text-sm font-semibold text-gray-900 whitespace-nowrap">
                            #{booking.booking_number}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 font-medium max-w-[250px]">
                            <div className="line-clamp-2" title={booking.circuit?.name || 'N/A'}>
                              {booking.circuit?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(booking.departure?.departure_date)}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {booking.total_price.toFixed(2)} €
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-green-600 whitespace-nowrap">
                            {booking.total_paid.toFixed(2)} €
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-orange-600 whitespace-nowrap">
                            {Math.max(booking.remaining_amount, 0).toFixed(2)} €
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <PaymentBadge status={getPaymentStatus(booking)} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${deadlineWarning.className}`}>
                              {deadlineWarning.text}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Link
                              href={`/agency/bookings/${booking.id}`}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold text-sm"
                            >
                              Vezi Detalii
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}