'use client';

import { useState, useEffect } from 'react';
import { Agency } from '@/lib/types/agency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [activeTab, setActiveTab] = useState<'company' | 'billing' | 'banking' | 'notes'>('company');
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
      setActiveTab('company');
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

      alert('✅ Agenție actualizată cu succes!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating agency:', error);
      alert('❌ Eroare la actualizarea agenției');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'company' as const, label: 'Companie', icon: '🏢' },
    { id: 'billing' as const, label: 'Facturare', icon: '📍' },
    { id: 'banking' as const, label: 'Bancare', icon: '🏦' },
    { id: 'notes' as const, label: 'Notițe', icon: '📝' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Editează Agenția - {agency.company_name}</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
              ✏️
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Editează Agenția</h2>
              <p className="text-purple-100 text-sm">{agency.company_name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-3">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-600 shadow-md'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto">
            {/* Company Tab */}
            {activeTab === 'company' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name" className="flex items-center gap-2 mb-2">
                    <span className="text-red-500">*</span> Nume Companie
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                    className="border-2 focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trade_register" className="flex items-center gap-2 mb-2">
                      <span className="text-red-500">*</span> Registrul Comerțului
                    </Label>
                    <Input
                      id="trade_register"
                      value={formData.trade_register}
                      onChange={(e) => setFormData({ ...formData, trade_register: e.target.value })}
                      required
                      className="border-2 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="registration_number" className="mb-2 block">
                      CUI / CIF
                    </Label>
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      className="border-2 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_person" className="flex items-center gap-2 mb-2">
                      <span className="text-red-500">*</span> Persoană Contact
                    </Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      required
                      className="border-2 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <span className="text-red-500">*</span> Telefon
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="border-2 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="commission_rate" className="flex items-center gap-2 mb-2">
                    <span className="text-red-500">*</span> Comision (%)
                  </Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                    required
                    className="border-2 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comision aplicat asupra plăților primite</p>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="billing_address" className="flex items-center gap-2 mb-2">
                    <span className="text-red-500">*</span> Adresă
                  </Label>
                  <Input
                    id="billing_address"
                    value={formData.billing_address}
                    onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                    required
                    className="border-2 focus:border-purple-500"
                    placeholder="Str. Exemplu, Nr. 123"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billing_city" className="flex items-center gap-2 mb-2">
                      <span className="text-red-500">*</span> Oraș
                    </Label>
                    <Input
                      id="billing_city"
                      value={formData.billing_city}
                      onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                      required
                      className="border-2 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="billing_county" className="mb-2 block">
                      Județ
                    </Label>
                    <Input
                      id="billing_county"
                      value={formData.billing_county}
                      onChange={(e) => setFormData({ ...formData, billing_county: e.target.value })}
                      className="border-2 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="billing_postal_code" className="mb-2 block">
                    Cod Poștal
                  </Label>
                  <Input
                    id="billing_postal_code"
                    value={formData.billing_postal_code}
                    onChange={(e) => setFormData({ ...formData, billing_postal_code: e.target.value })}
                    className="border-2 focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Banking Tab */}
            {activeTab === 'banking' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bank_name" className="mb-2 block">
                    Nume Bancă
                  </Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="border-2 focus:border-purple-500"
                    placeholder="Ex: BCR, BRD, ING"
                  />
                </div>

                <div>
                  <Label htmlFor="bank_account" className="mb-2 block">
                    IBAN
                  </Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    className="border-2 focus:border-purple-500 font-mono"
                    placeholder="RO00XXXX0000000000000000"
                  />
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                      <div className="font-bold text-blue-900 mb-1">Informație Importantă</div>
                      <p className="text-sm text-blue-800">
                        Datele bancare sunt folosite pentru calculul comisioanelor și rapoarte financiare.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin_notes" className="mb-2 block">
                    Notițe Admin (Interne)
                  </Label>
                  <textarea
                    id="admin_notes"
                    value={formData.admin_notes}
                    onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Notițe interne vizibile doar pentru administratori..."
                  />
                </div>

                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <div className="font-bold text-orange-900 mb-1">Confidențial</div>
                      <p className="text-sm text-orange-800">
                        Aceste notițe sunt vizibile doar pentru administratori și nu vor fi văzute de agenție.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Câmpuri obligatorii
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="px-6"
              >
                Anulează
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Se salvează...
                  </>
                ) : (
                  <>
                    <span className="mr-2">💾</span>
                    Salvează Modificările
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}