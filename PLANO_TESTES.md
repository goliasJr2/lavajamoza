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
| API | Consultar `/api/health` com API e PostgreSQL disponíveis ou indisponíveis | Retorna estado da API/base de dados ou erro de conexão |

## Fase 1 — Acesso administrativo e catálogo

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Consultar catálogo público com serviços activos | Resposta inclui apenas dados publicados e válidos |
| API | Consultar `/api/services` sem token | Lista serviços activos; não expõe serviços inactivos |
| API | Criar/editar/desactivar serviço como funcionário autorizado | Alteração validada e persistida |
| Segurança | Aceder a endpoint administrativo sem sessão ou como cliente | Resposta não autorizada; nenhum dado é alterado |
| Validação | Enviar preço negativo, duração inválida ou campos em falta | Erro de validação previsível; sem gravação parcial |
| Frontend | Carregar catálogo, catálogo vazio e erro da API | Cada estado tem apresentação clara e sem preços inventados |
| Ponta a ponta | Funcionário altera serviço e cliente abre o catálogo | Cliente vê o valor persistido mais recente |

## Fase 2 — Viatura e pré-marcação

**Estado actual:** criação e consulta de pedidos estão ligadas à API e persistem no PostgreSQL. A equipa autenticada pode listar, aceitar ou rejeitar pedidos pendentes. A confirmação inicial é apenas de recepção (`REQUESTED`); a equipa ainda precisa aceitar o atendimento. A capacidade é de uma viatura por intervalo, com horário das 08:00 às 18:00 no fuso de Maputo.

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Criar marcação com serviço activo, viatura e horário válido | Marcação persistida com identificador e estado inicial |
| API | Consultar disponibilidade com serviço/dia e com serviço inactivo/data inválida | Só devolve horas futuras livres, respeitando duração e janela diária; entradas inválidas são rejeitadas |
| API | Criar marcação e consultar com código correcto e contacto correspondente | Os mesmos dados e estado persistido são devolvidos, sem expor registos de terceiros |
| API | Criar marcação com serviço inactivo ou dados inválidos | Pedido rejeitado, sem registo parcial |
| API | Pedir hora passada, antes das 08:00, depois do fecho, duração que ultrapassa as 18:00 ou data inválida | Pedido rejeitado com mensagem compreensível |
| API | Pedir horário sobreposto ou repetir pedido para o mesmo intervalo | Conflito explicado; não criar marcação duplicada |
| API | Associar matrícula existente a contacto diferente | Pedido rejeitado sem alterar o proprietário da viatura |
| API | Consultar com código ou contacto que não coincidem | Resposta não revela se o código ou o contacto existe |
| Segurança | Consultar ou alterar a lista administrativa sem token de administrador | A API responde não autorizado/proibido e não altera o pedido |
| API | Aceitar ou rejeitar o mesmo pedido duas vezes, ou enviar estado não permitido | Primeira transição pendente é persistida; repetição/estado inválido recebe conflito/validação |
| Frontend | Submeter formulário válido, dados inválidos, horário ocupado e API indisponível | Estado de sucesso só após resposta persistida; erro de rede/validação não parece sucesso |
| Frontend | Ver confirmação e consultar com código/contacto | Código visível, estado inicial identificado como pedido recebido e dados consistentes |
| Frontend | Alterar serviço/data e escolher horário disponível | Horários são actualizados para a combinação escolhida; horários ocupados ou que ultrapassam o fecho não são oferecidos |
| Frontend | Equipa abre o painel e aceita/rejeita pedido pendente | Lista reflecte apenas o estado confirmado pela API; pedido tratado deixa de oferecer acções |
| Ponta a ponta | Cliente cria pedido, equipa aceita e cliente consulta novamente | O mesmo pedido e o estado aceite aparecem nos dois lados |

## Fase 3 — Fila e estado do atendimento

