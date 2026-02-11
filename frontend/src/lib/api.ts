const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  }

  private async uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Upload failed');
    }
    return response.json();
  }

  // Auth
  register(data: any) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }); }
  login(data: { email: string; password: string }) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }); }
  getProfile() { return this.request('/auth/profile'); }
  switchTenant(tenantId: string) { return this.request('/auth/switch-tenant', { method: 'POST', body: JSON.stringify({ tenantId }) }); }

  // Tenants (Fiduciary)
  getAccessibleTenants() { return this.request('/tenants'); }
  getChildTenants() { return this.request('/tenants/children'); }
  createManagedTenant(data: any) { return this.request('/tenants', { method: 'POST', body: JSON.stringify(data) }); }
  getConsolidatedDashboard() { return this.request('/tenants/consolidated'); }

  // Clients
  getClients(search?: string) { return this.request(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`); }
  getClient(id: string) { return this.request(`/clients/${id}`); }
  createClient(data: any) { return this.request('/clients', { method: 'POST', body: JSON.stringify(data) }); }
  updateClient(id: string, data: any) { return this.request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteClient(id: string) { return this.request(`/clients/${id}`, { method: 'DELETE' }); }

  // Invoices
  getInvoices(status?: string) { return this.request(`/invoices${status ? `?status=${status}` : ''}`); }
  getInvoice(id: string) { return this.request(`/invoices/${id}`); }
  createInvoice(data: any) { return this.request('/invoices', { method: 'POST', body: JSON.stringify(data) }); }
  updateInvoice(id: string, data: any) { return this.request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteInvoice(id: string) { return this.request(`/invoices/${id}`, { method: 'DELETE' }); }
  aiGenerateInvoice(data: any) { return this.request('/invoices/ai-generate', { method: 'POST', body: JSON.stringify(data) }); }
  createPaymentLink(invoiceId: string) { return this.request(`/invoices/${invoiceId}/payment-link`, { method: 'POST' }); }
  getPaymentLinks() { return this.request('/payment-links'); }

  // Export URLs (opened in new tab with auth)
  getExportUrl(format: 'csv' | 'fec', filters?: { startDate?: string; endDate?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return `${API_URL}/invoices/export/${format}${query}`;
  }

  // Quotes
  getQuotes(status?: string) { return this.request(`/quotes${status ? `?status=${status}` : ''}`); }
  createQuote(data: any) { return this.request('/quotes', { method: 'POST', body: JSON.stringify(data) }); }
  updateQuote(id: string, data: any) { return this.request(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteQuote(id: string) { return this.request(`/quotes/${id}`, { method: 'DELETE' }); }

  // Documents
  getDocuments(type?: string) { return this.request(`/documents${type ? `?type=${type}` : ''}`); }
  uploadDocument(file: File) { const fd = new FormData(); fd.append('file', file); return this.uploadRequest('/documents/upload', fd); }
  deleteDocument(id: string) { return this.request(`/documents/${id}`, { method: 'DELETE' }); }

  // Reminders
  getReminders(status?: string) { return this.request(`/reminders${status ? `?status=${status}` : ''}`); }
  createReminder(data: any) { return this.request('/reminders', { method: 'POST', body: JSON.stringify(data) }); }
  aiGenerateReminder(data: any) { return this.request('/reminders/ai-generate', { method: 'POST', body: JSON.stringify(data) }); }
  deleteReminder(id: string) { return this.request(`/reminders/${id}`, { method: 'DELETE' }); }

  // Dashboard
  getDashboard() { return this.request('/dashboard/finance'); }
  getAgingDashboard() { return this.request('/dashboard/aging'); }

  // Payment (public - no auth)
  getPaymentInfo(token: string) { return this.request(`/pay/${token}`); }
  confirmPayment(token: string, method: string, notes?: string) { return this.request(`/pay/${token}/confirm`, { method: 'POST', body: JSON.stringify({ method, notes }) }); }

  // AI Chat
  aiChat(message: string, context?: string) { return this.request<{ response: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message, context }) }); }
}

export const api = new ApiClient();
