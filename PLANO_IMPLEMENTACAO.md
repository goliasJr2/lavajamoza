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

**Estado:** primeira versão implementada; requer migração e seed locais antes da utilização. O catálogo público, o login administrativo e a gestão protegida estão ligados à API.

**Backend:** API NestJS em `apps/api`, autenticação JWT para administrador, protecção de rotas administrativas, modelos Prisma de equipa e serviço, endpoint de health check, consulta pública e operações protegidas de criação/edição/activação de serviços. O seed cria uma conta administrativa e preços de exemplo.

**Frontend:** catálogo público ligado à API, com estados de erro e catálogo vazio; ecrã administrativo de login e gestão de serviços ligado aos endpoints protegidos. Preços iniciais estão marcados como demonstrativos.

**Concluído quando:** os serviços apresentados ao cliente vêm da API e uma alteração administrativa persistida aparece no catálogo.

### Fase 2 — Viatura e pré-marcação

**Estado:** implementação inicial real concluída. Clientes, viaturas e pedidos são persistidos no PostgreSQL; a API valida serviço activo, contacto, matrícula, data/hora futura, horário de funcionamento (08:00–18:00) e conflitos de duração. O cliente recebe um código para consulta e distingue pedido recebido de atendimento confirmado. A equipa autenticada consulta pedidos e aceita/rejeita pedidos pendentes. A disponibilidade é de uma viatura por intervalo; transições depois da aceitação (em atendimento/concluída) ficam para a Fase 3.

**Backend:** modelos mínimos de cliente/viatura e marcação; endpoints públicos para consultar horários livres, criar um pedido e consultá-lo por código e contacto; endpoints administrativos protegidos para listar, aceitar ou rejeitar pedidos pendentes. Valida serviço activo, campos, horário, disponibilidade, sobreposição e duplicação. A data/hora é interpretada no fuso de Maputo. O estado inicial é `REQUESTED` e o preço/duração são fotografados no pedido. A disponibilidade actual considera uma viatura de cada vez; os pedidos não podem ser cancelados pelo cliente nesta etapa.

**Frontend:** fluxo em duas etapas, começando pelo serviço e por horários livres vindos da API, seguido pelos dados da viatura/cliente. Exibe resumo antes do envio, confirmação somente depois da persistência, código de acompanhamento e consulta do pedido com código/contacto. A confirmação informa que o atendimento aguarda validação da equipa. O painel administrativo lista pedidos e permite aceitar/rejeitar um pedido pendente.

**Concluído quando:** uma marcação válida persiste e surge no painel; pedidos inválidos ou horários indisponíveis recebem mensagens compreensíveis.

### Fase 3 — Fila e estado do atendimento

**Estado: implementada no fluxo principal.** A API permite as transições sequenciais `REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED`, mantendo também `REQUESTED → REJECTED`. A área da equipa apresenta apenas a próxima acção válida; a página `/fila` consulta a API usando código público e contacto telefónico. A consulta do cliente não requer conta e não expõe marcações quando os dois dados não coincidem.

**Estado:** implementação concluída no fluxo principal, conforme o resumo acima; auditoria e actualização em tempo real continuam pendentes.

**Backend:** [x] gerir transições permitidas; [ ] registar auditoria de quem alterou cada estado. Cancelamento pelo cliente continua fora do escopo actual.

**Frontend:** [x] painel operacional para aceitar, rejeitar, iniciar e concluir; [x] consulta do estado da marcação pela API; [x] mensagens de sucesso e erro baseadas na resposta do servidor.

**Concluído quando:** [x] uma mudança de estado feita pela equipa é persistida e visível ao cliente, sem permitir estados incompatíveis. [ ] auditoria das alterações e actualização automática em tempo real.

### Fase 4 — Crédito Lava Já, pagamentos demonstrativos e fidelização

**Estado:** backend e frontend demonstram carregamentos, pagamento de uma marcação aceite/concluída, movimentos persistidos e pontos acumulados/resgatados. A identidade é verificada com código da marcação e telefone. Métodos Moza, M-Pesa e e-Mola são apenas rótulos de demonstração, sem chamadas externas. Os movimentos e saldos permanecem dados fictícios sem valor monetário.

