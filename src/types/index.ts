export interface Company {
  id: string;
  name: string;
  nit: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  backgroundUrl?: string;
  backgroundColor?: string;
  elements: CertificateElement[];
}

export interface CertificateElement {
  id: string;
  type: 'text' | 'image';
  content: string;
  position: { x: number; y: number };
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    lineHeight?: number;
    letterSpacing?: number;
  };
  size: { width: number, height: number };
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'email' | 'url';
  required: boolean;
  defaultValue?: string;
  validation?: string;
  description?: string;
}

export interface Certificate {
  id: string;
  templateId: string;
  recipientName: string;
  data: Record<string, any>;
  generatedAt: Date;
  validationCode: string;
  status: 'generated' | 'sent' | 'verified';
  downloadUrl?: string;
}

export interface APIEndpoint {
  id: string;
  templateId: string;
  endpoint: string;
  method: 'POST' | 'PUT';
  isActive: boolean;
  authRequired: boolean;
  apiKey?: string;
  webhookUrl?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalCertificates: number;
  activeCertificates: number;
  templatesCount: number;
  verificationRequests: number;
  certificatesThisMonth: number;
  verificationsThisMonth: number;
}