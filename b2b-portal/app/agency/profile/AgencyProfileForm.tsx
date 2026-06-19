'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AgencyData {
  id: string;
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
}

interface AgencyProfileFormProps {
  agencyData: AgencyData;
  userId: string;
}

// ── Helper: input cu toggle vizibilitate parolă
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

  const [formData, setFormData] = useState({
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

  // ── Parola state
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('agencies')
        .update({
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
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setSuccess(true);
      setIsEditing(false);

      setTimeout(() => { router.refresh(); }, 1000);

    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'A apărut o eroare la actualizarea profilului');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
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

    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      {/* Success Message - Profil */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-green-500 text-2xl">✅</span>
            <div>
              <div className="font-bold text-green-800">Profilul a fost actualizat cu succes!</div>
              <div className="text-sm text-green-700">Modificările au fost salvate.</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message - Profil */}
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

      {/* Edit Button */}
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
        {/* Company Information */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <span>Informații Companie</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nume Companie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Registrul Comerțului <span className="text-red-500">*</span>
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
                CUI / CIF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
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

            <div>
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
              <p className="text-xs text-gray-500 mt-1">
                Doar administratorii pot modifica rata de comision
              </p>
            </div>
          </div>
        </div>

        {/* Billing Information */}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Județ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="billing_county"
                  value={formData.billing_county}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cod Poștal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="billing_postal_code"
                  value={formData.billing_postal_code}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <span>Informații Bancare</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nume Bancă <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                placeholder="Ex: BCR, BRD, ING"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                IBAN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                placeholder="RO00XXXX0000000000000000"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Profil */}
        {isEditing && (
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
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

      {/* ── Schimbare Parolă */}
      <div className="mt-6 bg-gray-50 rounded-xl p-6 border-2 border-indigo-200">
        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span className="text-xl">🔐</span>
          <span>Schimbare Parolă</span>
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Introdu parola curentă și apoi parola nouă dorită.
        </p>

        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm font-semibold text-green-800">
                Parola a fost schimbată cu succes!
              </span>
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