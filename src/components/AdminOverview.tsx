"use client";

import { useCallback, useEffect, useState } from "react";

type Summary = {
  today: { bookings: number; completed: number; estimatedServiceValueMzn: number };
  queue: { requestsPending: number; accepted: number; inProgress: number };
  simulatedPaymentsToday: { count: number; amountMzn: number };
  walletOperations: {
    demo: true;
    wallets: { count: number; loadedBalanceMzn: number; promoBalanceMzn: number; mozaCreditBalanceMzn: number; totalBalanceMzn: number; pointsBalance: number };
    payments: { count: number; amountMzn: number };
    recentMovements: Array<{
      id: string;
      type: "LOAD" | "PROMO_CREDIT" | "PAYMENT" | "POINTS_EARNED" | "POINTS_REDEEMED" | "MOZA_BONUS_CREDIT";
      amount: number;
      loadedAmountMzn: number;
      promoAmountMzn: number;
      mozaCreditAmountMzn: number;
      description: string;
      createdAt: string;
      customer: { name: string };
      booking: { publicCode: string } | null;
    }>;
  };
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
      const headers = { Authorization: `Bearer ${token}` };
      const [bookingsResponse, walletResponse] = await Promise.all([
        fetch(`${apiBase}/bookings/manage/summary`, { headers, cache: "no-store" }),
        fetch(`${apiBase}/demo-wallet/manage/summary`, { headers, cache: "no-store" }),
      ]);
      if ([bookingsResponse.status, walletResponse.status].some((status) => status === 401 || status === 403)) onUnauthorized();
      if (!bookingsResponse.ok || !walletResponse.ok) throw new Error("Não foi possível carregar o resumo operacional.");
      const [bookings, walletOperations] = await Promise.all([
        bookingsResponse.json() as Promise<Omit<Summary, "walletOperations">>,
        walletResponse.json() as Promise<Summary["walletOperations"]>,
      ]);
      setSummary({ ...bookings, walletOperations });
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
      <section className="overview-wallet-operations" aria-labelledby="wallet-operations-heading">
        <div className="section-heading section-heading-left"><p className="eyebrow">Carteira · demonstração</p><h3 id="wallet-operations-heading">Resumo de saldos fictícios</h3></div>
        <div className="overview-wallet-grid">
          <article className="overview-card"><span>Carteiras demonstrativas</span><strong>{summary.walletOperations.wallets.count}</strong><small>Clientes com carteira</small></article>
          <article className="overview-card"><span>Saldo carregado</span><strong>{summary.walletOperations.wallets.loadedBalanceMzn.toLocaleString("pt-MZ")} MT</strong><small>Sem valor monetário</small></article>
          <article className="overview-card"><span>Crédito promocional</span><strong>{summary.walletOperations.wallets.promoBalanceMzn.toLocaleString("pt-MZ")} MT</strong><small>Separado do saldo carregado</small></article>
          <article className="overview-card"><span>Pagamentos simulados</span><strong>{summary.walletOperations.payments.count}</strong><small>{summary.walletOperations.payments.amountMzn.toLocaleString("pt-MZ")} MT · fictícios</small></article>
        </div>
        <p className="wallet-operations-note">Total indicativo nas carteiras: <strong>{summary.walletOperations.wallets.totalBalanceMzn.toLocaleString("pt-MZ")} MT</strong>. Nenhum destes valores é dinheiro real.</p>
        <p className="field-hint">Credito especial Moza separado: <strong>{summary.walletOperations.wallets.mozaCreditBalanceMzn.toLocaleString("pt-MZ")} MT</strong> · Pontos acumulados: <strong>{summary.walletOperations.wallets.pointsBalance.toLocaleString("pt-MZ")}</strong>.</p>
        <h4>Movimentos recentes</h4>
        {summary.walletOperations.recentMovements.length ? <div className="overview-demo-movements">{summary.walletOperations.recentMovements.map((movement) => <article className="overview-demo-movement" key={movement.id}>
          <div><strong>{movement.description}</strong><small>{movement.customer.name}{movement.booking ? ` · ${movement.booking.publicCode}` : ""} · {new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(movement.createdAt))}</small>{movement.type === "PAYMENT" && movement.loadedAmountMzn + movement.promoAmountMzn > 0 && <small>Promocional: {movement.promoAmountMzn.toLocaleString("pt-MZ")} MT · carregado: {movement.loadedAmountMzn.toLocaleString("pt-MZ")} MT</small>}</div>
          <b>{movement.type === "PAYMENT" || movement.type === "POINTS_REDEEMED" ? "−" : "+"}{movement.amount.toLocaleString("pt-MZ")} {movement.type === "POINTS_EARNED" || movement.type === "POINTS_REDEEMED" ? "pts" : "MT demo"}</b>
        </article>)}</div> : <p className="catalog-state">Ainda não há movimentos demonstrativos.</p>}
      </section>
      <div className="overview-recent"><div className="section-heading section-heading-left"><p className="eyebrow">Última actividade</p><h3>Marcações recentes</h3></div>
        {summary.recentBookings.length === 0 ? <p className="catalog-state">Ainda não há marcações registadas.</p> : <div className="overview-booking-list">{summary.recentBookings.map((booking) => <article className="overview-booking-row" key={booking.publicCode}>
          <div><strong>{booking.service.name} · {booking.vehicle.plate}</strong><small>{booking.customer.name} · {new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeZone: "Africa/Maputo" }).format(new Date(booking.startsAt))}</small></div>
          <span className={`booking-admin-status status-${booking.status.toLowerCase()}`}>{statusNames[booking.status] ?? booking.status}</span>
        </article>)}</div>}
      </div>
    </>}
  </section>;
}
