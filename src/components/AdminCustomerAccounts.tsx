"use client";

import { useCallback, useEffect, useState } from "react";

const api = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;
type Business = { id: string; name: string; phone: string; businessName: string | null; nuit: string | null; accountStatus: "PENDING" | "ACTIVE" | "REJECTED"; _count: { vehicles: number; bookings: number } };
type Rating = { id: string; score: number; comment: string | null; createdAt: string; booking: { publicCode: string; service: { name: string }; vehicle: { plate: string } }; customer: { name: string; businessName: string | null; accountType: string } };
type Summary = { averageScore: number; ratingCount: number; completedBookings: number; responseRate: number; distribution: Array<{ score: number; count: number }>; ratings: Rating[] };

export default function AdminCustomerAccounts({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const load = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [businessResponse, ratingResponse] = await Promise.all([
        fetch(`${api}/customer-auth/business/manage`, { headers, cache: "no-store" }),
        fetch(`${api}/customer-auth/ratings/manage`, { headers, cache: "no-store" }),
      ]);
      if ([businessResponse.status, ratingResponse.status].some((status) => status === 401 || status === 403)) onUnauthorized();
      if (!businessResponse.ok || !ratingResponse.ok) throw new Error("Não foi possível carregar as contas e avaliações.");
      setBusinesses(await businessResponse.json() as Business[]);
      setSummary(await ratingResponse.json() as Summary);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar dados."); }
  }, [token, onUnauthorized]);

  useEffect(() => { void load(); }, [load]);

  async function review(id: string, decision: "APPROVE" | "REJECT") {
    setBusyId(id); setError("");
    try {
      const response = await fetch(`${api}/customer-auth/business/manage/${id}/review`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
      if (!response.ok) throw new Error("Não foi possível actualizar esta conta.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao rever a conta."); }
    finally { setBusyId(""); }
  }

  return <section className="admin-panel customer-admin-panel" id="customer-accounts">
    <div className="section-heading section-heading-left"><div><p className="eyebrow">Clientes empresariais</p><h2>Contas e avaliações</h2><p>Valide os pedidos empresariais e acompanhe o feedback das lavagens concluídas.</p></div></div>
    {error && <p className="feedback error" role="alert">{error}</p>}
    <div className="admin-rating-summary"><article><span>Média das avaliações</span><strong>{summary?.averageScore.toFixed(1) ?? "—"} / 5</strong></article><article><span>Avaliações recebidas</span><strong>{summary?.ratingCount ?? "—"}</strong></article><article><span>Lavagens concluídas avaliadas</span><strong>{summary ? `${summary.responseRate}%` : "—"}</strong></article></div>
    <h3>Pedidos empresariais</h3>
    <div className="admin-review-list">{businesses.map((business) => <article className="admin-review-card" key={business.id}><div><strong>{business.businessName}</strong><p>NUIT {business.nuit} · contacto {business.name} · {business.phone}</p><small>{business._count.vehicles} viaturas · {business._count.bookings} marcações</small></div><div className="editor-actions"><span className={`booking-admin-status status-${business.accountStatus.toLowerCase()}`}>{business.accountStatus === "PENDING" ? "A aguardar" : business.accountStatus === "ACTIVE" ? "Activa" : "Rejeitada"}</span>{business.accountStatus === "PENDING" && <><button className="primary-button" disabled={busyId === business.id} onClick={() => void review(business.id, "APPROVE")}>Aprovar</button><button className="secondary-button" disabled={busyId === business.id} onClick={() => void review(business.id, "REJECT")}>Rejeitar</button></>}</div></article>)}{!businesses.length && <p className="catalog-state">Ainda não existem pedidos empresariais.</p>}</div>
    <h3>Avaliações recentes</h3>
    <div className="admin-rating-distribution">{summary?.distribution.map((item) => <span key={item.score}>{item.score} ★ <strong>{item.count}</strong></span>)}</div>
    <div className="admin-review-list">{summary?.ratings.map((rating) => <article className="admin-review-card" key={rating.id}><div><strong>{"★".repeat(rating.score)}{"☆".repeat(5 - rating.score)} · {rating.customer.businessName ?? rating.customer.name}</strong><p>{rating.booking.service.name} · {rating.booking.vehicle.plate} · {rating.booking.publicCode}</p><small>{rating.comment || "Sem comentário"} · {new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeZone: "Africa/Maputo" }).format(new Date(rating.createdAt))}</small></div></article>)}{summary && !summary.ratings.length && <p className="catalog-state">Ainda não foram recebidas avaliações.</p>}</div>
  </section>;
}
