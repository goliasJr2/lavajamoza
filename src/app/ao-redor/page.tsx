import CustomerShell from "@/components/CustomerShell";
import LocalGuide from "@/components/LocalGuide";

type Place = {
  id: string;
  name: string;
  category: "SHOPS" | "FOOD" | "ENTERTAINMENT";
  description: string;
  estimatedMinutes: number;
  isDemo: boolean;
};

async function getPlaces(): Promise<Place[] | null> {
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/api/local-guide`, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json() as Place[];
  } catch { return null; }
}

export const metadata = { title: "À volta do Lava Já | Lava Já Smart" };

export default async function LocalGuidePage() {
  const places = await getPlaces();
  return <CustomerShell active="/ao-redor"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Enquanto cuidamos do seu carro</p><h1>Ideias para aproveitar o tempo.</h1><p>Explore sugestões de lojas, cafés e entretenimento na zona do Lava Já.</p></header>
    {places === null ? <div className="catalog-state" role="status"><span className="state-icon">!</span><div><h2>Não foi possível carregar as sugestões</h2><p>O guia está temporariamente indisponível. Tente novamente mais tarde.</p></div></div> : <LocalGuide places={places} />}
  </main></CustomerShell>;
}
