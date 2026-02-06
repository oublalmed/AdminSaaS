const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

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

  private async uploadRequest<T>(
    endpoint: string,
    formData: FormData,
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  // Auth
  register(data: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  login(data: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getProfile() {
    return this.request('/auth/profile');
  }

  // Clients
  getClients(search?: string) {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/clients${params}`);
  }

  getClient(id: string) {
    return this.request(`/clients/${id}`);
  }

  createClient(data: any) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateClient(id: string, data: any) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteClient(id: string) {
    return this.request(`/clients/${id}`, { method: 'DELETE' });
  }

  // Invoices
  getInvoices(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/invoices${params}`);
  }

  getInvoice(id: string) {
    return this.request(`/invoices/${id}`);
  }

  createInvoice(data: any) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateInvoice(id: string, data: any) {
    return this.request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteInvoice(id: string) {
    return this.request(`/invoices/${id}`, { method: 'DELETE' });
  }

  aiGenerateInvoice(data: any) {
    return this.request('/invoices/ai-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Quotes
  getQuotes(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/quotes${params}`);
  }

  createQuote(data: any) {
    return this.request('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateQuote(id: string, data: any) {
    return this.request(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteQuote(id: string) {
    return this.request(`/quotes/${id}`, { method: 'DELETE' });
  }

  // Documents
  getDocuments(type?: string) {
    const params = type ? `?type=${type}` : '';
    return this.request(`/documents${params}`);
  }

  uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.uploadRequest('/documents/upload', formData);
  }

  deleteDocument(id: string) {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  }

  // Reminders
  getReminders(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/reminders${params}`);
  }

  createReminder(data: any) {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  aiGenerateReminder(data: any) {
    return this.request('/reminders/ai-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteReminder(id: string) {
    return this.request(`/reminders/${id}`, { method: 'DELETE' });
  }

  // Dashboard
  getDashboard() {
    return this.request('/dashboard/finance');
  }

  // AI Chat
  aiChat(message: string, context?: string) {
    return this.request<{ response: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }
}

export const api = new ApiClient();
