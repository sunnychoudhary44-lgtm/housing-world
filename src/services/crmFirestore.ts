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
import {
  Lead,
  CallLog,
  AuthUser,
  Developer,
  Project,
  ProjectUnit,
  Broker,
  SiteVisit,
  CostSheet,
  TokenAgreement,
  Deal,
  CrmTask,
} from '../types';

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
const USERS_COLLECTION = 'users';
const DEVELOPERS_COLLECTION = 'developers';
const PROJECTS_COLLECTION = 'projects';
const BROKERS_COLLECTION = 'brokers';
const UNITS_COLLECTION = 'units';
const SITE_VISITS_COLLECTION = 'site_visits';
const COST_SHEETS_COLLECTION = 'cost_sheets';
const TOKENS_AGREEMENTS_COLLECTION = 'tokens_agreements';

/**
 * Listen for real-time updates to users collection.
 */
export function subscribeToUsers(
  onData: (users: AuthUser[]) => void,
  onError?: (error: Error) => void
) {
  const usersRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const items: AuthUser[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AuthUser);
      });
      // Sort by creation or name
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (err) => {
      console.error('Firestore users subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or register a new user in Firestore.
 */
export async function saveUserToCloud(user: AuthUser): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, String(user.id));
  await setDoc(userDocRef, cleanObject(user), { merge: true });
}

/**
 * Fetch all registered users once from Firestore.
 */
export async function getUsersFromCloud(): Promise<AuthUser[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(usersRef);
    const users: AuthUser[] = [];
    snap.forEach((docSnap) => {
      users.push(docSnap.data() as AuthUser);
    });
    return users;
  } catch (err) {
    console.error('Error fetching users from cloud:', err);
    return [];
  }
}

/**
 * Delete a user from Firestore.
 */
export async function deleteUserFromCloud(userId: string): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, String(userId));
  await deleteDoc(userDocRef);
}

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
 * Bulk save or update multiple leads in Firestore using batched writes.
 */
export async function bulkSaveLeadsToCloud(leads: Lead[]): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < leads.length; i += CHUNK_SIZE) {
    const chunk = leads.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((lead) => {
      const dRef = doc(db, LEADS_COLLECTION, String(lead.id));
      batch.set(dRef, cleanObject(lead), { merge: true });
    });
    await batch.commit();
  }
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
 * Clear all leads and calls from Firestore to provide a clean database for real usage.
 */
