import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

interface GenerateInvoiceParams {
  clientName: string;
  description: string;
  language: string;
  currency: string;
  tvaRate: number;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface GeneratedInvoice {
  items: InvoiceItem[];
  notes: string;
}

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateInvoice(params: GenerateInvoiceParams): Promise<GeneratedInvoice> {
    const prompt = `Tu es un assistant comptable pour une entreprise au Maroc.
Génère une facture structurée en JSON pour le client "${params.clientName}".

Description du travail: ${params.description}
Devise: ${params.currency}
Taux TVA: ${params.tvaRate}%
Langue: ${params.language === 'fr' ? 'Français' : params.language === 'ar' ? 'Arabe' : 'English'}

Retourne un JSON valide avec cette structure exacte:
{
  "items": [
    {"description": "Description du service/produit", "quantity": 1, "unitPrice": 1000}
  ],
  "notes": "Notes de la facture"
}

Les prix doivent être en ${params.currency} et réalistes pour le marché marocain/africain.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  }

  async generateReminderMessage(params: {
    clientName: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: string;
    daysOverdue: number;
    channel: string;
    language?: string;
  }): Promise<string> {
    const prompt = `Tu es un assistant administratif pour une entreprise au Maroc.
Rédige un message de relance ${params.channel === 'EMAIL' ? 'email' : params.channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} pour:
- Client: ${params.clientName}
- Facture N°: ${params.invoiceNumber}
- Montant: ${params.amount} ${params.currency}
- Date d'échéance: ${params.dueDate}
- Jours de retard: ${params.daysOverdue}

Le message doit être professionnel, courtois et adapté au contexte business marocain/africain.
${params.channel === 'SMS' ? 'Maximum 160 caractères.' : ''}
Langue: ${params.language || 'fr'}

Retourne uniquement le texte du message, sans guillemets ni formatage JSON.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    return response.choices[0].message.content;
  }

  async extractDocumentData(ocrText: string): Promise<any> {
    const prompt = `Tu es un assistant qui analyse des documents administratifs marocains/africains.
Analyse le texte OCR suivant et extrais les données structurées en JSON:

${ocrText}

Identifie et retourne:
{
  "type": "INVOICE|QUOTE|CONTRACT|ID_DOCUMENT|OTHER",
  "data": {
    "documentNumber": "",
    "date": "",
    "companyName": "",
    "ice": "",
    "rc": "",
    "cin": "",
    "totalAmount": null,
    "currency": "",
    "items": [],
    "otherFields": {}
  },
  "confidence": 0.0
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async chat(message: string, context?: string): Promise<string> {
    const systemPrompt = `Tu es un assistant administratif et financier IA pour les PME au Maroc et en Afrique francophone.
Tu aides avec:
- La facturation et les devis
- La gestion des clients et le KYC
- Les relances de paiement
- L'analyse financière
- La conformité réglementaire (ICE, RC, CIN, TVA)

${context ? `Contexte actuel:\n${context}` : ''}

Réponds de manière concise et professionnelle en français.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  }
}
