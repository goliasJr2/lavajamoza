# Plano de implementação — Lava Já Smart

## Objectivo e prioridade

Construir uma aplicação web para apoiar os clientes e a operação de um único carwash: o Lava Já, na Matola. A primeira fase não terá afiliados, outros operadores, marketplace nem gestão multi-carwash. O código deve permitir evolução posterior sem implementar essa complexidade agora.

O documento `LAVA JÁ SMART.docx` apresenta a visão estratégica que o protótipo deve ajudar a demonstrar, incluindo Crédito Lava Já, pagamentos, fidelização, Moza Banco e expansão. O protótipo deve mostrar como esses fluxos poderiam funcionar, usando dados e transacções simulados. Não haverá movimentação de dinheiro real, ligação a bancos ou carteiras financeiras reais. O foco operacional continua a ser um único carwash, sem afiliados reais.

## Regras de execução

- Cada incremento de backend deve ser entregue junto com a respectiva funcionalidade de frontend, no mesmo ciclo.
- Nenhuma regra importante de negócio pode depender apenas do frontend.
- Antes de iniciar um incremento, consultar o caso correspondente em `PLANO_TESTES.md`; actualizar os testes previstos quando o escopo mudar.
- Usar PostgreSQL em Docker para desenvolvimento local. O backend acede à base de dados através do Prisma; o navegador nunca acede directamente à base de dados.
- Manter uma única operação do Lava Já na primeira fase. Não criar cadastro de afiliados, tenants ou liquidação entre comerciantes.
- Usar as cores da marca `#03A8FB`, `#85DFFC` e `#0172D4`. O logótipo oficial será integrado quando for entregue; até lá, a interface usa uma marca textual temporária.
- Priorizar a jornada de consulta de serviços, pré-marcação e acompanhamento do atendimento, demonstrando também o conceito de Crédito Lava Já e fidelização.
- Identificar sempre saldos, pagamentos, pontos e integrações como demonstração. Não sugerir que houve cobrança, transferência ou confirmação por uma instituição financeira real.

## Base técnica actual

- Frontend: Next.js, React, TypeScript e Tailwind CSS na raiz do projecto (`src/`).
- Backend: NestJS com API REST e TypeScript em `apps/api/`.
- Persistência: PostgreSQL + Prisma; PostgreSQL é iniciado por `docker-compose.yml` na porta local 5433.
- Validação: validar no backend todos os dados recebidos. Partilhar tipos/schemas só quando houver necessidade concreta.
- Repositório: manter a estrutura actual durante a fundação. A conversão para monorepo não é requisito do MVP e só deve ser feita se trouxer benefício directo.
- PWA: preparar depois de os fluxos principais estarem funcionais; não prometer funcionamento offline de marcações ou estados.

## Fases e incrementos

### Fase 0 — Fundação e ambiente local

**Estado:** configuração inicial aplicada.

- Definir tokens de cor globais, idioma `pt-MZ`, metadados e identidade temporária no frontend.
- Substituir a página inicial padrão por uma página de apresentação alinhada ao único carwash.
- Disponibilizar PostgreSQL com volume persistente e healthcheck através de Docker Compose.
- Criar a API NestJS separada em `apps/api`, com Prisma e endpoint de health check.
- Documentar a configuração local e manter segredos fora do controlo de versão.

**Entrega conjunta API + interface:** estado de ligação/indisponibilidade da API tratado na interface; sem expor detalhes internos ou apresentar dados fictícios como confirmados.

### Fase 1 — Acesso administrativo e catálogo de serviços

**Estado:** catálogo actualizado com seis serviços do carwash; o seed mantém os preços como referências demonstrativas e desactiva os serviços de exemplo antigos. O catálogo público, o login administrativo e a gestão protegida estão ligados à API.

**Backend:** API NestJS em `apps/api`, autenticação JWT para administrador, protecção de rotas administrativas, modelos Prisma de equipa e serviço, endpoint de health check, consulta pública e operações protegidas de criação/edição/activação de serviços. O seed cria uma conta administrativa e preços de exemplo.

