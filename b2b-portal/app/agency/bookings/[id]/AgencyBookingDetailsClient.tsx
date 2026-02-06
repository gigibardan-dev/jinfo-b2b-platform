'use client';

import { useState, useEffect } from 'react';
import PaymentsList from '@/components/payments/PaymentsList';
import DocumentsList from '@/components/documents/DocumentsList';
import Link from 'next/link';
import type { PaymentStatus } from '@/lib/types/payment';

interface AgencyBookingDetailsClientProps {
  booking: any;
}

export default function AgencyBookingDetailsClient({ booking }: AgencyBookingDetailsClientProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const totalAmount = booking.total_price || 0;
  const circuit = booking.circuit;
  const departure = booking.departure;
  const agency = booking.agency;
  const depDate = departure ? new Date(departure.departure_date) : null;
  const retDate = departure ? new Date(departure.return_date) : null;
  const totalPax = (booking.num_adults || 0) + (booking.num_children || 0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load payments
      const paymentsRes = await fetch(`/api/payments?booking_id=${booking.id}`);
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      // Load documents (only visible to agency)
      const docsRes = await fetch(`/api/documents?booking_id=${booking.id}`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.filter((doc: any) => doc.visible_to_agency));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (document: any) => {
    try {
      const res = await fetch(`/api/documents/${document.id}`);
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Eroare la descărcarea documentului');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { gradient: string; badge: string; text: string; icon: string }> = {
      pending: { 
        gradient: 'from-yellow-50 to-amber-50', 
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        text: 'În așteptare', 
        icon: '⏳' 
      },
      approved: { 
        gradient: 'from-green-50 to-emerald-50', 
        badge: 'bg-green-100 text-green-800 border-green-300',
        text: 'Aprobat', 
        icon: '✅' 
      },
      rejected: { 
        gradient: 'from-red-50 to-rose-50', 
        badge: 'bg-red-100 text-red-800 border-red-300',
        text: 'Respins', 
        icon: '❌' 
      },
      cancelled: { 
        gradient: 'from-gray-50 to-slate-50', 
        badge: 'bg-gray-100 text-gray-800 border-gray-300',
        text: 'Anulat', 
        icon: '🚫' 
      },
    };
    
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(booking.status);
  const paidAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const remainingAmount = totalAmount - paidAmount;
  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const getPaymentStatus = (): PaymentStatus => {
    if (paidAmount === 0) return 'pending';
    if (paidAmount >= totalAmount) return 'paid';
    return 'partial';
  };

  const getPaymentDeadline = () => {
    const departureDate = new Date(departure.departure_date);
    const deadline = new Date(departureDate);
    deadline.setDate(deadline.getDate() - 45);

    const today = new Date();
    const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return { deadline, daysRemaining };
  };

  const { daysRemaining } = getPaymentDeadline();

  const getDeadlineWarning = () => {
    if (remainingAmount <= 0) {
      return {
        text: '✓ Plătit integral',
        className: 'bg-green-50 text-green-800 border-green-300'
      };
    }

    if (daysRemaining > 10) {
      return {
        text: `✓ ${daysRemaining} zile rămase`,
        className: 'bg-green-50 text-green-800 border-green-300'
      };
    }

    if (daysRemaining >= 5 && daysRemaining <= 10) {
      return {
        text: `⚠️ ${daysRemaining} zile rămase până la deadline`,
        className: 'bg-yellow-50 text-yellow-800 border-yellow-300'
      };
    }

    if (daysRemaining > 0 && daysRemaining < 5) {
      return {
        text: `🚨 URGENT: ${daysRemaining} zile rămase!`,
        className: 'bg-red-50 text-red-800 border-red-300'
      };
    }

    return {
      text: '❌ Termen depășit',
      className: 'bg-red-50 text-red-800 border-red-300'
    };
  };

  const deadlineWarning = getDeadlineWarning();

  return (
    <div className="space-y-6">{/* Removed min-h-screen bg-gradient py-8 px-4 */}
      <div className="max-w-7xl mx-auto space-y-6">{/* Kept max-w for content constraint */}
        {/* Back Button + Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/agency/bookings"
            className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-semibold shadow-md border border-gray-200"
          >
            ← Înapoi la Rezervări
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Detalii Pre-Rezervare</h1>
            {booking.booking_number && (
              <p className="text-gray-600 mt-1">
                Număr rezervare: <span className="font-mono font-semibold">#{booking.booking_number}</span>
              </p>
            )}
          </div>
          
          {/* Payment Status Indicator */}
          <div className={`px-5 py-3 rounded-xl border-2 ${
            remainingAmount <= 0 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
              : remainingAmount < totalAmount 
              ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300'
              : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
          }`}>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              {remainingAmount <= 0 ? 'Plătit Complet' : 'Rămas de Plată'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {remainingAmount <= 0 ? '✅' : remainingAmount < totalAmount ? '⚠️' : '💰'}
              </span>
              <span className={`text-2xl font-bold ${
                remainingAmount <= 0 
                  ? 'text-green-700' 
                  : remainingAmount < totalAmount 
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }`}>
                {remainingAmount <= 0 ? '0.00' : remainingAmount.toFixed(2)} €
              </span>
            </div>
            {remainingAmount > 0 && (
              <div className="mt-1">
                <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      paymentProgress >= 50 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${statusConfig.badge} flex items-center gap-2`}>
            <span className="text-lg">{statusConfig.icon}</span>
            {statusConfig.text}
          </span>
        </div>

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Circuit Info */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                🗺️
              </div>
              <h2 className="text-xl font-bold text-gray-900">Circuit</h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">Nume Circuit</div>
                <div className="font-semibold text-gray-900">{circuit?.name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Durată</div>
                <div className="font-semibold text-gray-900">{circuit?.nights || 'N/A'} nopți</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Perioada</div>
                <div className="font-semibold text-gray-900">
                  {formatDate(depDate)}
                </div>
                <div className="text-sm text-gray-500">
                  până {formatDate(retDate)}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <Link
                  href={`/circuits/${circuit?.slug}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  📍 Vezi Circuit Complet →
                </Link>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                📋
              </div>
              <h2 className="text-xl font-bold text-gray-900">Detalii</h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">Călători</div>
                <div className="font-semibold text-gray-900">{totalPax} persoane</div>
                <div className="text-sm text-gray-500">
                  {booking.num_adults} adulți, {booking.num_children} copii
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Cameră</div>
                <div className="font-semibold text-gray-900">{booking.room_type || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Comision Agenție</div>
                <div className="font-semibold text-purple-600">{agency?.commission_rate || 0}%</div>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Total Rezervare</div>
                <div className="text-2xl font-bold text-orange-600">{totalAmount.toFixed(2)} €</div>
              </div>
            </div>
          </div>

          {/* Commission Calculation */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-md border-2 border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                💰
              </div>
              <h2 className="text-xl font-bold text-purple-900">Comisionul Tău</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-white/50 rounded-xl p-4">
                <div className="text-sm text-purple-700 mb-1">Din Plățile Primite</div>
                <div className="text-3xl font-bold text-purple-900">
                  {(paidAmount * (agency?.commission_rate || 0) / 100).toFixed(2)} €
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {agency?.commission_rate}% din {paidAmount.toFixed(2)} € plătit
                </div>
              </div>
              <div className="bg-white/50 rounded-xl p-4">
                <div className="text-sm text-purple-700 mb-1">Comision Total Estimat</div>
                <div className="text-2xl font-bold text-purple-900">
                  {(totalAmount * (agency?.commission_rate || 0) / 100).toFixed(2)} €
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {agency?.commission_rate}% din {totalAmount.toFixed(2)} € total
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Passengers */}
        {booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">👥</span>
              <h2 className="text-xl font-bold text-gray-900">Lista Pasageri ({booking.passengers.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {booking.passengers.map((pax: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{pax.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">
                      {pax.age || 'N/A'} ani
                      {pax.passport && ` • ${pax.passport}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agency Notes */}
        {booking.agency_notes && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md border-2 border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💬</span>
              <h2 className="text-xl font-bold text-blue-900">Observațiile Tale</h2>
            </div>
            <p className="text-blue-900 leading-relaxed">{booking.agency_notes}</p>
          </div>
        )}

        {/* Admin Response */}
        {(booking.approval_notes || booking.rejection_reason) && (
          <div className={`rounded-2xl shadow-md border-2 p-6 ${
            booking.status === 'approved' 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
              : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{booking.status === 'approved' ? '✅' : '❌'}</span>
              <h2 className={`text-xl font-bold ${
                booking.status === 'approved' ? 'text-green-900' : 'text-red-900'
              }`}>
                Răspuns J'Info Tours
              </h2>
            </div>
            <p className={`leading-relaxed ${
              booking.status === 'approved' ? 'text-green-900' : 'text-red-900'
            }`}>
              {booking.approval_notes || booking.rejection_reason}
            </p>
          </div>
        )}

        {/* Payment Deadline Warning */}
        {remainingAmount > 0 && (
          <div className={`rounded-2xl shadow-md border-2 p-6 ${deadlineWarning.className}`}>
            <div className="flex items-center gap-4">
              <div className="text-4xl">⏰</div>
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">Termen Limită Plată</div>
                <p className="text-sm">
                  {deadlineWarning.text}
                </p>
                <p className="text-xs mt-2 opacity-75">
                  Plata completă trebuie efectuată cu 45 zile înainte de plecare
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS SECTION */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">💰</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">Status Plăți</h2>
                  <p className="text-green-100 text-sm">{payments.length} {payments.length === 1 ? 'plată înregistrată' : 'plăți înregistrate'}</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-white text-sm font-semibold">Doar Vizualizare</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Payment Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="text-sm text-blue-600 font-semibold mb-1">Total Rezervare</div>
                <div className="text-3xl font-bold text-gray-900">{totalAmount.toFixed(2)} €</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="text-sm text-green-600 font-semibold mb-1">Plătit</div>
                <div className="text-3xl font-bold text-green-700">{paidAmount.toFixed(2)} €</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
                <div className="text-sm text-orange-600 font-semibold mb-1">Rămas de Plată</div>
                <div className="text-3xl font-bold text-orange-700">{remainingAmount.toFixed(2)} €</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Progres Plată</span>
                <span className="text-sm font-bold text-green-600">{paymentProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                />
              </div>
            </div>

            {/* Payments List */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Se încarcă plățile...</div>
            ) : (
              <PaymentsList
                payments={payments}
                currency="EUR"
                canDelete={false}
              />
            )}
          </div>
        </div>

        {/* DOCUMENTS SECTION */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📄</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">Documente Disponibile</h2>
                  <p className="text-blue-100 text-sm">{documents.length} {documents.length === 1 ? 'document' : 'documente'}</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-white text-sm font-semibold">Doar Descărcare</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Se încarcă documentele...</div>
            ) : (
              <DocumentsList
                documents={documents}
                onDownload={handleDownloadDocument}
                canDelete={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}