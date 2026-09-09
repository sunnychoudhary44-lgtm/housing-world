import { Lead, LeadStatus, LeadSource, WhatsAppTemplate } from '../types';

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

export const TEAM_MEMBERS: string[] = [
  'Vishal',
  'JP Gupta',
  'Yashpal Ji',
  'Sanjay Ji',
  'Rahul',
];

export const TEAM_TARGETS: Record<string, number> = {
  Vishal: 50,
  'JP Gupta': 50,
  'Yashpal Ji': 60,
  'Sanjay Ji': 100,
  Rahul: 50,
};

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

export const INITIAL_LEADS: Lead[] = [
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
