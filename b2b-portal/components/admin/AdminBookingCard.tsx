'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminBookingCardProps {
  booking: any;
}

export default function AdminBookingCard({ booking }: AdminBookingCardProps) {
  const router = useRouter();
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string; icon: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'În așteptare', icon: '⏳' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Aprobat', icon: '✅' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Respins', icon: '❌' },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Anulat', icon: '🚫' },
    };
    
    const badge = badges[status] || badges.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${badge.color}`}>
        <span>{badge.icon}</span>
        <span>{badge.text}</span>
      </span>
    );
  };

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
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 border-gray-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {circuit?.name || 'Circuit necunoscut'}
                </h3>
                {getStatusBadge(booking.status)}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                {booking.booking_number && (
                  <span className="flex items-center gap-1 font-semibold">
                    Nr: <span className="font-mono">{booking.booking_number}</span>
                  </span>
                )}
                {depDate && (
                  <span className="flex items-center gap-1">
                    📅 {depDate.toLocaleDateString('ro-RO', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  👥 {totalPax} {totalPax === 1 ? 'persoană' : 'persoane'}
                </span>
                <span className="flex items-center gap-1">
                  🏨 {booking.room_type}
                </span>
              </div>

              {/* Agency Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-blue-900 mb-1">
                  Agenție:
                </div>
                <div className="text-sm text-blue-800">
                  <div className="font-bold">{agency?.company_name || 'Necunoscută'}</div>
                  {agency?.contact_person && (
                    <div>Contact: {agency.contact_person}</div>
                  )}
                  {agency?.email && (
                    <div>Email: {agency.email}</div>
                  )}
                  {agency?.phone && (
                    <div>Tel: {agency.phone}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right ml-4">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-2xl font-bold text-orange-600">
                {booking.total_price} EUR
              </div>
              {booking.agency_commission && (
                <div className="text-sm text-green-600 font-medium">
                  Comision agenție: {booking.agency_commission} EUR
                </div>
              )}
            </div>
          </div>

          {/* Passengers */}
          {booking.passengers && Array.isArray(booking.passengers) && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Pasageri:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {booking.passengers.map((pax: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-500">{idx + 1}.</span>
                    <span className="font-medium">{pax.name}</span>
                    <span className="text-gray-500">({pax.age} ani)</span>
                    {pax.passport && (
                      <span className="text-gray-500 text-xs">• {pax.passport}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.agency_notes && (
            <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm font-semibold text-purple-900 mb-1">
                Observații agenție:
              </div>
              <div className="text-sm text-purple-800">
                {booking.agency_notes}
              </div>
            </div>
          )}

          {/* Admin Response */}
          {booking.status === 'approved' && booking.approval_notes && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-semibold text-green-900 mb-1">
                Notă aprobare:
              </div>
              <div className="text-sm text-green-800">
                {booking.approval_notes}
              </div>
            </div>
          )}

          {booking.status === 'rejected' && booking.rejection_reason && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm font-semibold text-red-900 mb-1">
                Motiv respingere:
              </div>
              <div className="text-sm text-red-800">
                {booking.rejection_reason}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Creat: {new Date(booking.created_at).toLocaleDateString('ro-RO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/circuits/${circuit?.slug || ''}`}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                Vezi circuitul →
              </Link>

              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
                  >
                    ✓ Aprobă
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                  >
                    ✕ Respinge
                  </button>
                </>
              )}
              
             
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Aprobă Pre-Rezervarea
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notă aprobare (opțional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                placeholder="Ex: Pre-rezervare aprobată. Locuri confirmate pentru data selectată."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors font-medium"
                style={{ backgroundColor: loading ? '#9ca3af' : '#22c55e', color: '#ffffff' }}
              >
                {loading ? 'Se procesează...' : '✓ Confirmă Aprobare'}
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Respinge Pre-Rezervarea
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motiv respingere *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
                placeholder="Ex: Locuri indisponibile pentru data selectată. Te rugăm să alegi o altă dată de plecare."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors font-medium"
                style={{ backgroundColor: loading ? '#9ca3af' : '#ef4444', color: '#ffffff' }}
              >
                {loading ? 'Se procesează...' : '✕ Confirmă Respingere'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
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