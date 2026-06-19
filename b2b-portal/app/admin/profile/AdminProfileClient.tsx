'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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

interface AdminProfileClientProps {
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
}

const roleConfig: Record<string, { label: string; color: string; icon: string }> = {
  superadmin: { label: 'Super Admin', color: 'text-purple-700 bg-purple-100 border-purple-200', icon: '👑' },
  admin: { label: 'Admin', color: 'text-blue-700 bg-blue-100 border-blue-200', icon: '👨‍💼' },
  operator: { label: 'Operator', color: 'text-green-700 bg-green-100 border-green-200', icon: '🔧' },
};

export default function AdminProfileClient({
  userId,
  email,
  fullName,
  role,
}: AdminProfileClientProps) {
  // ── Nume state
  const [nameValue, setNameValue] = useState(fullName || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState(false);

  // ── Parola state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const config = roleConfig[role] || roleConfig.admin;

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameLoading(true);
    setNameError('');
    setNameSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: nameValue, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      setNameSuccess(true);
    } catch (err: any) {
      setNameError(err.message || 'Eroare la salvarea numelui');
    } finally {
      setNameLoading(false);
    }
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
      const response = await fetch('/api/admin/change-password', {
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
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
              {config.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Profilul Meu</h1>
              <p className="text-indigo-200 text-sm mt-1">{email}</p>
            </div>
            <div className="ml-auto">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.color}`}>
                {config.icon} {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nume */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">👤</span>
          <span>Informații Cont</span>
        </h2>

        {nameSuccess && (
          <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm font-semibold text-green-800">Numele a fost actualizat!</span>
            </div>
          </div>
        )}

        {nameError && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-sm text-red-700">{nameError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleNameSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="text"
              value={email}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Emailul nu poate fi modificat din această pagină</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nume complet</label>
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="Ex: Popescu Ion"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
            <input
              type="text"
              value={`${config.icon} ${config.label}`}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Rolul poate fi modificat doar de un Super Admin</p>
          </div>

          <button
            type="submit"
            disabled={nameLoading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md flex items-center gap-2"
          >
            {nameLoading ? (
              <><span className="animate-spin">⏳</span> Se salvează...</>
            ) : (
              <><span>💾</span> Salvează Numele</>
            )}
          </button>
        </form>
      </div>

      {/* Schimbare Parolă */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span className="text-xl">🔐</span>
          <span>Schimbare Parolă</span>
        </h2>
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

        <form onSubmit={handlePasswordChange} className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <button
            type="submit"
            disabled={
              passwordLoading ||
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword
            }
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md flex items-center gap-2"
          >
            {passwordLoading ? (
              <><span className="animate-spin">⏳</span> Se schimbă...</>
            ) : (
              <><span>🔐</span> Schimbă Parola</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}