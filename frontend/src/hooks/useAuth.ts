'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Tenant, AuthResponse } from '@/types';
import { api } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedTenant = localStorage.getItem('tenant');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      if (savedTenant) setTenant(JSON.parse(savedTenant));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = (await api.login({ email, password })) as AuthResponse;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('tenant', JSON.stringify(data.tenant));
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  }, []);

  const register = useCallback(async (formData: any) => {
    const data = (await api.register(formData)) as AuthResponse;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('tenant', JSON.stringify(data.tenant));
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setUser(null);
    setTenant(null);
    window.location.href = '/auth/login';
  }, []);

  return { user, tenant, loading, login, register, logout };
}
