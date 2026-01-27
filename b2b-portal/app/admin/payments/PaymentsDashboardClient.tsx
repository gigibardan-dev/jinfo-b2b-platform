'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import PaymentBadge from '@/components/payments/PaymentBadge';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface PaymentsDashboardClientProps {
  payments: any[];
  bookings: any[];
  stats: {
    totalRevenue: number;
    pendingAmount: number;
    totalPayments: number;
    paidBookings: number;
    totalBookings: number;
  };
}

export default function PaymentsDashboardClient({ payments, bookings, stats }: PaymentsDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'payments' | 'bookings'>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');

  const filteredPayments = payments.filter((payment) => {
    const search = searchTerm.toLowerCase();
    return (
      payment.booking?.booking_reference?.toLowerCase().includes(search) ||
      payment.booking?.agency?.name?.toLowerCase().includes(search) ||
      payment.reference_number?.toLowerCase().includes(search)
    );
  });

  const filteredBookings = bookings.filter((booking) => {
    const search = bookingSearchTerm.toLowerCase();
    return booking.booking_reference?.toLowerCase().includes(search);
  });

  const formatDate = (dateString: string) => {
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

  const collectionRate = stats.totalBookings > 0
    ? ((stats.paidBookings / stats.totalBookings) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
              💰
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">
                Dashboard Plăți
              </h1>
              <p className="text-green-100 text-sm">
                Monitorizează toate plățile și veniturile platformei
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
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-green-200">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                  💵
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toFixed(0)} €</div>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Venit Total</div>
              <div className="text-xs text-gray-500 mt-1">{stats.totalPayments} plăți încasate</div>
            </div>
          </div>

          {/* Pending Amount */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-orange-200">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                  ⏳
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{stats.pendingAmount.toFixed(0)} €</div>
                  <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Pending</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Suma Restantă</div>
              <div className="text-xs text-gray-500 mt-1">De încasat</div>
            </div>
          </div>

          {/* Paid Bookings */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-blue-200">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md">
                  ✅
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{stats.paidBookings}</div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Plătite</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700">Rezervări Plătite</div>
              <div className="text-xs text-gray-500 mt-1">din {stats.totalBookings} total</div>
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
              <div className="text-sm font-semibold text-gray-700">Rată de Colectare</div>
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
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <h2 className="text-xl font-bold text-gray-900">Plăți Recente</h2>
              </div>
              <div className="relative w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <Input
                  placeholder="Caută după referință sau agenție..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-green-200 focus:border-green-500"
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rezervare</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Agenție</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Sumă</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Metodă</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Referință</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/bookings/${payment.booking.id}`}
                          className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                        >
                          {payment.booking.booking_reference}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {payment.booking.agency?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-green-600">
                          {payment.amount.toFixed(2)} €
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                          {formatMethod(payment.payment_method)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {payment.reference_number || '-'}
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
                  placeholder="Caută după referință..."
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rezervare</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Plătit</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rămas</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Plăți</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {booking.booking_reference}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {booking.total_amount.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">
                        {booking.paid_amount.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-orange-600">
                        {(booking.total_amount - booking.paid_amount).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4">
                        <PaymentBadge status={booking.payment_status} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-semibold">
                          {booking.payments_count} {booking.payments_count === 1 ? 'plată' : 'plăți'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold text-sm"
                        >
                          Vezi Detalii
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
    </div>
  );
}