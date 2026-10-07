# Afetivo

Diário pessoal, local e privado para acompanhar humor, emoções, sono, energia,
impulsos, medicações e contexto ao longo do tempo — com análise de padrões para
acompanhar mudanças e apoiar conversas clínicas.

> **Aviso:** o Afetivo é ferramenta pessoal de autorregistro. Não substitui
> avaliação profissional, diagnóstico, tratamento ou orientação de medicação.

## Recursos

| Área        | O que tem                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Registro    | Registro rápido em segundos, registro detalhado completo e múltiplos momentos por dia              |
| Resumo      | Ritual opcional de resumo do dia (humor/energia/nota) sem streaks nem punição                      |
| Diário      | Busca, filtros por humor, edição e exclusão em dois passos                                         |
| Medicações  | Cadastro de medicamentos e eventos (tomada, ajuste, pausa, reação) ligados ao histórico             |
| Padrões     | Gráficos de humor, ativação, sono e impulsos; afetivograma; timeline medicação × humor; tags       |
| Correlações | Pearson dia a dia entre humor × ativação/sono/impulsos (mínimo 5 dias, descritivo, sem causalidade) |
| Análise     | Resumo local determinístico de qualquer período; IA opcional no servidor com fallback local        |
| Acessos     | Login opcional por magic link (sem senha) e sincronização entre dispositivos via Supabase          |
| Portabilidade | Exportação JSON completa do backup (tudo local, nada passa pelo servidor)                         |

Princípios fixos: ausente é `null` (nunca zero), sem sequências/diarias
obrigatórias, alvos de toque de 44 px, textos do usuário nunca são reescritos e
exemplos fictícios (`isDemo`) ficam fora de todos os cálculos.

## Stack

- **Front:** React 19 + TypeScript + Vite (Rolldown) + Tailwind CSS 4
- **Estado/dados:** TanStack Query + Zustand + Zod + Dexie (IndexedDB local)
- **Backend opcional:** Supabase (Postgres + Row Level Security + Edge Functions)
- **Gráficos:** Recharts · **Testes:** Vitest + Testing Library

## Executar localmente

```bash
npm ci
npm run dev
```

Sem `.env` o app roda 100% local (sem conta, sem servidor). Para sincronização,
copie `.env.example` para `.env.local` e preencha:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Chave secreta **nunca** entra em variável `VITE_*` — o `anon key` é pública por
projeto. A chave de um provedor de IA (se usado) fica apenas no servidor, na
Edge Function.

## Qualidade

Pipeline executado a cada commit (também no CI do GitHub Actions):

```bash
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm test               # Vitest (unidade + componentes)
npm run build          # Build de produção
```

## Dados e privacidade

- Tudo fica no **IndexedDB do navegador**; sem conta não há servidor envolvido.
- **Migração v1:** na primeira abertura, registros do antigo `localStorage`
  (`afetivo_*_v2`/`_v1`) migram automaticamente para o schema atual — as chaves
  originais são preservadas e a migração roda uma única vez.
- **Backup:** Ajustes → "Exportar dados (JSON)" baixa o arquivo completo.
- **Sync opcional (Supabase):** crie um projeto gratuito, preencha as env vars
  acima, aplique o SQL do `supabase/` e use Ajustes → e-mail mágico. Sem login
  nada sai do dispositivo.
- **Análise com IA (opcional):** a Edge Function `supabase/functions/ai-analysis`
  recebe **só agregados do período** (nunca notas nem textos); sem provedor
  configurado ela responde `not_found` e o app usa a análise local. Veja
  [docs/PROVEDOR_IA.md](docs/PROVEDOR_IA.md).

## Deploy (Render)

Static Site no Render:

| Campo             | Valor                     |
| ----------------- | ------------------------- |
| Branch            | `main`                    |
| Build Command     | `npm ci && npm run build` |
| Publish Directory | `dist`                    |
| `NODE_VERSION`    | `24`                      |

SPA rewrite no Render: criar regra `/* → /index.html` (Redirect/Rewrite).
Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas env vars do site se
quiser sync/login em produção.

## Documentação complementar

- [docs/PROVEDOR_IA.md](docs/PROVEDOR_IA.md) — provedor de IA da Edge Function
- [docs/REVISAO.md](docs/REVISAO.md) — revisão de produto e decisões
- [docs/PESQUISA_TDAH_DIARIO_HUMOR.md](docs/PESQUISA_TDAH_DIARIO_HUMOR.md) — pesquisa de referência
- [docs/BUSCAS_TDAH_2026-10-06.json](docs/BUSCAS_TDAH_2026-10-06.json) — resultados de busca
- [docs/BACKUP_PASTA_DRIVE.md](docs/BACKUP_PASTA_DRIVE.md) — fluxo de pasta do Drive da versão anterior
