import CustomerShell from "@/components/CustomerShell";

export const metadata = { title: "Fidelização | Lava Já Smart" };

export default function LoyaltyPage() {
  return <CustomerShell active="/fidelizacao"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Reconhecer cada visita</p><h1>Fidelização Lava Já</h1><p>Veja como uma experiência de pontos poderia valorizar a preferência dos clientes.</p></header>
    <div className="demo-notice prominent-notice"><strong>Pontos fictícios.</strong> Este exemplo não está associado a uma conta, compra ou benefício resgatável.</div>
    <section className="points-card"><div><span className="wallet-topline">PONTOS DE DEMONSTRAÇÃO</span><h2>As visitas podem trazer vantagens.</h2><p>Exemplo de saldo num programa de fidelização.</p></div><div className="points-total"><strong>320</strong><span>pontos</span></div></section>
    <section className="loyalty-progress"><div className="progress-heading"><div><p className="eyebrow">Próxima recompensa ilustrativa</p><h2>Lavagem com desconto</h2></div><strong>320 <small>/ 500 pts</small></strong></div><div className="progress-track"><span /></div><p>Faltariam 180 pontos para atingir este exemplo de recompensa.</p></section>
    <section className="transaction-list"><div className="section-heading section-heading-left"><p className="eyebrow">Exemplo de actividade</p><h2>Como os pontos poderiam acumular</h2></div><div className="loyalty-row"><span className="loyalty-row-icon">＋</span><div><strong>Visita ao Lava Já</strong><small>Exemplo de pontos por serviço</small></div><b>+120 pts</b></div><div className="loyalty-row"><span className="loyalty-row-icon">＋</span><div><strong>Campanha de boas-vindas</strong><small>Bónus demonstrativo</small></div><b>+200 pts</b></div></section>
    <div className="future-card"><span className="demo-badge">Ainda sem resgate real</span><h2>Benefícios ajustados à operação</h2><p>As regras de acumulação e recompensa seriam definidas pelo Lava Já e implementadas com registo confirmado na API.</p></div>
  </main></CustomerShell>;
}
