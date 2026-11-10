import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { app } from './googleAuth';
import type { ShareRecord } from '../types';
import { INITIAL_SHARES } from '../data/initialData';

export const db = getFirestore(app);

export interface SocietyCloudData {
  shares: ShareRecord[];
  allConfiguredMonths?: string[];
  activeMonths?: string[];
  currentMonth?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

const COLLECTION_NAME = 'society';
const DOCUMENT_ID = 'ledger_data';

/**
 * Sanitizes object by stripping out undefined fields which Firestore rejects.
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Listen to real-time changes from Cloud Firestore.
 * If the document does not exist yet (first-time run), it automatically initializes it.
 */
export function subscribeToSocietyData(
  onData: (data: SocietyCloudData) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);

  const unsubscribe = onSnapshot(
    docRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as SocietyCloudData;
        if (cloudData && Array.isArray(cloudData.shares) && cloudData.shares.length > 0) {
          onData(cloudData);
        }
      } else {
        // Document does not exist yet. Initialize it with default register data.
        console.log('[Firestore] Document not found. Initializing with baseline register...');
        const initialPayload: SocietyCloudData = {
          shares: INITIAL_SHARES,
          allConfiguredMonths: ['Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'],
          activeMonths: ['Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'],
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system_init',
        };
        try {
          await setDoc(docRef, sanitizeForFirestore(initialPayload));
          onData(initialPayload);
        } catch (initErr) {
          console.warn('[Firestore] Auto-init failed:', initErr);
        }
      }
    },
    (error) => {
      console.warn('[Firestore] Real-time sync listener warning:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Saves updated society data to Cloud Firestore.
 * Triggers instant real-time update across all connected members/devices.
 */
export async function saveSocietyDataToCloud(data: Partial<SocietyCloudData>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
  const payload = sanitizeForFirestore({
    ...data,
    lastUpdated: new Date().toISOString(),
  });

  await setDoc(docRef, payload, { merge: true });
}

