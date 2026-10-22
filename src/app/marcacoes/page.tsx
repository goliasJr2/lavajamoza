import CustomerShell from "@/components/CustomerShell";
import DemoBookingForm from "@/components/DemoBookingForm";

type Service = { id: string; name: string; priceMzn: number; durationMinutes: number; isDemo: boolean };

async function getServices(): Promise<Service[]> {
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/api/services`, { cache: "no-store" });
    return response.ok ? await response.json() as Service[] : [];
  } catch { return []; }
}

export const metadata = { title: "Pré-marcação | Lava Já Smart" };

export default async function BookingPage() {
  const services = await getServices();
  return <CustomerShell active="/marcacoes"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Visita ao Lava Já · Matola</p><h1>Planeie a sua próxima lavagem.</h1><p>Indique os dados da visita para ver como funcionará o pedido de pré-marcação.</p></header>
    {services.length ? <DemoBookingForm services={services} /> : <div className="catalog-state"><span className="state-icon">!</span><div><h3>Serviços temporariamente indisponíveis</h3><p>O formulário precisa do catálogo actual. Tente novamente quando a API estiver disponível.</p></div></div>}
    <p className="scope-note">Esta versão demonstra o ecrã e a experiência. O pedido não é guardado nem confirmado pelo carwash.</p>
  </main></CustomerShell>;
}
