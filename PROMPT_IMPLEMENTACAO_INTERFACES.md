# Prompt — Implementação das Interfaces do Lava Já Smart

## 1. Contexto do projecto

Desenvolve as interfaces do **Lava Já Smart**, uma plataforma digital para melhorar a experiência dos clientes e a gestão operacional do carwash Lava Já, localizado na Matola, Moçambique.

A solução será desenvolvida no contexto do Hackathon Moza xLab × Universidade Eduardo Mondlane (UEM), com um prazo de dois dias.

O objectivo é construir um MVP funcional, visualmente profissional, responsivo e instalável como Progressive Web App (PWA).

A aplicação destina-se exclusivamente ao carwash Lava Já. Não desenvolver funcionalidades de marketplace para gerir vários carwash independentes.

## 2. Stack e arquitectura obrigatórias

O projecto deve seguir esta arquitectura:

- Monorepo com pnpm Workspaces.
- `apps/web`: Next.js, React e TypeScript.
- `apps/api`: NestJS e TypeScript.
- `packages/database`: Prisma e SQLite.
- `packages/shared`: tipos e schemas partilhados, quando necessário.
- Tailwind CSS para estilização.
- API REST para comunicação entre frontend e backend.
- PWA com manifesto e service worker.

Toda a lógica de negócio e o acesso à base de dados pertencem ao backend.

**Não criar um frontend independente em React fora do Next.js. Não colocar o acesso ao SQLite no frontend. Não substituir a API por dados fictícios como solução definitiva.**

Se o backend ainda não estiver disponível, utilizar dados temporários claramente identificados para permitir desenvolver e testar a interface, mantendo uma camada de serviços preparada para a integração posterior.

Antes de alterar ficheiros, inspecciona a estrutura actual do repositório, identifica as tecnologias já configuradas e preserva o trabalho existente.

## 3. Direcção visual

Criar uma interface moderna, profissional e simples, adequada a um serviço automóvel.

### Identidade visual

- Nome: Lava Já Smart.
- Estilo: moderno, limpo, funcional e tecnológico.
- Cor principal: azul-escuro, associado à confiança e ao profissionalismo.
- Cor de destaque: azul vivo ou ciano.
- Fundo: branco ou cinzento muito claro.
- Estados: cores semânticas para sucesso, alerta, erro e informação.
- Tipografia: moderna, legível e com boa hierarquia visual.
- Ícones: consistentes, preferencialmente através de Lucide.
- Componentes: cartões, tabelas, formulários, indicadores e diálogos reutilizáveis.

Evitar excesso de gradientes, sombras pesadas, animações decorativas e elementos que prejudiquem a leitura.

A interface deve parecer um produto real, e não um template genérico de dashboard.

## 4. Perfis de utilização

A aplicação terá duas áreas principais:

1. **Área do cliente:** consulta de serviços, pré-marcações, cartão virtual, carteira demonstrativa, fidelização e histórico.
2. **Área administrativa:** gestão dos serviços, marcações, fila, pagamentos e indicadores operacionais.

A área administrativa deve exigir autenticação e autorização. Os clientes não podem aceder às funcionalidades administrativas apenas por conhecerem o URL.

## 5. Descrição das telas do cliente

### Tela 1 — Página inicial

Rota sugerida: `/`

Objectivo: apresentar o Lava Já Smart e permitir ao visitante consultar rapidamente os serviços e a disponibilidade do carwash.

Elementos:

- Cabeçalho com logótipo, navegação e botão de entrada na conta.
- Apresentação principal com o título “A sua lavagem, sem complicações”.
- Texto curto que explique a possibilidade de consultar serviços e efectuar pré-marcações.
- Botão principal “Marcar lavagem”.
- Botão secundário “Consultar serviços”.
- Cartão com o estado operacional: aberto, fechado ou indisponível.
- Resumo da fila e tempo de espera estimado, quando houver dados disponíveis.
- Secção de serviços mais procurados, com preço e duração estimada.
- Secção “Como funciona”, com três passos: escolher serviço, efectuar pré-marcação e acompanhar o atendimento.
- Área de promoções ou negócios parceiros, com conteúdo demonstrativo identificado.
- Rodapé com localização, horário de funcionamento e contactos.

A página deve ser útil mesmo para visitantes que ainda não têm conta.

### Tela 2 — Registo de cliente

Rota sugerida: `/register`

Campos:

- Nome completo.
- Número de telefone.
- E-mail, opcional se não for necessário para o fluxo inicial.
- Palavra-passe.
- Confirmação da palavra-passe, se aplicável.

Requisitos:

- Validação dos campos.
- Mensagens de erro claras.
- Indicação dos campos obrigatórios.
- Opção para mostrar ou ocultar a palavra-passe.
- Ligação para iniciar sessão.
- Estados de carregamento e sucesso.

