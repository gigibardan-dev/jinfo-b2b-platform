'use client';

import { useState, useEffect } from 'react';
import { Agency } from '@/lib/types/agency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface EditAgencyModalProps {
  agency: Agency;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditAgencyModal({
  agency,
  isOpen,
  onClose,
  onUpdate,
}: EditAgencyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    trade_register: '',
    registration_number: '',
    contact_person: '',
    phone: '',
    billing_address: '',
    billing_city: '',
    billing_county: '',
    billing_postal_code: '',
    bank_name: '',
    bank_account: '',
    commission_rate: 0,
    admin_notes: '',
  });

  // Sincronizează datele când se deschide modalul sau se schimbă agenția
  useEffect(() => {
    if (agency) {
      setFormData({
        company_name: agency.company_name || '',
        trade_register: agency.trade_register || '',
        registration_number: agency.registration_number || '',
        contact_person: agency.contact_person || '',
        phone: agency.phone || '',
        billing_address: agency.billing_address || '',
        billing_city: agency.billing_city || '',
        billing_county: agency.billing_county || '',
        billing_postal_code: agency.billing_postal_code || '',
        bank_name: agency.bank_name || '',
        bank_account: agency.bank_account || '',
        commission_rate: agency.commission_rate || 0,
        admin_notes: agency.admin_notes || '',
      });
    }
  }, [agency, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/agencies/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: agency.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update agency');
      }

      alert('Agentie actualizata cu succes!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating agency:', error);
      alert('Eroare la actualizarea agentiei');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editează Agenția</DialogTitle>
          <DialogDescription>
            Modifică datele pentru {agency.company_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                Informații Companie
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="company_name">
                    Nume Companie <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="trade_register">
                    Registrul Comerțului <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="trade_register"
                    value={formData.trade_register}
                    onChange={(e) =>
                      setFormData({ ...formData, trade_register: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="registration_number">CUI / CIF</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_number: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="contact_person">
                    Persoană Contact <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_person: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">
                    Telefon <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="commission_rate">
                    Comision (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commission_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                Informații Facturare
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="billing_address">
                    Adresă <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="billing_address"
                    value={formData.billing_address}
                    onChange={(e) =>
                      setFormData({ ...formData, billing_address: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="billing_city">
                    Oraș <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="billing_city"
                    value={formData.billing_city}
                    onChange={(e) =>
                      setFormData({ ...formData, billing_city: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="billing_county">Județ</Label>
                  <Input
                    id="billing_county"
                    value={formData.billing_county}
                    onChange={(e) =>
                      setFormData({ ...formData, billing_county: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="billing_postal_code">Cod Poștal</Label>
                  <Input
                    id="billing_postal_code"
                    value={formData.billing_postal_code}
                    onChange={(e) =>
                      setFormData({ ...formData, billing_postal_code: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                Informații Bancare
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_name">Nume Bancă</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="bank_account">IBAN</Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_account: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label htmlFor="admin_notes">Notițe Admin (Interne)</Label>
              <textarea
                id="admin_notes"
                value={formData.admin_notes}
                onChange={(e) =>
                  setFormData({ ...formData, admin_notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notițe interne vizibile doar pentru administratori..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvează Modificările
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}