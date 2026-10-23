# Perguntas e respostas para apresentar o Lava Já Smart

Respostas curtas para uma demonstração ou conversa de pitch. Quando algo ainda é proposta, a resposta identifica-o como tal.

## Produto e clientes

### 1. Que problema a plataforma resolve?

Organiza a descoberta dos serviços, a pré-marcação e o acompanhamento do atendimento num só canal, enquanto dá à equipa uma área para gerir pedidos e comunicar actualizações.

### 2. Quem pode usar a plataforma?

Clientes individuais e empresariais podem usar os fluxos de cliente. O ADMIN gere a operação do Lava Já. Nesta fase não existe um perfil separado para vendedores ou parceiros externos.

### 3. O que uma conta empresarial pode fazer?

Depois de aprovada pelo ADMIN, pode gerir a frota associada à sua conta e usar os fluxos de cliente. Não é uma conta de parceiro do marketplace.

### 4. Como funciona a pré-marcação?

O cliente escolhe serviço, veículo e horário, envia o pedido e recebe um código. O pedido fica pendente até a equipa o aceitar ou rejeitar; depois o estado pode ser acompanhado.

### 5. A marcação garante atendimento no horário escolhido?

O horário é solicitado e sujeito à validação operacional. A equipa confirma a marcação no painel antes de ela avançar no fluxo.

## Pagamentos, fidelização e Moza Banco

### 6. É possível pagar realmente pelo Moza Banco nesta versão?

Não. O checkout mostra como o pedido poderia ser criado e validado, mas não está ligado ao Moza Banco, SIMO, POS ou USSD e não movimenta dinheiro.

### 7. O que significa “pagamento confirmado” no demo?

Significa que o ADMIN mudou o estado no fluxo de apresentação. Não é uma confirmação recebida do banco.

### 8. Como funcionam os pontos?

Na regra demonstrativa actual, um serviço pago e concluído dá 50 pontos. Os pontos ficam separados dos saldos de carteira. Os valores e recompensas ainda são ilustrativos.

### 9. Os créditos especiais Moza são dinheiro?

Não. São um saldo promocional fictício usado para demonstrar uma proposta de benefício. A aplicação não confirma que o pagador é cliente do banco nem credita uma conta bancária.

### 10. O que falta para aceitar pagamentos reais?

Definir com o banco o canal e o processo de adesão, obter documentação e ambiente de testes, implementar confirmação autenticada, reconciliação e tratamento de estados como cancelamento ou expiração, e validar o fluxo com o comerciante.

## Marketplace e notificações

### 11. Os parceiros apresentados já aceitarão os vouchers?

Não. As ofertas do marketplace são exemplos para demonstrar a experiência. Não há parceiros confirmados, voucher utilizável ou desconto de pontos nesse fluxo.

### 12. O que o ADMIN faz no marketplace demonstrativo?

Vê um pedido fictício e pode aprová-lo ou rejeitá-lo. O estado é guardado no navegador local, sem comunicação com o parceiro e sem emissão de voucher real.

### 13. As promoções chegam por SMS ou notificação do telemóvel?

Não nesta versão. O ADMIN pode agendar campanhas e os clientes consultam as mensagens na caixa de notificações da aplicação. SMS, email e push não estão ligados.

### 14. Como poderá o marketplace gerar valor para parceiros e para o Lava Já?

Como proposta futura, os parceiros poderiam receber visibilidade e novos clientes, enquanto o carwash poderia aumentar a fidelização. Comissão, preço de participação e regras de resgate ainda precisam de validação comercial e não estão implementados.

## Operação, segurança e próximos passos

### 15. O ADMIN consegue ver e gerir toda a operação?

O painel actual permite gerir serviços e marcações, registar ou validar pagamentos demonstrativos, consultar indicadores, gerir campanhas, rever contas empresariais e consultar avaliações. O escopo actual usa um único ADMIN.

### 16. Como são protegidos os dados da conta?

O backend autentica sessões, aplica controlos de acesso às rotas administrativas e restringe operações autenticadas de cliente à própria conta. Palavras-passe são guardadas como hash. OTP, recuperação de palavra-passe e uma auditoria de segurança completa ainda não estão concluídos.

### 17. O que está pronto para uma operação comercial real?

A plataforma tem fluxos demonstráveis e persistência para marcações, gestão operacional, contas e carteira fictícia. Pagamentos bancários reais, comunicações externas, parceiros do marketplace, validação de vouchers e confirmação comercial de preços ainda dependem de trabalho técnico e acordos externos.

### 18. Qual seria o próximo passo depois do protótipo?

Validar o processo operacional com o Lava Já e o interesse dos clientes; depois escolher uma integração prioritária — por exemplo pagamentos ou comunicação — e avançar com requisitos, fornecedor, ambiente de testes, segurança e piloto controlado.

## Frase de transparência para fechar a demonstração

“O que apresentamos é um protótipo navegável dos fluxos de marcação, operação e benefícios. Pagamentos Moza, notificações externas e marketplace ainda são demonstrações e não movimentam dinheiro nem dependem de parceiros activos.”
