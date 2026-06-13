# Relatório de extração pública

## SIMMples GASO

Conteúdo público identificado:

- Título: SIMMples GASO.
- Blocos: Parâmetros; Eletrólitos / Refino; Distúrbio Primário; Compensação / Secundário; Refino Metabólico.
- Campos: pH, pCO2, HCO3, Na, Cl, Alb.
- Ações: Copiar Relatório Clínico; Acessar SIMMples VENT.

## SIMMples VENT

Conteúdo público identificado:

- Título: SIMMples VENT.
- Blocos: Proteção Pulmonar; Gasometria Dinâmica; Mecânica Ventilatória; Relação P/F & Índice ROX; Paciente em Crise (DOPES); Assincronias.
- Campos principais: sexo, altura, peso predito, VT 6/8 mL/kg, pCO2, FR, alvo, pO2, FiO2, PEEP, volume corrente, pressão de platô, P/F e ROX.
- Assincronias: esforço ineficaz, duplo disparo, ciclagem prematura, ciclagem tardia, fome de fluxo.

## SIMMples Calc

Conteúdo público identificado:

- Título: SIMMples Calc.
- Blocos/elementos: VIS, Acesso Central, Acesso Periférico, Peso, Vazão Atual, Quantidade, Volume, Ver Tabela de Titulação e Copiar Prescrição.
- O módulo foi reconstruído como base visual configurável, sem tabela medicamentosa embutida.

## Limitações

- Não é possível obter o repositório privado original, histórico Git, arquivos TypeScript/React originais ou variáveis de ambiente apenas a partir da URL pública.
- O que foi produzido é uma reconstrução limpa, modular e editável, baseada na interface renderizada e na identidade visual pública.

## v11 — SIMM AI
- Adicionada função serverless `/api/simm-ai.js`.
- Adicionado componente `AiPanel` em todos os módulos via `AppShell`.
- A IA usa o contexto visível da tela e não modifica cálculos, conteúdos ou animações.
- Requer `OPENAI_API_KEY` como variável de ambiente na Vercel.
