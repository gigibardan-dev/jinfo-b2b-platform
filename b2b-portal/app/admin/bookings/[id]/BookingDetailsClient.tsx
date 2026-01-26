'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentBadge from '@/components/payments/PaymentBadge';
import PaymentFormModal from '@/components/payments/PaymentFormModal';
import PaymentsList from '@/components/payments/PaymentsList';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentsList from '@/components/documents/DocumentsList';
import { Plus, Calendar, Users, MapPin, Phone, Mail } from 'lucide-react';
import type { PaymentSummary } from '@/lib/types/payment';
import type { BookingDocument, DocumentType } from '@/lib/types/document';

interface BookingDetailsClientProps {
  booking: any;
}

export default function BookingDetailsClient({ booking }: BookingDetailsClientProps) {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [documents, setDocuments] = useState<BookingDocument[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalAmount = booking.departure.price_per_person * booking.number_of_travelers;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsRes, docsRes] = await Promise.all([
        fetch(`/api/payments?booking_id=${booking.id}`),
        fetch(`/api/documents?booking_id=${booking.id}`)
      ]);

      const payments = await paymentsRes.json();
      const docs = await docsRes.json();

      const paidAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const remainingAmount = totalAmount - paidAmount;

      let status: any = 'pending';
      if (paidAmount === 0) status = 'pending';
      else if (paidAmount >= totalAmount) status = 'paid';
      else status = 'partial';

      setPaymentSummary({
        total_amount: totalAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        status,
        payments
      });

      setDocuments(docs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (data: any) => {
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
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    const res = await fetch(`/api/payments/${paymentId}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Failed to delete payment');
    await loadData();
  };

  const handleUploadDocument = async (file: File, documentType: DocumentType, notes?: string) => {
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
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const res = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Failed to delete document');
    await loadData();
  };

  const handleDownloadDocument = async (document: BookingDocument) => {
    try {
      const res = await fetch(`/api/documents/${document.id}`);
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { label: 'Pending', variant: 'outline' },
      approved: { label: 'Approved', variant: 'default' },
      rejected: { label: 'Rejected', variant: 'destructive' },
      cancelled: { label: 'Cancelled', variant: 'outline' }
    };
    const { label, variant } = variants[status] || variants.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">Reference: {booking.booking_reference}</p>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(booking.status)}
          {paymentSummary && <PaymentBadge status={paymentSummary.status} />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Circuit Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Circuit</p>
              <p className="font-medium">{booking.circuit.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{booking.circuit.duration} days</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Travel Dates</p>
              <p className="font-medium">
                {formatDate(booking.departure.start_date)} - {formatDate(booking.departure.end_date)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agency Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Agency Name</p>
              <p className="font-medium">{booking.agency.company_name}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{booking.agency.email}</span>
            </div>
            {booking.agency.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.agency.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Number of Travelers</p>
              <p className="text-2xl font-bold">{booking.number_of_travelers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price per Person</p>
              <p className="text-2xl font-bold">{booking.departure.price_per_person} EUR</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{totalAmount} EUR</p>
            </div>
          </div>
          {booking.special_requests && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Special Requests</p>
                <p>{booking.special_requests}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payment Summary</CardTitle>
                <Button onClick={() => setShowPaymentModal(true)} disabled={paymentSummary?.status === 'paid'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentSummary && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">{paymentSummary.total_amount.toFixed(2)} EUR</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        {paymentSummary.paid_amount.toFixed(2)} EUR
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {paymentSummary.remaining_amount.toFixed(2)} EUR
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <PaymentsList
                    payments={paymentSummary.payments}
                    currency="EUR"
                    onDelete={handleDeletePayment}
                    canDelete={true}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Documents</CardTitle>
                <Button onClick={() => setShowDocumentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DocumentsList
                documents={documents}
                onDelete={handleDeleteDocument}
                onDownload={handleDownloadDocument}
                canDelete={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {paymentSummary && (
        <PaymentFormModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handleAddPayment}
          remainingAmount={paymentSummary.remaining_amount}
          currency="EUR"
        />
      )}

      <DocumentUpload
        open={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onUpload={handleUploadDocument}
      />
    </div>
  );
}