Não afirmar que o telefone ou o e-mail foram verificados se a verificação não tiver sido implementada.

### Tela 3 — Início de sessão

Rota sugerida: `/login`

Elementos:

- Campo de telefone ou e-mail, conforme o mecanismo de autenticação adoptado.
- Campo de palavra-passe.
- Botão “Entrar”.
- Ligação para criar conta.
- Mensagens para credenciais inválidas e erros de comunicação.
- Indicador de carregamento.

Após autenticação, encaminhar o cliente para a área do cliente e os utilizadores autorizados para o painel administrativo.

### Tela 4 — Serviços

Rota sugerida: `/services`

Objectivo: permitir comparar as opções de lavagem antes de efectuar uma marcação.

Cada serviço deve apresentar:

- Nome.
- Descrição curta.
- Preço em meticais (MT).
- Duração estimada.
- Tipo de viatura elegível, se aplicável.
- Serviços adicionais, se existirem.
- Botão “Seleccionar serviço”.

Incluir estados de carregamento, ausência de serviços e erro de carregamento.

Os preços devem vir da API; não inventar preços comerciais definitivos.

### Tela 5 — Nova pré-marcação

Rota sugerida: `/bookings/new`

Criar um formulário simples, organizado em etapas visuais ou secções.

Campos:

- Tipo de viatura.
- Serviço pretendido.
- Serviços adicionais, quando disponíveis.
- Data.
- Horário disponível.
- Observações opcionais.

Comportamento:

- Mostrar o preço e a duração estimada antes da confirmação.
- Consultar os horários disponibilizados pelo backend.
- Impedir a selecção de horários indisponíveis.
- Validar os campos obrigatórios.
- Mostrar um resumo da pré-marcação.
- Solicitar confirmação antes de submeter.
- Mostrar um resultado claro após a resposta da API.

A pré-marcação não garante atendimento imediato. Apresentar uma nota informativa sobre a possibilidade de alterações operacionais.

Não simular uma confirmação bem-sucedida se a API rejeitar ou não confirmar o pedido.

### Tela 6 — Confirmação da marcação

Rota sugerida: `/bookings/[id]`

Apresentar:

- Referência da marcação.
- Serviço seleccionado.
- Tipo de viatura.
- Data e horário.
- Preço estimado.
- Estado actual.
- Instruções para chegar ao estabelecimento.
- Botão para consultar o estado.
- Botão de cancelamento, apenas se as regras do backend permitirem.

O estado da marcação deve ser apresentado com uma etiqueta visual e texto descritivo.

### Tela 7 — Minhas marcações

Rota sugerida: `/bookings`

Organizar as marcações em separadores:

- Próximas.
- Em atendimento.
- Histórico.

Cada cartão deve apresentar referência, serviço, data, horário e estado.

Permitir abrir os detalhes de uma marcação.

Incluir estados vazios, por exemplo: “Ainda não tem marcações”.

### Tela 8 — Cartão virtual

Rota sugerida: `/card`

Objectivo: apresentar o cartão digital do cliente.

O cartão deve incluir:

- Identidade visual Lava Já Smart.
- Nome do cliente.
- Identificador alfanumérico.
- QR Code único associado ao cliente.
- Estado do cartão.

O QR Code serve para identificar o cliente ou localizar uma operação autorizada. A sua leitura não deve permitir debitar automaticamente a carteira.

Disponibilizar o identificador alfanumérico como alternativa à leitura do QR Code.

Não incluir saldo, telefone ou outros dados pessoais directamente no conteúdo do QR Code. Utilizar um identificador opaco ou um token não sensível.

### Tela 9 — Carteira demonstrativa

Rota sugerida: `/wallet`

A carteira é exclusivamente demonstrativa e não movimenta dinheiro real.

Elementos:

- Saldo fictício, claramente identificado como “Saldo demonstrativo”.
- Botão “Simular carregamento”.
- Lista de movimentos.
- Data, descrição, valor e estado de cada movimento.
- Indicação do método de pagamento simulado.
- Estados vazios e mensagens de erro.

Permitir demonstrar um carregamento fictício e, se implementado no backend, um débito de demonstração associado a um serviço.

Não apresentar a simulação como transacção bancária confirmada.

Os valores e os movimentos devem ser controlados pelo backend. O frontend não deve decidir autonomamente o saldo final.

### Tela 10 — Fidelização

Rota sugerida: `/loyalty`

Apresentar:

- Total de pontos.
- Regras resumidas de atribuição.
- Histórico de pontos ganhos ou utilizados.
- Benefícios ou recompensas disponíveis, se implementados.

Os pontos devem ser separados do saldo monetário.

Se as regras de fidelização ainda não estiverem implementadas, apresentar uma demonstração explicitamente identificada como tal.

