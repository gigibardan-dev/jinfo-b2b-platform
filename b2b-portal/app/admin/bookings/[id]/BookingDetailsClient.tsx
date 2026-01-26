'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Users, MapPin, Phone, Mail } from 'lucide-react';

interface BookingDetailsClientProps {
  booking: any;
}

export default function BookingDetailsClient({ booking }: BookingDetailsClientProps) {
  const [loading, setLoading] = useState(false);

  const totalAmount = booking.total_price || 0;

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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Detalii Pre-Rezervare</h1>
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
              <p className="text-2xl font-bold text-orange-600">{totalAmount} EUR</p>
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

          {booking.approval_notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Notă Aprobare:</p>
                <p className="text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                  {booking.approval_notes}
                </p>
              </div>
            </>
          )}

          {booking.rejection_reason && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Motiv Respingere:</p>
                <p className="text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {booking.rejection_reason}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Informații</TabsTrigger>
          <TabsTrigger value="payments">Plăți</TabsTrigger>
          <TabsTrigger value="documents">Documente</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Detalii complete despre rezervare afișate mai sus.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Modulul de plăți va fi implementat în curând.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Modulul de documente va fi implementat în curând.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
