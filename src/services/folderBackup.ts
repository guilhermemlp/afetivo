import {
  validateEntries,
  validateMedications,
  validateProfile,
} from './validation';

const MAX_BYTES = 10 * 1024 * 1024;
const BACKUP_NAME = /^afetivo-backup-[A-Za-z0-9_-]+\.json$/;
export interface BackupFileHandle {
  kind: 'file';
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{
    write: (data: Blob | string) => Promise<void>;
    close: () => Promise<void>;
    abort: () => Promise<void>;
  }>;
}
export interface BackupDirectory {
  kind: 'directory';
  name: string;
  values: () => AsyncIterable<
    BackupFileHandle | { kind: 'directory'; name: string }
  >;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<BackupFileHandle>;
  removeEntry: (name: string) => Promise<void>;
  queryPermission: (options: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission: (options: {
    mode: 'readwrite';
  }) => Promise<PermissionState>;
}
export interface FolderBackup {
  name: string;
  modifiedAt: number;
  size: number;
}
declare global {
  interface Window {
    showDirectoryPicker?: (options: {
      id: string;
      mode: 'readwrite';
      startIn: 'documents';
    }) => Promise<BackupDirectory>;
  }
}

export function folderBackupSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.showDirectoryPicker === 'function'
  );
}
export function pickBackupDirectory(): Promise<BackupDirectory> {
  if (!folderBackupSupported())
    return Promise.reject(
      new Error(
        'Use Chrome ou Edge no computador, em HTTPS ou localhost, para escolher uma pasta. O backup JSON continua disponível.',
      ),
    );
  // Invoke synchronously from a user action: the browser owns the permission prompt.
  return window.showDirectoryPicker!({
    id: 'afetivo-backups',
    mode: 'readwrite',
    startIn: 'documents',
  });
}
export function inspectFolderBackup(text: string): {
  entriesCount: number;
  medsCount: number;
} {
  if (new TextEncoder().encode(text).length > MAX_BYTES)
    throw new Error('O backup ultrapassa o limite de 10 MB.');
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('O arquivo não contém um backup JSON válido.');
  }
  if (
    !data ||
    Array.isArray(data) ||
    !Array.isArray(data.entries) ||
    !Array.isArray(data.medications)
  )
    throw new Error('O arquivo não é um backup completo do Afetivo.');
  const entries = validateEntries(data.entries),
    medications = validateMedications(data.medications);
  if (data.profile !== undefined) validateProfile(data.profile);
  return { entriesCount: entries.length, medsCount: medications.length };
}
export async function listFolderBackups(
  directory: BackupDirectory,
): Promise<FolderBackup[]> {
  const backups: FolderBackup[] = [];
  for await (const handle of directory.values()) {
    if (handle.kind !== 'file' || !BACKUP_NAME.test(handle.name)) continue;
    const file = await handle.getFile();
    backups.push({
      name: handle.name,
      modifiedAt: file.lastModified,
      size: file.size,
    });
  }
  return backups
    .sort((a, b) => b.modifiedAt - a.modifiedAt || b.name.localeCompare(a.name))
    .slice(0, 10);
}
export async function writeFolderBackup(
  directory: BackupDirectory,
  text: string,
): Promise<FolderBackup> {
  inspectFolderBackup(text); // Validate before creating a file or touching the user's folder.
  const name = `afetivo-backup-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}.json`;
  let writer: Awaited<ReturnType<BackupFileHandle['createWritable']>> | null =
      null,
    created = false;
  try {
    const handle = await directory.getFileHandle(name, { create: true });
    created = true;
    writer = await handle.createWritable();
    await writer.write(new Blob([text], { type: 'application/json' }));
    await writer.close();
    writer = null;
    const file = await handle.getFile();
    return { name, modifiedAt: file.lastModified, size: file.size };
  } catch (error) {
    if (writer) {
      try {
        await writer.abort();
      } catch {
        /* Preserve the original error. */
      }
    }
    // Clean up only this operation's unique, newly created file, never earlier backups.
    if (created) {
      try {
        await directory.removeEntry(name);
      } catch {
        /* The next read will still validate any incomplete file. */
      }
    }
    throw error;
  }
}
export async function readFolderBackup(
  directory: BackupDirectory,
  backup: FolderBackup,
): Promise<string> {
  if (!BACKUP_NAME.test(backup.name))
    throw new Error('Nome de backup inválido.');
  const file = await (await directory.getFileHandle(backup.name)).getFile();
  if (file.size > MAX_BYTES)
    throw new Error('O backup ultrapassa o limite de 10 MB.');
  const text = await file.text();
  inspectFolderBackup(text);
  return text;
}

const DATABASE = 'afetivo-backup-preferences';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('preferences');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error('Não foi possível abrir as preferências de backup.'));
  });
}
// Browsers can store a directory handle using structured clone, without storing an absolute path.
export async function rememberDirectory(
  handle: BackupDirectory | null,
): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('preferences', 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onabort = () =>
        reject(new Error('O navegador não guardou a preferência de pasta.'));
      const store = transaction.objectStore('preferences');
      handle
        ? store.put(handle, 'backup-directory')
        : store.delete('backup-directory');
    });
  } finally {
    db.close();
  }
}
export async function recalledDirectory(): Promise<BackupDirectory | null> {
  const db = await database();
  try {
    return await new Promise<BackupDirectory | null>((resolve, reject) => {
      const request = db
        .transaction('preferences', 'readonly')
        .objectStore('preferences')
        .get('backup-directory');
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () =>
        reject(new Error('Não foi possível recuperar a pasta escolhida.'));
    });
  } finally {
    db.close();
  }
}
