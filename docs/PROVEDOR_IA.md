# Adaptação para provedores de IA

O Afetivo funciona atualmente sem IA. A análise é calculada no navegador pelo
provedor `local`, sem chave e sem transmitir os registros. A interface comum
fica em `src/services/analysisProvider.ts`.

`PatternAnalysisProvider` recebe um `PatternAnalysisRequest` e devolve um
`PatternAnalysisResult`. Assim, um provedor futuro pode usar OpenAI, Anthropic,
Gemini, um modelo hospedado localmente ou outro serviço sem alterar o formato
dos registros nem os componentes que exibem a análise.

## Como adicionar um provedor externo

1. Implemente `PatternAnalysisProvider` em um backend ou função serverless.
2. Guarde a chave somente nesse ambiente confiável. Nunca use uma variável
   `VITE_*` para uma chave secreta, pois ela seria incorporada ao JavaScript.
3. Envie apenas os dados necessários e somente após uma ação clara do usuário.
4. Valide entrada e saída, imponha autenticação, limite de uso e timeout.
5. Preserve o provedor local como fallback quando o serviço estiver indisponível.
6. Identifique na interface o provedor usado e explique quais dados saem do
   dispositivo.

O contrato não pressupõe um fornecedor. Uma integração externa também deve
manter os limites do produto: não inventar observações, não interpretar campos
ausentes como zero e não produzir diagnóstico, prognóstico ou orientação de
medicação.
