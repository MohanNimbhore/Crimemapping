import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'demo-admin-1',
  name: 'Inspector Vikram Patel',
  email: 'admin@crimemapper.com',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('crimemapper_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default to demo admin logged-in if not configured or first visit
    return isSupabaseConfigured ? null : DEMO_USER;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at, updated_at')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (error || !data) {
        setUser(null);
      } else {
        setUser(data);
        localStorage.setItem('crimemapper_auth_user', JSON.stringify(data));
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const loggedUser: User = {
        id: `user-${Date.now()}`,
        name: email.includes('admin') ? 'Inspector Vikram Patel' : 'Officer Sharma',
        email,
        role: email.includes('admin') ? 'admin' : 'officer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(loggedUser);
      localStorage.setItem('crimemapper_auth_user', JSON.stringify(loggedUser));
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Login failed');
      await fetchUserProfile(data.user.id);
    } catch (err) {
      // Fallback for demo credentials even with supabase configured
      if (email === 'admin@crimemapper.com' || email === 'officer@police.gov.in') {
        const loggedUser: User = {
          id: `demo-${email.split('@')[0]}`,
          name: email === 'admin@crimemapper.com' ? 'Inspector Vikram Patel' : 'Officer Rajesh Sharma',
          email,
          role: email === 'admin@crimemapper.com' ? 'admin' : 'officer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(loggedUser);
        localStorage.setItem('crimemapper_auth_user', JSON.stringify(loggedUser));
        return;
      }
      throw err;
    }
  };

  const signup = async (name: string, email: string, password: string, role: string = 'officer') => {
    if (!isSupabaseConfigured) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: (role === 'admin' ? 'admin' : 'officer'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem('crimemapper_auth_user', JSON.stringify(newUser));
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed');

    if (!data.session) {
      throw new Error('Please check your email to confirm your account, then sign in.');
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    await fetchUserProfile(data.user.id);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    localStorage.removeItem('crimemapper_auth_user');
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
