import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lead, CallLog } from '../types';

// Helper to remove undefined values before sending to Firestore
function cleanObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

const LEADS_COLLECTION = 'leads';
const CALLS_COLLECTION = 'calls';

/**
 * Listen for real-time updates to leads collection.
 */
export function subscribeToLeads(
  onData: (leads: Lead[]) => void,
  onError?: (error: Error) => void
) {
  const leadsRef = collection(db, LEADS_COLLECTION);
  return onSnapshot(
    leadsRef,
    (snapshot) => {
      const items: Lead[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Lead);
      });
      // Sort descending by ID or createdAt
      items.sort((a, b) => b.id - a.id);
      onData(items);
    },
    (err) => {
      console.error('Firestore leads subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Listen for real-time updates to calls collection.
 */
export function subscribeToCalls(
  onData: (calls: CallLog[]) => void,
  onError?: (error: Error) => void
) {
  const callsRef = collection(db, CALLS_COLLECTION);
  return onSnapshot(
    callsRef,
    (snapshot) => {
      const items: CallLog[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as CallLog);
      });
      // Sort descending by timestamp
      items.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      onData(items);
    },
    (err) => {
      console.error('Firestore calls subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a lead in Firestore.
 */
export async function saveLeadToCloud(lead: Lead): Promise<void> {
  const leadDocRef = doc(db, LEADS_COLLECTION, String(lead.id));
  await setDoc(leadDocRef, cleanObject(lead), { merge: true });
}

/**
 * Delete a lead from Firestore.
 */
export async function deleteLeadFromCloud(leadId: number): Promise<void> {
  const leadDocRef = doc(db, LEADS_COLLECTION, String(leadId));
  await deleteDoc(leadDocRef);
}

/**
 * Save or update a call log in Firestore.
 */
export async function saveCallToCloud(call: CallLog): Promise<void> {
  const callDocRef = doc(db, CALLS_COLLECTION, call.id);
  await setDoc(callDocRef, cleanObject(call), { merge: true });
}

/**
 * Delete a call log from Firestore.
 */
export async function deleteCallFromCloud(callId: string): Promise<void> {
  const callDocRef = doc(db, CALLS_COLLECTION, callId);
  await deleteDoc(callDocRef);
}

/**
 * Seed initial sample leads and calls if the database is brand new.
 */
export async function seedIfEmpty(
  initialLeads: Lead[],
  initialCalls: CallLog[]
): Promise<boolean> {
  try {
    const leadsRef = collection(db, LEADS_COLLECTION);
    const existingSnap = await getDocs(leadsRef);

    if (existingSnap.empty && initialLeads.length > 0) {
      console.log('Seeding initial leads to Firestore...');
      const batch = writeBatch(db);

      initialLeads.forEach((lead) => {
        const dRef = doc(db, LEADS_COLLECTION, String(lead.id));
        batch.set(dRef, cleanObject(lead));
      });

      initialCalls.forEach((call) => {
        const cRef = doc(db, CALLS_COLLECTION, call.id);
        batch.set(cRef, cleanObject(call));
      });

      await batch.commit();
      console.log('Initial CRM data successfully seeded to Firestore!');
      return true;
    }
  } catch (err) {
    console.error('Error during Firestore initial seed:', err);
  }
  return false;
}

/**
 * Re-seed / reset Firestore with sample data.
 */
export async function resetFirestoreWithDemo(
  initialLeads: Lead[],
  initialCalls: CallLog[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    initialLeads.forEach((lead) => {
      const dRef = doc(db, LEADS_COLLECTION, String(lead.id));
      batch.set(dRef, cleanObject(lead));
    });

    initialCalls.forEach((call) => {
      const cRef = doc(db, CALLS_COLLECTION, call.id);
      batch.set(cRef, cleanObject(call));
    });

    await batch.commit();
  } catch (err) {
    console.error('Error resetting Firestore demo data:', err);
    throw err;
  }
}
