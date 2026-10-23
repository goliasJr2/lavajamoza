"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Booking = {
  code: string;
  status: "REQUESTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED";
  customerName: string;
  plate: string;
  service: string;
  startsAt: string;
  priceMzn: number;
  durationMinutes: number;
  rating: { score: number; comment: string | null } | null;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const statusLabel: Record<Booking["status"], string> = {
  REQUESTED: "A aguardar confirmação", ACCEPTED: "Aceite", IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluída", CANCELLED: "Cancelada", REJECTED: "Não aceite",
};

async function readError(response: Response) {
  try {
    const body = await response.json() as { message?: string };
    if (body.message) return body.message;
  } catch { /* resposta sem JSON */ }
  return "Não foi possível consultar o histórico. Tente novamente.";
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [phone, setPhone] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [ratingBusy, setRatingBusy] = useState("");

  useEffect(() => {
    const token = window.sessionStorage.getItem("lavaja-customer-token");
    if (!token) return;
    setHasToken(true);
    setLoading(true);
    fetch(`${apiUrl}/api/customer-auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error(await readError(response)); return response.json(); })
      .then((profile) => { setPhone(profile.phone); setBookings(profile.bookings.map((b: { publicCode: string; status: Booking["status"]; startsAt: string; priceMznAtBooking: number; durationAtBooking: number; rating: Booking["rating"]; service: { name: string }; vehicle: { plate: string } }) => ({ code: b.publicCode, status: b.status, customerName: profile.name, plate: b.vehicle.plate, service: b.service.name, startsAt: b.startsAt, priceMzn: b.priceMznAtBooking, durationMinutes: b.durationAtBooking, rating: b.rating }))); setAccount(true); })
      .catch((cause) => { setError(cause instanceof Error ? cause.message : "Não foi possível abrir a conta."); setHasToken(false); })
      .finally(() => setLoading(false));
  }, []);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setBookings(null);
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      code: String(form.get("code") ?? "").trim().toUpperCase(),
      phone: String(form.get("phone") ?? "").trim(),
    });
    setPhone(params.get("phone") ?? "");
    try {
      const response = await fetch(`${apiUrl}/api/bookings/history?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await readError(response));
      setBookings(await response.json() as Booking[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha de ligação. Verifique a internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function submitRating(event: FormEvent<HTMLFormElement>, booking: Booking) {
    event.preventDefault(); setRatingBusy(booking.code); setRatingError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${apiUrl}/api/customer-auth/ratings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: booking.code, phone, score: Number(form.get("score")), comment: String(form.get("comment") ?? "").trim() }) });
      if (!response.ok) throw new Error(await readError(response));
      const rating = await response.json() as { score: number; comment: string | null };
      setBookings((current) => current?.map((item) => item.code === booking.code ? { ...item, rating } : item) ?? null);
    } catch (cause) { setRatingError(cause instanceof Error ? cause.message : "NÃ£o foi possÃ­vel enviar a avaliaÃ§Ã£o."); }
    finally { setRatingBusy(""); }
  }

  return <section className="history-section">
    <header className="page-heading"><p className="eyebrow">Área do cliente</p><h1>As suas marcações</h1><p>{account ? "Histórico associado à sua conta." : "Entre na sua conta ou use os dados de uma marcação para consultar o histórico."}</p></header>
    {!account && !hasToken && <p className="account-entry"><Link href="/perfil">Entrar ou criar conta</Link></p>}
    {!account && !hasToken && <form className="demo-form history-lookup-form" onSubmit={lookup}>
      <label>Código de uma marcação<input name="code" placeholder="Ex.: A1B2C3D4" minLength={8} maxLength={8} required /></label>
      <label>Contacto telefónico<input name="phone" type="tel" placeholder="84 123 4567" pattern="(\+?258[\s-]?)?8[2-7]([\s-]?[0-9]){7}" title="Use um número moçambicano válido." required /></label>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={loading}>{loading ? "A consultar…" : "Consultar histórico"}</button>
      <p className="lookup-security">O código e o contacto são verificados antes de mostrar as marcações associadas.</p>
    </form>}

    {bookings && <section className="history-results" aria-live="polite">
      <div className="section-heading section-heading-left"><p className="eyebrow">Até 50 registos</p><h2>Histórico encontrado</h2></div>
      {bookings.length === 0 ? <p className="catalog-state">Ainda não existem outras marcações associadas a este contacto.</p> : <div className="booking-admin-list">
        {bookings.map((booking) => <article className="booking-admin-card history-card" key={booking.code}>
          <div className="booking-admin-top"><span className="booking-code">{booking.code}</span><span className={`booking-admin-status status-${booking.status.toLowerCase()}`}>{statusLabel[booking.status]}</span></div>
          <h3>{booking.service}</h3>
          <p>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(booking.startsAt))}</p>
          <dl><div><dt>Viatura</dt><dd>{booking.plate}</dd></div><div><dt>Duração</dt><dd>{booking.durationMinutes} min</dd></div><div><dt>Preço indicativo</dt><dd>{booking.priceMzn.toLocaleString("pt-MZ")} MT</dd></div></dl>
          {booking.status === "COMPLETED" && (booking.rating ? <p className="rating-confirmation" aria-label={`Rating: ${booking.rating.score} out of 5`}>{"★".repeat(booking.rating.score)}{"☆".repeat(5 - booking.rating.score)} · Avaliação enviada</p> : <form className="booking-rating-form" onSubmit={(event) => void submitRating(event, booking)}><label>Avalie o atendimento<select name="score" defaultValue="5"><option value="5">5 · Excelente</option><option value="4">4 · Muito bom</option><option value="3">3 · Bom</option><option value="2">2 · Fraco</option><option value="1">1 · Mau</option></select></label><label>Comentário (opcional)<textarea name="comment" maxLength={1000} rows={2} placeholder="Como foi a sua experiência?" /></label>{ratingError && <p className="feedback error" role="alert">{ratingError}</p>}<button className="secondary-button" disabled={ratingBusy === booking.code}>{ratingBusy === booking.code ? "A enviar…" : "Enviar avaliação"}</button></form>)}
        </article>)}
      </div>}
    </section>}
  </section>;
}
