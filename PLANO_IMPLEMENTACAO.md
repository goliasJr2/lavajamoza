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

**Estado:** ecrã demonstrativo implementado; submissão ainda não persistida na API. A interface permite visualizar os campos, serviço, duração e preço, mas identifica explicitamente que não cria uma reserva.

**Backend:** modelos mínimos de cliente/viatura e marcação; endpoints para criar e consultar marcações; validar serviço activo, campos, horário, disponibilidade e duplicação. Definir estados iniciais e política de cancelamento simples.

**Frontend:** formulário de pré-marcação adequado a telemóvel, confirmação baseada na resposta da API, ecrã de detalhe e lista das marcações do cliente; vista administrativa para consultar e aceitar/rejeitar pedidos.

**Concluído quando:** uma marcação válida persiste e surge no painel; pedidos inválidos ou horários indisponíveis recebem mensagens compreensíveis.

### Fase 3 — Fila e estado do atendimento

**Estado:** vista conceptual implementada com dados fictícios. Não representa uma fila operacional nem recebe estados do backend.

**Backend:** gerir a fila e transições de estado permitidas (por exemplo: aguardando, em atendimento, concluído e cancelado); registar quem fez cada alteração e impedir transições inválidas.

**Frontend:** painel operacional simples para a equipa actualizar a fila; cliente consegue ver o estado actual da sua marcação. Actualizar os dados a partir da API e indicar quando não foi possível confirmar uma alteração.

**Concluído quando:** uma mudança de estado feita pela equipa é persistida e visível ao cliente, sem permitir estados incompatíveis.

### Fase 4 — Crédito Lava Já, pagamentos demonstrativos e fidelização

**Estado:** ecrãs de protótipo implementados. O saldo de Crédito Lava Já pode ser alterado localmente na sessão para demonstrar carregamento e pagamento; fidelização apresenta pontos e recompensa de exemplo. Nada é persistido ou enviado para bancos, carteiras ou API.

**Backend:** criar saldo demonstrativo separado por tipo (saldo carregado simulado e crédito promocional), movimentos imutáveis de crédito/débito, pontos de fidelização e registo de pagamentos simulados. Implementar confirmação idempotente e impedir saldo negativo. Criar dados de demonstração para o Moza Banco e para cenários de expansão, sem chamadas externas nem liquidação financeira.

**Frontend:** apresentar carteira com aviso visível de "Demonstração — sem valor monetário real", simular carregamento, autorização de pagamento de um serviço e atribuição/utilização de pontos. Mostrar opções conceptuais de carregamento associadas ao Moza e a outros meios, sem ligação técnica a esses fornecedores. Incluir uma apresentação clicável ou fluxo guiado que ilustre como o Crédito Lava Já poderia ser aceite em estabelecimentos parceiros no futuro, deixando explícito que os parceiros e a liquidação são fictícios nesta versão.

**Concluído quando:** o utilizador consegue percorrer a experiência completa com dados simulados; todos os movimentos ficam no histórico de demonstração; não existe integração financeira activa nem alegação de pagamento real.

### Fase 5 — Histórico e acabamento da experiência

**Backend:** endpoints de histórico do cliente e consultas operacionais básicas; paginação/limites adequados e filtragem por estado/data se necessária.

**Frontend:** histórico de marcações, estados vazios/erro/carregamento e resumo operacional mínimo para a equipa.

**Concluído quando:** cliente e equipa conseguem consultar apenas os registos permitidos para o seu perfil.

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
