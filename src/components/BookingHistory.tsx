"use client";

import { FormEvent, useState } from "react";

type Booking = {
  code: string;
  status: "REQUESTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED";
  customerName: string;
  plate: string;
  service: string;
  startsAt: string;
  priceMzn: number;
  durationMinutes: number;
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

  return <section className="history-section">
    <header className="page-heading"><p className="eyebrow">Área do cliente</p><h1>As suas marcações</h1><p>Use o código de uma marcação e o telefone associado para consultar o histórico deste contacto.</p></header>
    <form className="demo-form history-lookup-form" onSubmit={lookup}>
      <label>Código de uma marcação<input name="code" placeholder="Ex.: A1B2C3D4" minLength={8} maxLength={8} required /></label>
      <label>Contacto telefónico<input name="phone" type="tel" placeholder="84 123 4567" pattern="(\+?258[\s-]?)?8[2-7]([\s-]?[0-9]){7}" title="Use um número moçambicano válido." required /></label>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={loading}>{loading ? "A consultar…" : "Consultar histórico"}</button>
      <p className="lookup-security">O código e o contacto são verificados antes de mostrar as marcações associadas.</p>
    </form>

    {bookings && <section className="history-results" aria-live="polite">
      <div className="section-heading section-heading-left"><p className="eyebrow">Até 50 registos</p><h2>Histórico encontrado</h2></div>
      {bookings.length === 0 ? <p className="catalog-state">Ainda não existem outras marcações associadas a este contacto.</p> : <div className="booking-admin-list">
        {bookings.map((booking) => <article className="booking-admin-card history-card" key={booking.code}>
          <div className="booking-admin-top"><span className="booking-code">{booking.code}</span><span className={`booking-admin-status status-${booking.status.toLowerCase()}`}>{statusLabel[booking.status]}</span></div>
          <h3>{booking.service}</h3>
          <p>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(booking.startsAt))}</p>
          <dl><div><dt>Viatura</dt><dd>{booking.plate}</dd></div><div><dt>Duração</dt><dd>{booking.durationMinutes} min</dd></div><div><dt>Preço indicativo</dt><dd>{booking.priceMzn.toLocaleString("pt-MZ")} MT</dd></div></dl>
        </article>)}
      </div>}
    </section>}
  </section>;
}