**Frontend:** catálogo público ligado à API, com estados de erro e catálogo vazio; ecrã administrativo de login e gestão de serviços ligado aos endpoints protegidos. Preços iniciais estão marcados como demonstrativos.

**Concluído quando:** os serviços apresentados ao cliente vêm da API e uma alteração administrativa persistida aparece no catálogo.

### Fase 2 — Viatura e pré-marcação

**Estado:** implementação inicial real concluída. Clientes, viaturas e pedidos são persistidos no PostgreSQL; a API valida serviço activo, contacto, matrícula, data/hora futura, horário de funcionamento (08:00–18:00) e conflitos de duração. O cliente pode combinar serviços num pacote; a API aplica automaticamente 10% de desconto a combinações de dois ou mais serviços e guarda nomes, duração e preço final no pedido. O cliente recebe um código para consulta e distingue pedido recebido de atendimento confirmado. A equipa autenticada consulta pedidos e aceita/rejeita pedidos pendentes. A disponibilidade é de uma viatura por intervalo; transições depois da aceitação (em atendimento/concluída) ficam para a Fase 3.

**Backend:** modelos mínimos de cliente/viatura e marcação; endpoints públicos para consultar horários livres, criar um pedido e consultá-lo por código e contacto; endpoints administrativos protegidos para listar, aceitar ou rejeitar pedidos pendentes. Valida serviço activo, campos, horário, disponibilidade, sobreposição e duplicação. A data/hora é interpretada no fuso de Maputo. O estado inicial é `REQUESTED` e o preço/duração são fotografados no pedido. A disponibilidade actual considera uma viatura de cada vez; os pedidos não podem ser cancelados pelo cliente nesta etapa.

**Frontend:** fluxo em duas etapas, começando pelo serviço e por horários livres vindos da API, seguido pelos dados da viatura/cliente. Exibe resumo antes do envio, confirmação somente depois da persistência, código de acompanhamento e consulta do pedido com código/contacto. A confirmação informa que o atendimento aguarda validação da equipa. O painel administrativo lista pedidos e permite aceitar/rejeitar um pedido pendente.

**Concluído quando:** uma marcação válida persiste e surge no painel; pedidos inválidos ou horários indisponíveis recebem mensagens compreensíveis.

### Fase 3 — Fila e estado do atendimento

**Estado: implementada no fluxo principal.** A API permite as transições sequenciais `REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED`, mantendo também `REQUESTED → REJECTED`. A área da equipa apresenta apenas a próxima acção válida; a página `/fila` consulta a API usando código público e contacto telefónico. A consulta do cliente não requer conta e não expõe marcações quando os dois dados não coincidem.

**Estado:** implementação concluída no fluxo principal; a auditoria das transições foi implementada na Fase 8. Actualização em tempo real permanece fora do escopo.

**Backend:** [x] gerir transições permitidas; [x] registar o actor e os estados anterior/seguinte. Cancelamento pelo cliente continua fora do escopo actual.

**Frontend:** [x] painel operacional para aceitar, rejeitar, iniciar e concluir; [x] consulta do estado da marcação pela API; [x] mensagens de sucesso e erro baseadas na resposta do servidor.

**Concluído quando:** [x] uma mudança de estado feita pela equipa é persistida e visível ao cliente, sem permitir estados incompatíveis. [x] transições auditadas; actualização automática em tempo real não faz parte desta fase.

### Fase 4 — Crédito Lava Já, pagamentos demonstrativos e fidelização

**Estado:** backend e frontend demonstram carregamentos, pagamento de uma marcação aceite/concluída, movimentos persistidos e pontos acumulados/resgatados. A identidade é verificada com código da marcação e telefone. Métodos Moza, M-Pesa e e-Mola são apenas rótulos de demonstração, sem chamadas externas. Os movimentos e saldos permanecem dados fictícios sem valor monetário.

**Backend:** [x] saldos demonstrativos carregado e promocional separados; [x] cada movimento regista a origem usada; [x] pagamento consome primeiro o saldo promocional e depois o carregado; [x] pagamentos limitados ao preço guardado, sem saldo negativo ou duplicação; [x] pontos e resgate de 500 pontos; [x] resumo de carteiras e movimentos recentes protegido para ADMIN.