**Estado actual:** painel da equipa e consulta do cliente estão ligados à API; transições e estado do pedido são persistidos. A validação abaixo deve ser executada para confirmar a implementação neste incremento.

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| Unitário/API | Percorrer transições permitidas | Estado muda conforme as regras de domínio |
| API | `REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED` com token ADMIN | Cada transição é persistida e devolvida com relações da marcação |
| API | Tentar `REQUESTED → IN_PROGRESS`, `ACCEPTED → COMPLETED` ou regressão após conclusão | Recebe conflito e estado original mantém-se |
| API | Enviar status operacional diferente de `IN_PROGRESS` ou `COMPLETED` | Validação rejeita a entrada |
| Unitário/API | Tentar transição proibida ou alterar como utilizador sem permissão | Operação rejeitada sem mudança persistida |
| Integração | Dois pedidos concorrentes actualizam a mesma marcação | Estado final consistente, sem duplicação ou regressão indevida |
| Frontend | Funcionário altera estado e API responde com sucesso | Painel reflecte o estado confirmado |
| Frontend | Pedido aceite e pedido em atendimento | Respectivamente, só “Iniciar atendimento” e “Concluir serviço” ficam disponíveis |
| Frontend | Consultar `/fila` com código e telefone correctos | Detalhes e passo actual correspondem ao estado devolvido pela API |
| Frontend | Consultar com código/telefone incorrectos, pedido rejeitado ou cancelado | Erro genérico ou estado terminal apropriado; sem dados de outra pessoa |
| Frontend | Consultar com API indisponível | Mensagem de erro; não apresentar dados anteriores como actualizados |
| Frontend | API falha durante actualização | Interface informa falha e não mostra sucesso falso |
| Ponta a ponta | Funcionário avança atendimento e cliente consulta novamente | Cliente recebe o estado persistido e actualizado |

## Fase 5 — Histórico do cliente

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Consultar histórico com código e telefone coincidentes | Até 50 marcações do mesmo cliente, ordenadas da mais recente para a mais antiga |
| API | Consultar com código/telefone que não coincidem | Resposta genérica de não encontrado; nenhum registo divulgado |
| API | Cliente tem uma marcação, várias marcações ou só a marcação de verificação | Lista limitada ao contacto verificado e sem duplicados |
| Frontend | Abrir histórico e submeter credenciais válidas | Apresenta estados e dados devolvidos pela API |
| Frontend | API indisponível ou credenciais inválidas | Erro claro sem mostrar dados antigos como resultado actual |
| Ponta a ponta | Criar duas marcações com o mesmo contacto e consultar o histórico por uma delas | Ambas aparecem; uma marcação de outro telefone não aparece |

## Fase 6 — PWA e modo sem ligação

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| Manifesto | Abrir `/manifest.webmanifest` | Nome, idioma, escopo, cores, modo standalone e ícones 192/512 válidos |
| Instalação | Abrir em Chrome/Edge num contexto HTTPS ou localhost | Browser oferece instalação e botão da aplicação chama o prompt nativo |
| Instalação | Abrir em Safari no iOS | Instrução “Partilhar → Adicionar ao ecrã principal” fica acessível |
| Service worker | Abrir em desenvolvimento | Service worker não é registado |
| Cache | Inspeccionar cache depois de usar a aplicação | Só página offline, ícones, logo, recursos estáticos versionados; sem HTML/rotas ou dados pessoais |
| Segurança | Navegar/consultar API com sessão/autorização e desligar rede | Nenhuma resposta `/api` ou conteúdo privado é servido da cache |
| Offline | Abrir uma rota sem rede após instalar | Página offline explica indisponibilidade e não afirma que dados/alterações foram guardados |
| Actualização | Publicar versão com nova cache name/service worker | Versão antiga é removida e recursos estáticos da versão nova podem carregar |
| API/segurança | Consultar o resumo operacional sem token ou com utilizador sem papel ADMIN | Acesso não autorizado/proibido |
| API | Consultar resumo com marcações e pagamentos simulados em dias diferentes | Contagens, estados da fila, valores indicativos e pagamentos do dia usam o intervalo de Maputo correcto |
| API | Consultar resumo sem dados | Contagens/valores iguais a zero e lista recente vazia |
| Frontend | Abrir painel autenticado com resultados e sem resultados | Indicadores e actividade recente correspondem à API; vazio é explícito |
| Frontend | Falha de rede ou token expirado no resumo | Mensagem de erro/termina sessão, sem apresentar indicadores fictícios |

## Fase 4 — Crédito Lava Já, pagamentos demonstrativos e fidelização

