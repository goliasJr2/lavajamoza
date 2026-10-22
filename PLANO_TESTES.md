# Plano de testes — Lava Já Smart

Este plano acompanha os incrementos de `PLANO_IMPLEMENTACAO.md`. Cada incremento de backend é validado junto da respectiva interface. Os testes devem distinguir falha da API, erro de validação e operação confirmada. Não considerar um fluxo concluído só porque a interface mudou de estado. Os fluxos de Crédito Lava Já, pagamentos, Moza Banco e expansão deste protótipo são simulados e não podem movimentar dinheiro nem chamar serviços financeiros reais.

## Estratégia

- **Unitários (backend):** regras de domínio, validações e transições de estado.
- **Integração (backend):** endpoints, autenticação, Prisma e PostgreSQL real de teste.
- **Componentes (frontend):** estados de carregamento, sucesso, vazio e erro; formulários e permissões visuais.
- **Ponta a ponta:** jornada completa no navegador contra frontend, API e base de dados de teste.
- **Manual responsivo:** verificar fluxos principais em largura móvel e desktop.
- Usar dados isolados de teste. Nunca executar testes destrutivos contra a base de dados de desenvolvimento ou produção.
- Para integrações financeiras futuras, usar sandbox; pagamentos reais estão fora do escopo actual.

## Fase 0 — Fundação e ambiente local

| Área | Verificação | Resultado esperado |
|---|---|---|
| Identidade | Abrir a página inicial em desktop e telemóvel | Cores da marca aplicadas, layout legível e idioma `pt-MZ` |
| Acessibilidade básica | Navegar com teclado e verificar foco/contraste dos elementos interactivos | Foco visível e conteúdo utilizável sem rato |
| Docker | Iniciar o serviço `database` e consultar healthcheck | Container fica saudável e PostgreSQL aceita conexão |
| Persistência | Criar dado de teste, reiniciar apenas o container e consultar novamente | Dado permanece no volume nomeado |
| Configuração | Verificar `.gitignore` e ficheiros de ambiente | `.env` e credenciais locais não são versionados |
| API (quando criada) | Consultar health check com API activa e indisponível | Interface distingue serviço disponível de erro de conexão |

## Fase 1 — Acesso administrativo e catálogo

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Consultar catálogo público com serviços activos | Resposta inclui apenas dados publicados e válidos |
| API | Criar/editar/desactivar serviço como funcionário autorizado | Alteração validada e persistida |
| Segurança | Aceder a endpoint administrativo sem sessão ou como cliente | Resposta não autorizada; nenhum dado é alterado |
| Validação | Enviar preço negativo, duração inválida ou campos em falta | Erro de validação previsível; sem gravação parcial |
| Frontend | Carregar catálogo, catálogo vazio e erro da API | Cada estado tem apresentação clara e sem preços inventados |
| Ponta a ponta | Funcionário altera serviço e cliente abre o catálogo | Cliente vê o valor persistido mais recente |

## Fase 2 — Viatura e pré-marcação

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Criar marcação com serviço activo, viatura e horário válido | Marcação persistida com identificador e estado inicial |
| API | Criar marcação com serviço inactivo ou dados inválidos | Pedido rejeitado, sem registo parcial |
| API | Pedir horário indisponível ou duplicar submissão | Conflito explicado; não criar marcação duplicada |
| Segurança | Cliente tenta consultar marcação de outra pessoa | Acesso negado ou registo não revelado |
| Frontend | Submeter formulário válido e formulário inválido | Confirmação só após resposta positiva; erros associados aos campos |
| Ponta a ponta | Cliente cria marcação e funcionário abre o painel | A mesma marcação e os mesmos dados aparecem nos dois lados |

