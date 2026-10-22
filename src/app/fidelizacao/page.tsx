import CustomerShell from "@/components/CustomerShell";
import DemoCreditPanel from "@/components/DemoCreditPanel";

export const metadata = { title: "Fidelização | Lava Já Smart" };

export default function LoyaltyPage() {
  return <CustomerShell active="/fidelizacao"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Reconhecer cada visita</p><h1>Fidelização Lava Já</h1><p>Descubra como as suas visitas podem transformar-se em vantagens.</p></header>
    <DemoCreditPanel mode="loyalty" />
    <div className="future-card"><span className="demo-badge">A explorar</span><h2>Benefícios para si</h2><p>As regras de acumulação e recompensa serão definidas pelo Lava Já, para que cada vantagem seja clara e fácil de acompanhar.</p></div>
  </main></CustomerShell>;
}
