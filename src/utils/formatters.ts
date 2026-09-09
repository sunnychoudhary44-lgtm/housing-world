import { Lead } from '../types';

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
