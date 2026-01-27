'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentBadge from '@/components/payments/PaymentBadge';
import PaymentsList from '@/components/payments/PaymentsList';
import DocumentsList from '@/components/documents/DocumentsList';
import { MapPin, Phone, Mail, Users, Calendar, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import type { PaymentStatus } from '@/lib/types/payment';

interface AgencyBookingDetailsClientProps {
  booking: any;
}

export default function AgencyBookingDetailsClient({ booking }: AgencyBookingDetailsClientProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const totalAmount = booking.total_price || 0;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, docsRes] = await Promise.all([
        fetch(`/api/payments?booking_id=${booking.id}`),
        fetch(`/api/documents?booking_id=${booking.id}`)
      ]);

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { label: 'În așteptare', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprobat', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Respins', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Anulat', className: 'bg-gray-100 text-gray-800' }
    };
    const { label, className } = variants[status] || variants.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  const totalPax = (booking.num_adults || 0) + (booking.num_children || 0);
  const paidAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const remainingAmount = totalAmount - paidAmount;
  const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const getPaymentStatus = (): PaymentStatus => {
    if (paidAmount === 0) return 'pending';
    if (paidAmount >= totalAmount) return 'paid';
    return 'partial';
  };

  const getPaymentDeadline = () => {
    const departureDate = new Date(booking.departure.departure_date);
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
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }

    if (daysRemaining > 10) {
      return {
        text: '✓ În termen',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }

    if (daysRemaining >= 5 && daysRemaining <= 10) {
      return {
        text: `⚠️ ${daysRemaining} zile rămase`,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    }

    if (daysRemaining > 0 && daysRemaining < 5) {
      return {
        text: `🚨 URGENT: ${daysRemaining} zile!`,
        className: 'bg-red-100 text-red-800 border-red-200'
      };
    }

    return {
      text: '❌ Depășit termenul',
      className: 'bg-red-100 text-red-800 border-red-200'
    };
  };

  const deadlineWarning = getDeadlineWarning();

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Detalii Rezervare</h1>
          <p className="text-muted-foreground">
            Nr: {booking.booking_number || 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(booking.status)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informații Circuit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Circuit</p>
              <p className="font-medium">{booking.circuit?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Durată</p>
              <p className="font-medium">{booking.circuit?.nights || 'N/A'} nopți</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Călătorie</p>
              <p className="font-medium">
                {formatDate(booking.departure?.departure_date)} - {formatDate(booking.departure?.return_date)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informații Agenție
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nume Agenție</p>
              <p className="font-medium">{booking.agency?.company_name || 'N/A'}</p>
            </div>
            {booking.agency?.contact_person && (
              <div>
                <p className="text-sm text-muted-foreground">Persoană Contact</p>
                <p className="font-medium">{booking.agency.contact_person}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{booking.agency?.email || 'N/A'}</span>
            </div>
            {booking.agency?.phone && (
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
          <CardTitle>Detalii Rezervare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Număr Călători</p>
              <p className="text-2xl font-bold">{totalPax}</p>
              <p className="text-xs text-muted-foreground">
                {booking.num_adults || 0} adulți, {booking.num_children || 0} copii
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tip Cameră</p>
              <p className="text-xl font-bold">{booking.room_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-orange-600">{totalAmount.toFixed(2)} EUR</p>
            </div>
          </div>

          {booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-3">Pasageri:</p>
                <div className="grid gap-2">
                  {booking.passengers.map((pax: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-500">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="font-medium">{pax.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">
                          {pax.age || 'N/A'} ani
                          {pax.passport && ` • Pașaport: ${pax.passport}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {booking.agency_notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Observații Agenție:</p>
                <p className="text-sm bg-purple-50 p-3 rounded-lg border border-purple-200">
                  {booking.agency_notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Informații</TabsTrigger>
          <TabsTrigger value="payments">
            Plăți ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documente ({documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Toate detaliile rezervării sunt afișate mai sus.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plăți</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4 p-4 bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{totalAmount.toFixed(2)} EUR</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plătit</p>
                  <p className="text-2xl font-bold text-green-600">{paidAmount.toFixed(2)} EUR</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rămas</p>
                  <p className="text-2xl font-bold text-orange-600">{remainingAmount.toFixed(2)} EUR</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <PaymentBadge status={getPaymentStatus()} />
                </div>
              </div>

              <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-green-600"
                  style={{ width: `${Math.min(paidPercentage, 100)}%` }}
                ></div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg border font-medium ${deadlineWarning.className}`}>
                {remainingAmount > 0 ? (
                  <>
                    <AlertTriangle className="h-5 w-5" />
                    <span>Termen limită plată: {deadlineWarning.text}</span>
                  </>
                ) : (
                  <span>{deadlineWarning.text}</span>
                )}
              </div>

              <Separator />

              {loading ? (
                <p className="text-center text-muted-foreground py-8">Se încarcă...</p>
              ) : payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nu există plăți înregistrate.
                </p>
              ) : (
                <PaymentsList
                  payments={payments}
                  currency="EUR"
                  canDelete={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documente</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Se încarcă...</p>
              ) : documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nu există documente disponibile.
                </p>
              ) : (
                <DocumentsList
                  documents={documents}
                  onDownload={handleDownloadDocument}
                  canDelete={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
