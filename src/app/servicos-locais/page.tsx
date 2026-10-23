import CustomerShell from "@/components/CustomerShell";
import LocalGuide from "@/components/LocalGuide";

type Place = {
  id: string;
  name: string;
  category: "SHOPS" | "FOOD" | "ENTERTAINMENT";
  description: string;
  estimatedMinutes: number;
  externalUrl: string | null;
  isDemo: boolean;
};

async function getPlaces(): Promise<Place[] | null> {
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/api/local-guide`, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json() as Place[];
  } catch { return null; }
}

export const metadata = { title: "Serviços locais | Lava Já Smart" };

export default async function LocalServicesPage() {
  const places = await getPlaces();
  return <CustomerShell active="/servicos-locais"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Enquanto cuidamos do seu carro</p><h1>Serviços locais</h1><p>Explore sugestões de lojas, refeições e entretenimento na zona do Lava Já.</p></header>
    {places === null ? <div className="catalog-state" role="status"><span className="state-icon">!</span><div><h2>Não foi possível carregar as sugestões</h2><p>Os serviços locais estão temporariamente indisponíveis. Tente novamente mais tarde.</p></div></div> : <LocalGuide places={places} />}
  </main></CustomerShell>;
}
