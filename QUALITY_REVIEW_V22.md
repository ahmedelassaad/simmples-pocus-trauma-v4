# SIMMples Suite v22 — Revisão de navegação horizontal

## Problema corrigido
Os elementos usados como viewport horizontal recebiam regras posteriores de CSS com `width: max-content` e/ou `overflow: visible`. Assim, o próprio viewport crescia junto com os itens e deixava de possuir uma área interna rolável. O problema era mais perceptível no seletor de ECG, nas abas e no menu da Suite.

## Correções aplicadas
- Viewports horizontais agora possuem `width: 100%`, `min-width: 0` e `overflow-x: auto` com prioridade global.
- Removido o conflito de `width: max-content` dos viewports do menu e das abas.
- Novo motor único de arraste para mouse, caneta e toque.
- O gesto só é capturado após predomínio horizontal; a rolagem vertical da página continua livre.
- Cliques em botões continuam funcionando quando não existe arraste.
- Cliques acidentais são bloqueados após um gesto de arraste.
- Setas laterais permanecem visíveis também em telas touch como alternativa ao swipe.
- Suporte a teclado: setas, Home e End.
- Suporte a Shift + roda do mouse.
- Atualização automática das métricas com ResizeObserver e MutationObserver.
- Aplicação global em ECG, abas, menu da Suite, atalhos do Plantão e resumo pediátrico.
- Tabelas do Calc e galeria do AVC mantêm rolagem nativa otimizada para toque.

## Validação
- Build Vite concluído sem erros.
- 1774 módulos transformados.
- Regras finais de CSS verificadas após todas as regras legadas, evitando nova sobrescrita.
