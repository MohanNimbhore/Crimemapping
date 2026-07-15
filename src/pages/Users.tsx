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
    try {
      const data = await api.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteUser(deleteId);
      setUsers((prev) => prev.filter((u) => u.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => {
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <UserPlus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      {/* Note about Supabase auth */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-300 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-950/20 p-4">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Authentication via Supabase</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
            Users sign up themselves through the login page. Supabase Auth handles user registration and authentication.
            This table displays users who have already signed up and have a profile in the system.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Users</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950/30 p-2.5">
              <UsersIcon className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Admins</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{users.filter((u) => u.role === 'admin').length}</p>
            </div>
            <div className="rounded-lg bg-purple-100 dark:bg-purple-950/30 p-2.5">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Officers</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{users.filter((u) => u.role === 'officer').length}</p>
            </div>
            <div className="rounded-lg bg-green-100 dark:bg-green-950/30 p-2.5">
              <UserIcon className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UsersIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No users found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Users will appear here once they sign up through the login page.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Email</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Role</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Created At</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {users.map((user, i) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                        {user.id === currentUser?.id && (
                          <span className="rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs px-1.5 py-0.5">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                        user.role === 'admin'
                          ? 'border-purple-500/50 bg-purple-950/50 text-purple-400'
                          : 'border-green-500/50 bg-green-950/50 text-green-400'
                      }`}>
                        {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                          title="Delete user"
                        >
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

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDeleteId(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-950/50 p-2.5">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete User?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will remove the user profile from the system. The user's Supabase auth account will not be affected.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
