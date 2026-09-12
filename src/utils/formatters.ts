import { Lead, CallLog } from '../types';

export function fmt(v?: string): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function fmtDateOnly(v?: string): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function cleanMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

export function openWhatsApp(mobile: string, text?: string): void {
  const digits = cleanMobile(mobile);
  const encodedText = text ? encodeURIComponent(text) : '';
  const url = `https://wa.me/91${digits}${encodedText ? `?text=${encodedText}` : ''}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function makePhoneCall(mobile: string): void {
  const digits = cleanMobile(mobile);
  window.location.href = `tel:+91${digits}`;
}

export function parseGaj(sizeStr?: string): number {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function parseAmount(str?: string | number): number {
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  if (!str) return 0;
  const clean = str.toString().replace(/,/g, '').trim().toLowerCase();
  const crMatch = clean.match(/([\d.]+)\s*(cr|crore)/);
  if (crMatch) return parseFloat(crMatch[1]) * 10000000;
  const lakhMatch = clean.match(/([\d.]+)\s*(lakh|lac|l)/);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;
  const numMatch = clean.match(/\d+/);
  return numMatch ? parseInt(numMatch[0], 10) : 0;
}

export function formatINR(amount: number, compact = false): string {
  if (isNaN(amount) || amount === 0) return '₹0';
  if (compact) {
    if (amount >= 10000000) {
      const cr = amount / 10000000;
      return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Cr`;
    }
    if (amount >= 100000) {
      const l = amount / 100000;
      return `₹${l.toFixed(l % 1 === 0 ? 0 : 1)} Lakh`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}k`;
    }
  }
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l.toFixed(2).replace(/\.00$/, '')} Lakh`;
  }
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function getLeadPaymentReceived(lead: Lead): number {
  if (typeof lead.paymentReceived === 'number' && !isNaN(lead.paymentReceived)) {
    return lead.paymentReceived;
  }
  // Check if remarks mention token or payment
  if (lead.remarks) {
    const tokenMatch = lead.remarks.match(/₹?\s*([\d,]+)\s*(?:received|token|advance|paid)/i);
    if (tokenMatch) {
      const parsed = parseInt(tokenMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  // If status is Closed, default to budget / total deal value
  if (lead.status === 'Closed') {
    return lead.totalDealValue || parseAmount(lead.budget) || 1500000;
  }
  // If status is Booking, default token payment
  if (lead.status === 'Booking') {
    const budgetVal = parseAmount(lead.budget);
    return budgetVal > 0 ? Math.min(Math.round(budgetVal * 0.1), 100000) : 51000;
  }
  return 0;
}

export type FollowupTiming = 'overdue' | 'today' | 'upcoming' | 'none';

export function getFollowupTiming(followupStr?: string, status?: string): FollowupTiming {
  if (!followupStr) return 'none';
  if (status && ['Booking', 'Closed', 'Lost'].includes(status)) return 'none';

  const d = new Date(followupStr);
  if (isNaN(d.getTime())) return 'none';

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const targetDayStr = d.toISOString().slice(0, 10);

  if (d < now && targetDayStr !== todayStr) {
    return 'overdue';
  } else if (targetDayStr === todayStr) {
    if (d < now) {
      return 'overdue';
    }
    return 'today';
  } else if (d > now) {
    return 'upcoming';
  }
  return 'none';
}

export function exportLeadsToCSV(leads: Lead[]): void {
  const headers = [
    'ID',
    'Name',
    'Mobile',
    'Project',
    'Source',
    'Budget',
    'Size (Gaj)',
    'Status',
    'Salesperson',
    'Priority',
    'Follow-up Date',
    'Remarks',
  ];

  const rows = leads.map((l) => [
    l.id,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${l.mobile || ''}"`,
    `"${(l.project || '').replace(/"/g, '""')}"`,
    `"${l.source || ''}"`,
    `"${(l.budget || '').replace(/"/g, '""')}"`,
    `"${(l.size || '').replace(/"/g, '""')}"`,
    `"${l.status || ''}"`,
    `"${(l.salesperson || '').replace(/"/g, '""')}"`,
    `"${l.priority || ''}"`,
    `"${l.followup || ''}"`,
    `"${(l.remarks || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `housing_worlds_leads_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatCallDuration(seconds: number): string {
  if (seconds <= 0) return '0s (No Ans)';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export function exportCallsToCSV(calls: CallLog[]): void {
  const headers = [
    'Call ID',
    'Date & Time',
    'Customer Name',
    'Mobile',
    'Salesperson',
    'Project',
    'Call Type',
    'Outcome',
    'Duration (sec)',
    'Duration Formatted',
    'Notes / Remarks',
  ];

  const rows = calls.map((c) => [
    `"${c.id}"`,
    `"${fmt(c.timestamp)}"`,
    `"${(c.leadName || '').replace(/"/g, '""')}"`,
    `"${c.mobile || ''}"`,
    `"${(c.salesperson || '').replace(/"/g, '""')}"`,
    `"${(c.project || '').replace(/"/g, '""')}"`,
    `"${c.callType || ''}"`,
    `"${(c.outcome || '').replace(/"/g, '""')}"`,
    c.durationSeconds,
    `"${formatCallDuration(c.durationSeconds)}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `housing_worlds_call_tracker_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
