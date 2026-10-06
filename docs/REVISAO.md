# Revisão funcional do Afetivo

Foram revisados os componentes da interface, os fluxos de registro e medicação, o armazenamento e a migração local, os backups, a geração local de análises e relatórios e os scripts de instalação e execução.

## Falhas corrigidas

| Problema | Correção |
| --- | --- |
| Excluir medicamento ou registro não funcionava em telas incorporadas que bloqueiam `window.confirm`. | Confirmação dentro do aplicativo, com cancelar, confirmar, Escape e foco controlado pelo diálogo. |
| “Limpar Tudo” deixava o diário vazio só até a próxima recarga ou exportação. | Persistência explícita das listas vazias, incluindo migração de listas legadas vazias. |
| Um registro novo substituía outro da mesma data sem aviso. | Novos registros são adicionados por identificador, permitindo vários momentos no mesmo dia; edição altera somente o registro selecionado. |
| O registro rápido declarava medicamentos como tomados sem marcação do usuário, incluindo itens pausados. | Apenas itens ativos são oferecidos em novos registros; uma tomada só é salva após marcação explícita. |
| A cópia do registro anterior podia usar o mais antigo da lista e carregar medicamentos excluídos. | O novo registro começa sem respostas e não copia observações anteriores. A cópia foi retirada para evitar presumir o estado atual. |
| Editar podia perder latência de sono e ocultar medicamentos removidos que faziam parte do histórico. | Preservação dos campos opcionais e apresentação do histórico de itens removidos. |
| Remover o último treino ou impulso podia recriá-lo ao salvar. | Desativação do respectivo grupo quando a última ocorrência é removida. |
| Erros de armazenamento eram engolidos, e a interface dizia que o registro estava salvo antes de gravá-lo. | Gravação antes da atualização da interface, mensagens de falha e preservação do formulário. |
| Os nomes de medicamentos e textos do diário eram reescritos automaticamente durante salvamento e carregamento. | Normalização dos campos antigos sem alterar o texto escrito pelo usuário. |
| Backups com campos inválidos podiam quebrar a interface ou substituir apenas parte dos dados. | Validação dos registros, listas internas, medicamentos, perfil, datas, faixas e identificadores antes da gravação; restauração dos valores anteriores quando uma gravação falha. |
| Importações sobrescreviam o diário sem confirmação. | Confirmação antes de restaurar o arquivo. |
| Relatórios usavam quantidade de registros como período; o servidor ignorava o filtro; respostas atrasadas podiam trocar o relatório atual. | Filtro por dias do calendário, incluindo a opção de todo o histórico, e cancelamento de requisições anteriores. |
| Falha ao copiar texto podia exibir “Copiado!” e gerar rejeição não tratada. | Confirmação da cópia somente após sucesso e mensagem com alternativa para baixar o arquivo. |
| A impressão incluía a página de fundo. | Layout de impressão restrito ao relatório. |
| Indicadores misturavam humor neutro (0) com a faixa de estabilidade (−1 a +1). | Indicadores de estabilidade/evolução foram retirados. Humor agradável/desagradável e ativação são registrados separadamente. |
| Relatórios afirmavam redução de ansiedade mesmo quando ela aumentava, e a análise local inventava gatilhos ou alertas. | Resumo descritivo, sem comparativos causais, gatilhos fictícios ou alertas prognósticos. |
| Uma data em UTC podia aparecer como o dia seguinte à noite no Brasil. | Datas de registro e de arquivos de exportação usam o calendário local. |
| A análise opcional dependia de uma chave Gemini e enviava dados para um servidor. | Análise totalmente local, sem chave ou transmissão, com contrato neutro para conectar qualquer provedor futuramente. |
| O servidor Express era necessário apenas para a integração externa e dificultava hospedagem estática. | Aplicação convertida em build Vite estático, compatível com Vercel, Cloudflare Pages, Netlify e serviços equivalentes. |
| Nomes livres como `__proto__` podiam interferir nos contadores; textos exportados podiam ser interpretados como fórmulas pela planilha. | Contadores sem propriedades herdadas e proteção dos campos de texto no CSV. |

## Executar e verificar

```sh
npm ci
npm run lint
npm test
npm run build
npm run test:browser
```

Os testes de navegador usam Chromium. No ambiente preparado, `/usr/bin/chromium` já está disponível. Em outra máquina, use `npx playwright install chromium` ou defina `CHROMIUM_EXECUTABLE_PATH` para um Chromium instalado. A suíte de navegador inicia e encerra o Vite e usa dados de teste isolados.

Desenvolvimento: `npm run dev`. Para conferir o build localmente: `npm run build` e `npm start`. Node 24 foi usado na validação. Em uma hospedagem, publique a pasta `dist` como site estático.

## Limitações e pontos para uma implantação pública

- Não há provedor externo de IA ativo. O contrato para um adaptador futuro está documentado em [PROVEDOR_IA.md](PROVEDOR_IA.md); chaves e chamadas externas deverão ficar em um backend autenticado.
- O histórico principal continua no `localStorage` do navegador. A pasta sincronizada pelo Drive permite criar backups durante a sessão, mas não transforma o armazenamento local em sincronização entre dispositivos.
- A frequência “2x ao dia” continua registrada como um status por medicamento em cada registro diário; não há controle individual de cada dose. O resumo conta respostas de uso, sem porcentagem de adesão ou prescrição calculada.
- Backups que já tiveram nomes ou textos alterados pela versão anterior não permitem recuperar automaticamente o texto original. A correção impede novas alterações desse tipo.

As alterações estão no checkout local. Nenhum deploy ou publicação do aplicativo faz parte desta revisão.

A adaptação para uso por pessoas com TDAH e as fontes consultadas estão em [PESQUISA_TDAH_DIARIO_HUMOR.md](PESQUISA_TDAH_DIARIO_HUMOR.md). Registros novos têm perguntas opcionais, valores ausentes explícitos e tipos momento/resumo do dia. A demonstração é identificada e excluída dos relatórios pessoais.

O backup em pasta sincronizada pelo Drive foi implementado sem OAuth ou Google Cloud. Veja [BACKUP_PASTA_DRIVE.md](BACKUP_PASTA_DRIVE.md) para preparar a pasta, ativar cópias nesta sessão e restaurar dados.