**Frontend:** [x] carteira mostra total e separação entre saldo carregado/promocional, carregamento fixo de 500 MT e detalhe de origem nos pagamentos novos; [x] equipa consulta totais e movimentos recentes demonstrativos no painel; [x] indicações visíveis de demonstração e opções conceptuais Moza/M-Pesa/e-Mola; [ ] fluxo guiado de parceiros fictícios.

**Concluído quando:** [x] o utilizador percorre carregamento, pagamento e pontos com movimentos persistidos e idempotentes; [x] a origem dos saldos e a alocação dos pagamentos são visíveis; [x] equipa consulta operações sem acesso público; [x] não há integração financeira real. Demonstrar cenário de parceiros fictícios permanece extensão opcional.

### Fase 5 — Histórico e acabamento da experiência

**Estado:** histórico do cliente implementado como consulta sem conta, usando código e telefone para verificar identidade e devolver até 50 marcações associadas ao contacto. A confirmação da pré-marcação agora liga directamente ao acompanhamento e ao histórico. O painel administrativo apresenta contagens da operação diária, fila, pagamentos simulados e marcações recentes; auditoria das transições é visível por marcação.

**Backend:** [x] endpoint de histórico limitado a 50 registos e condicionado a código/telefone válidos; [x] resumo operacional protegido por ADMIN, com consultas agregadas limitadas ao necessário.

**Frontend:** [x] histórico de marcações com estados de erro, carregamento no botão e lista vazia; [x] resumo operacional e lista das seis marcações recentes, com indicadores claramente separados de receitas reais.

**Concluído quando:** [x] cliente e equipa consultam registos autorizados; [x] equipa vê o resumo actualizado a partir da API; [x] equipa consulta as transições registadas.

### Fase 6 — PWA e validação de demonstração

**Estado:** manifesto, ícones 192/512 e Apple Touch, registo do service worker em produção, instalação assistida (incluindo instrução para iOS) e fallback offline implementados. O service worker guarda apenas página offline e recursos estáticos públicos; nunca guarda HTML de aplicação nem respostas `/api`. Validação final de instalação em navegadores/dispositivos reais continua pendente.

- [x] Configurar manifesto, ícones de instalação e comportamento instalável.
- [x] Tratar navegação sem ligação com página de indisponibilidade; não confirmar offline uma marcação, alteração de fila ou pagamento.
- [ ] Validar instalação e comportamento offline em navegadores/dispositivos de demonstração.
- Preparar dados de demonstração e percorrer o fluxo cliente → API → painel → estado actualizado.
- Preparar uma demonstração curta para avaliadores: escolha de serviço, pré-marcação, crédito carregado por um meio simulado (Moza ou outro), pagamento simulado, pontos recebidos e painel operacional com indicadores de exemplo.
- Mostrar uma visão conceptual de expansão para parceiros como cenário futuro, sem os apresentar como afiliados activos nem permitir transacções entre comerciantes.

### Extensões posteriores ao protótipo

- Refinar a demonstração de Moza Banco, campanhas e expansão, com base na reacção dos avaliadores.
- Notificações e indicadores adicionais se houver tempo e necessidade validada.
- Integrações financeiras reais, custódia de saldos, liquidação, múltiplos operadores e afiliados exigem nova decisão de escopo, validação comercial/jurídica e desenho de segurança. Permanecem fora do protótipo.

### Fase 7 — Guia local demonstrativo e notificações na aplicação

**Âmbito:** apoiar a experiência durante a visita ao Lava Já, sem introduzir afiliados. As lojas, cafés, entretenimento, descrições e tempos apresentados são exemplos fictícios, não verificados e sem associação comercial. Não usar mapas, localização do dispositivo ou dados de estabelecimentos reais.

