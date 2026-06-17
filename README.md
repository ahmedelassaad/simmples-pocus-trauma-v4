# SIMMples Suite v9 — UX Premium

Suite pronta para Vercel com os módulos:

- SIMMples GASO
- SIMMples VENT
- SIMMples Calc
- SIMMples TRAUMA
- SIMMples SEPSE
- SIMMples POCUS

## v9

Versão baseada na v8, mantendo funcionalidades, conteúdo e cálculos. A v9 melhora a experiência de uso:

- visual mais clean;
- cards mais leves;
- resumo rápido no SIMMples Calc;
- atalhos de dose mínima/intermediária/máxima no Calc;
- navegação rápida entre apps;
- melhor responsividade mobile;
- resultados mais destacados;
- sem alteração nas animações do SIMMples VENT.

## Deploy Vercel

Framework: Vite  
Install command: `npm install`  
Build command: `npm run build`  
Output directory: `dist`

## SIMM Suite v10 — UX Clínica

Versão baseada na v9, mantendo conteúdo, cálculos e animações do VENT. Melhorias de UX:

- Ícones do menu inferior revisados por tema: Calc, VENT, POCUS, Trauma, GASO e Sepse.
- SIMMples Calc com fluxo guiado: droga → peso → dose → resultado.
- Campos numéricos com Enter/Próximo para avançar no mobile.
- Resultado rápido com etapas visuais e card fixo.
- Botões de limpar dose/vazão e novo paciente.
- Tabela de titulação colapsável para reduzir poluição visual.
- Ajustes de toque, espaçamento e responsividade mobile.

As animações dinâmicas do VENT não foram alteradas.

## SIMM AI — camada de inteligência artificial

A v11 inclui uma camada consultiva chamada **SIMM AI** em todos os módulos da suite. Ela não altera os cálculos determinísticos, protocolos, curvas do VENT ou conteúdos clínicos já implementados. A IA lê o contexto visível da tela e pode ajudar a explicar, resumir e checar campos ausentes.

### Variáveis de ambiente necessárias na Vercel

Configure no projeto da Vercel:

```txt
OPENAI_API_KEY=cole_sua_chave_aqui
```

Opcionalmente, defina o modelo:

```txt
OPENAI_MODEL=gpt-4.1-mini
```

A chave fica no backend serverless em `/api/simm-ai.js`; ela não é exposta no navegador.

### Funções disponíveis

- Explicar tela
- Checar campos
- Gerar resumo
- Dupla checagem
- Pergunta livre sobre a tela atual

A IA é uma camada consultiva e não substitui protocolo local, dupla checagem, decisão médica ou os cálculos determinísticos da suite.

## v13 — ECG explicativo e traçados revisados
- Explicações breves por padrão de ECG.
- Derivações afetadas, número/grupo de derivações, território e intervalos relevantes.
- Critérios práticos de reconhecimento por ritmo, bloqueio e padrão IAM/OMI.
- Traçados SVG dinâmicos revisados para morfologia mais fidedigna por derivação.
- Mantido todo o conteúdo da v12 e sem alterar cálculos/curvas do VENT.
