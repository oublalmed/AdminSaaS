'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  Receipt,
  X,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
  onLogout: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/invoices', label: 'Factures', icon: FileText },
  { href: '/dashboard/invoices?tab=quotes', label: 'Devis', icon: Receipt },
  { href: '/dashboard/documents', label: 'Documents', icon: FolderOpen },
  { href: '/dashboard/reminders', label: 'Relances', icon: Bell },
  { href: '/dashboard/ai-chat', label: 'Assistant IA', icon: MessageSquare },
];

export default function Sidebar({ onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-bold text-primary-700">AdminSaaS</h1>
          <p className="text-xs text-gray-500">Assistant IA</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href.split('?')[0]));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Deconnexion
        </button>
      </div>
    </div>
  );
}
