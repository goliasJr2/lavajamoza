# Fluxos da plataforma e roteiro de verificação

Este guia indica por onde começar a explorar o Lava Já Smart e o que verificar em cada tipo de utilizador. A aplicação serve um carwash; as contas empresariais são clientes com frota, não vendedores do marketplace.

## Antes de começar

1. Inicie PostgreSQL, API e frontend conforme o `README.md`.
2. Confirme que a API responde em `http://localhost:4000/api/health` e abra `http://localhost:3000`.
3. Aplique as migrações e carregue o seed se estiver a usar uma base de demonstração nova.
4. Use os dados demonstrativos descritos no `README.md`; a marcação `LAVA1002` é a referência prevista para o fluxo de pagamento. Confirme que existe e está aceite antes de iniciar o checkout.
5. Para o marketplace, use cliente e ADMIN no mesmo navegador, pois os pedidos são guardados localmente.

## 1. Visitante ou cliente sem sessão

**Comece em:** `/` (catálogo).

1. Veja serviços, preços e duração de referência.
2. Abra `/marcacoes`, escolha serviço, viatura/identificação do veículo e horário, e envie uma pré-marcação.
3. Guarde o código apresentado. A marcação é criada como pedido pendente; isso ainda não significa que o atendimento foi aceite.
4. A equipa decide no `/admin`. Depois de aceite, o cliente pode consultar o estado em `/fila` com código e telefone.
5. Consulte `/marcacoes/historico` e `/notificacoes` para verificar histórico e actualizações associadas ao contacto.  

**Verifique:** validações do formulário, código gerado, persistência após recarregar e estado pendente até a decisão administrativa.

## 2. Cliente individual autenticado

**Comece em:** `/perfil` para criar/abrir uma conta individual. No registo, associe a conta a uma marcação existente conforme solicitado pela interface.

1. Inicie sessão e confirme o perfil e as marcações associadas.
2. Abra `/cartao` para ver o cartão virtual e o QR identificador. O QR não autoriza pagamentos.
3. Abra `/credito` para consultar a carteira demonstrativa e os movimentos. Pode demonstrar carregamento ou pagamento simulado usando uma marcação elegível.
4. Abra `/fidelizacao` para consultar pontos e recompensas. Os pontos só são atribuídos quando coexistem pagamento confirmado e serviço concluído.
5. Abra `/pagamento` para o fluxo Moza ilustrativo: submeta código e telefone, veja o pedido pendente e aguarde a validação da equipa no `/admin`.
6. Abra `/notificacoes` para consultar mensagens internas, incluindo campanhas já disponibilizadas.
7. Abra `/marketplace`, preencha nome e telefone, solicite um benefício ilustrativo e veja o estado depois da decisão do ADMIN.
8. Para acompanhar as sugestões locais, consulte `/ao-redor`.

**Verifique:** a sessão cliente só acede aos próprios dados; pontos, crédito promocional, bónus Moza e saldo carregado são apresentados separadamente. O checkout não comunica com o banco.

## 3. Cliente empresarial

**Comece em:** `/perfil`, seleccionando o registo empresarial.

1. Envie os dados da empresa. A conta começa pendente de revisão.
2. Entre no `/admin` como ADMIN e consulte a área de contas empresariais.
3. Aprove ou rejeite o pedido.
4. Se aprovado, volte à sessão empresarial e confirme que pode gerir a frota permitida pela conta.

**Verifique:** uma empresa pendente não deve usar as capacidades reservadas a uma empresa aprovada. Esta conta é cliente do Lava Já; não representa um parceiro vendedor.

## 4. ADMIN / proprietário operacional

**Comece em:** `/admin` e entre com as credenciais locais definidas no `.env`/seed.

1. **Resumo operacional:** confira marcações, estados, métricas e recebimentos registados. Valores estimados do catálogo não são receita contabilística.
2. **Pagamentos:** veja pedidos Moza pendentes e use a acção de validação demonstrativa; ou registe um recebimento declarado pela equipa.
3. **Marcações:** aceite/rejeite pedidos e avance os estados até à conclusão.
4. **Serviços:** crie, edite, active ou desactive itens do catálogo.
5. **Guia local:** mantenha sugestões ilustrativas visíveis ou ocultas.
6. **Campanhas e notificações:** agende uma campanha para o futuro e consulte o seu estado. A entrega é na caixa interna, sem SMS/email/push.
7. **Marketplace demo:** encontre o pedido do cliente criado no mesmo navegador e aprove/rejeite-o. Volte à página cliente para mostrar o estado actualizado.
8. **Contas empresariais e avaliações:** reveja empresas e consulte as avaliações do atendimento.

**Verifique:** sem sessão válida, o painel não disponibiliza gestão; estados e decisões são validados pela API. A aprovação de marketplace é apenas local e demonstrativa.

## Percurso curto recomendado para a apresentação

1. Cliente envia uma pré-marcação em `/marcacoes`.
2. ADMIN aceita o pedido no `/admin`.
3. Cliente consulta `/pagamento` e cria o pedido Moza de demonstração.
4. ADMIN valida esse pedido e, quando aplicável, conclui a lavagem.
5. Cliente consulta `/fidelizacao` para mostrar os pontos/créditos elegíveis e `/notificacoes` para actualizações internas.
6. Cliente solicita uma oferta em `/marketplace`; ADMIN aprova-a no painel; cliente mostra o estado final.

## Limites a mencionar durante a verificação

- Pagamento Moza, carteira, vouchers e recompensas são demonstrações sem movimento financeiro real.
- Notificações ficam dentro da aplicação; não há entrega por SMS, email ou push de sistema.
- Ofertas, parceiros e aprovação do marketplace são fictícios e guardados apenas no navegador da demonstração.
- O guia local contém sugestões ilustrativas, não confirmação de estabelecimentos ou afiliação.
- Não há conta autónoma de parceiro, gateway financeiro integrado ou verificação por OTP nesta fase.
