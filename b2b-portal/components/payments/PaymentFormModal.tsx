'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SuccessDialog from '@/components/ui/success-dialog';
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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
      setShowSuccess(true);
    } catch (error) {
      console.error('Error adding payment:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Eroare la adăugarea plății');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Înregistrează Plată</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Sumă ({currency})</Label>
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
                Rămas: {remainingAmount.toFixed(2)} {currency}
              </p>
            </div>

            <div>
              <Label htmlFor="payment_method">Metodă Plată</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value as PaymentMethod })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Transfer Bancar</SelectItem>
                  <SelectItem value="cash">Numerar</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Altele</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_date">Data Plății</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="reference_number">Număr Referință</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="Opțional"
              />
            </div>

            <div>
              <Label htmlFor="notes">Note</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Opțional"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Anulează
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Se salvează...' : 'Salvează Plata'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessDialog
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Plată Înregistrată!"
        description="Plata a fost adăugată cu succes în sistem."
        type="success"
      />

      <SuccessDialog
        open={showError}
        onClose={() => setShowError(false)}
        title="Eroare"
        description={errorMessage}
        type="error"
      />
    </>
  );
}
