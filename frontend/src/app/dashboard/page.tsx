'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardData, AgingData } from '@/types';

function formatCurrency(amount: number, currency = 'MAD') {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: currency === 'MAD' ? 'MAD' : currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

const bucketColors = [
  { bar: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  { bar: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50' },
  { bar: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50' },
  { bar: 'bg-red-600', text: 'text-red-800', bg: 'bg-red-100' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [aging, setAging] = useState<AgingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAging, setShowAging] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getDashboard().then((res) => setData(res as DashboardData)),
      api.getAgingDashboard().then((res) => {
        const agingData = res as AgingData;
        setAging(agingData);
        if (agingData.totalOutstanding > 0) setShowAging(true);
      }).catch(() => {}),
    ])
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

  const maxBucket = aging ? Math.max(...aging.buckets.map((b) => b.amount), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="flex items-center gap-2">
          <a
            href={api.getExportUrl('csv')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </a>
          <a
            href={api.getExportUrl('fec')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            FEC
          </a>
        </div>
      </div>

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

      {/* Aging Receivables */}
      {aging && showAging && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold">Balance agee</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total impaye</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(aging.totalOutstanding)}
              </p>
              <p className="text-xs text-gray-400">DSO: {aging.dso} jours</p>
            </div>
          </div>

          {/* Aging Bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {aging.buckets.map((bucket, i) => (
              <div key={bucket.label} className={`p-3 rounded-lg ${bucketColors[i]?.bg || 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${bucketColors[i]?.text || 'text-gray-700'}`}>
                  {bucket.label}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {formatCurrency(bucket.amount)}
                </p>
                <p className="text-xs text-gray-500">{bucket.count} facture(s)</p>
                <div className="mt-2 bg-white/50 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bucketColors[i]?.bar || 'bg-gray-400'}`}
                    style={{ width: `${(bucket.amount / maxBucket) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Client Breakdown Table */}
          {aging.clientBreakdown.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">Client</th>
                    <th className="text-right py-2 font-medium text-yellow-600">0-30j</th>
                    <th className="text-right py-2 font-medium text-orange-600">31-60j</th>
                    <th className="text-right py-2 font-medium text-red-600">61-90j</th>
                    <th className="text-right py-2 font-medium text-red-800">90j+</th>
                    <th className="text-right py-2 font-medium text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {aging.clientBreakdown.map((client) => (
                    <tr key={client.name} className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-900">{client.name}</td>
                      <td className="py-2 text-right text-gray-600">
                        {client.current > 0 ? formatCurrency(client.current) : '-'}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {client.days31_60 > 0 ? formatCurrency(client.days31_60) : '-'}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {client.days61_90 > 0 ? formatCurrency(client.days61_90) : '-'}
                      </td>
                      <td className="py-2 text-right text-red-600 font-medium">
                        {client.over90 > 0 ? formatCurrency(client.over90) : '-'}
                      </td>
                      <td className="py-2 text-right font-bold text-gray-900">
                        {formatCurrency(client.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cashflow chart and Clients at risk */}
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
