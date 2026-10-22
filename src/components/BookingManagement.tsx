"use client";

import { useCallback, useEffect, useState } from "react";

type ManagedBooking = {
  id: string;
  publicCode: string;
  status: "REQUESTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED";
  startsAt: string;
  endsAt: string;
  priceMznAtBooking: number;
  durationAtBooking: number;
  customer: { name: string; phone: string };
  vehicle: { plate: string };
  service: { name: string };
};

const apiBase = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;
const label: Record<ManagedBooking["status"], string> = {
  REQUESTED: "A aguardar resposta", ACCEPTED: "Aceite", IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluída", CANCELLED: "Cancelada", REJECTED: "Não aceite",
};

export default function BookingManagement({ token }: { token: string }) {
  const [bookings, setBookings] = useState<ManagedBooking[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${apiBase}/bookings/manage`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error("Não foi possível carregar os pedidos de marcação.");
      setBookings(await response.json() as ManagedBooking[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha de ligação à API.");
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function update(booking: ManagedBooking, status: "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED") {
    setBusyId(booking.id);
    setError("");
    setNotice("");
    try {
      const endpoint = status === "IN_PROGRESS" || status === "COMPLETED" ? "operational-status" : "status";
      const response = await fetch(`${apiBase}/bookings/${booking.id}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? "Não foi possível actualizar o pedido.");
      }
      const messages = {
        ACCEPTED: "Marcação aceite; o cliente já pode consultar o estado.",
        REJECTED: "Pedido rejeitado e horário libertado.",
        IN_PROGRESS: "Atendimento iniciado; o cliente já pode acompanhar o estado.",
        COMPLETED: "Serviço concluído e estado actualizado para o cliente.",
      };
      setNotice(messages[status]);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha de ligação à API.");
    } finally {
      setBusyId("");
    }
  }

  return <section className="booking-management">
    <div className="booking-management-heading"><div><p className="eyebrow">Operação</p><h2>Pedidos de pré-marcação</h2><p>Confirme a disponibilidade antes de aceitar um pedido.</p></div><button className="secondary-button" type="button" onClick={() => void load()}>Actualizar lista</button></div>
    {notice && <p className="feedback success" role="status">{notice}</p>}
    {error && <p className="feedback error" role="alert">{error}</p>}
    <div className="booking-admin-list">
      {bookings.map((booking) => <article className="booking-admin-card" key={booking.id}>
        <div className="booking-admin-top"><span className="booking-code">{booking.publicCode}</span><span className={`booking-admin-status status-${booking.status.toLowerCase()}`}>{label[booking.status]}</span></div>
        <h3>{booking.service.name}</h3>
        <p>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(booking.startsAt))} · {booking.durationAtBooking} min</p>
        <dl><div><dt>Cliente</dt><dd>{booking.customer.name} · {booking.customer.phone}</dd></div><div><dt>Viatura</dt><dd>{booking.vehicle.plate}</dd></div><div><dt>Preço indicativo</dt><dd>{booking.priceMznAtBooking.toLocaleString("pt-MZ")} MT</dd></div></dl>
        {booking.status === "REQUESTED" && <div className="editor-actions"><button className="primary-button" disabled={busyId === booking.id} onClick={() => void update(booking, "ACCEPTED")}>Aceitar pedido</button><button className="secondary-button" disabled={busyId === booking.id} onClick={() => void update(booking, "REJECTED")}>Rejeitar</button></div>}
        {booking.status === "ACCEPTED" && <div className="editor-actions"><button className="primary-button" disabled={busyId === booking.id} onClick={() => void update(booking, "IN_PROGRESS")}>Iniciar atendimento</button></div>}
        {booking.status === "IN_PROGRESS" && <div className="editor-actions"><button className="primary-button" disabled={busyId === booking.id} onClick={() => void update(booking, "COMPLETED")}>Concluir serviço</button></div>}
      </article>)}
      {bookings.length === 0 && !error && <p className="catalog-state">Ainda não há pedidos de pré-marcação.</p>}
    </div>
  </section>;
}
