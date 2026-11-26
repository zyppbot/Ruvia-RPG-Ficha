import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { CharacterSheet } from './types';

let cachedDb: Firestore | null = null;

function getDb(): Firestore {
  if (cachedDb) return cachedDb;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  try {
    cachedDb = initializeFirestore(
      app,
      { ignoreUndefinedProperties: true },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    cachedDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
  return cachedDb;
}

export const CLIENT_ID =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function generateRandomToken(length = 24): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function sanitizeSheetForCloud(sheet: CharacterSheet): CharacterSheet {
  const cloned = JSON.parse(JSON.stringify(sheet)) as CharacterSheet;
  delete cloned.shareOwnerSecret;
  delete cloned.folderId;
  delete cloned.folderIds;
  return cloned;
}

export function extractShareIdFromInput(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;
  if (trimmed.includes('share=')) {
    try {
      const parsedUrl = trimmed.startsWith('http')
        ? new URL(trimmed)
        : new URL(
            trimmed.startsWith('?')
              ? `https://ruvia.local/${trimmed}`
              : `https://ruvia.local/?${trimmed.split('?').pop() || ''}`
          );
      const share = parsedUrl.searchParams.get('share')?.trim();
      if (share && /^[A-Za-z0-9_-]{8,64}$/.test(share)) return share;
    } catch {
      const match = trimmed.match(/[?&]share=([A-Za-z0-9_-]{8,64})/);
      if (match?.[1]) return match[1];
    }
  }
  if (/^[A-Za-z0-9_-]{12,64}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export async function fetchSharedSheetOnce(shareId: string): Promise<{
  sheet: CharacterSheet;
  ownerHash: string;
}> {
  const db = getDb();
  try {
    const snapshot = await getDoc(doc(db, 'sharedSheets', shareId));
    if (!snapshot.exists()) {
      throw new Error('Link inválido ou ficha não encontrada.');
    }
    const data = snapshot.data() as {
      revoked?: boolean;
      ownerHash?: string;
      sheet?: CharacterSheet;
    };
    if (data.revoked || !data.sheet || !data.ownerHash) {
      throw new Error('Este compartilhamento foi encerrado pelo dono.');
    }
    return { sheet: data.sheet, ownerHash: data.ownerHash };
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'permission-denied' || code === 'not-found') {
      throw new Error('Este compartilhamento foi encerrado pelo dono ou não existe.');
    }
    throw err;
  }
}

export function buildShareUrl(shareId: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?share=${encodeURIComponent(shareId)}`;
}

export async function createShareLink(sheet: CharacterSheet): Promise<{
  shareId: string;
  ownerSecret: string;
  ownerHash: string;
}> {
  const db = getDb();
  const shareId = generateRandomToken(24);
  const ownerSecret = generateRandomToken(32);
  const ownerHash = await sha256Hex(ownerSecret);
  const cleanSheet = sanitizeSheetForCloud({ ...sheet, shareId });

  await setDoc(doc(db, 'sharedSheets', shareId), {
    ownerHash,
    revoked: false,
    sheet: cleanSheet,
    updatedBy: CLIENT_ID,
    updatedAt: Date.now(),
    clientMutationId: generateRandomToken(16),
  });

  return { shareId, ownerSecret, ownerHash };
}

export async function pushSharedSheetUpdate(
  shareId: string,
  ownerHash: string,
  sheet: CharacterSheet,
  clientMutationId: string
): Promise<void> {
  const db = getDb();
  const cleanSheet = sanitizeSheetForCloud({ ...sheet, shareId });
  await updateDoc(doc(db, 'sharedSheets', shareId), {
    revoked: false,
    ownerHash,
    sheet: cleanSheet,
    updatedBy: CLIENT_ID,
    updatedAt: Date.now(),
    clientMutationId,
  });
}

export async function revokeShareLink(shareId: string, ownerSecret: string): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, 'sharedSheets', shareId), {
    revoked: true,
    revokeProof: ownerSecret,
    sheet: {},
    updatedBy: CLIENT_ID,
    updatedAt: Date.now(),
  });
}

export function subscribeToSharedSheet(
  shareId: string,
  callbacks: {
    onData: (payload: {
      sheet: CharacterSheet;
      ownerHash: string;
      updatedBy: string;
      clientMutationId?: string;
      fromLocalWrite: boolean;
    }) => void;
    onUnavailable: (reason: 'revoked' | 'not-found') => void;
    onError: (err: Error) => void;
  }
): () => void {
  const db = getDb();
  const ref = doc(db, 'sharedSheets', shareId);
  return onSnapshot(
    ref,
    snapshot => {
      if (!snapshot.exists()) {
        callbacks.onUnavailable('not-found');
        return;
      }
      const data = snapshot.data() as {
        revoked?: boolean;
        ownerHash?: string;
        sheet?: CharacterSheet;
        updatedBy?: string;
        clientMutationId?: string;
      };
      if (data.revoked) {
        callbacks.onUnavailable('revoked');
        return;
      }
      if (!data.sheet || !data.ownerHash) {
        callbacks.onUnavailable('not-found');
        return;
      }
      callbacks.onData({
        sheet: data.sheet,
        ownerHash: data.ownerHash,
        updatedBy: data.updatedBy || '',
        clientMutationId: data.clientMutationId,
        fromLocalWrite: snapshot.metadata.hasPendingWrites,
      });
    },
    error => {
      const code = (error as { code?: string }).code || '';
      if (code === 'permission-denied' || code === 'not-found') {
        callbacks.onUnavailable('revoked');
      } else {
        callbacks.onError(error);
      }
    }
  );
}
