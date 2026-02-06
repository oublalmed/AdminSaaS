export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'ACCOUNTANT';
}

export interface Tenant {
  id: string;
  name: string;
  ice?: string;
  rc?: string;
  currency: string;
  tvaRate: number;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  token: string;
}

export interface Client {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  cin?: string;
  ice?: string;
  rc?: string;
  taxId?: string;
  isVerified: boolean;
  riskScore: number;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate?: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  total: number;
  currency: string;
  notes?: string;
  items: InvoiceItem[];
  aiGenerated: boolean;
  client: Client;
  paidAt?: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  number: string;
  date: string;
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  total: number;
  currency: string;
  notes?: string;
  items: InvoiceItem[];
  aiGenerated: boolean;
  client: Client;
  createdAt: string;
}

export interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  type: 'INVOICE' | 'QUOTE' | 'CONTRACT' | 'ID_DOCUMENT' | 'OTHER';
  ocrText?: string;
  ocrData?: any;
  isProcessed: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  message: string;
  scheduledAt: string;
  sentAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  aiGenerated: boolean;
  client: Client;
  invoice?: Invoice;
  createdAt: string;
}

export interface DashboardData {
  summary: {
    totalRevenue: number;
    totalOverdue: number;
    totalInvoices: number;
    paidCount: number;
    overdueCount: number;
    draftCount: number;
    totalQuotes: number;
    acceptedQuotes: number;
    totalClients: number;
    atRiskClients: number;
  };
  monthly: {
    revenue: number;
    total: number;
    invoiceCount: number;
  };
  cashflow: Array<{ month: string; total: number; paid: number }>;
  clientsAtRisk: Array<{ name: string; amount: number }>;
}