## Fase 3 — Fila e estado do atendimento

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| Unitário/API | Percorrer transições permitidas | Estado muda conforme as regras de domínio |
| Unitário/API | Tentar transição proibida ou alterar como utilizador sem permissão | Operação rejeitada sem mudança persistida |
| Integração | Dois pedidos concorrentes actualizam a mesma marcação | Estado final consistente, sem duplicação ou regressão indevida |
| Frontend | Funcionário altera estado e API responde com sucesso | Painel reflecte o estado confirmado |
| Frontend | API falha durante actualização | Interface informa falha e não mostra sucesso falso |
| Ponta a ponta | Funcionário avança atendimento e cliente consulta novamente | Cliente recebe o estado persistido e actualizado |

## Fase 4 — Crédito Lava Já, pagamentos demonstrativos e fidelização

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Simular carregamento demonstrativo | Movimento registado como simulado; saldo actualizado uma única vez |
| API | Repetir a mesma confirmação/idempotency key | Não duplica saldo nem movimento |
| API | Simular pagamento superior ao saldo disponível | Operação recusada; saldo não fica negativo |
| API | Simular pagamento de serviço elegível | Débito, estado demonstrativo e referência ficam no histórico |
| API | Atribuir e resgatar pontos | Pontos são separados do saldo em meticais simulados e não ficam negativos |
| Segurança/integridade | Enviar saldo, preço ou resultado de pagamento adulterado pelo cliente | Backend calcula valores e rejeita confirmação não autorizada |
| Frontend | Abrir carteira, carregar, pagar e consultar histórico | Aviso de demonstração visível; interface só mostra sucesso após confirmação da API |
| Frontend | Abrir cenário de parceiro/expansão | Exemplo identificado como conceptual/fictício, sem permitir pagamento real |
| Ponta a ponta | Percorrer carregamento simulado → pagamento simulado → pontos | Movimentos consistentes no painel e na carteira do cliente |
| Integração externa | Inspeccionar o fluxo de demonstração | Nenhum pedido é enviado a Moza, M-Pesa, e-Mola ou outro fornecedor financeiro |

## Fase 5 — Histórico e consultas operacionais

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Cliente consulta o seu histórico | Só vê as próprias marcações, com ordenação e limites definidos |
| API | Funcionário consulta operação por estado/data | Filtros aplicados e acesso protegido |
| Frontend | Utilizador sem histórico, com histórico e com falha de API | Estado vazio, lista ou mensagem de erro apropriados |
| Ponta a ponta | Criar e concluir uma marcação, depois abrir histórico | Registo e estado final aparecem correctamente |

## Fase 6 — PWA e demonstração

| Área | Verificação | Resultado esperado |
|---|---|---|
| Instalação | Validar manifesto e instalar em navegador compatível | Nome, tema e ícones provisórios correctos |
| Responsividade | Completar consulta, marcação e acompanhamento em ecrã móvel | Sem overflow; controlos principais acessíveis |
| Indisponibilidade | Desligar API e tentar marcar/actualizar estado | Operação não é apresentada como concluída; instrução de recuperação clara |
| Demonstração | Executar o critério de sucesso de ponta a ponta com dados limpos | Cliente e funcionário concluem o fluxo sem intervenção na base de dados |

## Regressão mínima antes de cada demonstração

1. Catálogo apresenta dados vindos da API.
2. Funcionário não autenticado não consegue alterar serviços ou estados.
3. Marcação válida é persistida e aparece no painel.
4. Marcação inválida, indisponível ou duplicada não é aceite silenciosamente.
5. Alteração de estado reflecte-se para o cliente depois de confirmada pela API.
6. Falha de rede nunca é apresentada como sucesso.
7. Layout principal funciona em largura móvel e desktop.
8. Saldos, pagamentos, pontos, opções Moza e cenários de parceiros têm indicação de demonstração; nenhum fluxo chama fornecedores financeiros.

## Fora da matriz actual

Não testar liquidação real entre carwash, custódia de dinheiro, carregamentos ou pagamentos reais por M-Pesa/e-Mola/Moza, nem adesão efectiva de afiliados. Testar apenas as simulações e verificar que não fazem chamadas financeiras externas. Antes de uma implementação real, criar casos de teste, requisitos de reconciliação e análise de segurança próprios.