### Tela 11 — Perfil do cliente

Rota sugerida: `/profile`

Apresentar:

- Nome.
- Contacto telefónico.
- E-mail, se registado.
- Identificador do cliente.
- Data de registo, se disponível.

Permitir editar apenas os campos suportados pelo backend.

Incluir opção de terminar sessão.

Não recolher morada ou outros dados pessoais sem necessidade funcional.

## 6. Descrição das telas administrativas

O painel administrativo deve ter navegação própria, separada da área do cliente.

Em desktop, utilizar uma barra lateral e uma área principal de conteúdo. Em dispositivos móveis, adaptar a navegação a um menu compacto.

### Tela 12 — Login administrativo

Rota sugerida: `/admin/login`

Elementos:

- Formulário de autenticação.
- Mensagens de erro.
- Indicador de carregamento.
- Encaminhamento após autenticação bem-sucedida.

A autorização deve ser verificada no backend. Ocultar os links administrativos na interface não é suficiente para proteger os dados.

### Tela 13 — Dashboard operacional

Rota sugerida: `/admin`

Apresentar indicadores:

- Lavagens realizadas no dia.
- Marcações pendentes.
- Viaturas em espera.
- Viaturas em lavagem.
- Total de pagamentos registados no dia.
- Distribuição dos pagamentos por método, se houver dados.

Incluir:

- Lista das marcações recentes.
- Resumo da fila.
- Serviços mais utilizados.
- Mensagem com a data e hora da última actualização dos dados.

Os indicadores devem ser obtidos da API. Não inventar estatísticas nem apresentar valores fictícios como dados reais.

### Tela 14 — Gestão de marcações

Rota sugerida: `/admin/bookings`

Apresentar uma tabela ou lista responsiva com:

- Referência.
- Cliente.
- Serviço.
- Tipo de viatura.
- Data e horário.
- Estado.
- Acções disponíveis.

Incluir filtros por data e estado.

Permitir abrir os detalhes e executar apenas as transições de estado permitidas pela API.

Apresentar confirmação antes de operações destrutivas ou cancelamentos.

### Tela 15 — Gestão da fila

Rota sugerida: `/admin/queue`

Esta é uma das telas prioritárias do MVP.

Apresentar a fila dividida por estados:

- Em espera.
- Em lavagem.
- Concluído.
- Cancelado, quando relevante para o histórico.

Cada entrada deve mostrar:

- Referência da marcação ou da viatura.
- Serviço.
- Tempo de espera, quando calculável.
- Estado actual.
- Acções permitidas.

Permitir actualizar o estado da viatura através de controlos simples.

Após uma alteração, actualizar a interface com a resposta confirmada pela API.

Apresentar a última actualização dos dados. Se não houver dados recentes, mostrar um aviso de que a estimativa da fila pode estar desactualizada.

Não apresentar o tempo estimado como garantia de atendimento.

### Tela 16 — Gestão de serviços

Rota sugerida: `/admin/services`

Apresentar:

- Lista de serviços.
- Nome e descrição.
- Preço.
- Duração estimada.
- Estado de disponibilidade.

Permitir criar, editar e activar ou desactivar serviços, conforme o âmbito implementado.

Os formulários devem validar os dados e apresentar mensagens de sucesso ou erro após a resposta do backend.

### Tela 17 — Registo de pagamentos

Rota sugerida: `/admin/payments`

Permitir consultar e registar pagamentos associados às marcações.

Campos de registo:

- Marcação ou serviço associado.
- Valor.
- Método de pagamento: numerário, carteira demonstrativa ou outro método simulado suportado.
- Estado.
- Observações opcionais.

O registo de pagamentos em numerário representa a confirmação pelo funcionário de que recebeu o valor. Deve guardar o funcionário responsável, quando existir autenticação adequada.

Distinguir carregamentos da carteira de pagamentos directos de serviços.

Não disponibilizar uma acção que permita alterar arbitrariamente o saldo sem criar o respectivo movimento de carteira.

### Tela 18 — Estatísticas

Rota sugerida: `/admin/statistics`

Apresentar indicadores básicos:

- Lavagens por dia.
- Serviços mais procurados.
- Horários de maior procura.
- Número de marcações concluídas.
- Pagamentos registados por método.

Usar gráficos simples apenas quando existirem dados suficientes.

Se não houver dados, apresentar um estado vazio informativo. Não fabricar métricas para preencher os gráficos.

### Tela 19 — Promoções e negócios locais

Rota sugerida: `/promotions`

Apresentar cartões promocionais com:

- Nome do negócio.
- Categoria.
- Descrição.
- Oferta ou desconto.
- Contacto ou localização, se disponíveis.

Esta área é secundária e poderá utilizar conteúdo demonstrativo identificado.

