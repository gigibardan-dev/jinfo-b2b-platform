'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface CreateAgencyFormProps {
  adminUserId: string;
}

export default function CreateAgencyForm({ adminUserId }: CreateAgencyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            company_name: formData.company_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/login`
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');

      const { error: agencyError } = await supabase
        .from('agencies')
        .insert({
          id: authData.user.id,
          user_id: authData.user.id,
          company_name: formData.company_name,
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

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          role: 'agency',
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setFormData({
          email: '',
          password: '',
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

    } catch (err: any) {
      console.error('Create agency error:', err);
      setError(err.message || 'Eroare la crearea agenției');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Agenție creată cu succes!
        </h3>
        <p className="text-gray-600 mb-4">
          Agenția <span className="font-bold text-green-600">{formData.company_name}</span> a fost creată și activată.
        </p>
        <p className="text-sm text-gray-500">
          Formularul se va reseta automat în 3 secunde...
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-2xl">❌</span>
            <div className="flex-1">
              <div className="font-bold text-red-800">Eroare</div>
              <div className="text-sm text-red-700 mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Autentificare */}
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

        {/* Date Companie */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <span>Date Companie</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nume Companie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
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

        {/* Adresă Facturare */}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Județ
              </label>
              <input
                type="text"
                name="billing_county"
                value={formData.billing_county}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cod Poștal
              </label>
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

        {/* Date Bancare */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <span>Date Bancare</span>
            <span className="text-xs text-gray-500 font-normal">(opțional)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bancă
              </label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                IBAN
              </label>
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

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
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