# SIMMples Suite — POCUS + Trauma completos

Base React/Vite para manter a identidade visual dos aplicativos SIMMples e acelerar novos módulos da Emergência SIMM.

Esta versão prioriza dois apps completos:

- `SIMMples POCUS` — RUSH/choque, eFAST/trauma, dispneia, DVT/aorta, integração automática de fenótipo e laudo copiável.
- `SIMMples TRAUMA` — avaliação fisiológica, hemorragia oculta, eFAST, ABC score, RABT simplificado, SI/MSI/Age SI, metabolismo, alertas e evolução copiável.

A suite também preserva os módulos-base já reconstruídos:

- `SIMMples GASO`
- `SIMMples VENT`
- `SIMMples Calc`
- `SIMMples SEPSE`

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse:

- `/` — hub da suite
- `/trauma`
- `/pocus`
- `/gaso`
- `/vent`
- `/calc`
- `/sepse`

## Build

```bash
npm run build
npm run preview
```

O build foi testado com sucesso nesta entrega.

## Deploy na Vercel

1. Suba esta pasta para um repositório GitHub.
2. Importe na Vercel.
3. Framework: `Vite`.
4. Build command: `npm run build`.
5. Output directory: `dist`.

Para publicar como apps separados, crie três projetos Vercel apontando para o mesmo repositório e use rewrites/domínios para abrir diretamente `/pocus` e `/trauma`, ou duplique o app removendo as rotas não usadas.

## Identidade visual

A identidade mantém:

- Fundo azul-marinho profundo.
- Destaques em ciano.
- Cards translúcidos com borda ciano.
- Tipografia forte e compacta para uso mobile.
- Logo carregado via URL pública dos apps atuais.

O logo está configurado em:

```js
src/brand.js
```

Para produção, o ideal é baixar o PNG oficial da SIMM, colocar em `public/logo-simm.png` e alterar `logoUrl` para `/logo-simm.png`.

## SIMMples TRAUMA — o que foi implementado

Arquivos principais:

- `src/apps/TraumaApp.jsx`
- `src/lib/trauma.js`

Funcionalidades:

- Entrada rápida: idade, peso, tempo desde trauma, mecanismo, alta energia, anticoagulação e estado neurológico.
- ABCDE fisiológico: PAS, PAD, FC, FR, SpO₂, temperatura, GCS e PAM estimada.
- Hemorragia/eFAST: sangramento externo, pelve, ossos longos e janelas FAST positivas.
- Perfusão/coagulopatia: pH, lactato, base excess, Hb, INR e cálcio iônico.
- Cálculos automáticos:
  - PAM.
  - Pressão de pulso.
  - Shock Index.
  - Modified Shock Index.
  - Age Shock Index.
  - ABC score.
  - RABT simplificado.
  - Hipoperfusão oculta.
- Classificação automática:
  - Alto risco hemorrágico.
  - Risco intermediário / observação agressiva.
  - Baixo risco com alerta isolado.
  - Sem alerta automático relevante.
- Alertas e prioridades:
  - Protocolo de hemorragia/massiva transfusão.
  - Controle de fonte.
  - Pelvic binder.
  - Repetição de lactato/BE.
  - Prevenção de hipotermia.
  - Monitorização/correção de cálcio conforme protocolo.
  - Lembrete de TXA se sangramento significativo e janela temporal compatível.
- Evolução copiável para prontuário.

## SIMMples POCUS — o que foi implementado

Arquivos principais:

- `src/apps/PocusApp.jsx`
- `src/lib/pocus.js`

Funcionalidades:

- Modos de exame:
  - Choque / RUSH.
  - Trauma / eFAST.
  - Dispneia aguda.
  - Vascular / DVT / aorta.
- Pump/cardíaco:
  - Contratilidade de VE.
  - VD normal/dilatado/muito dilatado.
  - Strain de VD.
  - Derrame pericárdico.
  - Sinais de tamponamento.
  - VCI.
- Tank/pulmão:
  - Perfil A.
  - Perfil B difuso.
  - B-lines focais.
  - Perfil misto.
  - Ausência de lung sliding.
  - Lung point.
  - Derrame pleural.
  - Consolidação.
  - Excursão diafragmática.
- eFAST/abdome/aorta:
  - RUQ/Morrison.
  - LUQ/esplenorrenal.
  - Pelve.
  - Pericárdio.
  - Aorta abdominal.
  - Bexiga distendida.
  - Hidronefrose.
  - Achado biliar relevante.
- Pipes/DVT:
  - Femoral direita/esquerda.
  - Poplítea direita/esquerda.
- Integração automática de fenótipos:
  - Cardiogênico/congestivo.
  - Hipovolêmico/hemorrágico.
  - Obstrutivo por tamponamento.
  - Obstrutivo por pneumotórax.
  - TEP com repercussão.
  - Síndrome intersticial/alveolar difusa.
  - Processo pulmonar focal.
  - Aorta crítica.
  - Retenção/obstrução urinária.
- Checklist de completude.
- Laudo copiável para prontuário.

## Fontes clínicas usadas como base conceitual

- ABC score: Nunez et al., 2009; Callcut et al., 2016.
- RABT simplificado: Joseph et al., 2018.
- Hipoperfusão oculta em trauma: definições variáveis na literatura, com uso frequente de lactato/base excess apesar de sinais vitais normais.
- RUSH: conceito pump/tank/pipes descrito em literatura de POCUS de ressuscitação.
- POCUS emergencista: diretrizes ACEP de ultrassom de emergência e aplicações core.
- TXA: CRASH-2 e análises de tratamento precoce em trauma hemorrágico.

## Governança clínica

Antes de usar em assistência, valide fórmulas, faixas, textos e condutas com responsáveis técnicos da SIMM e dos serviços. Para módulos envolvendo medicações ou protocolos locais, prefira arquivos de configuração versionados e aprovados institucionalmente.

## Sobre o código fonte original

Os apps hospedados na Vercel expõem a interface e assets públicos, mas não expõem necessariamente o repositório original, componentes com nomes originais, histórico Git, variáveis de ambiente ou código fonte não minificado. Este pacote entrega uma reconstrução limpa, modular e editável, baseada na interface renderizada e na identidade visual pública.