As promoções não devem permitir pagamentos através da carteira Lava Já.

## 7. Navegação

### Navegação do cliente

A navegação principal deverá destacar:

- Início.
- Serviços.
- Minhas marcações.
- Cartão.
- Perfil.

A carteira e a fidelização poderão ficar agrupadas numa secção de conta, especialmente em dispositivos móveis.

### Navegação administrativa

- Dashboard.
- Fila.
- Marcações.
- Serviços.
- Pagamentos.
- Estatísticas.

As promoções poderão ser acrescentadas se houver tempo.

## 8. Componentes reutilizáveis

Criar componentes partilhados quando forem úteis em mais do que uma tela:

- `AppHeader`
- `ClientNavigation`
- `AdminSidebar`
- `MobileNavigation`
- `ServiceCard`
- `BookingCard`
- `BookingStatusBadge`
- `QueueEntryCard`
- `MetricCard`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `ConfirmDialog`
- `FormField`
- `PageHeader`

Evitar criar componentes genéricos excessivamente complexos. A prioridade é a reutilização que reduz duplicação real.

## 9. Requisitos de experiência do utilizador

Todas as telas devem contemplar:

- Estados de carregamento.
- Estados vazios.
- Mensagens de erro compreensíveis.
- Confirmação de operações relevantes.
- Formulários com validação.
- Navegação coerente.
- Interface adaptada a telemóveis e computadores.
- Contraste adequado e campos com rótulos acessíveis.
- Indicação clara quando uma funcionalidade é demonstrativa.

As operações que alteram dados devem mostrar o resultado real devolvido pelo backend.

Não utilizar `alert()` como mecanismo principal de feedback. Preferir notificações visuais consistentes, mensagens junto aos formulários e diálogos de confirmação quando necessário.

## 10. PWA

Implementar:

- Manifesto com nome, nome curto, ícones, cores e modo de apresentação.
- Service worker com uma estratégia de cache apropriada.
- Cache dos recursos estáticos necessários à abertura da interface.
- Experiência de instalação nos navegadores compatíveis.
- Página ou mensagem de indisponibilidade de rede.

Não armazenar indiscriminadamente respostas privadas da API em cache. Dados pessoais, pagamentos e estados operacionais devem ter uma estratégia de cache adequada e não devem ser expostos a outros utilizadores do dispositivo.

A demonstração deverá funcionar através de HTTPS quando instalada num ambiente remoto, ou em `localhost` durante o desenvolvimento.

## 11. Prioridades de implementação

Dado o limite de dois dias, seguir esta ordem:

**Prioridade 1 — Fluxo operacional essencial**
1. Página inicial.
2. Consulta de serviços.
3. Criação de pré-marcações.
4. Login administrativo.
5. Gestão das marcações.
6. Gestão da fila e actualização dos estados.

**Prioridade 2 — Elementos diferenciadores**
7. Cartão virtual com QR Code.
8. Carteira demonstrativa.
9. Registo de pagamentos simulados.
10. Pontos de fidelização.

**Prioridade 3 — Acabamento**
11. Dashboard e estatísticas.
12. Promoções.
13. PWA e testes finais de instalação.

A configuração básica da PWA e a responsividade devem ser consideradas desde o início, mesmo que os testes finais ocorram na última etapa.

## 12. Critérios de aceitação

A implementação será considerada aceitável quando:

1. As telas principais apresentarem uma interface coerente e responsiva.
2. O cliente conseguir consultar serviços e efectuar uma pré-marcação.
3. A marcação ficar persistida através da API.
4. O funcionário conseguir consultar a marcação no painel.
5. O funcionário conseguir actualizar o estado da viatura.
6. O cliente conseguir consultar o estado actualizado.
7. O cartão QR identificar o cliente sem autorizar débitos por si só.
8. Os pagamentos e carregamentos forem identificados claramente como simulados.
9. As rotas administrativas estiverem protegidas por autenticação e autorização no backend.
10. A aplicação apresentar estados de carregamento, erro e ausência de dados.
11. A PWA puder ser instalada em ambientes compatíveis.
12. Nenhum dado demonstrativo for apresentado como uma transacção financeira real.

## 13. Instrução final de execução

Implementa as telas de forma incremental, começando pelo fluxo de marcação e gestão da fila.

Antes de criar novos componentes ou alterar a arquitectura, inspecciona o código existente e reutiliza o que já estiver correcto.

Não implementes todas as telas apenas com dados estáticos e não consideres uma operação concluída antes de a API confirmar o resultado.

Prioriza uma experiência de demonstração completa, consistente e funcional em vez de muitas funcionalidades incompletas.

No final de cada etapa, apresenta um resumo dos ficheiros criados ou alterados, os comandos para executar o projecto e os testes realizados.
