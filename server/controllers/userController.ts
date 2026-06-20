import { supabase } from '../config/supabase.js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('id, name, email, role, created_at, updated_at').order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

  if (error) return null;
  return data;
};

export const createUser = async (user: UserInput) => {
  const existingUser = await getUserByEmail(user.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      ...user,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, name, email, role, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, updates: Partial<Omit<UserInput, 'password'>>) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, name, email, role, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
};
