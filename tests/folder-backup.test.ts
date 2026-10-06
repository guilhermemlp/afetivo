import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  writeFolderBackup,
  listFolderBackups,
  readFolderBackup,
  inspectFolderBackup,
  type BackupDirectory,
} from '../src/services/folderBackup';
import { generateInitialSeedEntries } from '../src/services/storage';
const payload = () =>
  JSON.stringify({
    version: '3.0',
    entries: [{ ...generateInitialSeedEntries()[0], createdAt: 123 }],
    medications: [],
    profile: { name: 'Pessoa', notificationsEnabled: false },
  });
function directory(initial: Record<string, string> = {}, failWrite = false) {
  const files = new Map(Object.entries(initial)),
    removed: string[] = [];
  let aborted = false;
  const handle = (name: string) => ({
    kind: 'file' as const,
    name,
    getFile: async () => {
      if (!files.has(name))
        throw new DOMException('Not found', 'NotFoundError');
      return new File([files.get(name)!], name, {
        lastModified: name.endsWith('older.json') ? 1 : 2,
      });
    },
    createWritable: async () => {
      let text = '';
      return {
        write: async (value: Blob | string) => {
          if (failWrite) throw new DOMException('Full', 'QuotaExceededError');
          text = typeof value === 'string' ? value : await value.text();
        },
        close: async () => {
          files.set(name, text);
        },
        abort: async () => {
          aborted = true;
        },
      };
    },
  });
  const value: BackupDirectory = {
    kind: 'directory',
    name: 'Afetivo',
    values: async function* () {
      for (const name of files.keys()) yield handle(name);
      yield { kind: 'directory', name: 'Other folder' };
    },
    getFileHandle: async (name, options) => {
      if (options?.create) files.set(name, '');
      if (!files.has(name))
        throw new DOMException('Not found', 'NotFoundError');
      return handle(name);
    },
    removeEntry: async (name) => {
      removed.push(name);
      files.delete(name);
    },
    queryPermission: async () => 'granted',
    requestPermission: async () => 'granted',
  };
  return {
    value,
    files,
    removed,
    get aborted() {
      return aborted;
    },
  };
}
test('each folder save creates a complete new snapshot and never overwrites earlier backups', async () => {
  const folder = directory({
    'afetivo-backup-older.json': 'existing',
    'other.json': 'other',
  });
  const first = await writeFolderBackup(folder.value, payload()),
    second = await writeFolderBackup(folder.value, payload());
  assert.notEqual(first.name, second.name);
  assert.match(first.name, /^afetivo-backup-.*\.json$/);
  assert.equal(folder.files.get('afetivo-backup-older.json'), 'existing');
  assert.equal(folder.files.get('other.json'), 'other');
  assert.equal(await readFolderBackup(folder.value, first), payload());
  assert.deepEqual(folder.removed, []);
});
test('malformed backups never create a file', async () => {
  const folder = directory();
  for (const text of [
    'bad',
    '{}',
    JSON.stringify({ entries: [null], medications: [] }),
    JSON.stringify({ entries: [], medications: 'invalid' }),
  ])
    await assert.rejects(() => writeFolderBackup(folder.value, text));
  assert.equal(folder.files.size, 0);
});
test('a failed write aborts and removes only its own incomplete file', async () => {
  const folder = directory({ 'afetivo-backup-older.json': payload() }, true);
  await assert.rejects(
    () => writeFolderBackup(folder.value, payload()),
    (error) => (error as DOMException).name === 'QuotaExceededError',
  );
  assert.equal(folder.aborted, true);
  assert.equal(folder.removed.length, 1);
  assert.equal(folder.files.size, 1);
  assert.equal(folder.files.get('afetivo-backup-older.json'), payload());
});
test('list shows at most ten recent app backups and does not scan subfolders or unrelated files', async () => {
  const folder = directory(
    Object.fromEntries([
      ...Array.from({ length: 12 }, (_, i) => [
        `afetivo-backup-${String(i).padStart(2, '0')}.json`,
        payload(),
      ]),
      ['private.txt', 'other'],
    ]),
  );
  const files = await listFolderBackups(folder.value);
  assert.equal(files.length, 10);
  assert.ok(files.every((f) => f.name.startsWith('afetivo-backup-')));
  assert.equal(files[0].name, 'afetivo-backup-11.json');
  assert.equal(folder.files.size, 13);
});
test('restore rejects invalid names, oversized content and malformed records without changing the folder', async () => {
  const folder = directory({
    'afetivo-backup-bad.json': '{"entries":[null],"medications":[]}',
    'afetivo-backup-huge.json': ' '.repeat(10 * 1024 * 1024 + 1),
  });
  await assert.rejects(() =>
    readFolderBackup(folder.value, {
      name: '../other.json',
      modifiedAt: 0,
      size: 0,
    }),
  );
  await assert.rejects(
    () =>
      readFolderBackup(folder.value, {
        name: 'afetivo-backup-huge.json',
        modifiedAt: 0,
        size: 0,
      }),
    /10 MB/,
  );
  await assert.rejects(() =>
    readFolderBackup(folder.value, {
      name: 'afetivo-backup-bad.json',
      modifiedAt: 0,
      size: 0,
    }),
  );
  assert.equal(folder.files.size, 2);
  assert.deepEqual(folder.removed, []);
});
test('backup preview reflects validated records and routine items', () => {
  assert.deepEqual(inspectFolderBackup(payload()), {
    entriesCount: 1,
    medsCount: 0,
  });
  assert.throws(() =>
    inspectFolderBackup(
      JSON.stringify({ entries: [], medications: [], profile: { name: 123 } }),
    ),
  );
});
