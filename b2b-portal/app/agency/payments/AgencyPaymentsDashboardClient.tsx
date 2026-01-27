'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PaymentBadge from '@/components/payments/PaymentBadge';
import Link from 'next/link';
import { TrendingUp, TrendingDown, CheckCircle, Clock, Calendar, CreditCard, FileText, AlertTriangle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('history');

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMethod = (method: string) => {
    if (!method) return 'N/A';
    return method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

    return { deadline, daysRemaining };
  };

  const getDeadlineText = (booking: any) => {
    if (booking.remaining_amount <= 0) {
      return { text: '✓ Plătit', className: 'text-green-600' };
    }

    const { daysRemaining } = getPaymentDeadline(booking.departure.departure_date);

    if (daysRemaining > 10) {
      return { text: '✓ În termen', className: 'text-green-600' };
    }

    if (daysRemaining >= 5 && daysRemaining <= 10) {
      return { text: `⚠️ ${daysRemaining} zile`, className: 'text-yellow-600' };
    }

    if (daysRemaining > 0 && daysRemaining < 5) {
      return { text: `🚨 ${daysRemaining} zile`, className: 'text-red-600' };
    }

    return { text: '❌ Depășit', className: 'text-red-600' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-blue-500 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="text-5xl">💰</div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard Plăți</h1>
                <p className="text-blue-100">
                  Monitorizează plățile și statusul financiar
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats.totalPaid.toFixed(2)} EUR
                </div>
                <div className="text-sm text-gray-600">Total Încasat</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <TrendingDown className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {stats.totalOutstanding.toFixed(2)} EUR
                </div>
                <div className="text-sm text-gray-600">Restant de Plată</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.bookingsFullyPaid}
                </div>
                <div className="text-sm text-gray-600">Plătite Integral</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {stats.bookingsPending}
                </div>
                <div className="text-sm text-gray-600">În Așteptare</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Istoric Plăți ({payments.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Status Rezervări ({bookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Istoric Plăți</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nu există plăți înregistrate</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Rezervare</TableHead>
                          <TableHead>Circuit</TableHead>
                          <TableHead>Sumă</TableHead>
                          <TableHead>Metodă</TableHead>
                          <TableHead>Referință</TableHead>
                          <TableHead>Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {formatDate(payment.paid_at)}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {payment.booking_number || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>{payment.circuit_name}</TableCell>
                            <TableCell className="font-bold text-green-600">
                              {parseFloat(payment.amount).toFixed(2)} EUR
                            </TableCell>
                            <TableCell>{formatMethod(payment.payment_method)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {payment.confirmation_notes || '-'}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/agency/bookings/${payment.pre_booking_id}`}
                                className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                              >
                                Vezi →
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Status Plăți Rezervări</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nu există rezervări</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nr. Rezervare</TableHead>
                          <TableHead>Circuit</TableHead>
                          <TableHead>Plecare</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Plătit</TableHead>
                          <TableHead>Rămas</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking: any) => {
                          const deadlineInfo = getDeadlineText(booking);
                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-mono text-sm">
                                {booking.booking_number}
                              </TableCell>
                              <TableCell className="font-medium">
                                {booking.circuit?.name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {formatDate(booking.departure?.departure_date)}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {booking.total_price.toFixed(2)} EUR
                              </TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {booking.total_paid.toFixed(2)} EUR
                              </TableCell>
                              <TableCell className="font-semibold text-orange-600">
                                {Math.max(booking.remaining_amount, 0).toFixed(2)} EUR
                              </TableCell>
                              <TableCell>
                                <PaymentBadge status={getPaymentStatus(booking)} />
                              </TableCell>
                              <TableCell>
                                <span className={`text-sm font-medium ${deadlineInfo.className}`}>
                                  {deadlineInfo.text}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Link
                                  href={`/agency/bookings/${booking.id}`}
                                  className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                                >
                                  Vezi →
                                </Link>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
