'use client';
// components/admin/AdminCruiseBookingCard.tsx

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminCruiseBookingCardProps {
  booking: any;
}

export default function AdminCruiseBookingCard({ booking }: AdminCruiseBookingCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const agency = booking.agencies;
  const totalPax = (booking.num_adults || 0) + (booking.num_children || 0);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { gradient: string; badge: string; text: string; icon: string }> = {
      pending:   { gradient: 'from-yellow-50 to-amber-50',  badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'În așteptare', icon: '⏳' },
      approved:  { gradient: 'from-green-50 to-emerald-50', badge: 'bg-green-100 text-green-800 border-green-300',   text: 'Aprobat',      icon: '✅' },
      rejected:  { gradient: 'from-red-50 to-rose-50',      badge: 'bg-red-100 text-red-800 border-red-300',         text: 'Respins',      icon: '❌' },
      cancelled: { gradient: 'from-gray-50 to-slate-50',    badge: 'bg-gray-100 text-gray-800 border-gray-300',      text: 'Anulat',       icon: '🚫' },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(booking.status);

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cruise_bookings')
        .update({
          status:         'approved',
          approved_at:    new Date().toISOString(),
          approved_by:    user.id,
          admin_notes:    approvalNotes || null,
        })
        .eq('id', booking.id);

      if (error) throw error;
      setShowApproveModal(false);
      router.refresh();
    } catch (err: any) {
      alert('Eroare la aprobare: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { alert('Completează motivul respingerii'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cruise_bookings')
        .update({
          status:               'cancelled',
          cancelled_at:         new Date().toISOString(),
          cancellation_reason:  rejectionReason,
        })
        .eq('id', booking.id);

      if (error) throw error;
      setShowRejectModal(false);
      router.refresh();
    } catch (err: any) {
      alert('Eroare la respingere: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-gray-100">
        {/* Header */}
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left">
          <div className={`bg-gradient-to-r ${statusConfig.gradient} px-6 py-4 border-b-2 border-cyan-100`}>
            <div className="flex items-center justify-between gap-4">
              {/* Left */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🚢</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusConfig.badge}`}>
                    {statusConfig.text}
                  </span>
                  {booking.booking_number && (
                    <span className="text-xs font-mono font-semibold text-gray-600">
                      #{booking.booking_number}
                    </span>
                  )}
                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">
                    Croazieră
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                  {booking.ship_name || 'Navă necunoscută'} — {booking.itin_desc || booking.sailing_port || ''}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>🏢</span>
                  <span className="truncate">{agency?.company_name || 'Necunoscută'}</span>
                  {booking.jinfocruise_jinfo_no && (
                    <span className="text-xs text-gray-400 font-mono">· {booking.jinfocruise_jinfo_no}</span>
                  )}
                </div>
              </div>

              {/* Middle */}
              <div className="hidden md:flex items-center gap-3 text-sm">
                {booking.sailing_date && (
                  <div className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-lg">
                    <span>📅</span>
                    <span className="font-semibold">{formatDate(booking.sailing_date)}</span>
                  </div>
                )}
                {booking.nights && (
                  <div className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-lg">
                    <span>🌙</span>
                    <span className="font-semibold">{booking.nights}n</span>
                  </div>
                )}
                <div className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-lg">
                  <span>👥</span>
                  <span className="font-semibold">{totalPax}</span>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-4">
                <div className="text-right min-w-[120px]">
                  <div className="text-xl font-bold text-gray-900">
                    {booking.gross_amount ? `${Number(booking.gross_amount).toFixed(0)} €` : '—'}
                  </div>
                  {booking.agency_commission && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Com: {Number(booking.agency_commission).toFixed(0)} €
                    </div>
                  )}
                </div>
                <div className={`text-2xl transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>⌄</div>
              </div>
            </div>
          </div>
        </button>

        {/* Expanded */}
        <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="p-6 space-y-4">
            {/* Detalii croazieră */}
            <div className="flex flex-wrap gap-3 text-sm">
              {booking.category_name && (
                <div className="flex items-center gap-2 bg-cyan-50 px-3 py-2 rounded-lg border border-cyan-200">
                  <span>🛏️</span>
                  <span className="font-semibold text-gray-900">{booking.category_name}</span>
                  {booking.cabin_no && booking.cabin_no !== '000000' && (
                    <span className="text-gray-500">· Cabina {booking.cabin_no}</span>
                  )}
                </div>
              )}
              {booking.fare_desc && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <span>⭐</span>
                  <span className="font-semibold text-gray-900">{booking.fare_desc}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                <span>👥</span>
                <span className="font-semibold text-gray-900">
                  {booking.num_adults} adulți{booking.num_children > 0 ? `, ${booking.num_children} copii` : ''}
                </span>
              </div>
              {booking.port_charges && (
                <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <span>⚓</span>
                  <span className="font-semibold text-gray-900">Taxe port: {Number(booking.port_charges).toFixed(0)} €</span>
                </div>
              )}
            </div>

            {/* Agenție */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0">🏢</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Agenție Parteneră</div>
                  <div className="font-bold text-gray-900 mb-2">{agency?.company_name || 'Necunoscută'}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                    {agency?.contact_person && <div className="flex items-center gap-1"><span>👤</span><span>{agency.contact_person}</span></div>}
                    {agency?.email         && <div className="flex items-center gap-1"><span>📧</span><span className="truncate">{agency.email}</span></div>}
                    {agency?.phone         && <div className="flex items-center gap-1"><span>📞</span><span>{agency.phone}</span></div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Pasageri */}
            {booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span>👥</span>
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Pasageri ({booking.passengers.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {booking.passengers.map((pax: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg border border-gray-200">
                      <span className="font-bold text-gray-400">{idx + 1}.</span>
                      <span className="font-semibold text-gray-900">{pax.first_name} {pax.last_name}</span>
                      <span className="text-gray-500 text-xs">({pax.pax_type})</span>
                      {pax.date_of_birth && <span className="text-gray-400 text-xs ml-auto">{pax.date_of_birth}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note agenție */}
            {booking.agency_notes && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span>💬</span>
                  <span className="text-sm font-bold text-purple-900 uppercase tracking-wide">Observații Agenție</span>
                </div>
                <p className="text-sm text-purple-900 leading-relaxed">{booking.agency_notes}</p>
              </div>
            )}

            {/* Note admin */}
            {booking.admin_notes && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span>✅</span>
                  <span className="text-sm font-bold text-green-900 uppercase tracking-wide">Notă Admin</span>
                </div>
                <p className="text-sm text-green-900 leading-relaxed">{booking.admin_notes}</p>
              </div>
            )}

            {booking.cancellation_reason && (
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <span>❌</span>
                  <span className="text-sm font-bold text-red-900 uppercase tracking-wide">Motiv Anulare</span>
                </div>
                <p className="text-sm text-red-900 leading-relaxed">{booking.cancellation_reason}</p>
              </div>
            )}

            {/* Acțiuni */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
              <div className="text-xs text-gray-500">
                📅 {new Date(booking.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/bookings/cruise/${booking.id}`}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all font-semibold text-sm shadow-md"
                >
                  🚢 Detalii
                </Link>
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-sm shadow-md"
                    >
                      ✓ Aprobă
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all font-semibold text-sm shadow-md"
                    >
                      ✕ Anulează
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Aprobare */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">✅</div>
              <h3 className="text-xl font-bold text-gray-900">Aprobă Rezervarea Croazieră</h3>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notă aprobare (opțional)</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={4}
                placeholder="Ex: Rezervare aprobată. Locuri confirmate."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition-all font-semibold">
                {loading ? '⏳ Se procesează...' : '✓ Confirmă Aprobare'}
              </button>
              <button onClick={() => setShowApproveModal(false)} disabled={loading}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anulare */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">❌</div>
              <h3 className="text-xl font-bold text-gray-900">Anulează Rezervarea Croazieră</h3>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Motiv anulare <span className="text-red-500">*</span></label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Ex: Locuri indisponibile pentru data selectată."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleReject} disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 transition-all font-semibold">
                {loading ? '⏳ Se procesează...' : '✕ Confirmă Anulare'}
              </button>
              <button onClick={() => setShowRejectModal(false)} disabled={loading}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold">
                Înapoi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}