**Backend:** [x] saldo e movimentos demonstrativos imutáveis, idempotentes; [x] pagamentos limitados ao preço guardado de marcação aceite/concluída, sem saldo negativo ou pagamento duplicado; [x] pontos acumulados e resgate de 500 pontos; [ ] separar saldo promocional/carregado e painel de operações para equipa.

**Frontend:** [x] carteira e fidelização ligados à API, carregamento fixo de 500 MT, pagamento pelo preço da marcação e registo de pontos/recompensa; [x] indicações visíveis de demonstração e opções conceptuais Moza/M-Pesa/e-Mola; [ ] fluxo guiado de parceiros fictícios.

**Concluído quando:** [x] o utilizador percorre carregamento, pagamento e pontos com movimentos persistidos e idempotentes; [x] não há integração financeira real; [ ] demonstrar cenário de parceiros fictícios.

### Fase 5 — Histórico e acabamento da experiência

**Estado:** histórico do cliente implementado como consulta sem conta, usando código e telefone para verificar identidade e devolver até 50 marcações associadas ao contacto. A confirmação da pré-marcação agora liga directamente ao acompanhamento e ao histórico. Auditoria de alterações e resumo operacional da equipa continuam pendentes.

**Backend:** [x] endpoint de histórico limitado a 50 registos e condicionado a código/telefone válidos; [ ] consultas operacionais agregadas e filtros adicionais.

**Frontend:** [x] histórico de marcações com estados de erro, carregamento no botão e lista vazia; [ ] resumo operacional mínimo para a equipa.

**Concluído quando:** [x] cliente e equipa consultam registos autorizados nos fluxos actuais; [ ] completar indicadores e auditoria operacional.

### Fase 6 — PWA e validação de demonstração

- Configurar manifesto, ícones provisórios e comportamento instalável. Substituir ícones pelo material de marca quando estiver disponível.
- Tratar perda de ligação de forma explícita; não confirmar offline uma marcação, alteração de fila ou pagamento.
- Preparar dados de demonstração e percorrer o fluxo cliente → API → painel → estado actualizado.
- Preparar uma demonstração curta para avaliadores: escolha de serviço, pré-marcação, crédito carregado por um meio simulado (Moza ou outro), pagamento simulado, pontos recebidos e painel operacional com indicadores de exemplo.
- Mostrar uma visão conceptual de expansão para parceiros como cenário futuro, sem os apresentar como afiliados activos nem permitir transacções entre comerciantes.

### Extensões posteriores ao protótipo

- Refinar a demonstração de Moza Banco, campanhas e expansão, com base na reacção dos avaliadores.
- Notificações e indicadores adicionais se houver tempo e necessidade validada.
- Integrações financeiras reais, custódia de saldos, liquidação, múltiplos operadores e afiliados exigem nova decisão de escopo, validação comercial/jurídica e desenho de segurança. Permanecem fora do protótipo.

## Critério de sucesso do MVP

Um cliente consulta os serviços do Lava Já, envia uma pré-marcação válida, recebe a confirmação da API e acompanha o estado. Um funcionário autenticado consulta essa marcação no painel e actualiza o atendimento. O protótipo também demonstra o Crédito Lava Já, um pagamento e a fidelização através de movimentos fictícios persistidos no PostgreSQL, sempre identificados como demonstração. Erros de rede ou validação não são apresentados como sucesso e nenhuma operação é apresentada como pagamento real.

## Execução local da base de dados

1. Copiar `.env.example` para `.env` e ajustar apenas valores locais, se necessário.
2. Iniciar PostgreSQL com `docker compose up -d database`.
3. Confirmar o estado com `docker compose ps`.
4. Quando a API/Prisma estiver configurada, aplicar migrações conforme os scripts do backend.

O volume `lava_ja_postgres_data` mantém os dados entre reinícios do container. Para apagar os dados locais deliberadamente, usar `docker compose down -v`.
