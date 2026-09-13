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
  createdAt?: string;
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
  | '99acres'
  | 'MagicBricks'
  | 'Housing.com'
  | 'Facebook'
  | 'Instagram'
  | 'WhatsApp'
  | 'Google'
  | 'Referral'
  | 'Walk-in'
  | 'Channel Partner'
  | 'Broker'
  | 'Other';

export type LeadPriority = 'Normal' | 'Hot' | 'High';

export interface Lead {
  id: number;
  name: string;
  mobile: string;
  project: string;
  projectId?: string;
  developerName?: string;
  developerId?: string;
  brokerName?: string;
  brokerId?: string;
  channelPartnerSourced?: boolean;
  unitBooked?: string;
  source: LeadSource;
  budget: string;
  size: string; // e.g., "100 Gaj", "150 Gaj", "3 BHK (1850 sq.ft)"
  status: LeadStatus;
  salesperson: string;
  followup: string; // ISO datetime string or YYYY-MM-DDTHH:mm
  priority: LeadPriority;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
  paymentReceived?: number; // Advance token, down payment or full payment in Rupees
  totalDealValue?: number; // Total deal value agreed in Rupees
}

export interface Developer {
  id: string;
  name: string;
  brandName?: string;
  reraNumber?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  headOffice: string;
  gstin?: string;
  status: 'Active' | 'Under Review' | 'Inactive';
  mandateType: 'Exclusive Mandate' | 'Preferred Partner' | 'Open Brokerage';
  commissionTerms?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ProjectType =
  | 'Residential High-Rise'
  | 'Luxury Floors'
  | 'Plotted Development'
  | 'Commercial / Retail'
  | 'Villas / Farmhouse';

export type ProjectStage =
  | 'Pre-Launch'
  | 'Under Construction'
  | 'Near Possession'
  | 'Ready to Move';

export interface Project {
  id: string;
  name: string;
  developerId: string;
  developerName: string;
  location: string;
  city: string;
  reraNumber?: string;
  projectType: ProjectType;
  stage: ProjectStage;
  landArea?: string;
  totalUnits: number;
  availableUnits: number;
  blockedUnits: number;
  soldUnits: number;
  startingPrice: number; // e.g. 8500000 = ₹85 Lakhs
  bspPerSqFt: number; // Base selling price
  configurations: string[];
  amenities: string[];
  paymentPlans: string[];
  possessionDate?: string;
  brochureUrl?: string;
  googleMapsUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export type UnitStatus = 'Available' | 'Blocked' | 'Booked';

export interface ProjectUnit {
  id: string;
  projectId: string;
  projectName: string;
  unitNumber: string; // e.g. "Tower A - 402" or "Plot 12"
  towerOrBlock: string;
  floor?: number;
  unitType: string; // "3 BHK Luxury", "150 Gaj"
  sizeSqFtOrGaj: string;
  facing: 'Park Facing' | 'Road Facing' | 'Corner / East' | 'Club Facing' | 'Standard';
  basePrice: number;
  status: UnitStatus;
  bookedByLeadId?: number;
  bookedByLeadName?: string;
  bookedByBrokerName?: string;
  remarks?: string;
  updatedAt?: string;
}

export type BrokerTier = 'Platinum CP' | 'Gold CP' | 'Silver CP' | 'Standard';

export interface BrokerBankDetails {
  accountNumber: string;
  ifsc: string;
  bankName?: string;
}

export interface Broker {
  id: string;
  name?: string;
  firmName: string;
  mobile?: string;
  phone?: string;
  contactPerson?: string;
  email?: string;
  reraNumber?: string;
  reraBrokerId?: string;
  tier: BrokerTier;
  city: string;
  operatingAreas?: string[];
  commissionRatePercent?: number; // e.g. 2.5%
  agreedCommissionPercent?: number;
  status: 'Verified' | 'Pending Verification' | 'Blocked';
  totalLeadsSourced: number;
  totalSiteVisitsDriven?: number;
  totalBookingsClosed?: number;
  totalDealsClosed?: number;
  totalBrokerageEarned: number; // in INR
  totalBrokeragePaid: number; // in INR
  pendingBrokerage?: number;
  bankAccountDetails?: string;
  bankDetails?: BrokerBankDetails | string;
  panNumber?: string;
  gstin?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BrokerPayout {
  id: string;
  brokerId: string;
  brokerName: string;
  amount: number;
  paymentMode?: 'NEFT/RTGS' | 'Cheque' | 'UPI' | 'Cash';
  referenceNo?: string;
  date?: string;
  notes?: string;
  leadId?: number;
  leadName?: string;
  projectName?: string;
  unitNumber?: string;
  dealValue?: number;
  commissionRate?: number;
  commissionAmount?: number;
  paidAmount?: number;
  status?: 'Pending' | 'Approved' | 'Paid';
  paymentDate?: string;
  transactionRef?: string;
  remarks?: string;
}

export type SiteVisitStatus =
  | 'Scheduled'
  | 'Conducted'
  | 'Rescheduled'
  | 'Cancelled'
  | 'No Show';

export interface SiteVisit {
  id: string;
  leadId: number;
  leadName: string;
  leadMobile: string;
  projectId: string;
  projectName: string;
  developerName?: string;
  scheduledTime: string; // ISO datetime
  conductedTime?: string;
  salesExecutive: string;
  telecaller?: string;
  pickupRequired: boolean;
  pickupAddress?: string;
  cabAssigned?: string;
  status: SiteVisitStatus;
  feedbackCategory?:
    | 'Hot - Ready to Book'
    | 'Interested - Revisit with Family'
    | 'Liked Project - Budget Stretched'
    | 'Negotiating'
    | 'Not Interested - Location Issue'
    | 'Not Interested - Price High';
  feedbackNotes?: string;
  ratingStars?: number; // 1 to 5
  passCode?: string; // e.g. "SV-8492" for Site Visit Pass
  createdAt: string;
  updatedAt?: string;
}

export type PaymentPlanType =
  | 'Construction Linked Plan (CLP)'
  | 'Down Payment Plan (10:90)'
  | 'Possession Linked Plan (30:70)'
  | 'Flexi Milestone Plan';

export interface CostSheet {
  id: string;
  leadId?: number;
  leadName?: string;
  leadMobile?: string;
  projectId: string;
  projectName: string;
  developerName?: string;
  unitNumber: string;
  unitType?: string; // e.g. "3 BHK Luxury", "150 Gaj"
  superAreaSqFt: number;
  bspPerSqFt: number; // Base Selling Price
  basicCost: number; // superArea * bsp
  plcPerSqFt?: number; // Preferential Location Charge
  plcAmount?: number;
  floorRisePerSqFt?: number;
  floorRiseAmount?: number;
  carParkingCount?: number;
  carParkingCost?: number;
  clubMembershipCost?: number;
  edcIdcCost?: number; // External/Internal Development
  possessionCharges?: number;
  taxGstPercent: number; // 5% standard
  taxGstAmount: number;
  stampDutyPercent: number; // 6%
  stampDutyAmount: number;
  grandTotal: number;
  paymentPlan: PaymentPlanType;
  generatedBy: string;
  createdAt: string;
  notes?: string;
}

export interface SalesTarget {
  name: string;
  targetGaj: number;
  targetPayment: number; // Target collection/payment in Rupees (e.g. 2500000 = ₹25 Lakh)
}

export type ActivePage =
  | 'dashboard'
  | 'leads'
  | 'add'
  | 'tokens_agreements'
  | 'site_visits'
  | 'cost_sheets'
  | 'brokers'
  | 'calls'
  | 'followups'
  | 'team'
  | 'reports'
  | 'developers'
  | 'projects';

export type DealType = 'Token / Bayana' | 'Agreement (ATS/BBA)' | 'Token + Agreement' | 'Registry / Possession';

export type TokenAgreementStatus =
  | 'Token Received'
  | 'Cheque in Clearance'
  | 'Agreement Drafted'
  | 'Agreement Signed'
  | 'Registry Completed'
  | 'Cancelled & Refunded';

export type PaymentMethod =
  | 'Cheque'
  | 'NEFT / RTGS'
  | 'UPI / QR'
  | 'Bank Demand Draft'
  | 'Cash';

export interface TokenAgreement {
  id: string;
  receiptNumber: string; // e.g. "TK-2026-101"
  dealType: DealType;
  leadId?: number;
  clientName: string;
  clientMobile: string;
  clientEmail?: string;
  clientAddress?: string;
  projectName: string;
  projectId?: string;
  unitNumber: string; // e.g. "Flat 1402, Tower B" or "Plot #45"
  unitType?: string; // "3 BHK", "150 Gaj Plot", "Commercial Shop"
  totalDealValue: number; // Total Property Price in ₹
  tokenAmount: number; // Token or Agreement amount paid in ₹
  balanceDue: number; // Remaining balance amount in ₹
  paymentMode: PaymentMethod;
  transactionRef?: string; // Cheque No / UTR / Transaction ID
  bankName?: string;
  paymentDate: string; // YYYY-MM-DD
  agreementDate?: string; // YYYY-MM-DD
  executiveName: string; // Salesperson / Executive who closed the deal
  executiveMobile?: string;
  brokerName?: string; // Optional Channel Partner / Broker
  brokerCommission?: number; // Brokerage amount in ₹
  status: TokenAgreementStatus;
  termsAndNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

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
