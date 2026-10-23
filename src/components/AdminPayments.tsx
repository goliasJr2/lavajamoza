"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Booking = { id: string; publicCode: string; status: string; priceMznAtBooking: number; service: { name: string }; customer: { name: string } };
type Payment = { id: string; amountMzn: number; method: "CASH" | "OTHER" | "MOZA_POS_DEMO"; status: "PENDING" | "CONFIRMED"; createdAt: string; staff: { email: string } | null; booking: { publicCode: string; service: { name: string }; customer: { name: string } } };
const api = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;

export default function AdminPayments({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([]); const [payments, setPayments] = useState<Payment[]>([]);
  const [bookingId, setBookingId] = useState(""); const [method, setMethod] = useState<"CASH" | "OTHER">("CASH");
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [bookingResponse, paymentResponse] = await Promise.all([fetch(`${api}/bookings/manage`, { headers, cache: "no-store" }), fetch(`${api}/payments/manage`, { headers, cache: "no-store" })]);
      if ([bookingResponse.status, paymentResponse.status].some((s) => s === 401 || s === 403)) onUnauthorized();
      if (!bookingResponse.ok || !paymentResponse.ok) throw new Error("Não foi possível carregar os pagamentos.");
      const [allBookings, allPayments] = await Promise.all([bookingResponse.json() as Promise<Booking[]>, paymentResponse.json() as Promise<Payment[]>]);
      setBookings(allBookings); setPayments(allPayments);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); }
  }, [token, onUnauthorized]);
  useEffect(() => { void load(); }, [load]);
  const eligible = bookings.filter((b) => ["ACCEPTED", "COMPLETED"].includes(b.status) && !payments.some((p) => p.booking.publicCode === b.publicCode));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!bookingId) return; setBusy(true); setError(""); setNotice("");
    try { const response = await fetch(`${api}/payments/manage`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ bookingId, method }) }); const result = await response.json(); if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Não foi possível registar o pagamento."); setNotice("Pagamento registado com o valor guardado na marcação."); setBookingId(""); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); } finally { setBusy(false); }
  }
  async function confirmMoza(id: string) {
    setBusy(true); setError(""); setNotice("");
    try { const response = await fetch(`${api}/payments/manage/${id}/confirm-moza-demo`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }); const result = await response.json(); if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Não foi possível validar o pedido."); setNotice("Estado do pedido actualizado."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); } finally { setBusy(false); }
  }
  return <section className="admin-payments" aria-labelledby="payments-heading"><div className="admin-overview-heading"><div><p className="eyebrow">Registo da equipa</p><h2 id="payments-heading">Pagamentos de marcações</h2><p>Registe a confirmação recebida pela equipa. O valor vem do preço guardado no pedido.</p></div></div>
    <div className="moza-demo-banner"><span className="demo-badge">Moza · apresentação</span><span>Pedidos ilustrativos são validados pela equipa.</span></div>
    <form className="admin-form payment-record-form" onSubmit={submit}><label>Marcação<select required value={bookingId} onChange={(e) => setBookingId(e.target.value)}><option value="">Seleccione uma marcação elegível</option>{eligible.map((b) => <option key={b.id} value={b.id}>{b.publicCode} · {b.customer.name} · {b.priceMznAtBooking.toLocaleString("pt-MZ")} MT</option>)}</select></label><label>Método registado<select value={method} onChange={(e) => setMethod(e.target.value as "CASH" | "OTHER")}><option value="CASH">Numerário recebido</option><option value="OTHER">Outro método confirmado pela equipa</option></select></label><button className="primary-button" disabled={busy || !bookingId}>{busy ? "A guardar…" : "Registar pagamento"}</button></form>
    {notice && <p className="feedback success" role="status">{notice}</p>}{error && <p className="feedback error" role="alert">{error} <button type="button" className="text-button" onClick={() => void load()}>Actualizar</button></p>}
    <h3>Registos recentes</h3>{payments.length ? <div className="payment-record-list">{payments.map((p) => <article key={p.id}><div><strong>{p.booking.publicCode} · {p.booking.service.name}</strong><small>{p.booking.customer.name} · {p.method === "CASH" ? "Numerário" : p.method === "MOZA_POS_DEMO" ? "Moza · apresentação" : "Outro método"} · {p.status === "PENDING" ? "Pendente" : `confirmado${p.staff ? ` por ${p.staff.email}` : ""}`}</small><small>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(p.createdAt))}</small></div><div className="payment-record-actions"><b>{p.amountMzn.toLocaleString("pt-MZ")} MT</b>{p.method === "MOZA_POS_DEMO" && p.status === "PENDING" && <button className="secondary-button" type="button" disabled={busy} onClick={() => void confirmMoza(p.id)}>Validar pedido</button>}</div></article>)}</div> : <p className="catalog-state">Ainda não há pagamentos registados pela equipa.</p>}
  </section>;
}
