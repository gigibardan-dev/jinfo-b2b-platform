'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AgencyData {
  id: string;
  agency_display_name: string;
  company_name: string;
  trade_register: string;
  registration_number: string;
  contact_person: string;
  phone: string;
  billing_address: string;
  billing_city: string;
  billing_county: string;
  billing_postal_code: string;
  bank_name: string;
  bank_account: string;
  commission_rate: string;
  logo_url?: string;
  email: string;
}

interface AgencyProfileFormProps {
  agencyData: AgencyData;
  userId: string;
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  required = false,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        minLength={required ? 8 : undefined}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors text-xl"
        tabIndex={-1}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

export default function AgencyProfileForm({ agencyData, userId }: AgencyProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(agencyData.logo_url || '');
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    agency_display_name: agencyData.agency_display_name || '',
    company_name: agencyData.company_name || '',
    trade_register: agencyData.trade_register || '',
    registration_number: agencyData.registration_number || '',
    contact_person: agencyData.contact_person || '',
    phone: agencyData.phone || '',
    billing_address: agencyData.billing_address || '',
    billing_city: agencyData.billing_city || '',
    billing_county: agencyData.billing_county || '',
    billing_postal_code: agencyData.billing_postal_code || '',
    bank_name: agencyData.bank_name || '',
    bank_account: agencyData.bank_account || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      setError('Logo-ul depășește 512 KB. Comprimă fișierul înainte de upload.');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const supabase = createClient();

      // 1. Upload logo dacă există
      let logoUrl = agencyData.logo_url ?? null;

      if (logoFile) {
        setLogoUploading(true);
        const fd = new FormData();
        fd.append('file', logoFile);
        fd.append('agencyId', agencyData.id);

        const uploadRes = await fetch('/api/agency/logo-upload', {
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

      // 2. Update în B2B Supabase
      const { error: updateError } = await supabase
        .from('agencies')
        .update({
          agency_display_name: formData.agency_display_name || null,
          company_name: formData.company_name,
          trade_register: formData.trade_register,
          registration_number: formData.registration_number,
          contact_person: formData.contact_person,
          phone: formData.phone,
          billing_address: formData.billing_address,
          billing_city: formData.billing_city,
          billing_county: formData.billing_county,
          billing_postal_code: formData.billing_postal_code,
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // 3. Sync spre jinfocruise (fire-and-forget)
      fetch('/api/agency/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agencyData.email,
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
        }),
      }).catch(err => console.error('[AgencyProfileForm] Sync error:', err));

      setSuccess(true);
      setIsEditing(false);
      setLogoFile(null);

      setTimeout(() => { router.refresh(); }, 1000);

    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'A apărut o eroare la actualizarea profilului');
    } finally {
      setLoading(false);
      setLogoUploading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      agency_display_name: agencyData.agency_display_name || '',
      company_name: agencyData.company_name || '',
      trade_register: agencyData.trade_register || '',
      registration_number: agencyData.registration_number || '',
      contact_person: agencyData.contact_person || '',
      phone: agencyData.phone || '',
      billing_address: agencyData.billing_address || '',
      billing_city: agencyData.billing_city || '',
      billing_county: agencyData.billing_county || '',
      billing_postal_code: agencyData.billing_postal_code || '',
      bank_name: agencyData.bank_name || '',
      bank_account: agencyData.bank_account || '',
    });
    setLogoFile(null);
    setLogoPreview(agencyData.logo_url || '');
    setIsEditing(false);
    setError('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Parola nouă trebuie să aibă minim 8 caractere');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Parolele nu coincid');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch('/api/agency/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Eroare la schimbarea parolei');

      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Eroare necunoscută');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-green-500 text-2xl">✅</span>
            <div>
              <div className="font-bold text-green-800">Profilul a fost actualizat cu succes!</div>
              <div className="text-sm text-green-700">Modificările au fost salvate și sincronizate.</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-2xl">❌</span>
            <div>
              <div className="font-bold text-red-800">Eroare</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span>✏️</span>
            <span>Editează Profilul</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Logo Agenție ── */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <span className="text-xl">🖼️</span>
            <span>Logo Agenție</span>
            <span className="text-xs text-gray-400 font-normal">(apare pe ofertele PDF)</span>
          </h3>
          <p className="text-xs text-gray-400 mb-4">JPG, PNG, WebP sau SVG · max 512 KB · recomandat 300×100 px</p>

