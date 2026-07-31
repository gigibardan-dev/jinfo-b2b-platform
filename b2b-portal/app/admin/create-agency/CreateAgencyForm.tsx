'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CreateAgencyFormProps {
  adminUserId: string;
}

export default function CreateAgencyForm({ adminUserId }: CreateAgencyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    commission_rate: '10.00',
  });

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

    if (formData.password.length < 8) {
      setError('Parola trebuie să aibă minim 8 caractere');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 1. Creare user auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { company_name: formData.company_name },
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');

      const userId = authData.user.id;

      // 2. Upload logo dacă există
      let logoUrl: string | null = null;
      if (logoFile) {
        setLogoUploading(true);
        const fd = new FormData();
        fd.append('file', logoFile);
        fd.append('agencyId', userId);

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

      // 3. Creare agenție în B2B
      const { error: agencyError } = await supabase
        .from('agencies')
        .insert({
          id: userId,
          user_id: userId,
          agency_display_name: formData.agency_display_name || null,
          company_name: formData.company_name,
          logo_url: logoUrl,
          trade_register: formData.trade_register,
          registration_number: formData.registration_number || null,
          contact_person: formData.contact_person,
          phone: formData.phone,
          email: formData.email,
          billing_address: formData.billing_address,
          billing_city: formData.billing_city,
          billing_county: formData.billing_county || null,
          billing_postal_code: formData.billing_postal_code || null,
          bank_name: formData.bank_name || null,
          bank_account: formData.bank_account || null,
          commission_rate: parseFloat(formData.commission_rate),
          status: 'active',
          approved_at: new Date().toISOString(),
          approved_by: adminUserId,
        });

      if (agencyError) throw agencyError;

      // 4. Profil utilizator
      await supabase
        .from('user_profiles')
        .insert({ id: userId, role: 'agency' })
        .then(({ error }) => {
          if (error) console.error('[CreateAgency] user_profiles error:', error);
        });

      // 5. Sync spre jinfocruise (fire-and-forget)
      fetch('/api/admin/sync-to-jinfocruise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Secret': 'string_random_pentru_autentificare$$',
        },
        body: JSON.stringify({
          email: formData.email,
          company_name: formData.company_name,
          agency_display_name: formData.agency_display_name || null,
          logo_url: logoUrl,
          contact_person: formData.contact_person,
          phone: formData.phone,
          commission_pct: parseFloat(formData.commission_rate),
          password: formData.password,
        }),
      }).catch(err => console.error('[CreateAgency] Sync jinfocruise error:', err));

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setLogoFile(null);
        setLogoPreview('');
        setFormData({
          email: '',
          password: '',
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
          commission_rate: '10.00',
        });
      }, 3000);

    } catch (err: unknown) {
      console.error('[CreateAgency] error:', err);
      setError(err instanceof Error ? err.message : 'Eroare la crearea agenției');
    } finally {
      setLoading(false);
      setLogoUploading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Agenție creată cu succes!</h3>
        <p className="text-gray-600 mb-1">
          Agenția <span className="font-bold text-green-600">{formData.agency_display_name || formData.company_name}</span> a fost creată și activată.
        </p>
        <p className="text-sm text-gray-500 mb-4">Cont creat automat și în JinfoCruise cu aceleași credențiale.</p>
        <p className="text-xs text-gray-400">Formularul se va reseta automat în 3 secunde...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-2xl">❌</span>
            <div>
              <div className="font-bold text-red-800">Eroare</div>
              <div className="text-sm text-red-700 mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Autentificare ── */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🔐</span>
            <span>Date Autentificare</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="contact@agentia.ro"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Parolă <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(min 8 caractere)</span>
              </label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="Parola inițială (agenția o poate schimba)"
              />
            </div>
          </div>
        </div>

        {/* ── Date Companie ── */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <span>Date Companie</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Nume agenție (comercial) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nume Agenție <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-1">— apare pe oferte</span>
              </label>
              <input
                type="text"
                name="agency_display_name"
                value={formData.agency_display_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="ex: J'Info Tours"
              />
            </div>

            {/* Denumire firmă (legală) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Denumire Firmă <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-1">— denumire fiscală</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="ex: SC Jinfo Tours SRL"
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
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Persoană Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
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
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comision (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="50"
                name="commission_rate"
                value={formData.commission_rate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-semibold text-purple-600"
              />
            </div>
          </div>
        </div>

        {/* ── Logo Agenție ── */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <span className="text-xl">🖼️</span>
            <span>Logo Agenție</span>
            <span className="text-xs text-gray-500 font-normal">(opțional — apare pe ofertele PDF)</span>
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            JPG, PNG, WebP sau SVG · max 512 KB · recomandat raport 3:1 sau 4:1 (ex: 300×100 px)
          </p>

          <div className="flex items-start gap-6">
            {/* Preview */}
            <div
              className="flex-shrink-0 w-40 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-white overflow-hidden cursor-pointer hover:border-purple-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Preview logo"
                  className="max-w-full max-h-full object-contain p-1"
                />
              ) : (
                <div className="text-center">
                  <div className="text-2xl">📷</div>
                  <div className="text-xs text-gray-400 mt-1">Click upload</div>
                </div>
              )}
            </div>

            {/* Controls */}
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
                className="px-4 py-2.5 bg-white border-2 border-purple-300 text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors text-sm"
              >
                {logoFile ? '🔄 Schimbă logo' : '📤 Alege fișier'}
              </button>

              {logoFile && (
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  <div className="font-medium text-gray-700">{logoFile.name}</div>
                  <div>{(logoFile.size / 1024).toFixed(0)} KB</div>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    ✕ Elimină
                  </button>
                </div>
              )}

              {logoUploading && (
                <div className="mt-2 flex items-center gap-2 text-xs text-purple-600">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Se uploadează...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Adresă Facturare ── */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📍</span>
            <span>Adresă Facturare</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresă <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="billing_address"
                value={formData.billing_address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Oraș <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="billing_city"
                value={formData.billing_city}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Județ</label>
              <input
                type="text"
                name="billing_county"
                value={formData.billing_county}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cod Poștal</label>
              <input
                type="text"
                name="billing_postal_code"
                value={formData.billing_postal_code}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Date Bancare ── */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <span>Date Bancare</span>
            <span className="text-xs text-gray-500 font-normal">(opțional)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bancă</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="Ex: BCR, BRD, ING"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">IBAN</label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleChange}
                placeholder="RO00XXXX0000000000000000"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || logoUploading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Se creează agenția...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>✅</span>
                <span>Creează Agenție (Pre-Validată)</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </>
  );
}