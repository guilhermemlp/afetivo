import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  writeFolderBackup,
  listFolderBackups,
  readFolderBackup,
  inspectFolderBackup,
  pickBackupDirectory,
  recalledDirectory,
  rememberDirectory,
  type BackupDirectory,
  type FolderBackup,
} from '../services/folderBackup';
import {
  exportDataAsJSON,
  importDataFromJSON,
  DATA_CHANGED_EVENT,
} from '../services/storage';
import {
  validateEntries,
  validateMedications,
  validateProfile,
} from '../services/validation';
import { useConfirmation } from './ConfirmationProvider';

interface ContextValue {
  folderName: string;
  connected: boolean;
  busy: boolean;
  autoBackup: boolean;
  backups: FolderBackup[];
  message: string;
  error: string;
  choose: () => Promise<void>;
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  save: () => Promise<void>;
  refresh: () => Promise<void>;
  restore: (backup: FolderBackup, onRestored: () => void) => Promise<void>;
  setAutoBackup: (enabled: boolean) => void;
}
const Context = createContext<ContextValue | null>(null);
export function useFolderBackup() {
  const context = useContext(Context);
  if (!context) throw new Error('FolderBackupProvider ausente.');
  return context;
}
function localBackup() {
  // Export must not hide a corrupt local section by producing an empty backup.
  for (const [key, validate] of [
    ['afetivo_entries_v2', validateEntries],
    ['afetivo_medications_v2', validateMedications],
    ['afetivo_user_profile_v2', validateProfile],
  ] as const) {
    const raw = localStorage.getItem(key);
    if (raw !== null) validate(JSON.parse(raw));
  }
  const text = exportDataAsJSON();
  inspectFolderBackup(text);
  return text;
}
export function FolderBackupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const confirm = useConfirmation();
  const [directory, setDirectory] = useState<BackupDirectory | null>(null),
    [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false),
    [autoBackup, updateAuto] = useState(false),
    [backups, setBackups] = useState<FolderBackup[]>([]);
  const [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const lock = useRef(false),
    revision = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    lastContent = useRef(''),
    suppressNextChange = useRef(false);
  const autoEnabled = useRef(false),
    dirty = useRef(false);
  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const failure = useCallback((err: unknown) => {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'AbortError') return; // Closing the browser picker changes nothing.
    setError(
      name === 'NotAllowedError' || name === 'SecurityError'
        ? 'O navegador não autorizou a pasta. Autorize novamente para continuar; o diário local foi preservado.'
        : name === 'QuotaExceededError'
          ? 'Não foi possível gravar por falta de espaço. O diário local foi preservado.'
          : err instanceof Error
            ? err.message
            : 'Não foi possível acessar a pasta. Confira se o Drive para computador está disponível.',
    );
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      setConnected(false);
      autoEnabled.current = false;
      updateAuto(false);
      clearTimer();
    }
  }, []);
  const activate = async (handle: BackupDirectory, current: number) => {
    const files = await listFolderBackups(handle);
    if (revision.current !== current) return;
    setDirectory(handle);
    setConnected(true);
    setBackups(files);
    lastContent.current = '';
    autoEnabled.current = true;
    updateAuto(true);
    setMessage(
      'Pasta conectada. Ao salvar um registro, o backup será criado imediatamente nesta pasta; o Google Drive para computador fará a sincronização com a nuvem.',
    );
    try {
      await rememberDirectory(handle);
    } catch {
      setMessage(
        'Pasta conectada nesta sessão. Se o navegador não guardar a preferência, escolha a pasta novamente ao voltar.',
      );
    }
  };
  const choose = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const current = ++revision.current;
    try {
      const handle = await pickBackupDirectory(); // No await before opening the permission picker.
      clearTimer();
      dirty.current = false;
      await activate(handle, current);
    } catch (err) {
      if (revision.current === current) failure(err);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const reconnect = async () => {
    if (!directory || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const current = revision.current;
    try {
      const permission = await directory.requestPermission({
        mode: 'readwrite',
      });
      if (permission !== 'granted')
        throw new DOMException('Permission denied', 'NotAllowedError');
      await activate(directory, current);
    } catch (err) {
      failure(err);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const disconnect = async () => {
    revision.current++;
    clearTimer();
    autoEnabled.current = false;
    dirty.current = false;
    setDirectory(null);
    setConnected(false);
    updateAuto(false);
    setBackups([]);
    setError('');
    setMessage(
      'Pasta desconectada. Os backups existentes e os registros locais foram preservados.',
    );
    try {
      await rememberDirectory(null);
    } catch {
      setError(
        'O navegador não conseguiu esquecer a pasta. Você pode remover a permissão nas configurações do site.',
      );
    }
  };
  const save = useCallback(
    async (automatic = false) => {
      if (lock.current) {
        if (automatic) dirty.current = true;
        return;
      }
      if (!directory || !connected) return;
      lock.current = true;
      setBusy(true);
      setError('');
      const current = revision.current;
      try {
        if (
          (await directory.queryPermission({ mode: 'readwrite' })) !== 'granted'
        )
          throw new DOMException('Permission denied', 'NotAllowedError');
        const text = localBackup(),
          { exportedAt, ...content } = JSON.parse(text),
          fingerprint = JSON.stringify(content);
        if (automatic && fingerprint === lastContent.current) return;
        const file = await writeFolderBackup(directory, text);
        if (revision.current !== current) return;
        lastContent.current = fingerprint;
        setBackups((previous) => [file, ...previous].slice(0, 10));
        setMessage(
          `Backup gravado na pasta em ${new Date(file.modifiedAt).toLocaleString('pt-BR')}. Confira a sincronização no Google Drive para computador.`,
        );
      } catch (err) {
        if (revision.current === current) failure(err);
      } finally {
        lock.current = false;
        setBusy(false);
        if (automatic && dirty.current && autoEnabled.current) {
          clearTimer();
          timer.current = setTimeout(() => {
            timer.current = null;
            if (!dirty.current || !autoEnabled.current) return;
            dirty.current = false;
            void save(true);
          }, 0);
        }
      }
    },
    [directory, connected, failure],
  );
  const refresh = async () => {
    if (!directory || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const current = revision.current;
    try {
      const files = await listFolderBackups(directory);
      if (revision.current === current) setBackups(files);
    } catch (err) {
      failure(err);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const restore = async (backup: FolderBackup, onRestored: () => void) => {
    if (!directory || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const current = revision.current;
    try {
      const text = await readFolderBackup(directory, backup),
        info = inspectFolderBackup(text);
      if (revision.current !== current) return;
      if (
        !(await confirm(
          `Restaurar o backup de ${new Date(backup.modifiedAt).toLocaleString('pt-BR')}, com ${info.entriesCount} registros e ${info.medsCount} itens de rotina? Ele substituirá os dados atuais deste navegador. O arquivo na pasta será preservado.`,
        )) ||
        revision.current !== current
      )
        return;
      clearTimer();
      dirty.current = false;
      // importDataFromJSON emits a data-change event. This restored snapshot
      // already exists in the selected folder, so do not duplicate it.
      suppressNextChange.current = true;
      const result = importDataFromJSON(text);
      if (!result.success) {
        suppressNextChange.current = false;
        throw new Error(result.error || 'Não foi possível restaurar.');
      }
      setMessage(
        `Backup restaurado: ${info.entriesCount} registros. Os próximos registros salvos continuarão sendo copiados automaticamente.`,
      );
      onRestored();
    } catch (err) {
      if (revision.current === current) failure(err);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const setAutoBackup = (enabled: boolean) => {
    clearTimer();
    dirty.current = false;
    updateAuto(enabled && connected);
    autoEnabled.current = enabled && connected;
    if (enabled && connected) {
      setMessage(
        'Backup automático ativado. Cada registro será copiado assim que você clicar em Salvar.',
      );
    }
  };
  useEffect(() => {
    let cancelled = false;
    const current = revision.current;
    void (async () => {
      try {
        const handle = await recalledDirectory();
        if (!handle || cancelled || revision.current !== current) return;
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (cancelled || revision.current !== current) return;
        setDirectory(handle);
        if (permission === 'granted') {
          const files = await listFolderBackups(handle);
          if (!cancelled && revision.current === current) {
            setConnected(true);
            setBackups(files);
            autoEnabled.current = true;
            updateAuto(true);
          }
        }
      } catch {
        /* A browser without persistent handles can still choose a folder this session. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const changed = () => {
      if (suppressNextChange.current) {
        suppressNextChange.current = false;
        return;
      }
      if (!autoEnabled.current) return;
      dirty.current = true;
      clearTimer();
      if (!lock.current) {
        dirty.current = false;
        void save(true);
      }
    };
    window.addEventListener(DATA_CHANGED_EVENT, changed);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, changed);
      clearTimer();
    };
  }, [save, autoBackup]);
  return (
    <Context.Provider
      value={{
        folderName: directory?.name ?? '',
        connected,
        busy,
        autoBackup,
        backups,
        message,
        error,
        choose,
        reconnect,
        disconnect,
        save: () => save(false),
        refresh,
        restore,
        setAutoBackup,
      }}
    >
      {children}
    </Context.Provider>
  );
}