**Estado actual:** carteira, movimentos, pagamento e pontos estão ligados à API e persistidos no PostgreSQL. Valores e operações são fictícios e devem continuar identificados como demonstração.

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Simular carregamento demonstrativo | Movimento registado como simulado; saldo actualizado uma única vez |
| API | Carregar 500 MT pelos meios simulados Moza/M-Pesa/e-Mola e pelo meio promocional | Saldo carregado aumenta para os três primeiros; apenas o saldo promocional aumenta para `PROMO_DEMO` |
| API | Pagar com saldo misto, promocional suficiente e carregado insuficiente | Total validado; saldo promocional é consumido primeiro e o movimento guarda a divisão exacta |
| API | Migrar uma carteira existente com saldo combinado | Total anterior é preservado no saldo carregado; valores históricos sem origem não são inventados |
| API | Repetir a mesma confirmação/idempotency key | Não duplica saldo nem movimento |
| API | Simular pagamento superior ao saldo disponível | Operação recusada; saldo não fica negativo |
| API | Simular pagamento de serviço elegível | Débito, estado demonstrativo e referência ficam no histórico |
| API | Tentar pagar marcação pendente/rejeitada, repetir pagamento ou usar saldo insuficiente | Operação recusada; saldo e histórico permanecem consistentes |
| API | Repetir carregamento/pagamento/resgate com a mesma chave idempotente | A mesma operação não duplica saldo, débito ou pontos |
| API | Resgatar recompensa com menos de 500 pontos e com pelo menos 500 | Saldo insuficiente é recusado; com saldo válido, 500 pontos são debitados uma única vez |
| API | Tentar enviar valor do carregamento/preço no corpo, método financeiro real ou campos extra | Validação rejeita campos não permitidos; backend define os valores demonstrativos |
| API | Atribuir e resgatar pontos | Pontos são separados do saldo em meticais simulados e não ficam negativos |
| API/segurança | Consultar resumo de operações demonstrativas sem token ou com papel não autorizado | Acesso recusado; totais e movimentos recentes só aparecem para ADMIN autenticado |
| Segurança/integridade | Enviar saldo, preço ou resultado de pagamento adulterado pelo cliente | Backend calcula valores e rejeita confirmação não autorizada |
| Frontend | Abrir carteira, carregar, pagar e consultar histórico | Aviso de demonstração visível; interface só mostra sucesso após confirmação da API |
| Frontend | Consultar carteira com saldos carregado/promocional e efectuar pagamento | Composição dos saldos aparece separada; pagamento e movimentos mostram quanto saiu de cada origem |
| Frontend/equipa | Abrir resumo de operações demonstrativas com dados e sem movimentos | Totais, saldos, pagamentos e actividade recente correspondem à API; estado vazio é explícito |
| Frontend | Abrir cenário de parceiro/expansão | Exemplo identificado como conceptual/fictício, sem permitir pagamento real |
| Frontend | Carregar carteira/pontos por código+telefone válidos após actualizar a página | Saldos e movimentos persistidos são recuperados pela API |
| Frontend | API indisponível, dados inválidos ou pagamento sem saldo | Mensagem de erro; interface não mostra sucesso falso nem altera saldo localmente |
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

## Fase 7 — Guia local e notificações na aplicação

| Área | Cenário | Resultado esperado |
|---|---|---|
| API | Consultar o guia local | Apenas sugestões activas de demonstração são devolvidas; categoria e ordem são válidas |
| Frontend | Filtrar lojas, cafés e entretenimento, incluindo lista vazia | Os filtros funcionam e os exemplos permanecem identificados como não verificados/não afiliados |
| Privacidade | Consultar notificações com código/telefone válidos e inválidos | Dados aparecem apenas após correspondência; erro não confirma se outro telefone/código existe |
| API | Criar uma marcação e depois aceitar, iniciar e concluir | Cada evento gera notificação persistida associada à marcação e ao cliente; mudança de estado e notificação são atómicas |
| API | Marcar notificações como lidas com identidade válida/inválida | Apenas as notificações do cliente verificado são actualizadas |
| Frontend | Abrir caixa, actualizar, aguardar sincronização e marcar como lidas | Contagem, estado lido e estados de erro reflectem as respostas da API |
| Integração | Usar guia e caixa de notificações | Não são feitas chamadas a mapas, localização, SMS, email ou push de sistema |

## Fase 8 — Auditoria das alterações de estado

| Área | Cenário | Resultado esperado |
|---|---|---|
| API | Administrador aceita/rejeita um pedido pendente | Estado, notificação e evento com actor/estado anterior/novo são persistidos na mesma transacção |
| API | Administrador inicia e conclui atendimento | Cada transição válida cria um evento com o utilizador autenticado e data/hora |
| Integridade | Repetir transição, usar transição inválida ou provocar falha | Estado não muda e nenhum evento de auditoria parcial é criado |
| Acesso | Consultar eventos sem autenticação ou com papel não autorizado | API recusa; eventos são devolvidos apenas pelo endpoint de gestão protegido |
| Frontend | Abrir histórico de uma marcação com e sem eventos | Linha temporal ordenada mostra transição, data e actor; vazio explica que o registo começa nas próximas acções |
| Privacidade | Consultar pedido/histórico pelo endpoint público do cliente | Resposta não inclui eventos nem emails da equipa |

