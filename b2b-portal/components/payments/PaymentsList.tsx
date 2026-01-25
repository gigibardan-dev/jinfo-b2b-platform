'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Payment } from '@/lib/types/payment';

interface PaymentsListProps {
  payments: Payment[];
  currency: string;
  onDelete?: (paymentId: string) => Promise<void>;
  canDelete?: boolean;
}

export default function PaymentsList({ payments, currency, onDelete, canDelete = false }: PaymentsListProps) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payments recorded yet
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMethod = (method: string) => {
    return method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Notes</TableHead>
            {canDelete && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(payment.payment_date)}</TableCell>
              <TableCell className="font-medium">
                {payment.amount.toFixed(2)} {currency}
              </TableCell>
              <TableCell>{formatMethod(payment.payment_method)}</TableCell>
              <TableCell>{payment.reference_number || '-'}</TableCell>
              <TableCell className="max-w-xs truncate">{payment.notes || '-'}</TableCell>
              {canDelete && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(payment.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
