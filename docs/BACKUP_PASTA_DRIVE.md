# Backup do Afetivo em uma pasta sincronizada pelo Google Drive

A integração escolhida não usa OAuth, credenciais, Google Drive API, Google Cloud ou servidor para guardar o diário. O navegador grava arquivos JSON na pasta autorizada pelo usuário. **O Google Drive para computador é responsável por sincronizá-los com a conta Google.**

## Preparar e usar

1. Instale o [Google Drive para computador](https://www.google.com/drive/download/) e conecte sua conta Google.
2. Crie uma pasta “Afetivo” dentro do seu Drive. Confirme que ela está disponível no computador.
3. Abra o Afetivo no Chrome ou Edge, por HTTPS ou localhost.
4. Abra **Backup & Exportar → Escolher pasta do Drive** e selecione “Afetivo”. Autorize o acesso solicitado pelo navegador.
5. Use **Salvar backup na pasta**. Verifique no aplicativo do Drive se a sincronização terminou.
6. A opção **Criar backup ao salvar registros** é ativada quando a pasta é conectada.

Não há uma variável de ambiente a configurar para esse recurso. A conta Google utiliza seu espaço disponível de armazenamento, inclusive a franquia gratuita. Não há custo de API ou infraestrutura do Google Cloud introduzido por essa integração.

## O que é guardado

Cada arquivo contém o backup JSON completo: registros de humor e emoções, contextos, notas, atividades, itens de rotina e perfil. O diário principal continua no `localStorage`; o arquivo é uma cópia, não um banco de dados compartilhado. Cópias são arquivos independentes com data e identificador único; salvar outra cópia não substitui as anteriores. O aplicativo não apaga backups anteriores automaticamente. A pasta pode ser administrada pelo próprio Drive.

O navegador pode lembrar a pasta por um identificador de acesso em IndexedDB. O Afetivo não obtém o caminho completo da pasta nem pede senha da conta Google. Não percorre subpastas; a listagem considera apenas arquivos com o padrão de nome dos backups do Afetivo. Os arquivos JSON não têm criptografia própria nem senha; use uma pasta privada da sua conta.

O aplicativo exibe até as dez cópias mais recentes da pasta. As demais continuam disponíveis no Drive e podem ser baixadas e restauradas por **Importar Backup**.

## Backup ao salvar o registro

Depois que a pasta é conectada, clicar em **Salvar** cria imediatamente um novo arquivo JSON com o backup completo, já incluindo o registro recém-salvo. Não existe espera de 15 segundos. A gravação é feita na pasta do computador; o aplicativo Google Drive para computador decide quando esse arquivo chega à nuvem.

Funciona enquanto o Afetivo está aberto e tem autorização para acessar a pasta, mesmo com o painel de backup fechado. Se o navegador conservar a autorização ao voltar ou recarregar a página, a cópia automática é reativada. Caso o navegador peça autorização novamente, use **Autorizar pasta salva**. Se a autorização for retirada, a cópia automática é pausada e o diário local permanece intacto.

Restaurar uma cópia pela lista da pasta não cria uma duplicata do arquivo restaurado. Os registros salvos depois da restauração continuam gerando novas cópias. A exclusão de registros ou limpeza do diário também pode gerar uma nova cópia, mas as versões anteriores são mantidas.

## Recuperar os dados

No mesmo computador, escolha uma cópia em **Restaurar uma cópia da pasta**. O arquivo é lido e validado antes de mostrar uma confirmação com a quantidade de registros e itens de rotina. Confirmar substitui os dados locais; cancelar preserva tudo. Um arquivo inválido ou uma falha de armazenamento não deve substituir o diário.

Em outro computador, conecte a mesma conta no Drive para computador e espere a pasta sincronizar. No Afetivo, escolha a pasta e restaure uma cópia. No celular ou em navegador sem suporte à seleção de pastas, baixe o JSON pelo aplicativo do Drive e use **Importar Backup**.

Isso é **backup e restauração**, não sincronização contínua entre dispositivos. Cada navegador continua com seu próprio diário. Se dois computadores criarem registros diferentes, as cópias não são mescladas automaticamente; confira a data e o conteúdo do arquivo que deseja restaurar.

## Limites e verificação

- A seleção de pasta depende da File System Access API e de contexto seguro. Chrome/Edge no computador são os caminhos indicados; disponibilidade pode variar por sistema e política do navegador. HTTP público, alguns navegadores móveis e páginas incorporadas podem não permitir o seletor.
- O aplicativo confirma que o arquivo foi gravado na pasta. Não confirma que o Google terminou o upload. O estado de sincronização deve ser verificado no Drive para computador.
- Backups acima de 10 MB são rejeitados pelo aplicativo. Falhas de autorização, falta de espaço e arquivos inválidos são exibidos sem declarar sucesso.
- A integração não foi verificada numa conta Google real ou num Drive montado neste ambiente. Testes exercitam as operações de arquivo, falhas de gravação, autorização, escolha de pasta, restauração e automação usando diretórios simulados nos testes de falha e um diretório real do armazenamento privado do navegador (OPFS) nos fluxos de gravação/restauração. O seletor de pasta é simulado nesses testes. A exportação/importação JSON e o diário foram verificados no navegador.
