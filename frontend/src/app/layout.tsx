import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AdminSaaS - Assistant Administratif & Financier IA',
  description:
    'Plateforme SaaS de gestion administrative et financiere pour les PME au Maroc et en Afrique',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
