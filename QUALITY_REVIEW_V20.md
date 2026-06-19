# SIMMples Suite v20 — revisão de qualidade

## Navegação horizontal
- Componente reutilizável `HorizontalRail` aplicado às abas, ao seletor de ECG, ao resumo pediátrico, aos atalhos do Plantão e ao dock da Suite.
- Scrollbar nativa escondida nas navegações e substituída por trilho luminoso, indicador de posição e setas contextuais.
- Suporte a toque, roda/trackpad, arraste com mouse, scroll suave e scroll snapping.
- Tabelas e galerias que precisam manter scrollbar nativa receberam visual fino, arredondado e em gradiente.

## Motor clínico local
- Novo arquivo `src/lib/clinicalReasoning.js`.
- Reconhecimento de conceitos clínicos por sinônimos e termos equivalentes.
- Leitura separada de queixa, história, exame, POCUS, impressão, notas e eventos.
- Pesos diferentes conforme a origem da informação.
- Reconhecimento de negações e frases de contraste.
- Extração de dados objetivos: FC, FR, SpO2, PAS, temperatura, lactato e glicemia.
- Regras combinatórias e limiares mínimos para reduzir hipóteses irrelevantes.
- Exibição de elementos favoráveis e contrários.
- O índice exibido mede coerência interna da regra, não probabilidade diagnóstica.

## Casos automatizados
13 cenários testados: SCA, negação de sintomas, sepse urinária, TEP, AVC, HSA, asma, HDA, convulsão, opioide, negação em lista, contraste após negação e SCA sem dor típica.

## Build
- Vite build concluído sem erros.
- 1774 módulos transformados.
