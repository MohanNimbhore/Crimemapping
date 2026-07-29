import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Trash2, Users as UsersIcon, Info, ShieldCheck, User as UserIcon } from 'lucide-react';
import { api } from '../lib/api';
import type { User } from '../types';
import { formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try { setUsers(await api.getUsers()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true);
    try { await api.deleteUser(deleteId); setUsers((p) => p.filter((u) => u.id !== deleteId)); setDeleteId(null); }
    catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const officerCount = users.filter((u) => u.role === 'officer').length;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/15 glow-green border border-green-500/20">
            <UsersIcon className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
            <p className="text-sm text-slate-400">Manage system users and their roles</p>
          </div>
        </div>
        <button
          onClick={() => { window.location.href = '/login'; }}
          className="flex items-center gap-2 rounded-xl glass-deep border border-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:border-blue-500/40 btn-press transition-all"
        >
          <UserPlus className="h-4 w-4" /> Invite User
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-300">Authentication via Supabase</p>
          <p className="text-sm text-blue-400/70 mt-0.5">Users sign up through the login page. This table shows users with existing profiles.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Users', value: users.length,  icon: <UsersIcon className="h-5 w-5" />,   color: '#3b82f6', glow: 'glow-blue',   border: 'border-blue-500/20' },
          { label: 'Admins',      value: adminCount,    icon: <ShieldCheck className="h-5 w-5" />, color: '#8b5cf6', glow: 'glow-purple', border: 'border-purple-500/20' },
          { label: 'Officers',    value: officerCount,  icon: <UserIcon className="h-5 w-5" />,    color: '#22c55e', glow: 'glow-green',  border: 'border-green-500/20' },
        ].map(({ label, value, icon, color, glow, border }, i) => (
          <div key={label} className={`card-3d glass-deep rounded-2xl border ${border} ${glow} p-5 animate-fade-in-up`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color }}>{icon}</span>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse-subtle" style={{ background: color }} />
            </div>
            <p className="text-3xl font-bold tabular-nums stat-3d" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="glass-deep rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-full bg-slate-800/60 mb-4"><UsersIcon className="h-10 w-10 text-slate-600" /></div>
          <h3 className="text-lg font-semibold text-slate-300">No users found</h3>
          <p className="text-sm text-slate-500 mt-1">Users appear here once they sign up through the login page.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/50 glass-deep">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-800/60 text-left">
                  {['Name','Email','Role','Created At',''].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id} className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/25 shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{user.name}</span>
                        {user.id === currentUser?.id && (
                          <span className="rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs px-1.5 py-0.5 font-semibold">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${user.role === 'admin' ? 'border-purple-500/40 bg-purple-500/10 text-purple-400' : 'border-green-500/40 bg-green-500/10 text-green-400'}`}>
                        {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== currentUser?.id && (
                        <button onClick={() => setDeleteId(user.id)}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-700/50 p-1.5 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-all btn-press">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm glass-deep rounded-2xl border border-red-500/20 p-6 animate-pop-in shadow-2xl shadow-red-500/10 neon-pulse-red" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-500/15 border border-red-500/25 p-2.5"><Trash2 className="h-5 w-5 text-red-400" /></div>
              <h3 className="text-lg font-bold text-white">Delete User?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-5">This removes the user profile from the system. Their auth account is not affected.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl glass-deep border border-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white btn-press">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 border border-red-500/30 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 btn-press">
                {deleting ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
