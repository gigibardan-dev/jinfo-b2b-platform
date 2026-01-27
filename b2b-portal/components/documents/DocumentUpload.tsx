'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SuccessDialog from '@/components/ui/success-dialog';
import { Upload } from 'lucide-react';
import type { DocumentType } from '@/lib/types/document';

interface DocumentUploadProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, documentType: DocumentType, notes?: string) => Promise<void>;
}

export default function DocumentUpload({ open, onClose, onUpload }: DocumentUploadProps) {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      await onUpload(file, documentType, notes || undefined);
      setFile(null);
      setNotes('');
      onClose();
      setShowSuccess(true);
    } catch (error) {
      console.error('Error uploading document:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Eroare la încărcarea documentului');
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
            <DialogTitle>Încarcă Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="document_type">Tip Document</Label>
              <Select
                value={documentType}
                onValueChange={(value) => setDocumentType(value as DocumentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="invoice">Factură</SelectItem>
                  <SelectItem value="payment_receipt">Chitanță</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                  <SelectItem value="passenger_list">Listă Pasageri</SelectItem>
                  <SelectItem value="other">Altele</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file">Fișier</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground mt-1">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Note</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opțional"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Anulează
              </Button>
              <Button type="submit" disabled={loading || !file}>
                {loading ? 'Se încarcă...' : 'Încarcă'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessDialog
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Document Încărcat!"
        description="Documentul a fost încărcat cu succes în sistem."
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
