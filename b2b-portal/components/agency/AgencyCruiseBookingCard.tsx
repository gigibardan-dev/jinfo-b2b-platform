'use client';
// components/agency/AgencyCruiseBookingCard.tsx

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, Users, Moon, Anchor } from 'lucide-react';

interface AgencyCruiseBookingCardProps {
  booking: any;
  paidAmount?: number;
}

export default function AgencyCruiseBookingCard({ booking, paidAmount = 0 }: AgencyCruiseBookingCardProps) {
  const totalAmount     = Number(booking.gross_amount) || 0;
  const remainingAmount = totalAmount - paidAmount;
  const paidPercentage  = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const totalPax        = (booking.num_adults || 0) + (booking.num_children || 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending:   { label: 'În așteptare', className: 'bg-yellow-100 text-yellow-800' },
      approved:  { label: 'Aprobat',      className: 'bg-green-100 text-green-800'  },
      cancelled: { label: 'Anulat',       className: 'bg-gray-100 text-gray-800'    },
    };
    const { label, className } = variants[status] || variants.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDeadlineWarning = () => {
    if (!booking.sailing_date) return null;
    const sailDate   = new Date(booking.sailing_date);
    const deadline   = new Date(sailDate);
    deadline.setDate(deadline.getDate() - 45);
    const today      = new Date();
    const days       = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (remainingAmount <= 0) return { text: '✓ Plătit integral', className: 'bg-green-100 text-green-800 border-green-200' };
    if (days > 10)            return { text: '✓ În termen',      className: 'bg-green-100 text-green-800 border-green-200' };
    if (days >= 5)            return { text: `⚠️ ${days} zile rămase`,      className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (days > 0)             return { text: `🚨 URGENT: ${days} zile!`,    className: 'bg-red-100 text-red-800 border-red-200' };
    return { text: '❌ Depășit termenul', className: 'bg-red-100 text-red-800 border-red-200' };
  };

  const deadlineWarning = getDeadlineWarning();

  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-cyan-400">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🚢</span>
              <h3 className="text-xl font-bold text-gray-900">{booking.ship_name || 'Navă necunoscută'}</h3>
              {getStatusBadge(booking.status)}
              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">Croazieră</span>
            </div>

            <div className="text-sm text-gray-500 mb-2">
              <span className="font-semibold text-gray-700">#{booking.booking_number}</span>
              {booking.jinfocruise_jinfo_no && (
                <span className="ml-2 font-mono text-xs text-gray-400">· {booking.jinfocruise_jinfo_no}</span>
              )}
            </div>

            {booking.itin_desc && (
              <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <Anchor className="h-3 w-3" />
                <span className="truncate max-w-xs">{booking.itin_desc}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {booking.sailing_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(booking.sailing_date)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {totalPax} {totalPax === 1 ? 'persoană' : 'persoane'}
              </span>
              {booking.nights && (
                <span className="flex items-center gap-1">
                  <Moon className="h-4 w-4" />
                  {booking.nights} nopți
                </span>
              )}
              {booking.category_name && (
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{booking.category_name}</span>
              )}
            </div>
          </div>

          <div className="text-right ml-4">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-cyan-600">{totalAmount.toFixed(2)} EUR</div>
            {booking.agency_commission && (
              <div className="text-xs text-purple-600 mt-1">
                Com: {Number(booking.agency_commission).toFixed(2)} €
              </div>
            )}
          </div>
        </div>

        {/* Plăți */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
            <div><span className="text-gray-600">Total:</span><div className="font-bold">{totalAmount.toFixed(2)} EUR</div></div>
            <div><span className="text-gray-600">Plătit:</span><div className="font-bold text-green-600">{paidAmount.toFixed(2)} EUR</div></div>
            <div><span className="text-gray-600">Rămas:</span><div className="font-bold text-cyan-600">{remainingAmount.toFixed(2)} EUR</div></div>
          </div>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(paidPercentage, 100)}%` }} />
          </div>
          {deadlineWarning && (
            <div className={`flex items-center gap-2 p-2 rounded-lg border text-sm font-medium ${deadlineWarning.className}`}>
              <span>{deadlineWarning.text}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <Link href={`/agency/bookings/cruise/${booking.id}`}
            className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-center font-medium text-sm">
            🚢 Vezi Detalii Complete
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}