**Backend:** adicionar catálogo demonstrativo de locais e notificações persistidas para recepção e transições da marcação. Incluir lembrete agendado após a conclusão e campanhas promocionais para a caixa interna, com tipo e ligação para ofertas futuras do marketplace. A consulta da caixa exige código de marcação/telefone ou sessão autenticada; marcar como lidas requer a mesma identidade. Gravar a notificação e a transição de estado na mesma transacção.

**Frontend:** criar `/ao-redor` com filtros de categoria, indicação explícita de dados ilustrativos e estados de erro/vazio; criar `/notificacoes` com consulta segura, actualização periódica enquanto aberta, leitura, ligação ao acompanhamento e acções para reservar novamente/ver uma promoção. Disponibilizar atalhos na página inicial, confirmação e acompanhamento. Notificações são apenas internas à aplicação; sem SMS, email ou push de sistema.

**Critério de conclusão:** dados de exemplo vêm da API e persistem na base de dados; cada evento relevante gera uma notificação; lembretes e campanhas agendados aparecem na caixa interna na data definida; erro de rede/identidade não revela dados; nenhum serviço externo é chamado.

### Fase 8 — Auditoria das alterações de estado

Persistir em cada transição o estado anterior, o novo estado, a data/hora e o utilizador autenticado que executou a acção. Criar o registo na mesma transacção da actualização da marcação/notificação. Disponibilizar a linha temporal somente no painel protegido da equipa; registos antigos sem actor não devem ser inventados retroactivamente.

**Critério de conclusão:** cada aceite/rejeição/início/conclusão bem-sucedido gera um único evento consultável; falha ou transição recusada não cria auditoria; consultas públicas do cliente não revelam identidade da equipa.

### Fase 9 — Contas individuais e empresariais

**Estado:** implementada. O registo empresarial cria um pedido pendente, o ADMIN pode aprovar/rejeitar e a conta aprovada gere a sua frota.


**Definição de escopo:** conta empresarial representa uma empresa cliente que agenda serviços para várias viaturas próprias. Não é uma conta de parceiro/afiliado do marketplace. Na primeira versão, cada empresa terá um contacto principal e um único acesso; vários membros e permissões empresariais ficam para uma fase posterior.

**Backend:**

- Adicionar ao perfil de cliente o tipo `INDIVIDUAL` ou `BUSINESS` e estado de activação `PENDING`, `ACTIVE` ou `REJECTED`. Contas existentes migram como `INDIVIDUAL` e mantêm o acesso actual.
- Guardar perfil empresarial ligado ao cliente autenticado: nome legal, NUIT, nome do contacto principal e telefone de contacto. NUIT deve ser único quando fornecido; validação comercial externa não será alegada pelo protótipo.
- Criar registo empresarial com palavra-passe e aprovação manual pelo único `ADMIN`. Aplicar limites de tamanho e validação aos campos e impedir que conta pendente/rejeitada use reservas, carteira e notificações empresariais.
- Associar a frota ao perfil empresarial e garantir que apenas o contacto autenticado da empresa consulta e escolhe as suas viaturas. Preservar a regra actual de uma viatura por marcação e os conflitos de horário.
- Expor ao `ADMIN` uma lista de empresas pendentes e operações de aprovar/rejeitar, com data e actor registados. Não misturar a autenticação empresarial com a conta administrativa.

**Frontend:**

- Oferecer escolha clara entre conta pessoal e conta empresarial na criação de conta/entrada.
- Apresentar formulário de empresa e estado da aprovação; não mostrar funções empresariais como activas enquanto a conta aguarda decisão.
- Disponibilizar à empresa a gestão da sua frota e permitir escolher uma das viaturas ao criar uma pré-marcação.
- No painel único do Lava Já, rever os dados submetidos e aprovar/rejeitar a conta.

**Critério de conclusão:** conta individual continua a funcionar sem regressão; uma empresa aprovada gere mais de uma viatura e agenda marcações para a frota; uma empresa não consulta dados de outra; conta pendente/rejeitada e cliente não autenticado não acedem à frota empresarial; nenhum tipo de conta empresarial recebe acesso ao painel administrativo.

### Fase 10 — Avaliação do atendimento

