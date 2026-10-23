"use client";

import { useEffect, useState } from "react";

type Report = {
  periodDays: number; from: string; generatedAt: string;
  bookings: { total: number; completed: number; cancelled: number; active: number };
  topServices: Array<{ service: string; count: number }>;
  peakHours: Array<{ hour: string; count: number }>;
  recordedPayments: Array<{ method: "CASH" | "OTHER"; count: number; amountMzn: number }>;
  demoWalletPayments: { count: number; amountMzn: number };
  note: string;
};
const api = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;

export default function AdminStatistics({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [days, setDays] = useState(30); const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => {
    let current = true; setLoading(true); setError("");
    fetch(`${api}/bookings/manage/statistics?days=${days}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (response) => { if (response.status === 401 || response.status === 403) onUnauthorized(); if (!response.ok) throw new Error("Não foi possível carregar as estatísticas."); return response.json() as Promise<Report>; })
      .then((data) => { if (current) setReport(data); })
      .catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [days, token, onUnauthorized]);
  return <section className="admin-statistics" aria-labelledby="statistics-heading">
    <div className="admin-overview-heading"><div><p className="eyebrow">Operação · análise</p><h2 id="statistics-heading">Estatísticas de marcações</h2><p>Dados calculados a partir das marcações e pagamentos persistidos.</p></div><label>Período<select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option></select></label></div>
    {loading && <p className="catalog-state" role="status">A carregar…</p>}{error && <p className="feedback error" role="alert">{error}</p>}
    {!loading && report && <>
      <div className="overview-grid"><article className="overview-card"><span>Marcações no período</span><strong>{report.bookings.total}</strong></article><article className="overview-card"><span>Concluídas</span><strong>{report.bookings.completed}</strong></article><article className="overview-card"><span>Activas ou pendentes</span><strong>{report.bookings.active}</strong></article><article className="overview-card"><span>Canceladas ou rejeitadas</span><strong>{report.bookings.cancelled}</strong></article></div>
      <div className="statistics-grid">
        <div className="overview-recent"><h3>Serviços mais procurados</h3>{report.topServices.length ? <ol className="statistics-service-list">{report.topServices.map((item) => <li key={item.service}><span>{item.service}</span><strong>{item.count}</strong></li>)}</ol> : <p className="catalog-state">Sem marcações para comparar serviços.</p>}</div>
        <div className="overview-recent"><h3>Horários com mais marcações</h3>{report.peakHours.length ? <ol className="statistics-service-list">{report.peakHours.map((item) => <li key={item.hour}><span>{item.hour}</span><strong>{item.count}</strong></li>)}</ol> : <p className="catalog-state">Sem dados de horário neste período.</p>}<small>Hora local de Maputo.</small></div>
        <div className="overview-recent"><h3>Pagamentos registados pela equipa</h3>{report.recordedPayments.length ? <ul className="statistics-service-list">{report.recordedPayments.map((item) => <li key={item.method}><span>{item.method === "CASH" ? "Numerário" : "Outro método"} · {item.count}</span><strong>{item.amountMzn.toLocaleString("pt-MZ")} MT</strong></li>)}</ul> : <p className="catalog-state">Sem pagamentos registados neste período.</p>}<p className="field-hint">Carteira demo separada: {report.demoWalletPayments.count} pagamentos · {report.demoWalletPayments.amountMzn.toLocaleString("pt-MZ")} MT simulados.</p></div>
      </div><p className="field-hint">{report.note} Actualizado {new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(report.generatedAt))}.</p>
    </>}
  </section>;
}