## Fora da matriz actual

## Cartão virtual de identificação

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Pedir `/api/bookings/card` com código e telefone correspondentes | Devolve nome e identificador opaco estável do cliente |
| Segurança | Pedir cartão com código/telefone divergentes | Não revela dados do cliente |
| Frontend | Validar marcação e apresentar cartão | QR contém apenas o identificador opaco; não inclui telefone, saldo ou autorização de pagamento |
| Ponta a ponta | Ler QR e tentar usá-lo como autorização de débito | QR serve apenas para identificar; pagamentos continuam a exigir validação própria da marcação |

## Estatísticas operacionais

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API/segurança | Consultar `/api/bookings/manage/statistics` sem ADMIN | Acesso não autorizado |
| API | Consultar períodos de 7, 30 e 90 dias e período inválido | Totais, serviços, horários de pico e pagamentos por método usam apenas registos dentro do período; valor inválido é rejeitado |
| Frontend | Consultar período com dados e sem dados | Indicadores vêm da API; listas vazias explicam falta de amostra; pagamentos demo permanecem separados dos directos |
| Frontend | API falha ou sessão expira | Erro visível e sessão administrativa encerrada quando não autorizada |

## Registo administrativo de pagamentos

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API/segurança | Listar ou registar pagamento sem ADMIN autenticado | Acesso não autorizado e nenhum registo criado |
| API | Registar pagamento para marcação aceite/concluída | Guarda valor do preço fixado na marcação, método, data e funcionário autenticado |
| API | Registar pagamento em marcação pendente, rejeitada, inexistente, já paga ou paga pela carteira demo | Operação recusada sem duplicar movimentos |
| Segurança/integridade | Enviar valor adulterado ou campos adicionais | DTO rejeita campos não permitidos e valor é sempre calculado pelo backend |
| Frontend | Abrir painel e registar recebimento confirmado | Só marcações elegíveis aparecem; histórico mostra método, montante e funcionário; sucesso após resposta da API |

## Pagamento Moza demonstrativo

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Pedir pagamento com código/telefone de marcação aceite | Cria pedido pendente pelo preço guardado na marcação, sem chamada a banco ou carteira móvel |
| API/segurança | Pedir com identidade divergente, marcação não elegível ou já paga | Operação recusada sem expor dados nem duplicar pagamento |
| API/segurança | Confirmar pedido pendente sem sessão ADMIN | Acesso negado |
| API | ADMIN confirma pedido Moza demo pendente | Estado muda uma vez e guarda funcionário responsável |
| Frontend | Cliente cria pedido e consulta estado | Interface comunica pendência e explica que é demonstração sem integração bancária |
| Frontend/equipa | ADMIN confirma a demonstração e cliente actualiza | Estado confirmado aparece como simulação, nunca como confirmação do banco |

## Conta e perfil de cliente

| Tipo | Cenário | Resultado esperado |
|---|---|---|
| API | Registar usando código/telefone de marcação correspondente e palavra-passe válida | Credencial é guardada com hash e é emitido token de cliente |
| API/segurança | Registar com dados divergentes, tentar registar contacto já associado ou palavra-passe inválida | Pedido rejeitado; não cria nem substitui credenciais |
| API | Entrar com telefone e palavra-passe correctos/incorretos | Token emitido apenas para credenciais válidas; erro não revela se telefone existe |
| API/segurança | Consultar `/api/customer-auth/me` sem token, com token ADMIN ou token de cliente | Apenas token CUSTOMER acede ao próprio perfil, marcações e saldos demonstrativos |
| Frontend | Criar conta, actualizar página, terminar sessão e voltar a entrar | Perfil é recuperado pela API; logout remove a sessão local |
| Segurança | Enviar telefone/código de outro cliente ou tentar alterar `sub` do token | Nenhum perfil ou registo de terceiros é devolvido |
| API/segurança | Consultar cartão, notificações ou carteira com token CUSTOMER | Devolve somente dados da conta autenticada |
| API/segurança | Usar no endpoint de carteira um código pertencente a outro cliente | Pedido recusado; operação não lê nem altera a carteira alheia |
| Frontend | Abrir histórico, cartão, notificações e carteira com sessão iniciada | As páginas usam a conta e não pedem nova validação código/telefone |

Não testar liquidação real entre carwash, custódia de dinheiro, carregamentos ou pagamentos reais por M-Pesa/e-Mola/Moza, nem adesão efectiva de afiliados. Testar apenas as simulações e verificar que não fazem chamadas financeiras externas. Antes de uma implementação real, criar casos de teste, requisitos de reconciliação e análise de segurança próprios.
