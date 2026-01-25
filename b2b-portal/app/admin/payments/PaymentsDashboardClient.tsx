'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import PaymentBadge from '@/components/payments/PaymentBadge';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, FileText, CheckCircle, Search } from 'lucide-react';
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMethod = (method: string) => {
    return method.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments Dashboard</h1>
        <p className="text-muted-foreground">Track all payments and revenue</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">{stats.totalPayments} payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidBookings}</div>
            <p className="text-xs text-muted-foreground">
              out of {stats.totalBookings} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBookings > 0
                ? ((stats.paidBookings / stats.totalBookings) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Fully paid bookings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="bookings">Bookings Payment Status</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Payments</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference or agency..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Booking Reference</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.payment_date)}</TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/bookings/${payment.booking.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {payment.booking.booking_reference}
                            </Link>
                          </TableCell>
                          <TableCell>{payment.booking.agency?.name || 'N/A'}</TableCell>
                          <TableCell className="font-medium">
                            {payment.amount.toFixed(2)} EUR
                          </TableCell>
                          <TableCell>{formatMethod(payment.payment_method)}</TableCell>
                          <TableCell>{payment.reference_number || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Bookings Payment Status</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference..."
                    value={bookingSearchTerm}
                    onChange={(e) => setBookingSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking Reference</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payments</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.booking_reference}
                          </TableCell>
                          <TableCell>{booking.total_amount.toFixed(2)} EUR</TableCell>
                          <TableCell className="text-green-600">
                            {booking.paid_amount.toFixed(2)} EUR
                          </TableCell>
                          <TableCell className="text-orange-600">
                            {(booking.total_amount - booking.paid_amount).toFixed(2)} EUR
                          </TableCell>
                          <TableCell>
                            <PaymentBadge status={booking.payment_status} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{booking.payments_count} payments</Badge>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/bookings/${booking.id}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View Details
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
