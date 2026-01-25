'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaymentMethod } from '@/lib/types/payment';

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    reference_number?: string;
    notes?: string;
  }) => Promise<void>;
  remainingAmount: number;
  currency: string;
}

export default function PaymentFormModal({
  open,
  onClose,
  onSubmit,
  remainingAmount,
  currency
}: PaymentFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: remainingAmount,
    payment_method: 'bank_transfer' as PaymentMethod,
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Remaining: {remainingAmount.toFixed(2)} {currency}
            </p>
          </div>

          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value as PaymentMethod })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
