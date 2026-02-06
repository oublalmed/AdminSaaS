'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Sparkles,
  Trash2,
  X,
  Mail,
  MessageCircle,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Reminder, Client, Invoice } from '@/types';

const channelIcons = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: Phone,
};

const statusConfig: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'En attente', class: 'badge-warning' },
  SENT: { label: 'Envoyee', class: 'badge-success' },
  FAILED: { label: 'Echouee', class: 'badge-danger' },
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiForm, setAiForm] = useState({
    clientId: '',
    invoiceId: '',
    channel: 'EMAIL' as 'EMAIL' | 'WHATSAPP' | 'SMS',
    language: 'fr',
  });

  const loadReminders = () => {
    setLoading(true);
    api
      .getReminders()
      .then((res) => setReminders(res as Reminder[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReminders();
    api.getClients().then((res) => setClients(res as Client[])).catch(console.error);
    api.getInvoices().then((res) => setInvoices(res as Invoice[])).catch(console.error);
  }, []);

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.aiGenerateReminder(aiForm);
      setShowAiForm(false);
      setAiForm({ clientId: '', invoiceId: '', channel: 'EMAIL', language: 'fr' });
      loadReminders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette relance?')) return;
    try {
      await api.deleteReminder(id);
      loadReminders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const clientInvoices = invoices.filter(
    (i) => i.client.id === aiForm.clientId && i.status !== 'PAID',
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Relances</h1>
        <button
          onClick={() => setShowAiForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Relance IA
        </button>
      </div>

      {/* AI Generate Reminder Modal */}
      {showAiForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                Relance IA
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
                    setAiForm({ ...aiForm, clientId: e.target.value, invoiceId: '' })
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
                  Facture *
                </label>
                <select
                  value={aiForm.invoiceId}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, invoiceId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Selectionner une facture</option>
                  {clientInvoices.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.number} - {i.total} {i.currency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Canal
                </label>
                <select
                  value={aiForm.channel}
                  onChange={(e) =>
                    setAiForm({
                      ...aiForm,
                      channel: e.target.value as any,
                    })
                  }
                  className="input-field"
                >
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">
                Generer la relance
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reminders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune relance</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const ChannelIcon = channelIcons[reminder.channel] || Mail;
            return (
              <div key={reminder.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <ChannelIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {reminder.client.name}
                        </h3>
                        <span className={statusConfig[reminder.status]?.class}>
                          {statusConfig[reminder.status]?.label}
                        </span>
                        {reminder.aiGenerated && (
                          <span className="badge-info flex items-center gap-1 text-xs">
                            <Sparkles className="h-3 w-3" /> IA
                          </span>
                        )}
                      </div>
                      {reminder.invoice && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Facture: {reminder.invoice.number}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                        {reminder.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Planifiee:{' '}
                        {new Date(reminder.scheduledAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
