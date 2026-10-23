import CustomerShell from "@/components/CustomerShell";
import DemoCreditPanel from "@/components/DemoCreditPanel";

export const metadata = { title: "Crédito Lava Já | Lava Já Smart" };

export default function CreditPage() {
  return <CustomerShell active="/credito"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Mais liberdade nas suas visitas</p><h1>Crédito Lava Já</h1><p>Uma forma prática de preparar pagamentos e acompanhar os seus benefícios.</p></header>
    <div className="demo-notice prominent-notice"><strong>Operações simuladas.</strong> O saldo apresentado não tem valor monetário. Moza Banco, M-Pesa e e-Mola não estão ligados a esta experiência.</div>
    <DemoCreditPanel />
  </main></CustomerShell>;
}
