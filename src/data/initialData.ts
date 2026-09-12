import {
  Lead,
  LeadStatus,
  LeadSource,
  WhatsAppTemplate,
  CallLog,
  CallOutcome,
  CallType,
  AuthUser,
} from '../types';

export const STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Follow-up',
  'Site Visit',
  'Negotiation',
  'Booking',
  'Closed',
  'Lost',
];

export const SOURCES: LeadSource[] = [
  'Facebook',
  'Instagram',
  'WhatsApp',
  'Google',
  'Referral',
  'Walk-in',
  'Other',
];

export const TEAM_MEMBERS: string[] = [];

export const DEFAULT_USERS: AuthUser[] = [
  {
    id: 'user-admin-1',
    name: 'Sunny Choudhary',
    mobile: '9876500000',
    username: 'admin',
    password: 'password123',
    role: 'admin',
    designation: 'Director / Administrator',
    avatarColor: 'bg-amber-500',
  },
];

export const TEAM_TARGETS: Record<string, number> = {};

// Monthly Payment / Collection targets in Rupees (₹)
export const TEAM_PAYMENT_TARGETS: Record<string, number> = {};

export const COMMON_PROJECTS = [
  'Nekpur',
  'Gounchi',
  'Govardhan Enclave',
  'Palwal Highway Plots',
  'Green Valley Township',
  'Shri Krishna Dham',
];

export const COMMON_SIZES = [
  '50 Gaj',
  '60 Gaj',
  '80 Gaj',
  '100 Gaj',
  '150 Gaj',
  '200 Gaj',
  '250 Gaj',
  '500 Gaj',
];

export const COMMON_BUDGETS = [
  '₹5,00,000 - ₹8,00,000',
  '₹8,00,000 - ₹12,00,000',
  '₹12,00,000 - ₹18,00,000',
  '₹20,00,000 - ₹30,00,000',
  '₹30,00,000+',
];