export async function clearAllDataFromCloud(): Promise<void> {
  try {
    const leadsRef = collection(db, LEADS_COLLECTION);
    const leadsSnap = await getDocs(leadsRef);
    if (!leadsSnap.empty) {
      const batch1 = writeBatch(db);
      leadsSnap.forEach((docSnap) => {
        batch1.delete(docSnap.ref);
      });
      await batch1.commit();
    }

    const callsRef = collection(db, CALLS_COLLECTION);
    const callsSnap = await getDocs(callsRef);
    if (!callsSnap.empty) {
      const batch2 = writeBatch(db);
      callsSnap.forEach((docSnap) => {
        batch2.delete(docSnap.ref);
      });
      await batch2.commit();
    }
  } catch (err) {
    console.error('Error clearing data from Firestore:', err);
    throw err;
  }
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

// ==========================================
// DEVELOPERS (BUILDERS / REAL ESTATE GROUPS)
// ==========================================

export function subscribeToDevelopers(
  onData: (devs: Developer[]) => void,
  onError?: (error: Error) => void
) {
  const ref = collection(db, DEVELOPERS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const items: Developer[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Developer);
      });
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (err) => {
      console.error('Firestore developers subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveDeveloperToCloud(dev: Developer): Promise<void> {
  const dRef = doc(db, DEVELOPERS_COLLECTION, dev.id);
  await setDoc(dRef, cleanObject(dev), { merge: true });
}

export async function deleteDeveloperFromCloud(devId: string): Promise<void> {
  const dRef = doc(db, DEVELOPERS_COLLECTION, devId);
  await deleteDoc(dRef);
}

// ==========================================
// PROJECTS & INVENTORY MASTER
// ==========================================

export function subscribeToProjects(
  onData: (projects: Project[]) => void,
  onError?: (error: Error) => void
) {
  const ref = collection(db, PROJECTS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Project);
      });
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (err) => {
      console.error('Firestore projects subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveProjectToCloud(proj: Project): Promise<void> {
  const pRef = doc(db, PROJECTS_COLLECTION, proj.id);
  await setDoc(pRef, cleanObject(proj), { merge: true });
}

export async function deleteProjectFromCloud(projId: string): Promise<void> {
  const pRef = doc(db, PROJECTS_COLLECTION, projId);
  await deleteDoc(pRef);
}

// ==========================================
// PROJECT UNITS (INVENTORY MATRIX)
// ==========================================

export function subscribeToUnits(
  onData: (units: ProjectUnit[]) => void,
  onError?: (error: Error) => void
) {
  const ref = collection(db, UNITS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const items: ProjectUnit[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ProjectUnit);
      });
      items.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));
      onData(items);
    },
    (err) => {
      console.error('Firestore units subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveUnitToCloud(unit: ProjectUnit): Promise<void> {
  const uRef = doc(db, UNITS_COLLECTION, unit.id);
  await setDoc(uRef, cleanObject(unit), { merge: true });
}

export async function deleteUnitFromCloud(unitId: string): Promise<void> {
  const uRef = doc(db, UNITS_COLLECTION, unitId);
  await deleteDoc(uRef);
}

// ==========================================
// BROKERS / CHANNEL PARTNERS (CP NETWORK)
// ==========================================

export function subscribeToBrokers(
  onData: (brokers: Broker[]) => void,
  onError?: (error: Error) => void
) {
  const ref = collection(db, BROKERS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const items: Broker[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Broker);
      });
      items.sort((a, b) => a.firmName.localeCompare(b.firmName));
      onData(items);
    },
    (err) => {
      console.error('Firestore brokers subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveBrokerToCloud(broker: Broker): Promise<void> {
  const bRef = doc(db, BROKERS_COLLECTION, broker.id);
  await setDoc(bRef, cleanObject(broker), { merge: true });
}

export async function deleteBrokerFromCloud(brokerId: string): Promise<void> {
  const bRef = doc(db, BROKERS_COLLECTION, brokerId);
  await deleteDoc(bRef);
}

/**
 * Seed initial real estate developers, projects, units, brokers, site visits, and cost sheets if Firestore is empty.
 */
export async function seedRealEstateIfEmpty(
  initialDevs: Developer[],
  initialProjs: Project[],
  initialUnits: ProjectUnit[],
  initialBrokers: Broker[],
  initialVisits?: SiteVisit[],
  initialSheets?: CostSheet[],
  initialTokens?: TokenAgreement[]
): Promise<void> {
  try {
    const devSnap = await getDocs(collection(db, DEVELOPERS_COLLECTION));
    if (devSnap.empty && initialDevs.length > 0) {
      console.log('Seeding initial Real Estate Developers & Projects to Firestore...');
      const batch = writeBatch(db);

      initialDevs.forEach((dev) => {
        const ref = doc(db, DEVELOPERS_COLLECTION, dev.id);
        batch.set(ref, cleanObject(dev));
      });

      initialProjs.forEach((proj) => {
        const ref = doc(db, PROJECTS_COLLECTION, proj.id);
        batch.set(ref, cleanObject(proj));
      });

      initialUnits.forEach((unit) => {
        const ref = doc(db, UNITS_COLLECTION, unit.id);
        batch.set(ref, cleanObject(unit));
      });

      initialBrokers.forEach((broker) => {
        const ref = doc(db, BROKERS_COLLECTION, broker.id);
        batch.set(ref, cleanObject(broker));
      });

      if (initialVisits && initialVisits.length > 0) {
        initialVisits.forEach((sv) => {
          const ref = doc(db, SITE_VISITS_COLLECTION, sv.id);
          batch.set(ref, cleanObject(sv));
        });
      }

      if (initialSheets && initialSheets.length > 0) {
        initialSheets.forEach((cs) => {
          const ref = doc(db, COST_SHEETS_COLLECTION, cs.id);
          batch.set(ref, cleanObject(cs));
        });
      }

      if (initialTokens && initialTokens.length > 0) {
        initialTokens.forEach((tk) => {
          const ref = doc(db, TOKENS_AGREEMENTS_COLLECTION, tk.id);
          batch.set(ref, cleanObject(tk));
        });
      }

      await batch.commit();
      console.log('Real Estate data seeded successfully!');
    }
  } catch (err) {
    console.error('Error seeding real estate data:', err);
  }
}

/**
 * Seed deals and tasks if they are empty in Firestore.
 */
export async function seedDealsAndTasksIfEmpty(
  initialDeals: Deal[],
  initialTasks: CrmTask[]
): Promise<void> {
  try {
    const dealsSnap = await getDocs(collection(db, DEALS_COLLECTION));
    if (dealsSnap.empty && initialDeals.length > 0) {
      const batch = writeBatch(db);
      initialDeals.forEach((deal) => {
        const ref = doc(db, DEALS_COLLECTION, deal.id);
        batch.set(ref, cleanObject(deal));
      });
      await batch.commit();
      console.log('Deals data seeded successfully!');
    }

    const tasksSnap = await getDocs(collection(db, TASKS_COLLECTION));
    if (tasksSnap.empty && initialTasks.length > 0) {
      const batch = writeBatch(db);
      initialTasks.forEach((task) => {
        const ref = doc(db, TASKS_COLLECTION, task.id);
        batch.set(ref, cleanObject(task));
      });
      await batch.commit();
      console.log('Tasks data seeded successfully!');
    }
  } catch (err) {
    console.warn('Note on seeding deals and tasks:', err);
  }
}

/**
 * Listen for real-time updates to site_visits collection.
 */
export function subscribeToSiteVisits(
  onData: (visits: SiteVisit[]) => void,
  onError?: (error: Error) => void
) {
  const visitsRef = collection(db, SITE_VISITS_COLLECTION);
  return onSnapshot(
    visitsRef,
    (snapshot) => {
      const visits: SiteVisit[] = [];
      snapshot.forEach((docSnap) => {
        visits.push(docSnap.data() as SiteVisit);
      });
      // Sort newest scheduled first
      visits.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
      onData(visits);
    },
    (err) => {
      console.error('Error listening to site_visits:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a site visit in Firestore.
 */
export async function saveSiteVisitToCloud(visit: SiteVisit): Promise<void> {
  const visitRef = doc(db, SITE_VISITS_COLLECTION, visit.id);
  await setDoc(visitRef, cleanObject(visit), { merge: true });
}

/**
 * Delete a site visit from Firestore.
 */
export async function deleteSiteVisitFromCloud(id: string): Promise<void> {
  const visitRef = doc(db, SITE_VISITS_COLLECTION, id);
  await deleteDoc(visitRef);
}

/**
 * Listen for real-time updates to cost_sheets collection.
 */
export function subscribeToCostSheets(
  onData: (sheets: CostSheet[]) => void,
  onError?: (error: Error) => void
) {
  const sheetsRef = collection(db, COST_SHEETS_COLLECTION);
  return onSnapshot(
    sheetsRef,
    (snapshot) => {
      const sheets: CostSheet[] = [];
      snapshot.forEach((docSnap) => {
        sheets.push(docSnap.data() as CostSheet);
      });
      sheets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(sheets);
    },
    (err) => {
      console.error('Error listening to cost_sheets:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a cost sheet in Firestore.
 */
export async function saveCostSheetToCloud(sheet: CostSheet): Promise<void> {
  const sheetRef = doc(db, COST_SHEETS_COLLECTION, sheet.id);
  await setDoc(sheetRef, cleanObject(sheet), { merge: true });
}

/**
 * Delete a cost sheet from Firestore.
 */
export async function deleteCostSheetFromCloud(id: string): Promise<void> {
  const sheetRef = doc(db, COST_SHEETS_COLLECTION, id);
  await deleteDoc(sheetRef);
}

// ==========================================
// TOKENS & AGREEMENTS (BOOKING TOKENS / BBA)
// ==========================================

/**
 * Listen for real-time updates to tokens_agreements collection.
 */
export function subscribeToTokensAgreements(
  onData: (records: TokenAgreement[]) => void,
  onError?: (error: Error) => void
) {
  const ref = collection(db, TOKENS_AGREEMENTS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const records: TokenAgreement[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as TokenAgreement);
      });
      // Sort newest payment date or created date first
      records.sort((a, b) => new Date(b.createdAt || b.paymentDate).getTime() - new Date(a.createdAt || a.paymentDate).getTime());
      onData(records);
    },
    (err) => {
      console.error('Error listening to tokens_agreements:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a token or agreement record in Firestore.
 */
export async function saveTokenAgreementToCloud(record: TokenAgreement): Promise<void> {
  const recordRef = doc(db, TOKENS_AGREEMENTS_COLLECTION, record.id);
  await setDoc(recordRef, cleanObject(record), { merge: true });
}

/**
 * Delete a token or agreement record from Firestore.
 */
export async function deleteTokenAgreementFromCloud(id: string): Promise<void> {
  const recordRef = doc(db, TOKENS_AGREEMENTS_COLLECTION, id);
  await deleteDoc(recordRef);
}

const DEALS_COLLECTION = 'deals';
const TASKS_COLLECTION = 'tasks';

/**
 * Subscribe to real-time updates for Deals.
 */
export function subscribeToDeals(
  onData: (deals: Deal[]) => void,
  onError?: (error: Error) => void
) {
  const ref = collection(db, DEALS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const records: Deal[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as Deal);
      });
      records.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      onData(records);
    },
    (err) => {
      console.error('Error listening to deals:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveDealToCloud(deal: Deal): Promise<void> {
  const dealRef = doc(db, DEALS_COLLECTION, deal.id);
  await setDoc(dealRef, cleanObject(deal), { merge: true });
}

export async function deleteDealFromCloud(dealId: string): Promise<void> {
  const dealRef = doc(db, DEALS_COLLECTION, dealId);
  await deleteDoc(dealRef);
}

/**
 * Subscribe to real-time updates for Tasks.
 */
export function subscribeToTasks(
  onData: (tasks: CrmTask[]) => void,
  onError?: (error: Error) => void
) {
  const ref = collection(db, TASKS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const records: CrmTask[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as CrmTask);
      });
      records.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      onData(records);
    },
    (err) => {
      console.error('Error listening to tasks:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveTaskToCloud(task: CrmTask): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, task.id);
  await setDoc(taskRef, cleanObject(task), { merge: true });
}

export async function deleteTaskFromCloud(taskId: string): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(taskRef);
}




