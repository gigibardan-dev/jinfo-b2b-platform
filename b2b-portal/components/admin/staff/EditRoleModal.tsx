'use client';

import { useState } from 'react';

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface EditRoleModalProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditRoleModal({ staff, isOpen, onClose, onUpdated }: EditRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState(staff?.role || 'admin');
  const [fullName, setFullName] = useState(staff?.full_name || '');

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, full_name: fullName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Eroare la actualizare');

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✏️</span>
              <div>
                <h2 className="text-xl font-bold text-white">Editare Staff</h2>
                <p className="text-orange-100 text-sm">{staff.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nume complet"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="admin">👨‍💼 Admin — acces complet</option>
              <option value="operator">🔧 Operator — doar rezervări</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {role === 'admin'
                ? 'Poate gestiona rezervări, agenții, plăți și documente'
                : 'Poate vedea și gestiona doar rezervările'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium disabled:opacity-50"
            >
              {loading ? '⏳ Se salvează...' : '✅ Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}