**Estado:** implementada. Marcações concluídas aceitam uma avaliação verificada por código e telefone, e o ADMIN consulta média, distribuição e comentários.


**Backend:**

- Criar uma avaliação associada de forma única a uma marcação concluída, ao cliente e à data de submissão.
- Aceitar uma nota geral de 1 a 5 e comentário opcional com limite de tamanho. Validar no servidor a propriedade da marcação por sessão autenticada ou pelo par código/telefone existente.
- Recusar avaliações de marcações inexistentes, pertencentes a terceiros, ainda não concluídas ou já avaliadas; não alterar o estado da marcação durante a avaliação.
- Disponibilizar ao único `ADMIN` a lista recente, média e distribuição das notas. Comentários ficam privados no painel nesta fase; publicação de testemunhos depende de decisão posterior.

**Frontend:**

- Apresentar a acção “Avaliar atendimento” após a conclusão, na notificação de conclusão e no histórico/perfil do cliente.
- Permitir seleccionar estrelas e escrever comentário opcional; mostrar confirmação apenas após resposta persistida pela API.
- Mostrar avaliações submetidas e estado vazio/falha de forma clara, sem permitir submeter novamente a mesma marcação.
- Incluir média, distribuição e comentários no painel administrativo, sem os apresentar como avaliações públicas.

**Critério de conclusão:** apenas o cliente associado pode avaliar a marcação concluída; existe no máximo uma avaliação por marcação; submissões inválidas não alteram dados; a equipa consulta resumo e comentários no painel; avaliações não são publicadas automaticamente.

## Critério de sucesso do MVP

Um cliente consulta os serviços do Lava Já, envia uma pré-marcação válida, recebe a confirmação da API e acompanha o estado. Um funcionário autenticado consulta essa marcação no painel e actualiza o atendimento. O protótipo também demonstra o Crédito Lava Já, um pagamento e a fidelização através de movimentos fictícios persistidos no PostgreSQL, sempre identificados como demonstração. Erros de rede ou validação não são apresentados como sucesso e nenhuma operação é apresentada como pagamento real.

## Execução local da base de dados

1. Copiar `.env.example` para `.env` e ajustar apenas valores locais, se necessário.
2. Iniciar PostgreSQL com `docker compose up -d database`.
3. Confirmar o estado com `docker compose ps`.
4. Quando a API/Prisma estiver configurada, aplicar migrações conforme os scripts do backend.

O volume `lava_ja_postgres_data` mantém os dados entre reinícios do container. Para apagar os dados locais deliberadamente, usar `docker compose down -v`.

### Fase 11 - Fidelizacao por servico e beneficio Moza

**Estado:** implementada para demonstracao. Cada servico pago e concluido concede 50 pontos, sem diferenciar o servico ou meio de pagamento. Um pagamento por cartao no fluxo Moza demonstrativo concede adicionalmente 5% do valor em credito especial Moza, separado do saldo carregado, do credito promocional comum e dos pontos.

**Recompensas:** 100 pontos emitem um voucher demonstrativo de parceiro alimentar; 250 pontos convertem-se em 100 MT de credito promocional para uma lavagem; 400 pontos emitem um voucher demonstrativo de servico automovel. Os codigos e movimentos ficam persistidos. Os parceiros ainda nao estao integrados, portanto os vouchers nao confirmam descontos externos.

**Elegibilidade e consistencia:** os pontos sao concedidos apenas quando a marcacao esta concluida e existe pagamento confirmado; funciona quer o pagamento seja registado antes ou depois da conclusao. Cada marcacao gera pontos uma unica vez; o bonus Moza tambem e idempotente. Os creditos especiais podem ser usados como saldo promocional numa operacao da carteira demonstrativa e a origem fica identificada no extrato.

**Limites da demonstracao:** o fluxo Moza continua sem ligacao ao banco, SIMO, POS ou USSD. O pagamento precisa ser validado pela equipa. A identificacao de um cliente Moza e inferida do metodo de pagamento Moza selecionado, nao de uma confirmacao bancaria de titularidade. Pontos, credito e vouchers nao representam dinheiro nem descontos de parceiros reais.
