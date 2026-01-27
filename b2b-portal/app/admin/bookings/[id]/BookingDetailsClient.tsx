'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import PaymentFormModal from '@/components/payments/PaymentFormModal';
import PaymentsList from '@/components/payments/PaymentsList';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentsList from '@/components/documents/DocumentsList';
import Link from 'next/link';
import type { DocumentType } from '@/lib/types/document';

interface BookingDetailsClientProps {
  booking: any;
}

export default function BookingDetailsClient({ booking }: BookingDetailsClientProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
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

      // Load documents
      const docsRes = await fetch(`/api/documents?booking_id=${booking.id}`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (data: any) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          booking_id: booking.id,
          currency: 'EUR'
        })
      });

      if (!res.ok) throw new Error('Failed to add payment');
      
      await loadData();
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Sigur vrei să ștergi această plată?')) return;

    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete payment');
      
      await loadData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Eroare la ștergerea plății');
    }
  };

  const handleUploadDocument = async (file: File, documentType: DocumentType, notes?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('booking_id', booking.id);
      formData.append('document_type', documentType);
      if (notes) formData.append('notes', notes);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to upload document');
      
      await loadData();
      setShowDocumentModal(false);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Sigur vrei să ștergi acest document?')) return;

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete document');
      
      await loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Eroare la ștergerea documentului');
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

  return (
    <div className="space-y-6">
      {/* Back Button + Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/bookings"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
        >
          ← Înapoi
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
          </div>
        </div>

        {/* Agency Info */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
              🏢
            </div>
            <h2 className="text-xl font-bold text-gray-900">Agenție</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-500 mb-1">Companie</div>
              <div className="font-semibold text-gray-900">{agency?.company_name || 'N/A'}</div>
            </div>
            {agency?.contact_person && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Contact</div>
                <div className="font-semibold text-gray-900">{agency.contact_person}</div>
              </div>
            )}
            <div className="space-y-2">
              {agency?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>📧</span>
                  <span className="truncate">{agency.email}</span>
                </div>
              )}
              {agency?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>📞</span>
                  <span>{agency.phone}</span>
                </div>
              )}
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
              <div className="text-sm text-gray-500 mb-1">Total Rezervare</div>
              <div className="text-2xl font-bold text-orange-600">{totalAmount.toFixed(2)} €</div>
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
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-md border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💬</span>
            <h2 className="text-xl font-bold text-purple-900">Observații Agenție</h2>
          </div>
          <p className="text-purple-900 leading-relaxed">{booking.agency_notes}</p>
        </div>
      )}

      {/* PAYMENTS SECTION - PROMINENT */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💰</span>
              <div>
                <h2 className="text-2xl font-bold text-white">Gestionare Plăți</h2>
                <p className="text-green-100 text-sm">{payments.length} {payments.length === 1 ? 'plată înregistrată' : 'plăți înregistrate'}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowPaymentModal(true)}
              className="bg-white text-green-600 hover:bg-green-50 font-semibold shadow-lg"
            >
              ➕ Adaugă Plată
            </Button>
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
              onDelete={handleDeletePayment}
              canDelete={true}
            />
          )}
        </div>
      </div>

      {/* DOCUMENTS SECTION - PROMINENT */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📄</span>
              <div>
                <h2 className="text-2xl font-bold text-white">Gestionare Documente</h2>
                <p className="text-blue-100 text-sm">{documents.length} {documents.length === 1 ? 'document încărcat' : 'documente încărcate'}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowDocumentModal(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg"
            >
              📤 Încarcă Document
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Se încarcă documentele...</div>
          ) : (
            <DocumentsList
              documents={documents}
              onDelete={handleDeleteDocument}
              onDownload={handleDownloadDocument}
              canDelete={true}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <PaymentFormModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handleAddPayment}
        remainingAmount={remainingAmount}
        currency="EUR"
      />

      <DocumentUpload
        open={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onUpload={handleUploadDocument}
      />
    </div>
  );
}