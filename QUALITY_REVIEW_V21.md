# Revisão de qualidade — SIMMples Suite v21

## Regressão corrigida

O componente `HorizontalRail` iniciava captura de ponteiro sobre elementos interativos. Pequenos movimentos entre `pointerdown` e `click` podiam cancelar o clique de botões internos, afetando:

- atalhos de inserção rápida;
- abas do SIMMples Plantão;
- outros botões posicionados em trilhos horizontais.

A v21 ignora o mecanismo de arraste quando o gesto começa em botão, link, campo, label ou elemento interativo. O arraste permanece disponível nas áreas livres do trilho.

## Hipóteses diagnósticas

- cartões expansíveis por clique;
- detalhes clínicos exibidos sob demanda;
- botão explícito para adicionar a hipótese à impressão diagnóstica;
- prevenção de duplicação da mesma hipótese;
- retorno automático à evolução após a inserção.

## Preenchimento rápido

- atualização funcional do estado, evitando perda de inserções em cliques sucessivos;
- foco e rolagem automática para o campo correspondente;
- prevenção de duplicação do mesmo trecho.

## Validações executadas

- build Vite de produção;
- teste de clique em botão dentro de `HorizontalRail`;
- criação de cofre e paciente;
- inserção rápida em exame físico;
- acesso à aba Hipóteses;
- inserção de hipótese na impressão diagnóstica;
- 14 cenários do motor clínico determinístico, incluindo negações e dor torácica típica.
