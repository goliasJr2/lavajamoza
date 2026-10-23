"use client";

import { FormEvent, useState } from "react";
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
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const steps = [
  { status: "REQUESTED", title: "Pedido recebido", detail: "A equipa recebeu a pré-marcação." },
  { status: "ACCEPTED", title: "Marcação aceite", detail: "A equipa confirmou a disponibilidade." },
  { status: "IN_PROGRESS", title: "Em atendimento", detail: "A lavagem da viatura já começou." },
  { status: "COMPLETED", title: "Concluído", detail: "O serviço foi finalizado." },
] as const;

async function responseMessage(response: Response) {
  try {
    const body = await response.json() as { message?: string };
    if (body.message) return body.message;
  } catch { /* resposta sem JSON */ }
  return "Não foi possível consultar este pedido. Verifique os dados e tente novamente.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-MZ", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(value));
}

export default function QueueTracker({ initialCode = "" }: { initialCode?: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams({ code: String(data.get("code") ?? "").trim().toUpperCase(), phone: String(data.get("phone") ?? "").trim() });
    try {
      const response = await fetch(`${apiUrl}/api/bookings/mine?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      setBooking(await response.json() as Booking);
    } catch (cause) {
      setBooking(null);
      setError(cause instanceof Error ? cause.message : "Falha de ligação. Verifique a internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const activeStep = booking ? steps.findIndex((step) => step.status === booking.status) : -1;

  return <>
    <form className="demo-form queue-lookup-form" onSubmit={lookup}>
      <div className="booking-step-heading"><span>1</span><div><h2>Consultar pedido</h2><p>O código está no comprovativo da pré-marcação.</p></div></div>
      <label>Código do pedido<input name="code" defaultValue={initialCode} placeholder="Ex.: A1B2C3D4" minLength={8} maxLength={8} autoCapitalize="characters" required /></label>
      <label>Contacto telefónico<input name="phone" type="tel" placeholder="84 123 4567" pattern="(\+?258[\s-]?)?8[2-7]([\s-]?[0-9]){7}" title="Use um número moçambicano válido." required /></label>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={loading}>{loading ? "A consultar…" : "Ver estado do pedido"}</button>
    </form>

    {booking && <section className="queue-demo-card queue-live-card" aria-live="polite">
      <div className="queue-card-heading"><div><span className={`booking-admin-status status-${booking.status.toLowerCase()}`}>{booking.status === "REQUESTED" ? "A aguardar confirmação" : booking.status === "ACCEPTED" ? "Aceite" : booking.status === "IN_PROGRESS" ? "Em atendimento" : booking.status === "COMPLETED" ? "Concluída" : booking.status === "REJECTED" ? "Não aceite" : "Cancelada"}</span><h2>{booking.service}</h2><p>Viatura {booking.plate} · {formatDate(booking.startsAt)}</p></div><span className="booking-code">{booking.code}</span></div>
      {activeStep >= 0 ? <ol className="queue-steps">{steps.map((step, index) => {
        const state = index < activeStep ? "complete" : index === activeStep ? "current" : "upcoming";
        return <li className={`queue-step ${state}`} key={step.status}><span className="step-marker">{state === "complete" ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div>{state === "current" && <span className="now-badge">Estado actual</span>}</li>;
      })}</ol> : <p className="demo-notice">{booking.status === "REJECTED" ? "A equipa não conseguiu confirmar este pedido. Contacte o Lava Já para mais informações." : "Este pedido foi cancelado."}</p>}
      <dl className="booking-receipt"><div><dt>Cliente</dt><dd>{booking.customerName}</dd></div><div><dt>Serviço</dt><dd>{booking.durationMinutes} min · {booking.priceMzn.toLocaleString("pt-MZ")} MT indicativos</dd></div></dl>
      <p className="field-hint">O estado é actualizado pela equipa. Consulte novamente esta página para ver alterações recentes.</p>
      <Link className="secondary-button queue-notifications-link" href={{ pathname: "/notificacoes", query: { code: booking.code } }}>Ver notificações deste pedido</Link>
    </section>}
  </>;
}
