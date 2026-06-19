'use client';

import { useState } from 'react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string; // nume sau email pentru afisare
  apiEndpoint: string; // '/api/admin/staff/[id]' sau '/api/admin/agencies/[id]'
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        minLength={8}
        required
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
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

export default function ResetPasswordModal({
  isOpen,
  onClose,
  userId,
  userName,
  apiEndpoint,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Parola trebuie să aibă minim 8 caractere');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Parolele nu coincid');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Eroare la resetarea parolei');

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔑</span>
              <div>
                <h2 className="text-xl font-bold text-white">Reset Parolă</h2>
                <p className="text-red-100 text-sm truncate max-w-[220px]">{userName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>
              Setezi o parolă nouă pentru acest user. 
              Comunică-i noua parolă pe un canal sigur.
            </span>
          </div>

          {success ? (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="font-bold text-green-800">Parola a fost resetată cu succes!</div>
              <p className="text-sm text-green-600 mt-1">
                Comunică noua parolă userului.
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Închide
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parolă nouă <span className="text-red-500">*</span>
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minim 8 caractere"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmă parola <span className="text-red-500">*</span>
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetă parola nouă"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {loading ? '⏳ Se resetează...' : '🔑 Resetează Parola'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}