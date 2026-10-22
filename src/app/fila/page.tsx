import CustomerShell from "@/components/CustomerShell";

export const metadata = { title: "Acompanhamento da fila | Lava Já Smart" };

const steps = [
  { title: "Pedido recebido", detail: "A equipa recebeu a pré-marcação.", state: "complete" },
  { title: "Aguardando atendimento", detail: "A viatura aguarda a sua vez.", state: "current" },
  { title: "Em lavagem", detail: "A equipa iniciou o serviço.", state: "upcoming" },
  { title: "Concluído", detail: "O serviço foi finalizado.", state: "upcoming" },
];

export default function QueuePage() {
  return <CustomerShell active="/fila"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Acompanhamento do atendimento</p><h1>Saiba em que etapa está a lavagem.</h1><p>Uma vista de exemplo dos estados que poderão acompanhar cada visita.</p></header>
    <section className="queue-demo-card">
      <div className="queue-card-heading"><div><span className="demo-badge">Cenário fictício</span><h2>Lavagem de demonstração</h2><p>Viatura ABC-123-MC · Lavagem completa</p></div><span className="queue-position">#03 <small>posição na fila</small></span></div>
      <ol className="queue-steps">{steps.map((step, index) => <li className={`queue-step ${step.state}`} key={step.title}><span className="step-marker">{step.state === "complete" ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div>{step.state === "current" && <span className="now-badge">Agora</span>}</li>)}</ol>
      <p className="demo-notice">Os dados acima são ilustrativos. Não representam uma viatura nem uma fila real do Lava Já.</p>
    </section>
    <div className="info-grid"><article className="info-card"><span className="feature-icon">01</span><h3>Actualização pela equipa</h3><p>No fluxo completo, a equipa actualiza a etapa e o cliente vê o estado confirmado.</p></article><article className="info-card"><span className="feature-icon">02</span><h3>Estimativa transparente</h3><p>Uma posição ou previsão só será apresentada com dados reais da operação.</p></article></div>
  </main></CustomerShell>;
}
