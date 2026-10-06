# Diário de humor adaptado ao uso por pessoas com TDAH

Atualizado em 6 de outubro de 2026, após liberação e verificação do acesso à internet.

## Objetivo e alcance

Adaptar o Afetivo para **acompanhar humor, emoções, contexto e registros pessoais**, facilitando o uso por uma pessoa com TDAH. O objetivo é reduzir esforço de preenchimento e tornar os dados compreensíveis. Não é avaliar uma intervenção para tratar TDAH.

Este documento reúne uma pesquisa narrativa direcionada, com rastreabilidade das consultas. Não é uma revisão sistemática própria: não houve busca exaustiva, triagem em duplicata, avaliação formal de risco de viés ou GRADE. O público considerado é adulto; resultados de populações mistas ou de outras condições não foram tratados como evidência específica para adultos com TDAH. A interface ainda precisa de avaliação de usabilidade com pessoas com TDAH.

## Consulta efetivamente realizada

Fontes acessadas: Europe PMC REST, incluindo registros MEDLINE/PubMed e resumos; XML completo de Beheshti et al.; página de recomendações NICE NG87. A primeira tentativa de acesso foi bloqueada, mas as consultas desta atualização retornaram resultados. Shaw et al. foi consultado pelo resumo: a tentativa de obter seu XML completo retornou erro 500.

Foram realizadas 19 consultas direcionadas: oito iniciais, sete complementares, três sobre EMA em adultos/modelo afetivo e uma para localizar o artigo de Posner et al. O [registro das buscas](BUSCAS_TDAH_2026-10-06.json) contém expressões, totais retornados, identificadores dos resultados recuperados e metadados das referências selecionadas. As consultas tiveram limites de 3 a 5 resultados por expressão e não percorreram todas as páginas. Os totais não representam estudos incluídos nem artigos integralmente avaliados. Três buscas iniciais por autor/título não retornaram resultados e foram reformuladas.

Exemplos das expressões realmente executadas:

```text
ADHD emotion dysregulation meta-analysis
EXT_ID:24480998
TITLE:"Emotion dysregulation in adults with attention deficit hyperactivity disorder"
ADHD AND ecological momentary assessment AND review
(TITLE:"ecological momentary" OR TITLE:"daily life")
  AND TITLE:"ADHD" AND (TITLE:"adult" OR TITLE:"adults")
TITLE:"emotional lability" AND (AUTH_LAST:Skirrow OR AUTH_LAST:Asherson)
TITLE:"Efficacy of journaling"
TITLE:"circumplex model of affect" AND FIRST_PDATE:[2005-01-01 TO 2005-12-31]
```

## Evidências e implicações para o registro

