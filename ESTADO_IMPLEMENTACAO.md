# Estado de implementação — Lava Já Smart

Este documento compara o prompt de interfaces (`PROMPT_IMPLEMENTACAO_INTERFACES.md`) com o código presente no repositório. A avaliação descreve o estado actual; um ecrã demonstrativo não é contado como funcionalidade operacional.

**Legenda:** ✅ implementado · 🟡 parcial/demonstrativo · ⬜ por implementar · ⚠️ diferente do prompt

## Resumo

| Área | Estado | Observação |
|---|---|---|
| Base do produto e navegação | ✅ | Área dedicada a um único carwash, com identidade Lava Já Smart. |
| Stack | ⚠️ | Next.js na raiz, NestJS em `apps/api`, Prisma com PostgreSQL e Docker Compose. O prompt descreve pnpm workspaces, `apps/web` e SQLite; a configuração real do projecto e o plano anterior já adoptaram PostgreSQL. |
| Logótipo | ✅ | SVG horizontal e vertical adicionados a `public/brand`; versão horizontal aplicada ao cabeçalho desktop/mobile. |
| Fluxo cliente: serviços e pedido | 🟡 | Catálogo e pré-marcação persistida funcionam; ainda não há conta de cliente nem área de histórico autenticada. |
| Fluxo operacional da equipa | 🟡 | Login de equipa, catálogo e decisão de aceitar/rejeitar pedidos existem. A fila não actualiza estados até à conclusão. |
| Crédito e fidelização | 🟡 | Carteira, carregamentos fixos, pagamento de marcação aceite/concluída e pontos/resgate são persistidos como demonstração. Não existe qualquer integração financeira; painel interno e separação de saldo promocional/carregado continuam pendentes. |
| PWA | ⬜ | Não foram encontrados manifesto, service worker, ícones de instalação ou experiência offline. |
| Pagamentos, cartão QR, métricas e promoções | 🟡 | Pagamento simulado de serviço existe; cartão QR, métricas e promoções não estão implementados. |

## Ecrãs e fluxos do cliente

| Requisito no prompt | Estado | Implementação encontrada / lacuna |
|---|---|---|
| Página inicial | 🟡 | `src/app/page.tsx` apresenta o catálogo vindo da API, acesso à pré-marcação e cartões para fila/crédito. Contactos, horário e campanhas reais não estão ligados. |
| Registo de cliente | ⬜ | Não existe rota de registo. O backend cria/localiza o cliente durante a pré-marcação através do nome e telefone. |
| Login de cliente | ⬜ | Não existe autenticação de cliente. |
| Consulta de serviços | ✅ | Catálogo da API, preços/duração, estados de erro/vazio e acesso directo à pré-marcação. Gestão administrativa dos serviços também existe. |
| Nova pré-marcação | ✅ | `/marcacoes` recolhe cliente, viatura, serviço e horário disponível; pedido fica persistido no PostgreSQL como pendente de validação da equipa. |
| Confirmação do pedido | 🟡 | O formulário apresenta resultado/código devolvido pela API; ainda não existe página própria de confirmação. Pedido permanece pendente até aceitação. |
| Minhas marcações / histórico | 🟡 | `/marcacoes/historico` lista até 50 marcações associadas ao contacto depois de verificar um código e telefone correspondentes. Não há conta de cliente; a consulta requer uma marcação de referência. |
| Cartão virtual e QR | ⬜ | Não implementados. |
| Carteira demonstrativa | 🟡 | `/credito` está ligado à API: carregamento simulado fixo de 500 MT, pagamento pelo valor guardado da marcação aceite/concluída, histórico persistido e idempotência. Saldo não representa dinheiro. |
| Fidelização | 🟡 | `/fidelizacao` mostra pontos persistidos por pagamento simulado e permite resgatar 500 pontos por benefício ilustrativo. Sem desconto real. |
| Perfil do cliente | ⬜ | Não implementado. |
| Responsividade e navegação | ✅ | Shell partilhado com sidebar em ecrãs maiores e navegação inferior mobile. |

## Ecrãs e fluxos administrativos

| Requisito no prompt | Estado | Implementação encontrada / lacuna |
|---|---|---|
| Login administrativo | ✅ | `/admin` pede autenticação da equipa; backend tem JWT, papéis e guardas de autorização. |
| Dashboard operacional | ✅ | O painel autenticado mostra marcações do dia, fila por estado, pagamentos simulados, estimativa de preços (explicitamente sem representar facturação) e seis marcações recentes. |
| Gestão de marcações | 🟡 | `BookingManagement` consulta pedidos e permite aceitar/rejeitar pedidos pendentes, iniciar atendimentos aceites e concluir os iniciados. Filtros e pesquisa ainda não estão disponíveis. |
| Gestão da fila | ✅ | A equipa avança os estados válidos na API. `/fila` consulta a marcação real por código e telefone e apresenta o passo persistido. |
| Gestão de serviços | ✅ | CRUD de serviços no painel de equipa, apoiado pela API. |
| Registo de pagamentos | ⬜ | Não há fluxo nem registo de pagamentos; a carteira é apenas demonstrativa. |
| Estatísticas | ⬜ | Não implementadas. |
| Promoções e negócios locais | ⬜ | Não implementados. O MVP permanece focado num só carwash, sem afiliados. |

## Requisitos transversais

| Requisito | Estado | Observação |
|---|---|---|
| API REST e persistência | ✅ | API NestJS comunica com Prisma/PostgreSQL; pré-marcações e catálogo são persistidos. |
| Movimentos demonstrativos | ✅ | Saldo, carregamentos, pagamentos e pontos têm registo persistido; backend impede saldo negativo, pagamento duplicado e repetições idempotentes. |
| Protecção administrativa | ✅ | Autenticação e autorização aplicadas no backend às operações administrativas. |
| Estados de carregamento/erro/vazio | 🟡 | Existem nos fluxos de catálogo, formulário e pedidos; ainda não há estados para ecrãs que não foram construídos. |
| Confirmação e feedback acessíveis | 🟡 | Formulários mostram mensagens; ainda faltam diálogos de confirmação para acções administrativas relevantes. |
| PWA instalável e offline | ⬜ | Manifesto, service worker, cache controlada e fallback offline por criar. |
| Dados financeiros claramente fictícios | ✅ | Carteira identifica operações simuladas e esclarece que não está ligada ao Moza Banco, M-Pesa ou e-Mola. |

## Logótipos adicionados

- `public/brand/lava-ja-horizontal.svg` — utilizado na sidebar e no cabeçalho mobile.
- `public/brand/lava-ja-vertical.svg` — disponível para futuras composições verticais, como página de acesso ou materiais da aplicação.

## Próximos passos sugeridos

1. Criar uma lista de marcações do cliente e confirmação dedicada, mantendo a consulta sem conta via código e telefone.
2. Implementar cartão QR de identificação sem capacidade de autorizar débitos.
3. Ligar fidelização a regras e registos na API; manter a carteira explicitamente simulada e definir como se registam operações fictícias.
4. Implementar PWA básica com manifesto, ícones, cache apenas de recursos públicos e fallback offline.
5. Acrescentar dashboard e estatísticas depois de existir histórico operacional suficiente.

O documento original continua como referência de requisitos; este estado deve ser actualizado à medida que cada fluxo passa de demonstrativo para persistido e utilizável.
