'use client';

import { useState, useEffect } from 'react';
import { Settings, Building, User, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getProfile()
      .then((res) => setProfile(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" role="status" aria-label="Chargement" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>

      {/* Profile Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold">Profil</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Prenom</label>
            <p className="text-gray-900">{profile.firstName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Nom</label>
            <p className="text-gray-900">{profile.lastName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{profile.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Role</label>
            <span className="badge-info">{profile.role}</span>
          </div>
        </div>
      </div>

      {/* Company Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Building className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold">Entreprise</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Nom</label>
            <p className="text-gray-900">{profile.tenant.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Devise</label>
            <p className="text-gray-900">{profile.tenant.currency}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">ICE</label>
            <p className="text-gray-900">{profile.tenant.ice || 'Non renseigne'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">RC</label>
            <p className="text-gray-900">{profile.tenant.rc || 'Non renseigne'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Taux TVA</label>
            <p className="text-gray-900">{profile.tenant.tvaRate}%</p>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold">Securite</h2>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Gestion de la securite de votre compte
        </p>
        <button
          className="btn-secondary text-sm"
          onClick={() => toast('info', 'Fonctionnalite de changement de mot de passe bientot disponible')}
        >
          Changer le mot de passe
        </button>
      </div>
    </div>
  );
}
