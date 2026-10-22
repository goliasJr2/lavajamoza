import CustomerShell from "@/components/CustomerShell";
import BookingExperience from "@/components/BookingExperience";

type Service = { id: string; name: string; priceMzn: number; durationMinutes: number; isDemo: boolean };

async function getServices(): Promise<Service[]> {
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/api/services`, { cache: "no-store" });
    return response.ok ? await response.json() as Service[] : [];
  } catch { return []; }
}

export const metadata = { title: "Pré-marcação | Lava Já Smart" };

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const services = await getServices();
  const { service: requestedService } = await searchParams;
  const initialServiceId = services.some((service) => service.id === requestedService) ? requestedService : services[0]?.id;
  return <CustomerShell active="/marcacoes"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Visita ao Lava Já · Matola</p><h1>Vamos preparar a sua visita.</h1><p>Escolha o serviço, indique um horário e deixe a equipa tratar do resto. O atendimento só fica confirmado depois da validação do Lava Já.</p></header>
    {services.length ? <BookingExperience services={services} initialServiceId={initialServiceId} /> : <div className="catalog-state"><span className="state-icon">!</span><div><h3>O serviço de marcações está temporariamente indisponível</h3><p>Não conseguimos carregar o catálogo. Verifique se a API está activa e tente novamente.</p></div></div>}
  </main></CustomerShell>;
}
