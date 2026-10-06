import React from 'react';
import { FolderOpen, RefreshCw } from 'lucide-react';
import { useFolderBackup } from './FolderBackupProvider';
import { folderBackupSupported } from '../services/folderBackup';

export function FolderBackupPanel({
  onDataRestored,
}: {
  onDataRestored: () => void;
}) {
  const backup = useFolderBackup();
  const supported = folderBackupSupported();
  return (
    <section
      className="border border-sky-200 dark:border-sky-900 rounded-xl p-4 space-y-3 text-sm"
      aria-labelledby="drive-folder-title"
    >
      <h3
        id="drive-folder-title"
        className="font-semibold flex items-center gap-2"
      >
        <FolderOpen size={18} /> Backup em pasta do Google Drive
      </h3>
      <p>
        Escolha uma pasta sincronizada pelo Google Drive para computador. O
        Afetivo grava arquivos nela; o aplicativo do Drive envia essas cópias
        para a nuvem.
      </p>
      <p className="text-xs text-stone-500">
        Sem OAuth, chave de API ou hospedagem no Google Cloud. Cada cópia contém
        todos os registros e itens de rotina. Você também pode usar outra pasta
        sincronizada.
      </p>
      {!supported && (
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Para escolher uma pasta, abra no Chrome ou Edge no computador, em
          HTTPS ou localhost. Neste navegador, use o Backup JSON Completo e
          guarde o arquivo no Drive.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          disabled={!supported || backup.busy}
          onClick={() => void backup.choose()}
          className="border rounded-lg px-3 py-2 disabled:opacity-50"
        >
          {backup.folderName
            ? 'Trocar pasta de backup'
            : 'Escolher pasta do Drive'}
        </button>
        {backup.folderName && !backup.connected && (
          <button
            disabled={backup.busy}
            onClick={() => void backup.reconnect()}
            className="border rounded-lg px-3 py-2 disabled:opacity-50"
          >
            Autorizar pasta salva
          </button>
        )}
      </div>
      {backup.folderName && (
        <p className="break-words">
          <strong>Pasta:</strong> {backup.folderName} ·{' '}
          {backup.connected
            ? 'Acesso autorizado'
            : 'Aguardando autorização do navegador'}
        </p>
      )}
      {backup.connected && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={backup.busy}
              onClick={() => void backup.save()}
              className="bg-teal-800 text-white rounded-lg px-3 py-2 disabled:opacity-50"
            >
              Salvar backup na pasta
            </button>
            <button
              disabled={backup.busy}
              onClick={() => void backup.refresh()}
              className="border rounded-lg px-3 py-2 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={14} /> Atualizar backups da pasta
            </button>
          </div>
          <label className="flex items-start gap-2">
            <input
              className="mt-1"
              type="checkbox"
              aria-label="Criar backup ao salvar registros"
              checked={backup.autoBackup}
              disabled={backup.busy}
              onChange={(event) => backup.setAutoBackup(event.target.checked)}
            />
            <span>
              Criar backup ao salvar registros
              <span className="block text-xs text-stone-500">
                Ativado automaticamente ao conectar a pasta. Cada clique em
                “Salvar” cria imediatamente um novo arquivo com o backup
                completo. Os arquivos anteriores são preservados.
              </span>
            </span>
          </label>
          <p className="text-xs text-stone-500">
            O Afetivo confirma a gravação na pasta. Consulte o aplicativo do
            Google Drive para verificar se a sincronização com a nuvem terminou.
          </p>
          <details>
            <summary className="cursor-pointer font-medium">
              Restaurar uma cópia da pasta ({backup.backups.length})
            </summary>
            <p className="text-xs text-stone-500 py-2">
              Até 10 cópias mais recentes. A restauração substitui os dados
              deste navegador, sem unir registros de dispositivos diferentes.
            </p>
            <ul className="space-y-2">
              {backup.backups.map((file) => (
                <li
                  key={file.name}
                  className="border rounded-lg p-2 flex flex-wrap justify-between items-center gap-2"
                >
                  <div>
                    <p>{new Date(file.modifiedAt).toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-stone-500">
                      {Math.ceil(file.size / 1024)} KB
                    </p>
                  </div>
                  <button
                    aria-label={`Restaurar backup de ${new Date(file.modifiedAt).toLocaleString('pt-BR')}`}
                    disabled={backup.busy}
                    onClick={() => void backup.restore(file, onDataRestored)}
                    className="border rounded-lg px-3 py-2 disabled:opacity-50"
                  >
                    Restaurar esta cópia
                  </button>
                </li>
              ))}
            </ul>
            {!backup.backups.length && (
              <p>
                Nenhum backup do Afetivo nesta pasta. Se os arquivos vierem de
                outro computador, aguarde a sincronização e atualize a lista.
              </p>
            )}
          </details>
        </>
      )}
      {backup.busy && <p role="status">Acessando a pasta…</p>}
      {backup.message && (
        <p role="status" className="text-teal-800 dark:text-teal-300">
          {backup.message}
        </p>
      )}
      {backup.error && (
        <p role="alert" className="text-red-700 dark:text-red-300">
          {backup.error}
        </p>
      )}
      {backup.folderName && (
        <button
          disabled={backup.busy}
          className="text-xs underline disabled:opacity-50"
          onClick={() => void backup.disconnect()}
        >
          Desconectar pasta
        </button>
      )}
      <details>
        <summary className="cursor-pointer text-xs font-medium">
          Como preparar a pasta
        </summary>
        <ol className="list-decimal pl-5 space-y-2 pt-2 text-xs">
          <li>Instale e conecte o Google Drive para computador à sua conta.</li>
          <li>Dentro do seu Drive, crie uma pasta chamada “Afetivo”.</li>
          <li>
            Clique em “Escolher pasta do Drive” e selecione essa pasta no
            computador.
          </li>
          <li>
            Salve uma cópia e confira no aplicativo do Drive se ela foi
            sincronizada.
          </li>
        </ol>
        <p className="text-xs pt-2">
          Para recuperar em outro computador, conecte a mesma conta do Drive,
          escolha a pasta sincronizada e selecione uma cópia para restaurar. No
          celular, baixe o JSON no aplicativo do Drive e use Importar Backup.
        </p>
      </details>
    </section>
  );
}