| Fonte e acesso | Achado relevante | Limite e implicação no Afetivo |
| --- | --- | --- |
| [NICE NG87, recomendações 1.4.5 e definição de modificações ambientais](https://www.nice.org.uk/guidance/ng87/chapter/Recommendations), texto da página consultado | Orienta adaptar informação ao estilo e à capacidade cognitiva e às necessidades individuais. Exemplos de modificações incluem reduzir distrações, instruções escritas e períodos menores de foco. | É uma diretriz de cuidado, não um teste desta interface. Sustenta a direção geral de instruções claras e etapas menores; a escolha de duas perguntas é uma decisão de produto. |
| [Shaw et al., 2014, PMID 24480998](https://pubmed.ncbi.nlm.nih.gov/24480998/), resumo consultado | Revisão descreve dificuldades de regulação emocional associadas ao TDAH ao longo da vida e sua contribuição ao prejuízo funcional. Discute diferentes modelos explicativos. | Não significa que toda pessoa com TDAH tem o mesmo padrão. Justifica oferecer registro de emoções sem inferir diagnóstico ou presumir o estado da pessoa. |
| [Beheshti et al., 2020, DOI 10.1186/s12888-020-2442-7](https://pmc.ncbi.nlm.nih.gov/articles/PMC7069054/), XML completo acessado; resumo, discussão e limitações examinados | Meta-análise com 13 estudos, N=2.535. O resumo informa maior desregulação emocional em adultos com TDAH que em controles, g=1,17, e associação entre gravidade de sintomas e desregulação, r=0,54. | Instrumentos diferentes; dados insuficientes para controlar moderadores por meta-regressão; heterogeneidade e possíveis estudos ausentes. Efeitos de grupo não classificam um indivíduo nem validam os escores do diário. |
| [Poetar e Nistor, 2026, PMID 42126465](https://pubmed.ncbi.nlm.nih.gov/42126465/), resumo consultado | Revisão sistemática de EMA em desregulação emocional no TDAH: 33 estudos, aproximadamente 2.678 participantes, busca até abril de 2025. Relata capacidade de capturar variação cotidiana e taxas de cumprimento de 60–99%. | Populações de diferentes idades e protocolos diversos. Cumprimento em pesquisa não é retenção do app; não define frequência ideal. Apoia registrar momentos sem exigir uma sequência diária. |
| [Skirrow et al., publicação eletrônica 2014, PMID 25066432](https://pubmed.ncbi.nlm.nih.gov/25066432/), resumo consultado | Avaliação ambulatória em 41 homens com TDAH e 47 controles; oito registros/dia durante uma semana de trabalho. Observou diferenças em irritabilidade/frustração e relação com eventos cotidianos. | Amostra restrita a homens, sem comorbidade, medicação atual ou uso de substâncias. Não generalizar nem copiar oito perguntas por dia como recomendação. Apoia conservar data, horário e contexto. |
| [Yitzhak et al., 2025, PMID 40849121](https://pubmed.ncbi.nlm.nih.gov/40849121/), resumo consultado | 57 jovens adultos com TDAH e 54 controles, cinco relatos de emoção/dia por cinco dias. Maior variabilidade intraindividual no grupo TDAH; **não encontrou diferenças de grupo na labilidade** entre/nos dias. | Variabilidade e labilidade são medidas diferentes. Resultados não sustentam um “índice de estabilidade” simples ou uma classificação pessoal automática. |
| [Ben-Dor Cohen et al., publicação eletrônica 2023, PMID 37971947](https://pubmed.ncbi.nlm.nih.gov/37971947/), resumo consultado | Estudo misto com 60 jovens adultos com TDAH, EMA por cinco dias. Descreve diferenças de autoconsciência e estratégias, esforço, preferências individuais e temporalidade. | Observacional; não demonstra que uma estratégia cause melhora. Apoia contexto e avaliação de apoio escolhidos pela pessoa, em vez de considerar frequência como eficácia. |
| [Shiffman, Stone e Hufford, 2008, PMID 18509902](https://pubmed.ncbi.nlm.nih.gov/18509902/), resumo consultado | Revisão metodológica de EMA: relatos repetidos no ambiente cotidiano visam reduzir viés de memória e observar mudanças ao longo do tempo/contexto. | Autorrelato continua sujeito a vieses. Um check-in voluntário do Afetivo não equivale a um protocolo de EMA validado. Separar “agora” de “resumo do dia”. |
| [Posner, Russell e Peterson, 2005, PMID 16262989](https://pubmed.ncbi.nlm.nih.gov/16262989/), resumo consultado | Modelo circumplexo distingue dimensões de valência e ativação dos estados afetivos. | Referência conceitual geral, não específica de TDAH. Separar agradável/desagradável de pouco/muito ativado melhora a definição do dado; os itens próprios não passam a ser uma escala validada. |
| [Sohal et al., 2022, PMID 35304431](https://pubmed.ncbi.nlm.nih.gov/35304431/), resumo consultado | Revisão de 20 ensaios de journaling sobre TEPT, ansiedade e depressão; relata grande heterogeneidade e limitações metodológicas. | Não é evidência específica para diário de humor em TDAH. Não justificar escrita longa obrigatória ou benefício clínico do Afetivo com esta fonte. |
| [Watkins, 2008, PMID 18298268](https://pubmed.ncbi.nlm.nih.gov/18298268/), resumo consultado | Revisão diferencia consequências construtivas e não construtivas do pensamento repetitivo, dependentes de conteúdo, contexto e grau de abstração. | Não avaliou esta interface nem demonstra que todo diário causa ruminação. Sugere prudência com reflexão extensa obrigatória: notas são opcionais e a pessoa pode parar. |

Também foram consultados os resumos de [Faraone et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33549739/), [López et al., 2018](https://pubmed.ncbi.nlm.nih.gov/29566425/) e do [estudo de viabilidade de intervenção combinada de 2024](https://pubmed.ncbi.nlm.nih.gov/38231536/). Eles contextualizam o tema, mas não foram usados para atribuir efeitos terapêuticos ao diário ou às mudanças de interface. Safren et al., listado no protocolo inicial, não foi consultado nesta atualização.

## Decisões implementadas

| Mudança | Relação com a evidência e o problema observado |
| --- | --- |
| Duas perguntas iniciais: sensação agradável/desagradável e ativação; detalhes em seções opcionais | Evitar a antiga combinação de euforia, energia, serenidade e tristeza numa única interpretação. O tamanho do núcleo é uma hipótese de usabilidade, não um protocolo comprovado. |
| Valores inicialmente ausentes, inclusive humor, sono, energia e sintomas; possibilidade de salvar sem escrever | A interface anterior salvava defaults como 7,5h e “sono bom”. Ausência de resposta agora é `null`, não uma observação presumida. |
| Vários registros por dia, diferenciando momento e resumo do dia | Conservar a dimensão temporal e evitar substituição automática. Registros do mesmo dia são contados separadamente de dias registrados. |
| Contextos como iniciar/trocar tarefa, interrupções, estímulos e interação difícil | Lembretes opcionais ligados ao cotidiano; não são lista diagnóstica nem prova de causalidade. |
| Desfechos de impulso sem “cedeu/resistiu” ou adiamento de 15 minutos presumido | Descrever o ocorrido sem avaliar sucesso/fracasso. “Não percebi impulsos” é uma resposta explícita, distinta de seção não preenchida. |
| Apoios com avaliação opcional: ajudou, em parte, não ajudou, não sei | Uma estratégia frequente não é automaticamente a mais eficaz. A avaliação é subjetiva e não identifica efeito causal. |
| Gráficos separados por escala, pontos datados e sem interpolar respostas ausentes | Os dados antigos mantêm seu significado. Pontos mostram registros, não um estado contínuo inferido em dias sem resposta. |
| Resumo descritivo, cobertura por respostas e dias, sem pontuação de estabilidade, evolução ou recomendações automáticas | Evitar falsa precisão. Não misturar momentos e resumos em conclusões sobre “dias melhores”. |
| Relatório e análise locais; contrato neutro para um provedor futuro opcional | Registrar e consultar não exige serviços externos nem chave. Um provedor futuro poderá ser conectado sem alterar os registros e deverá tornar explícito o que for enviado. |
| Primeiro acesso vazio; demonstração identificada e fora dos resumos pessoais | Dados fictícios não devem parecer observações do usuário. |

## Compatibilidade e integridade

Os registros antigos permanecem na escala original (`legacy`); os novos usam `valence`. Uma edição conserva os campos antigos e só troca a escala se a pessoa escolher uma resposta nova de humor. Dados pessoais existentes não são reinterpretados para tentar descobrir respostas que a interface antiga presumiu.

Backup JSON passa a informar versão 3.0, mantendo importação de formatos anteriores. CSV acrescenta escala, tipo de registro, ativação, contextos, próximo passo, avaliação do apoio, seções respondidas e identificação de demonstração. Campos não respondidos ficam vazios. A aplicação continua com armazenamento local no navegador.

## Como avaliar a adaptação com usuários

As escolhas de interface precisam de testes de uso com pessoas com TDAH. Avaliar compreensão de humor versus ativação, esforço percebido, facilidade de pular perguntas e retomar, encontrabilidade de registros e entendimento das lacunas. Medir o tempo observado sem prometer um prazo ideal. Investigar sobrecarga e autocobrança. Não usar quantidade de registros, uso contínuo ou médias de humor como medida isolada de sucesso do usuário.

Ainda não foram implementados lembretes, salvamento automático de rascunhos, sincronização entre dispositivos, questionários clínicos ou avaliações causais. Devem ser considerados a partir da necessidade da pessoa e de testes de uso, sem aumentar a carga do registro.
