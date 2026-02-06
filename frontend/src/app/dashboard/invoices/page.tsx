'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Sparkles,
  Trash2,
  X,
  Send,
  CheckCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Invoice, Client } from '@/types';

function formatCurrency(amount: number, currency = 'MAD') {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  DRAFT: { label: 'Brouillon', class: 'badge-gray' },
  SENT: { label: 'Envoyee', class: 'badge-info' },
  PAID: { label: 'Payee', class: 'badge-success' },
  OVERDUE: { label: 'En retard', class: 'badge-danger' },
  CANCELLED: { label: 'Annulee', class: 'badge-warning' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    clientId: '',
    dueDate: '',
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  });
  const [aiForm, setAiForm] = useState({
    clientId: '',
    description: '',
    language: 'fr',
  });

  const loadInvoices = () => {
    setLoading(true);
    api
      .getInvoices(statusFilter || undefined)
      .then((res) => setInvoices(res as Invoice[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
    api.getClients().then((res) => setClients(res as Client[])).catch(console.error);
  }, [statusFilter]);

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...form.items];
    (items[index] as any)[field] = value;
    setForm({ ...form, items });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInvoice(form);
      setShowForm(false);
      setForm({
        clientId: '',
        dueDate: '',
        notes: '',
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
      });
      loadInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.aiGenerateInvoice(aiForm);
      setShowAiForm(false);
      setAiForm({ clientId: '', description: '', language: 'fr' });
      loadInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.updateInvoice(id, { status });
      loadInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette facture?')) return;
    try {
      await api.deleteInvoice(id);
      loadInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAiForm(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">IA</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle</span>
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? statusConfig[s]?.label : 'Toutes'}
          </button>
        ))}
      </div>

      {/* AI Generate Modal */}
      {showAiForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                Generation IA
              </h2>
              <button onClick={() => setShowAiForm(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAiGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <select
                  value={aiForm.clientId}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, clientId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Selectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description du travail *
                </label>
                <textarea
                  value={aiForm.description}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, description: e.target.value })
                  }
                  className="input-field"
                  rows={3}
                  placeholder="Decrivez les services ou produits..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Langue
                </label>
                <select
                  value={aiForm.language}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, language: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="fr">Francais</option>
                  <option value="ar">Arabe</option>
                  <option value="en">English</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">
                Generer avec l&apos;IA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nouvelle facture</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <select
                  value={form.clientId}
                  onChange={(e) =>
                    setForm({ ...form, clientId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Selectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d&apos;echeance *
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Articles
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-primary-600 font-medium"
                  >
                    + Ajouter
                  </button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(i, 'description', e.target.value)
                      }
                      placeholder="Description"
                      className="input-field flex-1"
                      required
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(i, 'quantity', Number(e.target.value))
                      }
                      placeholder="Qte"
                      className="input-field w-16"
                      min={1}
                      required
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(i, 'unitPrice', Number(e.target.value))
                      }
                      placeholder="Prix"
                      className="input-field w-24"
                      min={0}
                      required
                    />
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Creer la facture
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoices List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune facture</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900">
                        {invoice.number}
                      </h3>
                      <span className={statusConfig[invoice.status]?.class}>
                        {statusConfig[invoice.status]?.label}
                      </span>
                      {invoice.aiGenerated && (
                        <span className="badge-info flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> IA
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {invoice.client.name} -{' '}
                      {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </span>
                  <div className="flex gap-1">
                    {invoice.status === 'DRAFT' && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(invoice.id, 'SENT')
                        }
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Marquer envoyee"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    {(invoice.status === 'SENT' ||
                      invoice.status === 'OVERDUE') && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(invoice.id, 'PAID')
                        }
                        className="p-1.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Marquer payee"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