          <div className="flex items-start gap-6">
            <div
              className={`flex-shrink-0 w-48 h-20 border-2 border-dashed rounded-xl flex items-center justify-center bg-white overflow-hidden transition-colors ${
                isEditing ? 'border-gray-300 hover:border-orange-400 cursor-pointer' : 'border-gray-200 cursor-default'
              }`}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo agenție" className="max-w-full max-h-full object-contain p-1" />
              ) : (
                <div className="text-center">
                  <div className="text-2xl">🖼️</div>
                  <div className="text-xs text-gray-400 mt-1">{isEditing ? 'Click upload' : 'Niciun logo'}</div>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-white border-2 border-orange-300 text-orange-700 font-semibold rounded-xl hover:bg-orange-50 transition-colors text-sm"
                >
                  {logoFile ? '🔄 Schimbă logo' : logoPreview ? '🔄 Înlocuiește logo' : '📤 Alege logo'}
                </button>

                {logoFile && (
                  <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                    <div className="font-medium text-gray-700">{logoFile.name}</div>
                    <div>{(logoFile.size / 1024).toFixed(0)} KB</div>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(agencyData.logo_url || '');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      ✕ Renunță
                    </button>
                  </div>
                )}

                {logoUploading && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-orange-600">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Se uploadează...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Informații Companie ── */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <span>Informații Companie</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nume Agenție
                <span className="text-xs text-gray-400 ml-1">— apare pe oferte</span>
              </label>
              <input
                type="text"
                name="agency_display_name"
                value={formData.agency_display_name}
                onChange={handleChange}
                disabled={!isEditing || loading}
                placeholder="ex: J'Info Tours"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Denumire Firmă <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1">— fiscală</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                placeholder="ex: SC Jinfo Tours SRL"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CUI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="trade_register"
                value={formData.trade_register}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nr. Reg. Com.
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                disabled={!isEditing || loading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Persoană de Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rată Comision
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={`${agencyData.commission_rate}%`}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed font-semibold text-purple-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Doar administratorii pot modifica rata de comision</p>
            </div>
          </div>
        </div>

        {/* ── Informații Facturare ── */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📍</span>
            <span>Informații Facturare</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresă Facturare <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="billing_address"
                value={formData.billing_address}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Oraș <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="billing_city"
                  value={formData.billing_city}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Județ</label>
                <input
                  type="text"
                  name="billing_county"
                  value={formData.billing_county}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cod Poștal</label>
                <input
                  type="text"
                  name="billing_postal_code"
                  value={formData.billing_postal_code}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Informații Bancare ── */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <span>Informații Bancare</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nume Bancă</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                disabled={!isEditing || loading}
                placeholder="Ex: BCR, BRD, ING"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">IBAN</label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleChange}
                disabled={!isEditing || loading}
                placeholder="RO00XXXX0000000000000000"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* ── Butoane ── */}
        {isEditing && (
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || logoUploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Se salvează...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>💾</span> Salvează Modificările
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold"
            >
              Anulează
            </button>
          </div>
        )}
      </form>

      {/* ── Schimbare Parolă ── */}
      <div className="mt-6 bg-gray-50 rounded-xl p-6 border-2 border-indigo-200">
        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span className="text-xl">🔐</span>
          <span>Schimbare Parolă</span>
        </h3>
        <p className="text-sm text-gray-500 mb-4">Introdu parola curentă și apoi parola nouă dorită.</p>

        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm font-semibold text-green-800">Parola a fost schimbată cu succes!</span>
            </div>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-sm text-red-700">{passwordError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Parola curentă <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Parola actuală"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Parolă nouă <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Minim 8 caractere"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmă parola <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Repetă parola nouă"
              required
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md flex items-center gap-2"
            >
              {passwordLoading ? (
                <><span className="animate-spin">⏳</span> Se schimbă...</>
              ) : (
                <><span>🔐</span> Schimbă Parola</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}