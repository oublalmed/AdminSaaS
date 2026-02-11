'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CreditCard,
  Building2,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PaymentLinkData } from '@/types';

function formatCurrency(amount: number, currency = 'MAD') {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: currency === 'MAD' ? 'MAD' : currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

const paymentMethods = [
  { value: 'BANK_TRANSFER', label: 'Virement bancaire', icon: Building2 },
  { value: 'CASH', label: 'Especes', icon: Banknote },
  { value: 'CHECK', label: 'Cheque', icon: FileText },
  { value: 'MOBILE_PAYMENT', label: 'Paiement mobile', icon: Smartphone },
  { value: 'CARD', label: 'Carte bancaire', icon: CreditCard },
];

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .getPaymentInfo(token)
      .then((res) => setData(res as PaymentLinkData))
      .catch((err) => setError(err.message || 'Lien invalide ou expire'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleConfirm = async () => {
    if (!selectedMethod) return;
    setConfirming(true);
    try {
      await api.confirmPayment(token, selectedMethod, notes || undefined);
      setConfirmed(true);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la confirmation');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500">{error || 'Ce lien de paiement n\'existe pas ou a expire.'}</p>
        </div>
      </div>
    );
  }

  if (data.isPaid || confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirme</h1>
          <p className="text-gray-500 mb-4">
            Merci! Le paiement de {formatCurrency(data.amount, data.currency)} a ete enregistre.
          </p>
          <p className="text-sm text-gray-400">
            Facture {data.invoice.number} - {data.company.name}
          </p>
        </div>
      </div>
    );
  }

  if (data.isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien expire</h1>
          <p className="text-gray-500">
            Ce lien de paiement a expire. Veuillez contacter {data.company.name} pour un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Company Header */}
        <div className="text-center">
          <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <Building2 className="h-7 w-7 text-blue-700" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{data.company.name}</h1>
          {data.company.ice && (
            <p className="text-xs text-gray-400 mt-1">ICE: {data.company.ice}</p>
          )}
        </div>

        {/* Invoice Summary */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <p className="text-sm opacity-80">Montant a payer</p>
            <p className="text-3xl font-bold">{formatCurrency(data.amount, data.currency)}</p>
            <p className="text-sm opacity-80 mt-1">Facture {data.invoice.number}</p>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date de facture</span>
              <span className="text-gray-900">
                {new Date(data.invoice.date).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date d&apos;echeance</span>
              <span className="text-gray-900">
                {new Date(data.invoice.dueDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {data.invoice.client?.name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Client</span>
                <span className="text-gray-900">{data.invoice.client.name}</span>
              </div>
            )}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sous-total HT</span>
                <span>{formatCurrency(data.invoice.subtotal, data.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">TVA ({data.invoice.tvaRate}%)</span>
                <span>{formatCurrency(data.invoice.tvaAmount, data.currency)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-1">
                <span>Total TTC</span>
                <span>{formatCurrency(data.invoice.total, data.currency)}</span>
              </div>
            </div>

            {/* Line items */}
            {data.invoice.items.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Detail</p>
                {data.invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span className="text-gray-600">
                      {item.description} ({item.quantity} x {formatCurrency(item.unitPrice, data.currency)})
                    </span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(item.quantity * item.unitPrice, data.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Mode de paiement</h2>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                onClick={() => setSelectedMethod(method.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedMethod === method.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <method.icon className={`h-5 w-5 ${
                  selectedMethod === method.value ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  selectedMethod === method.value ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {method.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reference de virement, numero de cheque..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedMethod || confirming}
            className={`w-full mt-4 py-3 rounded-lg font-medium text-white transition-colors ${
              selectedMethod && !confirming
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {confirming ? 'Confirmation en cours...' : `Confirmer le paiement de ${formatCurrency(data.amount, data.currency)}`}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Expire le {new Date(data.expiresAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}
