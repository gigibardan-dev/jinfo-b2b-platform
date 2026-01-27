import { Badge } from '@/components/ui/badge';
import type { PaymentStatus } from '@/lib/types/payment';

interface PaymentBadgeProps {
  status: PaymentStatus;
}

export default function PaymentBadge({ status }: PaymentBadgeProps) {
  const variants: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'În așteptare', variant: 'outline' },
    partial: { label: 'Parțial', variant: 'secondary' },
    paid: { label: 'Plătit', variant: 'default' },
    overdue: { label: 'Întârziat', variant: 'destructive' },
    cancelled: { label: 'Anulat', variant: 'outline' },
  };

  const { label, variant } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}
