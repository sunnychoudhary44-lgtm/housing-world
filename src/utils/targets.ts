import { TEAM_TARGETS, TEAM_PAYMENT_TARGETS } from '../data/initialData';

const STORAGE_KEY_GAJ = 'hw_crm_team_targets_gaj';
const STORAGE_KEY_PAYMENT = 'hw_crm_team_targets_payment';

export function getGajTargets(): Record<string, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GAJ);
    if (saved) {
      return { ...TEAM_TARGETS, ...JSON.parse(saved) };
    }
  } catch (_) {}
  return { ...TEAM_TARGETS };
}

export function saveGajTargets(targets: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_GAJ, JSON.stringify(targets));
    window.dispatchEvent(new CustomEvent('hw_targets_updated'));
  } catch (_) {}
}

export function getPaymentTargets(): Record<string, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PAYMENT);
    if (saved) {
      return { ...TEAM_PAYMENT_TARGETS, ...JSON.parse(saved) };
    }
  } catch (_) {}
  return { ...TEAM_PAYMENT_TARGETS };
}

export function savePaymentTargets(targets: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_PAYMENT, JSON.stringify(targets));
    window.dispatchEvent(new CustomEvent('hw_targets_updated'));
  } catch (_) {}
}
