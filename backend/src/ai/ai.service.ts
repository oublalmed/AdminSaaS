import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;
  private isConfigured = false;

  onModuleInit() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'sk-your-openai-api-key') {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
      this.logger.log('OpenAI API configured successfully');
    } else {
      this.logger.warn(
        'OPENAI_API_KEY not set - AI features will return mock data',
      );
    }
  }

  private safeJsonParse<T>(content: string, fallback: T): T {
    try {
      return JSON.parse(content);
    } catch {
      this.logger.warn('Failed to parse AI JSON response, using fallback');
      return fallback;
    }
  }

  async generateInvoice(params: GenerateInvoiceParams): Promise<GeneratedInvoice> {
    if (!this.isConfigured) {
      return {
        items: [
          { description: `Service: ${params.description}`, quantity: 1, unitPrice: 1000 },
        ],
        notes: `Facture generee automatiquement pour ${params.clientName}`,
      };
    }

    const prompt = `Tu es un assistant comptable pour une entreprise au Maroc.
Genere une facture structuree en JSON pour le client "${params.clientName}".

Description du travail: ${params.description}
Devise: ${params.currency}
Taux TVA: ${params.tvaRate}%
Langue: ${params.language === 'fr' ? 'Francais' : params.language === 'ar' ? 'Arabe' : 'English'}

Retourne un JSON valide avec cette structure exacte:
{
  "items": [
    {"description": "Description du service/produit", "quantity": 1, "unitPrice": 1000}
  ],
  "notes": "Notes de la facture"
}

Les prix doivent etre en ${params.currency} et realistes pour le marche marocain/africain.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return this.safeJsonParse<GeneratedInvoice>(
      response.choices[0].message.content,
      {
        items: [{ description: params.description, quantity: 1, unitPrice: 1000 }],
        notes: 'Facture generee par IA',
      },
    );
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
    if (!this.isConfigured) {
      return `Bonjour ${params.clientName}, nous vous rappelons que la facture ${params.invoiceNumber} d'un montant de ${params.amount} ${params.currency} est en attente depuis le ${params.dueDate}. Merci de regulariser dans les meilleurs delais. Cordialement.`;
    }

    const prompt = `Tu es un assistant administratif pour une entreprise au Maroc.
Redige un message de relance ${params.channel === 'EMAIL' ? 'email' : params.channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} pour:
- Client: ${params.clientName}
- Facture N: ${params.invoiceNumber}
- Montant: ${params.amount} ${params.currency}
- Date d'echeance: ${params.dueDate}
- Jours de retard: ${params.daysOverdue}

Le message doit etre professionnel, courtois et adapte au contexte business marocain/africain.
${params.channel === 'SMS' ? 'Maximum 160 caracteres.' : ''}
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
    if (!this.isConfigured) {
      return { type: 'OTHER', data: {}, confidence: 0 };
    }

    const prompt = `Tu es un assistant qui analyse des documents administratifs marocains/africains.
Analyse le texte OCR suivant et extrais les donnees structurees en JSON:

${ocrText.substring(0, 3000)}

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

    return this.safeJsonParse(response.choices[0].message.content, {
      type: 'OTHER',
      data: {},
      confidence: 0,
    });
  }

  async chat(message: string, context?: string): Promise<string> {
    if (!this.isConfigured) {
      return "L'assistant IA n'est pas configure. Veuillez ajouter votre cle API OpenAI dans les variables d'environnement (OPENAI_API_KEY).";
    }

    const systemPrompt = `Tu es un assistant administratif et financier IA pour les PME au Maroc et en Afrique francophone.
Tu aides avec:
- La facturation et les devis
- La gestion des clients et le KYC
- Les relances de paiement
- L'analyse financiere
- La conformite reglementaire (ICE, RC, CIN, TVA)

${context ? `Contexte actuel:\n${context}` : ''}

Reponds de maniere concise et professionnelle en francais.`;

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
