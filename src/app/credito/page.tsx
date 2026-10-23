import CustomerShell from "@/components/CustomerShell";
import DemoCreditPanel from "@/components/DemoCreditPanel";

export const metadata = { title: "Crédito Lava Já | Lava Já Smart" };

export default function CreditPage() {
  return <CustomerShell active="/credito"><main className="shell content-page credit-page">
    <header className="page-heading"><p className="eyebrow">Carteira digital · demonstração</p><h1>Crédito Lava Já</h1><p>Consulte o saldo da sua carteira demonstrativa, acompanhe os movimentos e simule o pagamento de uma marcação.</p></header>
    <DemoCreditPanel />
  </main></CustomerShell>;
}
