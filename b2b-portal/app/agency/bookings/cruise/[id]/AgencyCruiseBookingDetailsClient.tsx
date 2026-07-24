'use client';
// app/agency/bookings/cruise/[id]/AgencyCruiseBookingDetailsClient.tsx

import { useState, useEffect } from 'react';
import PaymentsList from '@/components/payments/PaymentsList';
import DocumentsList from '@/components/documents/DocumentsList';
import Link from 'next/link';

export default function AgencyCruiseBookingDetailsClient({ booking }: { booking: any }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const totalAmount = Number(booking.gross_amount) || 0;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pr, dr] = await Promise.all([
        fetch(`/api/cruise-payments?booking_id=${booking.id}`),
        fetch(`/api/cruise-documents?booking_id=${booking.id}`),
      ]);
      if (pr.ok) {
        const data = await pr.json();
        // cruise_payment_records folosește paid_at, nu payment_date
        setPayments(data.map((p: any) => ({
          ...p,
          payment_date: p.paid_at,
          reference_number: p.confirmation_notes,
          notes: p.confirmation_notes,
        })));
      }
      if (dr.ok) {
        const docs = await dr.json();
        setDocuments(docs.filter((d: any) => d.visible_to_agency));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDownloadDocument = async (document: any) => {
    const res = await fetch(`/api/cruise-documents/${document.id}`);
    const { url } = await res.json();
    window.open(url, '_blank');
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { badge: string; text: string; icon: string }> = {
      pending: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'În așteptare', icon: '⏳' },
      approved: { badge: 'bg-green-100 text-green-800 border-green-300', text: 'Aprobat', icon: '✅' },
      cancelled: { badge: 'bg-gray-100 text-gray-800 border-gray-300', text: 'Anulat', icon: '🚫' },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(booking.status);
  const paidAmount = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const remainingAmount = totalAmount - paidAmount;
  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const fmt = (d: string | null) => d
    ? new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  const commissionRate = booking.commission_rate || booking.agencies?.commission_rate || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/agency/bookings?tab=cruises"
          className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-semibold shadow-md border border-gray-200">
          ← Înapoi la Rezervări
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🚢</span>
            <h1 className="text-3xl font-bold text-gray-900">Rezervare Croazieră</h1>
          </div>
          <p className="text-gray-600">
            <span className="font-mono font-semibold">#{booking.booking_number}</span>
            {booking.jinfocruise_jinfo_no && (
              <span className="ml-2 text-gray-400 text-sm">· {booking.jinfocruise_jinfo_no}</span>
            )}
          </p>
        </div>

        <div className={`px-5 py-3 rounded-xl border-2 ${remainingAmount <= 0 ? 'bg-green-50 border-green-300' : remainingAmount < totalAmount ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'
          }`}>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            {remainingAmount <= 0 ? 'Plătit Complet' : 'Rămas de Plată'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{remainingAmount <= 0 ? '✅' : remainingAmount < totalAmount ? '⚠️' : '💰'}</span>
            <span className={`text-2xl font-bold ${remainingAmount <= 0 ? 'text-green-700' : remainingAmount < totalAmount ? 'text-yellow-700' : 'text-red-700'}`}>
              {remainingAmount <= 0 ? '0.00' : remainingAmount.toFixed(2)} €
            </span>
          </div>
          {remainingAmount > 0 && (
            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
              <div className={`h-full ${paymentProgress >= 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${Math.min(paymentProgress, 100)}%` }} />
            </div>
          )}
        </div>

        <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${statusConfig.badge} flex items-center gap-2`}>
          <span>{statusConfig.icon}</span>{statusConfig.text}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Croazieră */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-2xl">🚢</div>
            <h2 className="text-xl font-bold text-gray-900">Croazieră</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div><div className="text-gray-500 mb-0.5">Navă</div><div className="font-semibold">{booking.ship_name || 'N/A'}</div></div>
            <div><div className="text-gray-500 mb-0.5">Data îmbarcare</div><div className="font-semibold">{fmt(booking.sailing_date)}</div></div>
            <div><div className="text-gray-500 mb-0.5">Port plecare</div><div className="font-semibold">{booking.sailing_port || 'N/A'}</div></div>
            <div><div className="text-gray-500 mb-0.5">Nopți</div><div className="font-semibold">{booking.nights || 'N/A'}</div></div>
            {booking.itin_desc && <div><div className="text-gray-500 mb-0.5">Itinerar</div><div className="font-semibold text-xs">{booking.itin_desc}</div></div>}
            {booking.category_name && <div><div className="text-gray-500 mb-0.5">Categorie</div><div className="font-semibold">{booking.category_name}</div></div>}
            {booking.fare_desc && <div><div className="text-gray-500 mb-0.5">Experience</div><div className="font-semibold">{booking.fare_desc}</div></div>}
          </div>
        </div>

        {/* Detalii */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
            <h2 className="text-xl font-bold text-gray-900">Detalii</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500 mb-0.5">Călători</div>
              <div className="font-semibold">{booking.num_adults} adulți{booking.num_children > 0 ? ` + ${booking.num_children} copii` : ''}</div>
            </div>
            {booking.port_charges && (
              <div><div className="text-gray-500 mb-0.5">Taxe port</div><div className="font-semibold">{Number(booking.port_charges).toFixed(2)} €</div></div>
            )}
            <div className="pt-3 border-t border-gray-200">
              <div className="text-gray-500 mb-0.5">Total Rezervare</div>
              <div className="text-2xl font-bold text-cyan-600">{totalAmount.toFixed(2)} €</div>
            </div>
          </div>
        </div>

        {/* Comision */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-md border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">💰</div>
            <h2 className="text-xl font-bold text-purple-900">Comisionul Tău</h2>
          </div>
          <div className="space-y-4">
            {booking.agency_commission ? (
              <div className="bg-white/50 rounded-xl p-4">
                <div className="text-sm text-purple-700 mb-1">Comision Total</div>
                <div className="text-3xl font-bold text-purple-900">{Number(booking.agency_commission).toFixed(2)} €</div>
                <div className="text-xs text-purple-600 mt-1">Calculat la momentul rezervării</div>
              </div>
            ) : (
              <div className="bg-white/50 rounded-xl p-4">
                <div className="text-sm text-purple-700 mb-1">Din Plățile Primite</div>
                <div className="text-3xl font-bold text-purple-900">
                  {(paidAmount * commissionRate / 100).toFixed(2)} €
                </div>
                <div className="text-xs text-purple-600 mt-1">{commissionRate}% din {paidAmount.toFixed(2)} € plătit</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pasageri */}
      {booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">👥</span>
            <h2 className="text-xl font-bold text-gray-900">Lista Pasageri ({booking.passengers.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {booking.passengers.map((pax: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center font-bold text-cyan-600">{idx + 1}</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{pax.first_name} {pax.last_name}</div>
                  <div className="text-sm text-gray-500">{pax.pax_type} · {pax.nationality || 'ROU'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Răspuns J'Info */}
      {(booking.admin_notes || booking.cancellation_reason) && (
        <div className={`rounded-2xl shadow-md border-2 p-6 ${booking.status === 'approved'
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
          }`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{booking.status === 'approved' ? '✅' : '❌'}</span>
            <h2 className={`text-xl font-bold ${booking.status === 'approved' ? 'text-green-900' : 'text-red-900'}`}>
              Răspuns J'Info Tours
            </h2>
          </div>
          <p className={`leading-relaxed ${booking.status === 'approved' ? 'text-green-900' : 'text-red-900'}`}>
            {booking.admin_notes || booking.cancellation_reason}
          </p>
        </div>
      )}

      {/* PLĂȚI — doar vizualizare */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💰</span>
              <div>
                <h2 className="text-2xl font-bold text-white">Status Plăți</h2>
                <p className="text-green-100 text-sm">{payments.length} {payments.length === 1 ? 'plată' : 'plăți'}</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white text-sm font-semibold">Doar Vizualizare</div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
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
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Progres Plată</span>
              <span className="text-sm font-bold text-green-600">{paymentProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(paymentProgress, 100)}%` }} />
            </div>
          </div>
          {loading ? <div className="text-center py-8 text-gray-500">Se încarcă...</div> : (
            <PaymentsList payments={payments} currency="EUR" canDelete={false} />
          )}
        </div>
      </div>

      {/* DOCUMENTE — doar descărcare */}
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
          {loading ? <div className="text-center py-8 text-gray-500">Se încarcă...</div> : (
            <DocumentsList documents={documents} onDownload={handleDownloadDocument} canDelete={false} />
          )}
        </div>
      </div>
    </div>
  );
}