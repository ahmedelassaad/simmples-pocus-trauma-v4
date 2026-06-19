# SIMMples Suite v19 — Plantão refinado e revisão de qualidade

Versão de acabamento da SIMMples Suite com revisão visual e textual do SIMMples Plantão, preservando todas as funcionalidades da v18.

## Melhorias do SIMMples Plantão

- Botões de adicionar paciente, bloquear cofre, salvar modelo, registrar evolução, importar/exportar backup e confirmar ações redesenhados.
- Ícones em superfícies próprias, hierarquia tipográfica, microinterações, brilho discreto e estados de hover/toque/foco.
- Botão “Salvar como modelo” com descrição contextual e melhor responsividade no celular.
- Diálogos de confirmação atualizados para o mesmo sistema visual.
- Higienização das hipóteses diagnósticas para impedir fragmentos vazios, pontuação quebrada e textos como “Pista .”.
- Resumo completo dos elementos clínicos reconhecidos em cada hipótese.
- Remoção automática de modelos ou registros corrompidos/incompletos ao abrir cofres antigos.
- Normalização segura de dados importados de versões anteriores.
- Respostas opcionais da SIMM AI passam por limpeza textual antes de serem exibidas.

## Compatibilidade

- Cofres criptografados criados na v18 continuam compatíveis.
- Pacientes, modelos, linha do tempo e preferências existentes são preservados.
- Nenhum módulo clínico anterior foi removido.

## Segurança

O SIMMples Plantão usa Web Crypto API, AES-GCM 256 e PBKDF2-SHA256. A senha não é armazenada. O cofre permanece local ao navegador e exige backup criptografado para reduzir risco de perda de dados.

Esta ferramenta não é um prontuário eletrônico certificado e não substitui o sistema institucional, a governança clínica, políticas de privacidade ou validação jurídica/LGPD.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## v20 — motor clínico local e navegação horizontal

A versão v20 substitui a associação simples por palavras por um motor clínico determinístico com contexto, negação, dados objetivos, combinações sindrômicas e limiares de coerência. A navegação horizontal recebeu um novo componente com arraste, setas, indicador de posição e suporte a toque.

Validação rápida do motor:

```bash
node scripts-clinical-reasoning-check.mjs
```

## v21 — Plantão com interações restauradas

A versão v21 corrige a regressão introduzida no componente de navegação horizontal da v20. Botões dentro de trilhos horizontais voltaram a receber cliques normalmente, sem perder rolagem por toque, setas ou arraste em áreas livres.

Principais correções:

- atalhos de preenchimento rápido voltaram a inserir conteúdo nos campos corretos;
- a aba Hipóteses voltou a responder normalmente;
- cartões de hipótese agora podem ser expandidos;
- cada hipótese pode ser adicionada diretamente à impressão diagnóstica;
- o foco é levado automaticamente ao campo alterado;
- inserções repetidas idênticas não duplicam o mesmo trecho;
- suporte defensivo para navegadores sem `ResizeObserver`;
- motor clínico ampliado para reconhecer descrições comuns de dor torácica isquêmica.
