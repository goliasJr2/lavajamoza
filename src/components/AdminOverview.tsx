"use client";

import { useCallback, useEffect, useState } from "react";

type Summary = {
  today: { bookings: number; completed: number; estimatedServiceValueMzn: number };
  queue: { requestsPending: number; accepted: number; inProgress: number };
  simulatedPaymentsToday: { count: number; amountMzn: number };
  recentBookings: Array<{
    publicCode: string;
    status: string;
    startsAt: string;
    priceMznAtBooking: number;
    service: { name: string };
    vehicle: { plate: string };
    customer: { name: string };
  }>;
};

const apiBase = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;
const statusNames: Record<string, string> = {
  REQUESTED: "Pendente", ACCEPTED: "Aceite", IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluída", REJECTED: "Não aceite", CANCELLED: "Cancelada",
};

export default function AdminOverview({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${apiBase}/bookings/manage/summary`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (response.status === 401 || response.status === 403) onUnauthorized();
      if (!response.ok) throw new Error("Não foi possível carregar o resumo operacional.");
      setSummary(await response.json() as Summary);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); }
    finally { setLoading(false); }
  }, [token, onUnauthorized]);

  useEffect(() => { void load(); }, [load]);

  return <section className="admin-overview" aria-labelledby="overview-heading">
    <div className="admin-overview-heading"><div><p className="eyebrow">Operação · Matola</p><h2 id="overview-heading">Resumo operacional</h2><p>Indicadores de marcações. Valores são referências de catálogo, não receitas.</p></div><button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}>{loading ? "A actualizar…" : "Actualizar"}</button></div>
    {error && <p className="feedback error" role="alert">{error} <button className="text-button" type="button" onClick={() => void load()}>Tentar novamente</button></p>}
    {loading && !summary ? <p className="catalog-state" role="status">A carregar indicadores…</p> : summary && <>
      <div className="overview-grid">
        <article className="overview-card"><span>Marcações hoje</span><strong>{summary.today.bookings}</strong><small>{summary.today.completed} concluídas hoje</small></article>
        <article className="overview-card"><span>Pedidos pendentes</span><strong>{summary.queue.requestsPending}</strong><small>Aguardam decisão da equipa</small></article>
        <article className="overview-card"><span>Na operação</span><strong>{summary.queue.accepted + summary.queue.inProgress}</strong><small>{summary.queue.accepted} aceites · {summary.queue.inProgress} em atendimento</small></article>
        <article className="overview-card"><span>Pagamentos simulados hoje</span><strong>{summary.simulatedPaymentsToday.count}</strong><small>{summary.simulatedPaymentsToday.amountMzn.toLocaleString("pt-MZ")} MT · sem valor monetário</small></article>
      </div>
      <div className="overview-secondary"><span>Valor indicativo das marcações de hoje</span><strong>{summary.today.estimatedServiceValueMzn.toLocaleString("pt-MZ")} MT</strong><small>Estimativa baseada nos preços registados; não representa facturação.</small></div>
      <div className="overview-recent"><div className="section-heading section-heading-left"><p className="eyebrow">Última actividade</p><h3>Marcações recentes</h3></div>
        {summary.recentBookings.length === 0 ? <p className="catalog-state">Ainda não há marcações registadas.</p> : <div className="overview-booking-list">{summary.recentBookings.map((booking) => <article className="overview-booking-row" key={booking.publicCode}>
          <div><strong>{booking.service.name} · {booking.vehicle.plate}</strong><small>{booking.customer.name} · {new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeZone: "Africa/Maputo" }).format(new Date(booking.startsAt))}</small></div>
          <span className={`booking-admin-status status-${booking.status.toLowerCase()}`}>{statusNames[booking.status] ?? booking.status}</span>
        </article>)}</div>}
      </div>
    </>}
  </section>;
}
