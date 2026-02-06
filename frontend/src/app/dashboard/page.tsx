'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardData } from '@/types';

function formatCurrency(amount: number, currency = 'MAD') {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: currency === 'MAD' ? 'MAD' : currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then((res) => setData(res as DashboardData))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Erreur de chargement</p>;

  const stats = [
    {
      label: 'Chiffre d\'affaires',
      value: formatCurrency(data.summary.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Impayes',
      value: formatCurrency(data.summary.totalOverdue),
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Factures',
      value: data.summary.totalInvoices,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: `${data.summary.paidCount} payees`,
    },
    {
      label: 'Clients',
      value: data.summary.totalClients,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: `${data.summary.atRiskClients} a risque`,
    },
    {
      label: 'Revenu mensuel',
      value: formatCurrency(data.monthly.revenue),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'En attente',
      value: data.summary.overdueCount,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      sub: 'factures en retard',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-start gap-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              {stat.sub && (
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cashflow chart placeholder and Clients at risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Cashflow annuel</h2>
          <div className="space-y-3">
            {data.cashflow.map((month) => (
              <div key={month.month} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-10">
                  {month.month}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-primary-500 h-full rounded-full transition-all"
                    style={{
                      width: `${data.cashflow.reduce((max, m) => Math.max(max, m.total), 1) > 0 ? (month.total / data.cashflow.reduce((max, m) => Math.max(max, m.total), 1)) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-24 text-right">
                  {formatCurrency(month.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Clients a risque</h2>
          {data.clientsAtRisk.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun client a risque</p>
          ) : (
            <div className="space-y-3">
              {data.clientsAtRisk.map((client, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-medium text-xs">
                      {client.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{client.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    {formatCurrency(client.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
