# TeaClient desktop visual refresh

## Objetivo

Modernizar a tela principal do TeaClient com aparência inspirada em Bootstrap, mantendo a paleta escura existente, os acentos atuais, as ações e o comportamento dos componentes. A primeira entrega será visual e exclusiva do build desktop.

## Escopo

- Toolbar com grupos de ações, dimensões uniformes e alinhamento consistente.
- Painéis principais com espaçamento baseado em 8px, bordas discretas e cantos arredondados de 6–8px.
- Árvore lateral com largura mínima equilibrada e separação visual clara.
- Área central com hierarquia melhor definida para estados de conexão e conversas.
- Rodapé alinhado, legível e visualmente integrado aos painéis.
- Estados de hover, ativo, desabilitado e foco visíveis.
- Transições discretas, respeitando `prefers-reduced-motion`.
- Manutenção do redimensionamento dos painéis e de todos os eventos existentes.

## Abordagem técnica

Será criada uma camada de estilo específica para o cliente desktop, usando uma classe de escopo no componente raiz da aplicação. Os estilos compartilhados continuarão disponíveis para a versão web, mas as regras do redesign só serão ativadas quando `__build.target` for `client`.

Não será adicionada a dependência Bootstrap. Os tokens visuais serão definidos em SCSS, reutilizando as cores e variáveis já existentes no projeto. Alterações de React serão limitadas à aplicação da classe de escopo e a pequenos agrupamentos semânticos que sejam necessários para estilização.

## Organização visual

1. Barra superior: menus preservados, com altura, padding e estados de interação uniformes.
2. Toolbar: ações agrupadas por função, separadores discretos e botões quadrados com área de clique consistente.
3. Conteúdo: árvore lateral, divisor redimensionável e área de conversas/log com espaçamento uniforme.
4. Rodapé: informações de versão e conexão alinhadas nas extremidades, sem competir com o conteúdo.

## Segurança e compatibilidade

Nenhuma entrada, evento, protocolo de conexão ou permissão será alterado. Os seletores serão escopados ao cliente para reduzir regressões na versão web. A mudança não introduzirá chamadas externas nem dependências novas.

## Validação

- Compilar o build web e o build client.
- Verificar que a versão web não recebe as regras desktop.
- Abrir o cliente e testar toolbar, menus, redimensionamento, conexão e fechamento.
- Conferir foco de teclado, contraste e comportamento com redução de movimento.
- Comparar a tela inicial com o print de referência em resolução desktop.
