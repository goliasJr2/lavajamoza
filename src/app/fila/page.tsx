import CustomerShell from "@/components/CustomerShell";
import QueueTracker from "@/components/QueueTracker";

export const metadata = { title: "Acompanhamento da fila | Lava Já Smart" };

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return <CustomerShell active="/fila"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Acompanhamento do atendimento</p><h1>Saiba em que etapa está a lavagem.</h1><p>Introduza o código do pedido e o contacto telefónico usado na pré-marcação para consultar o estado actualizado.</p></header>
    <QueueTracker initialCode={code} />
  </main></CustomerShell>;
}
