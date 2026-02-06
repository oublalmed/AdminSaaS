'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    ice: '',
    rc: '',
    phone: '',
    city: '',
    country: 'MA',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-700">AdminSaaS</h1>
          <p className="text-gray-500 mt-1">Creez votre compte entreprise</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Inscription</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prenom
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="votre@email.ma"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Min. 8 caracteres"
                minLength={8}
                required
              />
            </div>

            <hr className="my-2" />
            <h3 className="text-sm font-semibold text-gray-700">
              Informations entreprise
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;entreprise
              </label>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ICE
                </label>
                <input
                  type="text"
                  name="ice"
                  value={form.ice}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Identifiant Commun"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RC
                </label>
                <input
                  type="text"
                  name="rc"
                  value={form.rc}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Registre Commerce"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telephone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Casablanca"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays
              </label>
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className="input-field"
              >
                <option value="MA">Maroc</option>
                <option value="SN">Senegal</option>
                <option value="CI">Cote d&apos;Ivoire</option>
                <option value="TN">Tunisie</option>
                <option value="DZ">Algerie</option>
                <option value="CM">Cameroun</option>
                <option value="GA">Gabon</option>
                <option value="ML">Mali</option>
                <option value="BF">Burkina Faso</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creation...' : 'Creer mon compte'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Deja un compte?{' '}
            <Link
              href="/auth/login"
              className="text-primary-600 font-medium hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
