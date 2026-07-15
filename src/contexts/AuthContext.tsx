import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const signingUp = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (signingUp.current) return;
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
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error || !data) {
      setUser(null);
    } else {
      setUser(data);
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed');
    await fetchUserProfile(data.user.id);
  };

  const signup = async (name: string, email: string, password: string, role: string = 'officer') => {
    signingUp.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Signup failed');

      if (!data.session) {
        throw new Error('Please check your email to confirm your account, then sign in.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          auth_user_id: data.user.id,
          name,
          email,
          role,
        })
        .select('id, name, email, role, created_at, updated_at')
        .maybeSingle();

      if (profileError) {
        if (profileError.code === '23505') {
          await fetchUserProfile(data.user.id);
          return;
        }
        throw new Error('Failed to create profile: ' + profileError.message);
      }

      setUser(profile);
      setLoading(false);
    } finally {
      signingUp.current = false;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
