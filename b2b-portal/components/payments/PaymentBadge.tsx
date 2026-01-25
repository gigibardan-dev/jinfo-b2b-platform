import { Badge } from '@/components/ui/badge';
import type { PaymentStatus } from '@/lib/types/payment';

interface PaymentBadgeProps {
  status: PaymentStatus;
}

export default function PaymentBadge({ status }: PaymentBadgeProps) {
  const variants: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pending', variant: 'outline' },
    partial: { label: 'Partial', variant: 'secondary' },
    paid: { label: 'Paid', variant: 'default' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'outline' },
  };

  const { label, variant } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}
