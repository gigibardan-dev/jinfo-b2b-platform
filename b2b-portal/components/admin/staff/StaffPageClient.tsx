'use client';

import { useState, useEffect, useCallback } from 'react';
import CreateStaffModal from './CreateStaffModal';
import EditRoleModal from './EditRoleModal';
import ResetPasswordModal from '@/components/admin/shared/ResetPasswordModal';

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

const roleConfig: Record<string, { label: string; color: string; icon: string }> = {
  superadmin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '👑' },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '👨‍💼' },
  operator: { label: 'Operator', color: 'bg-green-100 text-green-800 border-green-200', icon: '🔧' },
};

export default function StaffPageClient({ currentUserId }: { currentUserId: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.success) setStaff(data.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeleteConfirm(null);
      fetchStaff();
    } catch (err: any) {
      alert('Eroare: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
                👥
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Gestionare Staff</h1>
                <p className="text-indigo-200 text-sm mt-1">
                  Admini și operatori J'Info Tours
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-md"
            >
              <span>➕</span>
              <span>User nou</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          {[
            { label: 'Super Admini', count: staff.filter(s => s.role === 'superadmin').length, icon: '👑', color: 'text-purple-600' },
            { label: 'Admini', count: staff.filter(s => s.role === 'admin').length, icon: '👨‍💼', color: 'text-blue-600' },
            { label: 'Operatori', count: staff.filter(s => s.role === 'operator').length, icon: '🔧', color: 'text-green-600' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-gray-500">Se încarcă...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500">Niciun user staff găsit</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Utilizator</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Rol</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Creat</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((member) => {
                const config = roleConfig[member.role] || roleConfig.admin;
                const isCurrentUser = member.id === currentUserId;
                const isSuperAdmin = member.role === 'superadmin';

                return (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg">
                          {config.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {member.full_name || '—'}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                Tu
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                        {config.icon} {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString('ro-RO', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrentUser && !isSuperAdmin ? (
                          <>
                            <button
                              onClick={() => setEditTarget(member)}
                              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                            >
                              ✏️ Editează
                            </button>
                            <button
                              onClick={() => setResetTarget(member)}
                              className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium"
                            >
                              🔑 Parolă
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(member.id)}
                              className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                            >
                              🗑️ Șterge
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            {isCurrentUser ? 'Contul tău' : 'Protejat'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <div>
            <strong>Despre roluri:</strong> Adminii pot gestiona rezervări, agenții, plăți și documente.
            Operatorii pot vedea și gestiona doar rezervările. Super Adminii nu pot fi modificați din această pagină.
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateStaffModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchStaff}
      />

      <EditRoleModal
        staff={editTarget}
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={fetchStaff}
      />

      <ResetPasswordModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        userId={resetTarget?.id || ''}
        userName={resetTarget?.email || ''}
        apiEndpoint={resetTarget ? `/api/admin/staff/${resetTarget.id}` : ''}
      />

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900">Confirmare ștergere</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Această acțiune este ireversibilă. Userul nu va mai putea accesa platforma.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Anulează
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {deleteLoading ? '⏳...' : '🗑️ Șterge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}