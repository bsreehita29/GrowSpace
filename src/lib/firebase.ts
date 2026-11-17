import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const SESSION_STORAGE_KEY = 'growspace_account_session';

export interface WorkspaceSession {
  username: string;
  displayName: string;
  workspaceId: string;
}

const sessionListeners = new Set<(session: WorkspaceSession | null) => void>();

function notifySessionListeners(session: WorkspaceSession | null) {
  sessionListeners.forEach((listener) => listener(session));
}

export function getCurrentSession(): WorkspaceSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkspaceSession>;
    if (
      typeof parsed.username === 'string' &&
      /^[a-z0-9._-]{3,32}$/.test(parsed.username) &&
      typeof parsed.workspaceId === 'string' &&
      /^[a-zA-Z0-9_-]{24,128}$/.test(parsed.workspaceId)
    ) {
      return {
        username: parsed.username,
        displayName:
          typeof parsed.displayName === 'string' && parsed.displayName.trim()
            ? parsed.displayName.trim()
            : parsed.username,
        workspaceId: parsed.workspaceId,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function saveSession(session: WorkspaceSession | null) {
  try {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage restriction errors in sandboxed frames
  }
  notifySessionListeners(session);
}

export function subscribeSession(listener: (session: WorkspaceSession | null) => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function validateUsername(raw: string): string {
  const clean = normalizeUsername(raw);
  if (!/^[a-z0-9._-]{3,32}$/.test(clean)) {
    throw new Error(
      'Username must be 3 to 32 characters using letters, numbers, dots, underscores, or hyphens.'
    );
  }
  return clean;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function generateSaltHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function createWorkspaceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ws_${crypto.randomUUID().replace(/-/g, '')}`;
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `ws_${bytesToHex(bytes)}`;
}

async function hashPasswordWithSalt(password: string, saltHex: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Secure Web Crypto API is required in this browser.');
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const saltBytes = hexToBytes(saltHex);
  const saltBuffer = saltBytes.buffer.slice(
    saltBytes.byteOffset,
    saltBytes.byteOffset + saltBytes.byteLength
  ) as ArrayBuffer;
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(derived));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export async function registerWithUsername(
  rawUsername: string,
  password: string,
  displayName?: string
): Promise<WorkspaceSession> {
  const username = validateUsername(rawUsername);
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (password.length > 128) {
    throw new Error('Password must be 128 characters or fewer.');
  }

  const accountPath = `accounts/${username}`;
  const accountRef = doc(db, 'accounts', username);

  let existingSnap;
  try {
    existingSnap = await getDoc(accountRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, accountPath);
  }

  if (existingSnap.exists()) {
    throw new Error('That username is already taken. Sign in instead or choose another username.');
  }

  const resolvedName = (displayName || '').trim().slice(0, 80) || username;
  const workspaceId = createWorkspaceId();
  const passwordSalt = generateSaltHex();
  const passwordHash = await hashPasswordWithSalt(password, passwordSalt);

  try {
    await setDoc(accountRef, {
      username,
      displayName: resolvedName,
      workspaceId,
      passwordSalt,
      passwordHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, accountPath);
  }

  const session: WorkspaceSession = {
    username,
    displayName: resolvedName,
    workspaceId,
  };
  saveSession(session);
  return session;
}

export async function signInWithUsername(
  rawUsername: string,
  password: string
): Promise<WorkspaceSession> {
  const username = validateUsername(rawUsername);
  if (!password) {
    throw new Error('Please enter your password.');
  }

  const accountPath = `accounts/${username}`;
  const accountRef = doc(db, 'accounts', username);

  let snap;
  try {
    snap = await getDoc(accountRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, accountPath);
  }

  if (!snap.exists()) {
    throw new Error('Invalid username or password.');
  }

  const data = snap.data() as {
    username?: string;
    displayName?: string;
    workspaceId?: string;
    passwordSalt?: string;
    passwordHash?: string;
  };

  if (!data.passwordSalt || !data.passwordHash || !data.workspaceId) {
    throw new Error('Account record is incomplete. Please create a new account.');
  }

  const computedHash = await hashPasswordWithSalt(password, data.passwordSalt);
  if (!constantTimeEqual(computedHash, data.passwordHash)) {
    throw new Error('Invalid username or password.');
  }

  const session: WorkspaceSession = {
    username,
    displayName: (data.displayName || '').trim() || username,
    workspaceId: data.workspaceId,
  };
  saveSession(session);
  return session;
}

export function signOutSession() {
  saveSession(null);
}
