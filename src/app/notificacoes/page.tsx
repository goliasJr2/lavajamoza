import CustomerShell from "@/components/CustomerShell";
import NotificationCenter from "@/components/NotificationCenter";

export const metadata = { title: "Notificações | Lava Já Smart" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return <CustomerShell active="/notificacoes"><main className="shell content-page">
    <header className="page-heading"><p className="eyebrow">Acompanhe o seu pedido</p><h1>As novidades da sua marcação.</h1><p>Consulte as actualizações guardadas pela equipa Lava Já.</p></header>
    <NotificationCenter initialCode={code} />
  </main></CustomerShell>;
}
