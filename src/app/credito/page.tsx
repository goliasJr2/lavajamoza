import CustomerShell from "@/components/CustomerShell";
import DemoCreditPanel from "@/components/DemoCreditPanel";

export const metadata = { title: "Crédito Lava Já | Lava Já Smart" };

export default function CreditPage() {
  return <CustomerShell active="/credito"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Uma ideia em demonstração</p><h1>Crédito Lava Já</h1><p>Uma experiência conceptual para carregar crédito e pagar serviços com praticidade.</p></header>
    <div className="demo-notice prominent-notice"><strong>Sem dinheiro real.</strong> Os valores, carregamentos e pagamentos apresentados são fictícios. Moza Banco, M-Pesa e e-Mola não estão ligados a este protótipo.</div>
    <DemoCreditPanel />
    <section className="future-card"><span className="demo-badge">Possibilidade futura</span><h2>Uma rede de parceiros</h2><p>No futuro, o crédito poderia ser aceite noutros estabelecimentos. Esta versão representa apenas a ideia: não existem parceiros activos, pagamentos a terceiros nem liquidação.</p></section>
  </main></CustomerShell>;
}
