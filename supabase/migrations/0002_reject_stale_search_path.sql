-- Security Advisor: "Function Search Path Mutable" em afetivo_reject_stale.
-- A função de trigger LWW só lê NEW/OLD (nenhum objeto do schema),
-- então fixar search_path vazio é seguro e não altera o comportamento.
alter function public.afetivo_reject_stale() set search_path = '';
