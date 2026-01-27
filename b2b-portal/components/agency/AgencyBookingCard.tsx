'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PaymentBadge from '@/components/payments/PaymentBadge';
import Link from 'next/link';
import { Calendar, Users, MapPin, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import type { PaymentStatus } from '@/lib/types/payment';

interface AgencyBookingCardProps {
  booking: {
    id: string;
    booking_number: string;
    status: string;
    total_price: number;
    num_adults: number;
    num_children: number;
    room_type: string;
    created_at: string;
    circuit: {
      name: string;
      slug: string;
      nights: string;
    };
    departure: {
      departure_date: string;
      return_date: string;
    };
    payments: Array<{
      amount: number;
    }>;
  };
}

export default function AgencyBookingCard({ booking }: AgencyBookingCardProps) {
  const totalPax = booking.num_adults + booking.num_children;
  const paidAmount = booking.payments?.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0) || 0;
  const remainingAmount = booking.total_price - paidAmount;
  const paidPercentage = booking.total_price > 0 ? (paidAmount / booking.total_price) * 100 : 0;

  const getPaymentStatus = (): PaymentStatus => {
    if (paidAmount === 0) return 'pending';
    if (paidAmount >= booking.total_price) return 'paid';
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'În așteptare', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprobat', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Respins', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Anulat', className: 'bg-gray-100 text-gray-800' }
    };
    const { label, className } = variants[status] || variants.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">
                {booking.circuit.name}
              </h3>
              {getStatusBadge(booking.status)}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="font-semibold">Nr: {booking.booking_number}</span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(booking.departure.departure_date)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {totalPax} {totalPax === 1 ? 'persoană' : 'persoane'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {booking.circuit.nights} nopți
              </span>
            </div>
          </div>

          <div className="text-right ml-4">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-orange-600">
              {booking.total_price.toFixed(2)} EUR
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Status Plată:</span>
            <PaymentBadge status={getPaymentStatus()} />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
            <div>
              <span className="text-gray-600">Total:</span>
              <div className="font-bold">{booking.total_price.toFixed(2)} EUR</div>
            </div>
            <div>
              <span className="text-gray-600">Plătit:</span>
              <div className="font-bold text-green-600">{paidAmount.toFixed(2)} EUR</div>
            </div>
            <div>
              <span className="text-gray-600">Rămas:</span>
              <div className="font-bold text-orange-600">{remainingAmount.toFixed(2)} EUR</div>
            </div>
          </div>

          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-green-600"
              style={{ width: `${Math.min(paidPercentage, 100)}%` }}
            ></div>
          </div>

          <div className={`flex items-center gap-2 p-2 rounded-lg border text-sm font-medium ${deadlineWarning.className}`}>
            {remainingAmount > 0 ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Termen plată: {deadlineWarning.text}</span>
              </>
            ) : (
              <span>{deadlineWarning.text}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <Link
            href={`/agency/bookings/${booking.id}`}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center font-medium text-sm"
          >
            Vezi Detalii Complete
          </Link>
          <Link
            href={`/circuits/${booking.circuit.slug}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm flex items-center gap-1"
          >
            <MapPin className="h-4 w-4" />
            Vezi Circuit
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
