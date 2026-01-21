'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Auth
    email: '',
    password: '',
    confirmPassword: '',
    
    // Company info
    company_name: '',
    trade_register: '',
    registration_number: '',
    contact_person: '',
    phone: '',
    
    // Billing address
    billing_address: '',
    billing_city: '',
    billing_county: '',
    billing_postal_code: '',
    
    // Bank details (optional)
    bank_name: '',
    bank_account: '',
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Parolele nu coincid');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Parola trebuie să aibă minim 8 caractere');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            company_name: formData.company_name,
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // 2. Create agency record (status: pending)
      const { error: agencyError } = await supabase
        .from('agencies')
        .insert({
          id: authData.user.id,
          company_name: formData.company_name,
          trade_register: formData.trade_register,
          registration_number: formData.registration_number,
          contact_person: formData.contact_person,
          phone: formData.phone,
          email: formData.email,
          billing_address: formData.billing_address,
          billing_city: formData.billing_city,
          billing_county: formData.billing_county,
          billing_postal_code: formData.billing_postal_code,
          bank_name: formData.bank_name || null,
          bank_account: formData.bank_account || null,
          status: 'pending',
        });

      if (agencyError) {
        throw agencyError;
      }

      // Success!
      setSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Eroare la înregistrare. Te rugăm să încerci din nou.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Solicitare trimisă cu succes!
              </h1>
              <p className="text-gray-600 mb-6">
                Cererea ta de înregistrare a fost trimisă către echipa J'Info Tours. 
                Vei primi un email de confirmare în maximum 24 de ore.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
                <div className="font-semibold mb-1">Ce urmează?</div>
                <ul className="text-left space-y-1 text-blue-700">
                  <li>✓ Verificăm datele companiei tale</li>
                  <li>✓ Activăm contul în 24h</li>
                  <li>✓ Primești email de confirmare</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500">
                Vei fi redirecționat automat către pagina de login...
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-4xl font-bold mb-2">
                <span className="text-orange-500">J'INFO</span>
                <span className="text-blue-600"> B2B</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Înregistrare agenție partener
              </h1>
              <p className="text-gray-600">
                Completează formularul pentru a solicita acces la portal
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <div className="flex-1">
                    <div className="font-semibold text-red-800">Eroare</div>
                    <div className="text-sm text-red-600 mt-1">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Autentificare */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🔐</span>
                  <span>Date autentificare</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="contact@agentia.ro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parolă * (min 8 caractere)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmă parola *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Date Companie */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🏢</span>
                  <span>Date companie</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nume companie *
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="SC AGENTIA TURISM SRL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CUI *
                    </label>
                    <input
                      type="text"
                      name="trade_register"
                      value={formData.trade_register}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="RO12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nr. Reg. Com.
                    </label>
                    <input
                      type="text"
                      name="registration_number"
                      value={formData.registration_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="J40/123/2020"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Persoană de contact *
                    </label>
                    <input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="Ion Popescu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="+40721234567"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Adresă Facturare */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📍</span>
                  <span>Adresă facturare</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresă *
                    </label>
                    <input
                      type="text"
                      name="billing_address"
                      value={formData.billing_address}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="Strada Exemplu, Nr. 10, Bl. A, Sc. B, Ap. 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Oraș *
                    </label>
                    <input
                      type="text"
                      name="billing_city"
                      value={formData.billing_city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="București"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Județ
                    </label>
                    <input
                      type="text"
                      name="billing_county"
                      value={formData.billing_county}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="Ilfov"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cod poștal
                    </label>
                    <input
                      type="text"
                      name="billing_postal_code"
                      value={formData.billing_postal_code}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="012345"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Date Bancare (Optional) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🏦</span>
                  <span>Date bancare (opțional)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banca
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="Banca Transilvania"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IBAN
                    </label>
                    <input
                      type="text"
                      name="bank_account"
                      value={formData.bank_account}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="RO49AAAA1B31007593840000"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Se trimite...</span>
                    </span>
                  ) : (
                    '📝 Trimite solicitare de înregistrare'
                  )}
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  * Câmpuri obligatorii
                </p>
              </div>
            </form>

            {/* Back to Login */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-3">
                Ai deja cont?
              </p>
              <Link
                href="/auth/login"
                className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Intră în cont →
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
            >
              <span>←</span>
              <span>Înapoi la circuite</span>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}