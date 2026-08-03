'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState<'company' | 'billing' | 'banking' | 'logo' | 'notes'>('company');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    agency_display_name: '',
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
        agency_display_name: agency.agency_display_name || '',
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
      setLogoFile(null);
      setLogoPreview(agency.logo_url || '');
      setActiveTab('company');
    }
  }, [agency, isOpen]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      alert('Logo-ul depășește 512 KB. Comprimă fișierul înainte de upload.');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Upload logo nou dacă există
      let logoUrl = agency.logo_url ?? null;

      if (logoFile) {
        setLogoUploading(true);
        const fd = new FormData();
        fd.append('file', logoFile);
        fd.append('agencyId', agency.id);

        const uploadRes = await fetch('/api/admin/logo-upload', {
          method: 'POST',
          body: fd,
        });

        const uploadData = await uploadRes.json();
        setLogoUploading(false);

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Eroare upload logo');
        }

        logoUrl = uploadData.url;
      }

      // 2. Update agenție în B2B
      const response = await fetch('/api/admin/agencies/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: agency.id,
          ...formData,
          logo_url: logoUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to update agency');

      // 3. Sync spre jinfocruise (fire-and-forget — nu blocăm UI-ul)
      fetch('/api/admin/sync-agency-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agency.email,
          agency_display_name: formData.agency_display_name || null,
          company_name: formData.company_name,
          contact_person: formData.contact_person,
          phone: formData.phone,
          logo_url: logoUrl,
          trade_register: formData.trade_register,
          registration_number: formData.registration_number,
          billing_address: formData.billing_address,
          billing_city: formData.billing_city,
          billing_county: formData.billing_county,
          billing_postal_code: formData.billing_postal_code,
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
          commission_pct: formData.commission_rate,
        }),
      }).catch(err => console.error('[EditAgencyModal] Sync error:', err));

      alert('✅ Agenție actualizată cu succes!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating agency:', error);
      alert('❌ Eroare la actualizarea agenției');
    } finally {
      setIsLoading(false);
      setLogoUploading(false);
    }
  };

  const tabs = [
    { id: 'company' as const, label: 'Companie', icon: '🏢' },
    { id: 'billing' as const, label: 'Facturare', icon: '📍' },
    { id: 'banking' as const, label: 'Bancare', icon: '🏦' },
    { id: 'logo' as const, label: 'Logo', icon: '🖼️' },
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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-2xl">✏️</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Editează Agenția</h2>
              <p className="text-purple-100 text-sm">
                {formData.agency_display_name || agency.company_name}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-3">
            <div className="flex gap-2 flex-wrap">
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
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto">

            {/* ── Company ── */}
            {activeTab === 'company' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agency_display_name" className="mb-2 block">
                      Nume Agenție
                      <span className="text-xs text-gray-400 ml-1">— apare pe oferte</span>
                    </Label>
                    <Input
                      id="agency_display_name"
                      value={formData.agency_display_name}
                      onChange={(e) => setFormData({ ...formData, agency_display_name: e.target.value })}
                      className="border-2 focus:border-purple-500"
                      placeholder="ex: J'Info Tours"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name" className="flex items-center gap-1 mb-2">
                      <span className="text-red-500">*</span> Denumire Firmă
                      <span className="text-xs text-gray-400">— fiscală</span>
                    </Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                      className="border-2 focus:border-purple-500"
                      placeholder="ex: SC Jinfo Tours SRL"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trade_register" className="flex items-center gap-1 mb-2">
                      <span className="text-red-500">*</span> CUI
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
                    <Label htmlFor="registration_number" className="mb-2 block">Nr. Reg. Com.</Label>
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
                    <Label htmlFor="contact_person" className="flex items-center gap-1 mb-2">
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
                    <Label htmlFor="phone" className="flex items-center gap-1 mb-2">
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
                  <Label htmlFor="commission_rate" className="flex items-center gap-1 mb-2">
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

            {/* ── Billing ── */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="billing_address" className="flex items-center gap-1 mb-2">
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
                    <Label htmlFor="billing_city" className="flex items-center gap-1 mb-2">
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
                    <Label htmlFor="billing_county" className="mb-2 block">Județ</Label>
                    <Input
                      id="billing_county"
                      value={formData.billing_county}
                      onChange={(e) => setFormData({ ...formData, billing_county: e.target.value })}
                      className="border-2 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="billing_postal_code" className="mb-2 block">Cod Poștal</Label>
                  <Input
                    id="billing_postal_code"
                    value={formData.billing_postal_code}
                    onChange={(e) => setFormData({ ...formData, billing_postal_code: e.target.value })}
                    className="border-2 focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* ── Banking ── */}
            {activeTab === 'banking' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bank_name" className="mb-2 block">Nume Bancă</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="border-2 focus:border-purple-500"
                    placeholder="Ex: BCR, BRD, ING"
                  />
                </div>
                <div>
                  <Label htmlFor="bank_account" className="mb-2 block">IBAN</Label>
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
                      <p className="text-sm text-blue-800">Datele bancare sunt folosite pentru calculul comisioanelor și rapoarte financiare.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Logo ── */}
            {activeTab === 'logo' && (
              <div className="space-y-6">
                <p className="text-sm text-gray-500">
                  JPG, PNG, WebP sau SVG · max 512 KB · recomandat 300×100 px
                </p>

                <div>
                  <Label className="mb-3 block">Logo curent</Label>
                  <div
                    className="w-64 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-purple-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo agenție" className="max-w-full max-h-full object-contain p-2" />
                    ) : (
                      <div className="text-center">
                        <div className="text-3xl mb-1">🖼️</div>
                        <div className="text-xs text-gray-400">Niciun logo setat</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-white border-2 border-purple-300 text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors text-sm"
                    >
                      {logoFile ? '🔄 Schimbă logo' : agency.logo_url ? '🔄 Înlocuiește logo' : '📤 Alege logo'}
                    </button>

                    {agency.logo_url && !logoFile && (
                      <span className="text-xs text-green-600 font-medium">✓ Logo setat</span>
                    )}

                    {logoFile && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{logoFile.name}</span>
                        {' · '}{(logoFile.size / 1024).toFixed(0)} KB
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(agency.logo_url || '');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="ml-2 text-red-500 hover:text-red-700 font-medium"
                        >
                          ✕ Renunță
                        </button>
                      </div>
                    )}
                  </div>

                  {logoUploading && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-purple-600">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Se uploadează logo-ul...
                    </div>
                  )}

                  <p className="text-xs text-amber-600 mt-3">
                    ⚠️ Logo-ul va fi actualizat și în JinfoCruise la salvare.
                  </p>
                </div>
              </div>
            )}

            {/* ── Notes ── */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin_notes" className="mb-2 block">Notițe Admin (Interne)</Label>
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
                      <p className="text-sm text-orange-800">Aceste notițe sunt vizibile doar pentru administratori și nu vor fi văzute de agenție.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Câmpuri obligatorii
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="px-6">
                Anulează
              </Button>
              <Button
                type="submit"
                disabled={isLoading || logoUploading}
                className="px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <><span className="animate-spin mr-2">⏳</span>Se salvează...</>
                ) : (
                  <><span className="mr-2">💾</span>Salvează Modificările</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}