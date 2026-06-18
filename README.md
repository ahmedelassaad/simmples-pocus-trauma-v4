# SIMMples Suite v18 — Clinical OS

Versão com redesign visual contemporâneo, busca inteligente de ECG e o novo SIMMples Plantão.

## Principais mudanças

- Nova linguagem visual: navy profundo, ciano elétrico, roxo, verde, amarelo e vermelho semânticos.
- Cards curvos, superfícies translúcidas, transições e feedbacks visuais.
- Valores clínicos com coloração semântica em todos os módulos.
- Busca do SIMMples ECG com busca parcial, aliases, siglas e tolerância a erros de digitação.
- Integração entre módulos e SIMMples Plantão pelo botão Plantão em relatórios.
- SIMMples Plantão com cofre local AES-GCM, pacientes, evoluções, intercorrências, modelos, hipóteses locais, linha do tempo e backup criptografado.
- SIMMples INTOX ampliado com triagem ABCDE, toxidromes, ECG/laboratórios, gaps, biblioteca de agentes e resumo clínico.
- SIMMples PEÇONHA ampliado com animais, classificação dinâmica, exames dirigidos, soroterapia de referência, observação e notificação.

## Segurança do SIMMples Plantão

O cofre usa Web Crypto API com AES-GCM 256 e chave derivada por PBKDF2-SHA256. A senha não é armazenada. O armazenamento é local ao navegador e exige backup criptografado para evitar perda de dados.

Esta implementação não é um prontuário eletrônico certificado e não substitui o sistema institucional, políticas de privacidade, LGPD, governança clínica ou validação jurídica da instituição.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Vercel

A pasta pode ser publicada diretamente. O endpoint opcional de IA permanece em `/api/simm-ai.js` e depende da variável de ambiente configurada no projeto.
