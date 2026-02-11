'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ChevronDown, Building2 } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Tenant, AuthResponse } from '@/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tenantDropdown, setTenantDropdown] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const { user, tenant, loading, logout, setAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      api.getAccessibleTenants()
        .then((res) => setTenants(res as Tenant[]))
        .catch(() => {});
    }
  }, [user]);

  const handleSwitchTenant = async (targetTenantId: string) => {
    if (targetTenantId === tenant?.id) {
      setTenantDropdown(false);
      return;
    }
    try {
      const data = (await api.switchTenant(targetTenantId)) as AuthResponse;
      setAuth(data);
      setTenantDropdown(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) return null;

  const showTenantSwitcher = tenants.length > 1;

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} onLogout={logout} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {showTenantSwitcher && (
              <div className="relative">
                <button
                  onClick={() => setTenantDropdown(!tenantDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
                >
                  <Building2 className="h-4 w-4 text-primary-600" />
                  <span className="max-w-[150px] truncate font-medium">{tenant?.name}</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
                {tenantDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setTenantDropdown(false)} />
                    <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border z-20 py-1 max-h-80 overflow-y-auto">
                      {tenants.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleSwitchTenant(t.id)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                            t.id === tenant?.id ? 'bg-primary-50 text-primary-700' : ''
                          }`}
                        >
                          <div>
                            <p className="font-medium">{t.name}</p>
                            {t.city && <p className="text-xs text-gray-400">{t.city}</p>}
                          </div>
                          {t.isPrimary && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              {!showTenantSwitcher && (
                <p className="text-xs text-gray-500">{tenant?.name}</p>
              )}
            </div>
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
