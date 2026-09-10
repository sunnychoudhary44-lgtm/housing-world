export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  username?: string;
  password?: string;
  designation?: string;
  avatarColor?: string;
}

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

export type ActivePage =
  | 'dashboard'
  | 'leads'
  | 'add'
  | 'followups'
  | 'calls'
  | 'team'
  | 'reports';

export type CallType = 'Outgoing' | 'Incoming' | 'Follow-up';

export type CallOutcome =
  | 'Connected - Interested'
  | 'Connected - Site Visit Scheduled'
  | 'Connected - Callback Requested'
  | 'Connected - Not Interested'
  | 'Not Connected - Ringing'
  | 'Not Connected - Busy'
  | 'Not Connected - Switched Off'
  | 'Invalid Number';

export interface CallLog {
  id: string;
  leadId?: number;
  leadName: string;
  mobile: string;
  salesperson: string;
  project?: string;
  callType: CallType;
  outcome: CallOutcome;
  durationSeconds: number; // Duration in seconds
  timestamp: string; // ISO datetime
  notes: string;
  rescheduledFollowup?: string;
  updatedLeadStatus?: LeadStatus;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  labelHindi: string;
  message: string;
}
