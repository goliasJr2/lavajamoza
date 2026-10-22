import Link from "next/link";
import CustomerShell from "@/components/CustomerShell";

type Service = {
  id: string;
  name: string;
  description: string;
  priceMzn: number;
  durationMinutes: number;
  isDemo: boolean;
};

async function getServices(): Promise<Service[] | null> {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}/api/services`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as Service[];
  } catch {
    return null;
  }
}

export default async function Home() {
  const services = await getServices();
  return (
    <CustomerShell active="/">
      <main className="shell">
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow">O seu carwash, mais simples</p>
            <h1>Mais tempo para si. Uma lavagem sem surpresas.</h1>
            <p className="hero-text">Consulte os serviços do Lava Já, organize a sua visita e acompanhe o atendimento num só lugar.</p>
            <Link className="primary-link" href="#servicos">Ver serviços <span aria-hidden="true">↓</span></Link>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="water-drop">✦</div>
            <div className="wash-card"><span className="wash-card-label">LAVA JÁ</span><span className="wash-card-car">🚘</span><span className="wash-card-sparkle sparkle-one">✦</span><span className="wash-card-sparkle sparkle-two">✧</span></div>
            <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
          </div>
        </section>

        <section className="phase" id="servicos">
          <div className="section-heading section-heading-left">
            <p className="eyebrow">Carwash Lava Já · Matola</p>
            <h2>Escolha o cuidado certo para o seu carro.</h2>
            <p>Consulte os serviços e preços disponíveis antes de se deslocar.</p>
          </div>
          {services === null ? (
            <div className="catalog-state" role="status"><span className="state-icon">!</span><div><h3>Não foi possível carregar os serviços</h3><p>O catálogo está temporariamente indisponível. Tente novamente mais tarde.</p></div></div>
          ) : services.length === 0 ? (
            <div className="catalog-state" role="status"><span className="state-icon">i</span><div><h3>Estamos a preparar o catálogo</h3><p>Os serviços do Lava Já estarão disponíveis aqui em breve.</p></div></div>
          ) : (
            <div className="service-grid">{services.map((service) => (
              <article className="service-card" key={service.id}>
                <div className="service-card-top"><span className="service-icon" aria-hidden="true">✦</span>{service.isDemo && <span className="demo-badge">Preço demonstrativo</span>}</div>
                <h3>{service.name}</h3><p className="service-description">{service.description}</p>
                <div className="service-details"><span>{service.durationMinutes} min estimados</span><strong>{service.priceMzn.toLocaleString("pt-MZ")} MT</strong></div>
                <Link className="service-book-link" href="/marcacoes">Escolher este serviço →</Link>
              </article>
            ))}</div>
          )}
          <p className="scope-note">Os preços demonstrativos são exemplos de protótipo e podem não corresponder aos preços praticados pelo carwash.</p>
        </section>

        <section className="feature-grid" aria-label="Funcionalidades do protótipo">
          <Link className="feature-card" href="/marcacoes"><span className="feature-icon">01</span><h3>Organize a visita</h3><p>Veja como funcionaria o pedido de pré-marcação.</p><span className="feature-action">Explorar →</span></Link>
          <Link className="feature-card" href="/fila"><span className="feature-icon">02</span><h3>Acompanhe a fila</h3><p>Conheça os estados previstos para o atendimento.</p><span className="feature-action">Ver demonstração →</span></Link>
          <Link className="feature-card" href="/credito"><span className="feature-icon">03</span><h3>Crédito Lava Já</h3><p>Explore um conceito de carteira e pagamentos simulados.</p><span className="feature-action">Explorar conceito →</span></Link>
        </section>
      </main>
    </CustomerShell>
  );
}
