# Estado da implementação — Lava Já Smart

Actualizado em 23 de Outubro de 2026. Este documento resume o código presente no repositório e distingue funcionalidades operacionais, fluxos demonstrativos e trabalho pendente.

## Já implementado

### Experiência do cliente

- Página inicial responsiva com catálogo de serviços carregado pela API.
- Pré-marcação com escolha de serviço, viatura e horário disponível. Os pedidos ficam guardados no PostgreSQL e recebem um código de consulta.
- Acompanhamento da fila e histórico usando código da marcação e telefone.
- Notificações na aplicação para recepção e actualizações das marcações, com leitura, lembrete de nova lavagem após 30 dias e campanhas promocionais agendadas pelo admin.
- Guia local com sugestões ilustrativas.
- Cartão virtual com QR de identificação. O QR contém apenas um identificador opaco e não autoriza pagamentos.
- Registo e login de cliente por telefone, com palavra-passe armazenada como hash. O registo associa a conta usando o código e telefone de uma marcação existente.
- Perfil autenticado com marcações recentes, cartão e resumo dos saldos demonstrativos.
- Contas cliente individuais e empresariais; empresas aguardam aprovação manual do ADMIN e podem gerir a sua frota aprovada.
- Histórico, cartão, notificações e carteira podem usar a sessão autenticada. As operações de carteira autenticadas só aceitam marcações que pertençam à conta.
- Avaliações de 1 a 5 com comentário opcional para marcações concluídas, uma avaliação por marcação e resumo privado para o administrador.

### Operação do Lava Já

- Login da equipa e rotas administrativas protegidas por JWT e papel ADMIN.
- Gestão de serviços e de marcações, incluindo aceitação/rejeição e transições até à conclusão.
- Registo de recebimentos associados a marcações elegíveis. O valor vem do preço guardado no pedido e o sistema regista o funcionário responsável.
- Pesquisa na gestão de marcações por código, cliente, telefone, matrícula e serviço, com filtros por estado e data de Maputo.
- Gestão do guia À volta do Lava Já: criar, editar, categorizar, publicar, ocultar e remover sugestões, com tempo estimado e ligação externa opcional.
- Agendamento de campanhas promocionais na caixa interna dos clientes; notificações tipadas com ligação interna preparada para futuras ofertas do marketplace.
- Painel com resumo operacional, carteira demonstrativa, histórico de marcações e indicadores para períodos de 7, 30 ou 90 dias: volume por estado, serviços procurados, horários de maior procura e pagamentos registados por método.
- Auditoria das transições de estado das marcações.

### Infraestrutura

- Migração PostgreSQL aplicada para distinguir contas individuais e empresariais, guardar frota e persistir avaliações de atendimento.
- Frontend Next.js/React/TypeScript; API NestJS; Prisma; PostgreSQL em Docker Compose.
- Migrações de base de dados para catálogo, marcações, carteira, pontos, notificações, auditoria, cartão QR, pagamentos e checkout demonstrativo.
- PWA com manifesto, instalação assistida e fallback offline para recursos públicos.

## Funcionalidades demonstrativas

- **Carteira e fidelizacao:** saldos carregados, promocionais e bonus Moza separados; pontos ganhos por servicos pagos e concluidos podem ser trocados por recompensas demonstrativas. Nao movimenta dinheiro nem emite descontos reais de parceiros.
- **Checkout Moza (`/pagamento`):** permite criar um pedido pendente ligado a uma marcação e à equipa actualizar o estado no painel. Não chama o Moza Banco, SIMO, POS ou USSD e não recebe confirmação bancária. É uma simulação do fluxo proposto.
- **Pagamentos registados pela equipa:** o registo reflecte a confirmação declarada pelo funcionário; não processa o pagamento.
- **Guia local:** as sugestões não confirmam estabelecimentos nem parcerias.
- **Notificações:** são internas à aplicação; não são enviadas por SMS, email ou push.
- **Marketplace (`/marketplace`):** ofertas ilustrativas podem ser solicitadas pelo cliente e aprovadas/rejeitadas pelo ADMIN. Os pedidos ficam no armazenamento local do navegador; não descontam pontos, não emitem vouchers e não notificam parceiros. Cliente e ADMIN precisam usar o mesmo navegador para partilhar a demonstração.

### Fidelizacao e beneficios Moza

- Cada servico pago e concluido concede 50 pontos, qualquer que seja o servico; apenas pagamentos confirmados contam.
- Resgates disponiveis: 100 pontos para voucher de parceiro (demo), 250 para 100 MT de credito promocional de lavagem, e 400 para voucher de servico automovel (demo).
- Pagamento Moza com cartao no fluxo demonstrativo concede ainda 5% do valor em credito especial Moza. O saldo Moza, os pontos, o credito promocional e o saldo carregado sao apresentados separadamente.
- Os vouchers nao correspondem a parceiros activos e o fluxo Moza nao se liga ao banco; os montantes e regras sao ilustrativos.

## Por implementar ou validar

### Prioridade de produto

1. Adicionar recuperação de palavra-passe e verificação de telefone por OTP quando houver um fornecedor SMS; OTP está adiado nesta fase.
2. Mais opções de comunicação com clientes, caso sejam escolhidas e configuradas (por exemplo SMS ou push).

### Integração Moza Banco

- Confirmar com o banco e o comerciante o canal disponível, processo de adesão, documentação técnica, ambiente de testes, credenciais e formato de confirmação/liquidação.
- Implementar apenas depois de aprovados os requisitos: criação de pedido real, retorno/consulta de estado, verificação de assinatura, reconciliação e tratamento de cancelamentos/expiração.
- Até essa integração existir, manter o checkout identificado como fluxo de apresentação e nunca apresentar uma confirmação interna como confirmação do banco.

### Qualidade e operação

- Executar testes automatizados de API, integração, ponta a ponta e regressão; o plano está em `PLANO_TESTES.md`.
- Validar a instalação PWA e os fluxos em dispositivos e navegadores reais.
- Paginação e permissões específicas para funcionários além do ADMIN ficam adiadas para uma fase posterior; o escopo actual mantém um único administrador.
- Configurar `JWT_SECRET` de forma persistente no `.env` antes de reiniciar a API. Na sessão actual, a API foi iniciada com uma chave temporária no processo.

## Estado do ambiente local

Na sessão de 22 de Outubro de 2026, PostgreSQL estava saudável, as migrações estavam aplicadas, o seed de demonstração foi executado e frontend/API responderam localmente (`http://localhost:3000` e `http://localhost:4000/api`). O endpoint `/api/health` confirmou a ligação à base de dados. A chave JWT usada nesta sessão não foi gravada no `.env`; o arranque após terminar o processo requer configurar `JWT_SECRET`.

## Critério para apresentar o pitch

Demonstrar primeiro a jornada completa: catálogo → pré-marcação → gestão pela equipa → acompanhamento → checkout ilustrativo → painel operacional. Apresentar o checkout Moza como proposta demonstrável, separando claramente a experiência simulada de uma integração bancária efectiva.
