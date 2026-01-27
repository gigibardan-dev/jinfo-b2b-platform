'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminBookingCardProps {
  booking: any;
}

// Payment Status Indicator Component
function PaymentStatusIndicator({ bookingId, totalPrice }: { bookingId: string; totalPrice: number }) {
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch(`/api/payments?booking_id=${bookingId}`);
        if (res.ok) {
          const payments = await res.json();
          const total = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
          setPaidAmount(total);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [bookingId]);

  if (loading) {
    return <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse mt-1"></div>;
  }

  const remaining = totalPrice - paidAmount;
  const progress = totalPrice > 0 ? (paidAmount / totalPrice) * 100 : 0;

  return (
    <div className="mt-1">
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full transition-all duration-500 ${
            progress >= 100 
              ? 'bg-green-500' 
              : progress > 0 
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {/* Status Text */}
      <div className={`text-xs font-semibold ${
        progress >= 100 
          ? 'text-green-600' 
          : progress > 0 
          ? 'text-yellow-600'
          : 'text-red-600'
      }`}>
        {progress >= 100 
          ? '✅ Plătit complet' 
          : progress > 0 
          ? `⚠️ Plătit: ${paidAmount.toFixed(0)}€`
          : '❌ Neplătit'}
      </div>
    </div>
  );
}

export default function AdminBookingCard({ booking }: AdminBookingCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const circuit = booking.circuits;
  const departure = booking.departures;
  const agency = booking.agencies;
  const depDate = departure ? new Date(departure.departure_date) : null;
  const totalPax = booking.num_adults + booking.num_children;

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

  const handleApprove = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('pre_bookings')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          approval_notes: approvalNotes || null,
        })
        .eq('id', booking.id);

      if (error) throw error;

      setShowApproveModal(false);
      router.refresh();
    } catch (err: any) {
      console.error('Error approving booking:', err);
      alert('Eroare la aprobare: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Te rog completează motivul respingerii');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('pre_bookings')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
          rejection_reason: rejectionReason,
        })
        .eq('id', booking.id);

      if (error) throw error;

      setShowRejectModal(false);
      router.refresh();
    } catch (err: any) {
      console.error('Error rejecting booking:', err);
      alert('Eroare la respingere: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-gray-100">
        {/* Collapsed Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          <div className={`bg-gradient-to-r ${statusConfig.gradient} px-6 py-4 border-b-2 ${statusConfig.badge.includes('yellow') ? 'border-yellow-200' : statusConfig.badge.includes('green') ? 'border-green-200' : statusConfig.badge.includes('red') ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between gap-4">
              {/* Left Section: Circuit & Agency */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{statusConfig.icon}</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusConfig.badge}`}>
                    {statusConfig.text}
                  </span>
                  {booking.booking_number && (
                    <span className="text-xs font-mono font-semibold text-gray-600">
                      #{booking.booking_number}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                  {circuit?.name || 'Circuit necunoscut'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="font-semibold">🏢</span>
                  <span className="truncate">{agency?.company_name || 'Necunoscută'}</span>
                </div>
              </div>

              {/* Middle Section: Quick Info */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                {depDate && (
                  <div className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-lg">
                    <span>📅</span>
                    <span className="font-semibold">
                      {depDate.toLocaleDateString('ro-RO', { 
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-lg">
                  <span>👥</span>
                  <span className="font-semibold">{totalPax}</span>
                </div>
              </div>

              {/* Right Section: Price & Expand */}
              <div className="flex items-center gap-4">
                <div className="text-right min-w-[140px]">
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {booking.total_price} €
                  </div>
                  {/* Payment Status Indicator */}
                  <PaymentStatusIndicator bookingId={booking.id} totalPrice={booking.total_price} />
                  {booking.agency_commission && (
                    <div className="text-xs text-gray-500 font-medium mt-1">
                      Com: {booking.agency_commission} €
                    </div>
                  )}
                </div>
                <div className={`text-2xl transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  ⌄
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="p-6 space-y-4">
            {/* Circuit Details */}
            <div className="flex flex-wrap gap-3 text-sm">
              {depDate && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <span className="text-blue-600">📅</span>
                  <span className="font-semibold text-gray-900">
                    {depDate.toLocaleDateString('ro-RO', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                <span className="text-purple-600">👥</span>
                <span className="font-semibold text-gray-900">
                  {booking.num_adults} adulți, {booking.num_children} copii
                </span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                <span className="text-orange-600">🏨</span>
                <span className="font-semibold text-gray-900">{booking.room_type}</span>
              </div>
            </div>

            {/* Agency Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0">
                  🏢
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                    Agenție Partner
                  </div>
                  <div className="font-bold text-gray-900 mb-2">{agency?.company_name || 'Necunoscută'}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                    {agency?.contact_person && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">👤</span>
                        <span>{agency.contact_person}</span>
                      </div>
                    )}
                    {agency?.email && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">📧</span>
                        <span className="truncate">{agency.email}</span>
                      </div>
                    )}
                    {agency?.phone && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">📞</span>
                        <span>{agency.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Passengers */}
            {booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">👥</span>
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Lista Pasageri ({booking.passengers.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {booking.passengers.map((pax: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg border border-gray-200">
                      <span className="font-bold text-gray-400">{idx + 1}.</span>
                      <span className="font-semibold text-gray-900">{pax.name}</span>
                      <span className="text-gray-500">({pax.age} ani)</span>
                      {pax.passport && (
                        <span className="text-gray-400 text-xs ml-auto font-mono">{pax.passport}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.agency_notes && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💬</span>
                  <span className="text-sm font-bold text-purple-900 uppercase tracking-wide">
                    Observații Agenție
                  </span>
                </div>
                <p className="text-sm text-purple-900 leading-relaxed">
                  {booking.agency_notes}
                </p>
              </div>
            )}

            {/* Admin Response */}
            {booking.status === 'approved' && booking.approval_notes && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✅</span>
                  <span className="text-sm font-bold text-green-900 uppercase tracking-wide">
                    Notă Aprobare
                  </span>
                </div>
                <p className="text-sm text-green-900 leading-relaxed">
                  {booking.approval_notes}
                </p>
              </div>
            )}

            {booking.status === 'rejected' && booking.rejection_reason && (
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">❌</span>
                  <span className="text-sm font-bold text-red-900 uppercase tracking-wide">
                    Motiv Respingere
                  </span>
                </div>
                <p className="text-sm text-red-900 leading-relaxed">
                  {booking.rejection_reason}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
              <div className="text-xs text-gray-500">
                📅 Creat: {new Date(booking.created_at).toLocaleDateString('ro-RO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                >
                  👁️ Detalii
                </Link>

                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      ✓ Aprobă
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      ✕ Respinge
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                ✅
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Aprobă Pre-Rezervarea
              </h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notă aprobare (opțional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={4}
                placeholder="Ex: Pre-rezervare aprobată. Locuri confirmate pentru data selectată."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                {loading ? '⏳ Se procesează...' : '✓ Confirmă Aprobare'}
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={loading}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all font-semibold"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">
                ❌
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Respinge Pre-Rezervarea
              </h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motiv respingere <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
                placeholder="Ex: Locuri indisponibile pentru data selectată. Te rugăm să alegi o altă dată de plecare."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                {loading ? '⏳ Se procesează...' : '✕ Confirmă Respingere'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all font-semibold"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}