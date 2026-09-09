export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up'
  | 'Site Visit'
  | 'Negotiation'
  | 'Booking'
  | 'Closed'
  | 'Lost';

export type LeadSource =
  | 'Facebook'
  | 'Instagram'
  | 'WhatsApp'
  | 'Google'
  | 'Referral'
  | 'Walk-in'
  | 'Other';

export type LeadPriority = 'Normal' | 'Hot' | 'High';

export interface Lead {
  id: number;
  name: string;
  mobile: string;
  project: string;
  source: LeadSource;
  budget: string;
  size: string; // e.g., "100 Gaj", "150 Gaj"
  status: LeadStatus;
  salesperson: string;
  followup: string; // ISO datetime string or YYYY-MM-DDTHH:mm
  priority: LeadPriority;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesTarget {
  name: string;
  targetGaj: number;
}

export type ActivePage = 'dashboard' | 'leads' | 'add' | 'followups' | 'team' | 'reports';

export interface WhatsAppTemplate {
  id: string;
  title: string;
  labelHindi: string;
  message: string;
}
