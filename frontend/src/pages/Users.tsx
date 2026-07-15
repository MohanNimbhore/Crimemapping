import { useEffect, useState, type JSX } from 'react';
import { Edit2, Trash2, Ban, Info, Users as UsersIcon, Crown, BadgeCheck } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { User as UserType } from '../types';
import { formatDate } from '../lib/utils';

export default function Users() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: 'officer' as 'admin' | 'officer' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: UserType) => {
    setSelectedUser(user);
    setFormData({ name: user.name, role: user.role });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.updateUser(selectedUser.id, { name: formData.name, role: formData.role });
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Ban className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-white font-semibold text-lg">Access Denied</p>
          <p className="text-sm text-slate-400 mt-1">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  const adminCount = users.filter(u => u.role === 'admin').length;
  const officerCount = users.filter(u => u.role === 'officer').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Manage system users and role permissions</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/8 border border-blue-500/25 rounded-2xl animate-fade-in-up" style={{ animationDelay: '40ms' }}>
        <div className="p-1.5 rounded-lg bg-blue-500/15 flex-shrink-0">
          <Info className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-blue-300 font-medium">New User Registration</p>
          <p className="text-sm text-slate-400 mt-0.5">
            New users must self-register via the <strong className="text-white">Sign Up</strong> tab on the login page. Admins can then update their role here.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <StatCard icon={<UsersIcon className="w-5 h-5" />} label="Total Users" value={users.length} color="blue" delay={0} />
        <StatCard icon={<Crown className="w-5 h-5" />} label="Administrators" value={adminCount} color="purple" delay={80} />
        <StatCard icon={<BadgeCheck className="w-5 h-5" />} label="Officers" value={officerCount} color="green" delay={160} />
      </div>

      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/40">
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-700/30 flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-slate-500" />
                      </div>
                      <p className="text-slate-400 text-sm">No users found. Users appear here after they register.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-slate-700/15 transition-colors group/row animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
                          <span className="text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        user.role === 'admin'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/25'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover/row:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-xl hover:bg-blue-500/15 text-slate-400 hover:text-blue-400 transition-all btn-press"
                          title="Edit user"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 rounded-xl hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-all btn-press"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Edit User">
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {(['officer', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: r })}
                  className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all duration-200 btn-press ${
                    formData.role === r
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-sm shadow-blue-500/10'
                      : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {r === 'admin' ? 'Admin' : 'Officer'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold disabled:opacity-50 transition-all flex items-center gap-2 btn-press shadow-lg shadow-blue-500/20"
            >
              {saving && <ButtonLoader />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: { icon: JSX.Element; label: string; value: string | number; color: string; delay: number }) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'from-blue-500/15 to-blue-600/5', icon: 'text-blue-400 bg-blue-500/15' },
    purple: { bg: 'from-purple-500/15 to-purple-600/5', icon: 'text-purple-400 bg-purple-500/15' },
    green: { bg: 'from-emerald-500/15 to-emerald-600/5', icon: 'text-emerald-400 bg-emerald-500/15' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-gradient-to-br ${c.bg} border border-slate-700/50 rounded-2xl p-4 card-lift animate-fade-in-up`} style={{ animationDelay: `${delay}ms`, opacity: 0 }}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${c.icon}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
