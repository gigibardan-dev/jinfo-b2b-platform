'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PaymentBadge from '@/components/payments/PaymentBadge';
import Link from 'next/link';
import { Calendar, Users, Clock, MapPin, AlertTriangle } from 'lucide-react';
import type { PaymentStatus } from '@/lib/types/payment';

interface AgencyBookingCardHorizontalProps {
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
      main_image?: string;
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

export default function AgencyBookingCardHorizontal({ booking }: AgencyBookingCardHorizontalProps) {
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
        text: `⚠️ ${daysRemaining} zile`,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    }

    if (daysRemaining > 0 && daysRemaining < 5) {
      return {
        text: `🚨 ${daysRemaining} zile!`,
        className: 'bg-red-100 text-red-800 border-red-200'
      };
    }

    return {
      text: '❌ Depășit',
      className: 'bg-red-100 text-red-800 border-red-200'
    };
  };

  const deadlineWarning = getDeadlineWarning();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: string }> = {
      pending: { label: 'În așteptare', className: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      approved: { label: 'Aprobat', className: 'bg-green-100 text-green-800', icon: '✅' },
      rejected: { label: 'Respins', className: 'bg-red-100 text-red-800', icon: '❌' },
      cancelled: { label: 'Anulat', className: 'bg-gray-100 text-gray-800', icon: '🚫' }
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <span>{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-100">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Main Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {booking.circuit.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-mono font-semibold">#{booking.booking_number}</span>
                </div>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(booking.departure.departure_date)}
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {totalPax} {totalPax === 1 ? 'persoană' : 'persoane'}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {booking.circuit.nights} nopți
              </span>
            </div>
          </div>

          {/* Center: Payment Info */}
          <div className="lg:w-80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Status Plată:</span>
              <PaymentBadge status={getPaymentStatus()} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-gray-600">Total</div>
                <div className="font-bold text-gray-900">{booking.total_price.toFixed(0)} €</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Plătit</div>
                <div className="font-bold text-green-600">{paidAmount.toFixed(0)} €</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Rămas</div>
                <div className="font-bold text-orange-600">{remainingAmount.toFixed(0)} €</div>
              </div>
            </div>

            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-green-600"
                style={{ width: `${Math.min(paidPercentage, 100)}%` }}
              ></div>
            </div>

            <div className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-semibold ${deadlineWarning.className}`}>
              {remainingAmount > 0 && <AlertTriangle className="h-3 w-3" />}
              <span>{deadlineWarning.text}</span>
            </div>
          </div>

          {/* Right: Price & Actions */}
          <div className="lg:w-48 flex flex-col justify-between items-end gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Total Rezervare</div>
              <div className="text-3xl font-bold text-orange-600">
                {booking.total_price.toFixed(0)} €
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Link
                href={`/agency/bookings/${booking.id}`}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center font-semibold text-sm shadow-md hover:shadow-lg"
              >
                Vezi Detalii
              </Link>
              <Link
                href={`/circuits/${booking.circuit.slug}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm text-center flex items-center justify-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Circuit
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}