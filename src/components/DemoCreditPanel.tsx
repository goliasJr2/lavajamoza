"use client";

import { useState } from "react";

export default function DemoCreditPanel() {
  const [balance, setBalance] = useState(450);
  const [notice, setNotice] = useState("");
  const [method, setMethod] = useState("Moza Banco");

  function simulateLoad() {
    setBalance((current) => current + 500);
    setNotice(`Carregamento de 500 MT simulado com ${method}. Nenhuma conta foi contactada.`);
  }

  function simulatePayment() {
    if (balance < 250) {
      setNotice("Saldo demonstrativo insuficiente para este exemplo.");
      return;
    }
    setBalance((current) => current - 250);
    setNotice("Pagamento de exemplo de 250 MT simulado. Nenhum valor foi cobrado.");
  }

  return <>
    <section className="wallet-card">
      <div className="wallet-topline"><span>CRÉDITO LAVA JÁ</span><span className="demo-badge">Saldo fictício</span></div>
      <p>Saldo de demonstração</p><strong className="wallet-amount">{balance.toLocaleString("pt-MZ")} <small>MT</small></strong>
      <span className="wallet-footnote">Este saldo não tem valor monetário e não pode ser levantado.</span>
    </section>
    <div className="credit-actions">
      <section className="credit-panel"><span className="feature-icon">＋</span><h2>Simular carregamento</h2><p>Veja como poderia ser escolhido um meio de carregamento.</p><label>Meio demonstrativo<select value={method} onChange={(event) => setMethod(event.target.value)}><option>Moza Banco</option><option>M-Pesa</option><option>e-Mola</option><option>Crédito promocional</option></select></label><button className="primary-button" onClick={simulateLoad}>Adicionar 500 MT fictícios</button></section>
      <section className="credit-panel"><span className="feature-icon">↗</span><h2>Simular pagamento</h2><p>Exemplo de pagamento de um serviço Lava Já.</p><div className="booking-summary"><span>Lavagem completa</span><strong>250 MT</strong></div><button className="secondary-button" onClick={simulatePayment}>Simular pagamento</button></section>
    </div>
    {notice && <p className="feedback success" role="status">{notice}</p>}
    <section className="transaction-list"><div className="section-heading section-heading-left"><p className="eyebrow">Actividade local</p><h2>Movimentos desta sessão</h2></div><p>Os exemplos de carregamento e pagamento alteram apenas este ecrã. Ao actualizar ou fechar a página, o saldo volta ao valor inicial. Nada é enviado ou guardado no servidor.</p></section>
  </>;
}