// Helper to get relative ISO string
function getOffsetISO(hoursOffset: number): string {
  const d = new Date(Date.now() + hoursOffset * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

// Clean slate for production use: INITIAL_LEADS starts completely empty
export const INITIAL_LEADS: Lead[] = [];

export const SAMPLE_DEMO_LEADS: Lead[] = [
  {
    id: 101,
    name: 'Rameshwar Sharma',
    mobile: '9871234567',
    project: 'Nekpur',
    source: 'Facebook',
    budget: '₹12,50,000',
    size: '100 Gaj',
    status: 'Interested',
    salesperson: 'Vishal',
    followup: getOffsetISO(2), // Today upcoming
    priority: 'Hot',
    remarks: 'Corner plot requirement. Family ke saath site visit karni hai iss Sunday.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 102,
    name: 'Amitabh Verma',
    mobile: '9810987654',
    project: 'Govardhan Enclave',
    source: 'Google',
    budget: '₹18,00,000',
    size: '150 Gaj',
    status: 'Site Visit',
    salesperson: 'Sanjay Ji',
    followup: getOffsetISO(6), // Today upcoming
    priority: 'Hot',
    remarks: 'Site visit scheduled for afternoon 3 PM. Registry details maangi hain.',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 103,
    name: 'Pooja Choudhary',
    mobile: '9958112233',
    project: 'Gounchi',
    source: 'Instagram',
    budget: '₹8,50,000',
    size: '80 Gaj',
    status: 'Follow-up',
    salesperson: 'JP Gupta',
    followup: getOffsetISO(-5), // Overdue
    priority: 'High',
    remarks: 'Loan process aur installment plan samajhna chahte hain. Overdue call pending.',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 104,
    name: 'Sunil Tanwar',
    mobile: '9818554433',
    project: 'Nekpur',
    source: 'Walk-in',
    budget: '₹15,00,000',
    size: '120 Gaj',
    status: 'Booking',
    salesperson: 'Yashpal Ji',
    followup: getOffsetISO(24),
    priority: 'Hot',
    remarks: 'Token amount ₹51,000 received. Registry date finalize karni hai.',
    paymentReceived: 51000,
    totalDealValue: 1500000,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 105,
    name: 'Vikas Kumar',
    mobile: '9312009988',
    project: 'Palwal Highway Plots',
    source: 'WhatsApp',
    budget: '₹6,50,000',
    size: '60 Gaj',
    status: 'New',
    salesperson: 'Rahul',
    followup: getOffsetISO(1),
    priority: 'Normal',
    remarks: 'Brochure aur location pin share ki hai. Introductory call karni hai.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 106,
    name: 'Harpal Singh',
    mobile: '9873445566',
    project: 'Govardhan Enclave',
    source: 'Referral',
    budget: '₹25,00,000',
    size: '200 Gaj',
    status: 'Closed',
    salesperson: 'Sanjay Ji',
    followup: '',
    priority: 'Normal',
    remarks: 'Full payment received and registry done. Referral lead.',
    paymentReceived: 2500000,
    totalDealValue: 2500000,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 107,
    name: 'Dinesh Yadav',
    mobile: '9811223344',
    project: 'Gounchi',
    source: 'Facebook',
    budget: '₹11,00,000',
    size: '100 Gaj',
    status: 'Negotiation',
    salesperson: 'Vishal',
    followup: getOffsetISO(30),
    priority: 'High',
    remarks: 'Discount per gaj discuss hua hai. Management approval pending.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 108,
    name: 'Neeraj Bhati',
    mobile: '9910334455',
    project: 'Nekpur',
    source: 'Walk-in',
    budget: '₹9,00,000',
    size: '80 Gaj',
    status: 'Lost',
    salesperson: 'JP Gupta',
    followup: '',
    priority: 'Normal',
    remarks: 'Budget mismatch. Customer looking for far away location.',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'intro',
    title: 'Introductory Greeting',
    labelHindi: 'शुरुआती परिचय और ब्रोशर',
    message:
      'नमस्ते {name} जी,\n\nमैं Housing Worlds से {salesperson} बोल रहा हूँ। आपके द्वारा {project} प्रोजेक्ट में प्लॉट के बारे में जानकारी चाही गई थी।\n\nहमारे पास 50 गज से 200 गज तक के प्राइम लोकेशन प्लॉट्स उपलब्ध हैं, जिसमें 30 फीट चौड़ी सड़कें, बिजली-पानी और तुरंत रजिस्ट्री-दाखिल खारिज की सुविधा है।\n\nक्या मैं आपको प्रोजेक्ट का ब्रोशर और लोकेशन शेयर करूँ?',
  },
  {
    id: 'site_visit',
    title: 'Site Visit Invitation',
    labelHindi: 'साइट विज़िट का निमंत्रण (मुफ्त पिक-अप)',
    message:
      'नमस्ते {name} जी,\n\nHousing Worlds की ओर से सादर प्रणाम। आपके लिए {project} में चुनिंदा प्राइम प्लॉट्स (जैसे {size}) होल्ड किए गए हैं।\n\nकल या परसों में हम आपके लिए फ्री साइट विज़िट और गाड़ी की सुविधा कर रहे हैं। क्या आप कल सुबह 11:00 बजे या दोपहर 3:00 बजे उपलब्ध हैं?',
  },
  {
    id: 'followup_reminder',
    title: 'Follow-up Check-in',
    labelHindi: 'फॉलो-अप और जानकारी अपडेट',
    message:
      'नमस्ते {name} जी,\n\nउम्मीद है आप सकुशल होंगे। हमारी पिछली बातचीत के संदर्भ में {project} के प्लॉट्स के बारे में अपडेट देना था। सीमित प्लॉट्स शेष हैं।\n\nयदि आपके कोई सवाल या बजट संबंधी चर्चा हो तो कृपया बताएं, हम बेस्ट डील दिलाएंगे।',
  },
  {
    id: 'booking_offer',
    title: 'Special Token & Booking Deal',
    labelHindi: 'सीमित ऑफर और बुकिंग डिस्काउंट',
    message:
      'नमस्ते {name} जी,\n\nHousing Worlds आपके लिए लेकर आया है {project} में खास डिस्काउंट ऑफर! सिर्फ ₹21,000/₹51,000 टोकन देकर आप अपना मनपसंद प्लॉट बुक करा सकते हैं, बाकी आसान किस्तों में।\n\nकृपया आज ही संपर्क करें ताकि बेस्ट कॉर्नर या फ्रंट प्लॉट मिल सके।\n\nधन्यवाद,\n{salesperson} - Housing Worlds',
  },
];

export interface CallOutcomeConfig {
  value: CallOutcome;
  category: 'connected' | 'not_connected' | 'invalid';
  badgeBg: string;
  badgeText: string;
  border: string;
}

export const CALL_OUTCOMES: CallOutcomeConfig[] = [
  {
    value: 'Connected - Site Visit Scheduled',
    category: 'connected',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700 font-bold',
    border: 'border-purple-200',
  },
  {
    value: 'Connected - Interested',
    category: 'connected',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 font-bold',
    border: 'border-emerald-200',
  },
  {
    value: 'Connected - Callback Requested',
    category: 'connected',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700 font-bold',
    border: 'border-blue-200',
  },
  {
    value: 'Connected - Not Interested',
    category: 'connected',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700 font-medium',
    border: 'border-slate-200',
  },
  {
    value: 'Not Connected - Ringing',
    category: 'not_connected',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700 font-medium',
    border: 'border-amber-200',
  },
  {
    value: 'Not Connected - Busy',
    category: 'not_connected',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700 font-medium',
    border: 'border-orange-200',
  },
  {
    value: 'Not Connected - Switched Off',
    category: 'not_connected',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700 font-medium',
    border: 'border-rose-200',
  },
  {
    value: 'Invalid Number',
    category: 'invalid',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800 font-medium',
    border: 'border-red-300',
  },
];

// Helper to construct timestamps
function getRecentCallTime(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

// Clean slate for production use: INITIAL_CALLS starts completely empty
export const INITIAL_CALLS: CallLog[] = [];

export const SAMPLE_DEMO_CALLS: CallLog[] = [
  {
    id: 'call-1',
    leadId: 101,
    leadName: 'Rameshwar Sharma',
    mobile: '9871234567',
    salesperson: 'Vishal',
    project: 'Nekpur',
    callType: 'Follow-up',
    outcome: 'Connected - Site Visit Scheduled',
    durationSeconds: 245,
    timestamp: getRecentCallTime(35),
    notes: 'Customer confirmed for Sunday 11:00 AM site visit with family for 100 Gaj plot. Asked for pickup from Ballabhgarh metro.',
    rescheduledFollowup: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16),
    updatedLeadStatus: 'Site Visit',
  },
  {
    id: 'call-2',
    leadId: 102,
    leadName: 'Amitabh Verma',
    mobile: '9810987654',
    salesperson: 'Sanjay Ji',
    project: 'Govardhan Enclave',
    callType: 'Follow-up',
    outcome: 'Connected - Interested',
    durationSeconds: 180,
    timestamp: getRecentCallTime(75),
    notes: 'Wants layout copy of Govardhan Enclave sent on WhatsApp. Budget ₹18 Lakhs approved by his brother.',
    rescheduledFollowup: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
  },
  {
    id: 'call-3',
    leadId: 103,
    leadName: 'Deepak Raghav',
    mobile: '9711223344',
    salesperson: 'Vishal',
    project: 'Gounchi',
    callType: 'Follow-up',
    outcome: 'Not Connected - Ringing',
    durationSeconds: 0,
    timestamp: getRecentCallTime(110),
    notes: 'Rang full duration, no response. Sent WhatsApp follow-up reminder with project brochure.',
  },
  {
    id: 'call-4',
    leadId: 104,
    leadName: 'Smt. Kamlesh Devi',
    mobile: '9999887766',
    salesperson: 'JP Gupta',
    project: 'Nekpur',
    callType: 'Outgoing',
    outcome: 'Connected - Site Visit Scheduled',
    durationSeconds: 310,
    timestamp: getRecentCallTime(160),
    notes: 'Daughter in law will accompany. Confirmed Saturday 2:00 PM for 60 Gaj plot. JP Gupta ji will guide on location.',
    updatedLeadStatus: 'Site Visit',
  },
  {
    id: 'call-5',
    leadId: 105,
    leadName: 'Harish Rawat',
    mobile: '9811445566',
    salesperson: 'Yashpal Ji',
    project: 'Palwal Highway Plots',
    callType: 'Outgoing',
    outcome: 'Connected - Callback Requested',
    durationSeconds: 90,
    timestamp: getRecentCallTime(220),
    notes: 'Currently in meeting at office. Requested to call back today evening around 6:30 PM.',
    rescheduledFollowup: new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 16),
  },
  {
    id: 'call-6',
    leadId: 106,
    leadName: 'Sunil Bhati',
    mobile: '9873001122',
    salesperson: 'JP Gupta',
    project: 'Gounchi',
    callType: 'Outgoing',
    outcome: 'Not Connected - Busy',
    durationSeconds: 0,
    timestamp: getRecentCallTime(290),
    notes: 'Line busy. Dropped standard SMS & WhatsApp text.',
  },
  {
    id: 'call-7',
    leadId: 107,
    leadName: 'Pooja Choudhary',
    mobile: '9312009988',
    salesperson: 'Rahul',
    project: 'Govardhan Enclave',
    callType: 'Outgoing',
    outcome: 'Connected - Interested',
    durationSeconds: 155,
    timestamp: getRecentCallTime(340),
    notes: 'Inquired about registry process and bank loan feasibility for Govardhan Enclave plot.',
  },
  {
    id: 'call-8',
    leadId: 109,
    leadName: 'Dharmendra Yadav',
    mobile: '9818776655',
    salesperson: 'Vishal',
    project: 'Palwal Highway Plots',
    callType: 'Follow-up',
    outcome: 'Connected - Site Visit Scheduled',
    durationSeconds: 420,
    timestamp: getRecentCallTime(420),
    notes: 'Token booking discussion. Agreed to inspect 250 Gaj commercial frontage plot tomorrow morning at 10 AM.',
    updatedLeadStatus: 'Site Visit',
  },
  {
    id: 'call-9',
    leadId: 108,
    leadName: 'Vikram Chauhan',
    mobile: '9899112233',
    salesperson: 'Sanjay Ji',
    project: 'Nekpur',
    callType: 'Follow-up',
    outcome: 'Not Connected - Switched Off',
    durationSeconds: 0,
    timestamp: getRecentCallTime(540),
    notes: 'Phone switched off. Will attempt again later in the afternoon.',
  },
  {
    id: 'call-10',
    leadName: 'Direct Walk-in Inquiry (Naresh)',
    mobile: '9810112233',
    salesperson: 'Yashpal Ji',
    project: 'Gounchi',
    callType: 'Incoming',
    outcome: 'Connected - Interested',
    durationSeconds: 210,
    timestamp: getRecentCallTime(720),
    notes: 'Saw banner at Gounchi turn. Inquired about 80 Gaj plot prices and possession timeline.',
  },
  {
    id: 'call-11',
    leadId: 110,
    leadName: 'Manoj Tiwari',
    mobile: '9910223344',
    salesperson: 'JP Gupta',
    project: 'Govardhan Enclave',
    callType: 'Follow-up',
    outcome: 'Connected - Callback Requested',
    durationSeconds: 75,
    timestamp: getRecentCallTime(1440), // Yesterday
    notes: 'Traveling out of station, will return on Monday. Remind on Monday 11:00 AM.',
  },
  {
    id: 'call-12',
    leadId: 111,
    leadName: 'Mohd. Imran',
    mobile: '9871998877',
    salesperson: 'Rahul',
    project: 'Green Valley Township',
    callType: 'Follow-up',
    outcome: 'Connected - Not Interested',
    durationSeconds: 110,
    timestamp: getRecentCallTime(1520), // Yesterday
    notes: 'Found property elsewhere near Faridabad. Marked inquiry as closed.',
  },
];
