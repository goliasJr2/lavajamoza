"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Service = { id: string; name: string; priceMzn: number; durationMinutes: number; isDemo: boolean };
type Booking = {
  code: string;
  status: "REQUESTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED";
  customerName: string;
  plate: string;
  service: string;
  startsAt: string;
  endsAt: string;
  priceMzn: number;
  durationMinutes: number;
};
type BookingProfile = { accountType: "INDIVIDUAL" | "BUSINESS"; accountStatus: string; name: string; phone: string; vehicles: Array<{ id: string; plate: string }> };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const statusLabels: Record<Booking["status"], string> = {
  REQUESTED: "Pedido recebido · aguarda confirmação da equipa",
  ACCEPTED: "Marcação aceite",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Serviço concluído",
  CANCELLED: "Marcação cancelada",
  REJECTED: "Pedido não aceite",
};

async function getError(response: Response) {
  try {
    const body = await response.json() as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (body.message) return body.message;
  } catch { /* resposta sem JSON */ }
  return "Não foi possível concluir o pedido. Tente novamente.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "long", timeStyle: "short", timeZone: "Africa/Maputo",
  }).format(new Date(value));
}

export default function BookingExperience({ services, initialServiceId }: { services: Service[]; initialServiceId?: string }) {
  const [serviceId, setServiceId] = useState(initialServiceId ?? services[0]?.id ?? "");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [customerProfile, setCustomerProfile] = useState<BookingProfile | null>(null);
  const [businessPlate, setBusinessPlate] = useState("");
  const [useOtherPlate, setUseOtherPlate] = useState(false);
  const selected = services.find((service) => service.id === serviceId);
  const minDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Maputo" }).format(new Date());

  useEffect(() => {
    const token = window.sessionStorage.getItem("lavaja-customer-token");
    if (!token) return;
    void fetch(`${apiUrl}/api/customer-auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<BookingProfile> : null)
      .then((profile) => {
        if (profile?.accountType === "BUSINESS" && profile.accountStatus === "ACTIVE") {
          setCustomerProfile(profile);
          setBusinessPlate(profile.vehicles[0]?.plate ?? "");
        }
      }).catch(() => undefined);
  }, []);

  useEffect(() => {
    setSelectedTime("");
    setSlots([]);
    setSlotsError("");
    if (!date || !serviceId) {
      setLoadingSlots(false);
      return;
    }

    const controller = new AbortController();
    setLoadingSlots(true);
    const params = new URLSearchParams({ date, serviceId });
    void fetch(`${apiUrl}/api/bookings/availability?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await getError(response));
        return response.json() as Promise<{ slots: string[] }>;
      })
      .then((result) => setSlots(result.slots))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setSlotsError(cause instanceof Error ? cause.message : "Não foi possível consultar os horários.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSlots(false);
      });

    return () => controller.abort();
  }, [date, serviceId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...(customerProfile ? { name: customerProfile.name, phone: customerProfile.phone, ...(businessPlate ? { plate: businessPlate } : {}) } : {}), serviceId }),
      });
      if (!response.ok) throw new Error(await getError(response));
      setBooking(await response.json() as Booking);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A ligação falhou. Verifique a internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function findBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setLookupError("");
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams({ code: String(formData.get("code") ?? "").trim().toUpperCase(), phone: String(formData.get("lookupPhone") ?? "").trim() });
    try {
      const response = await fetch(`${apiUrl}/api/bookings/mine?${params}`);
      if (!response.ok) throw new Error(await getError(response));
      setBooking(await response.json() as Booking);
    } catch (cause) {
      setLookupError(cause instanceof Error ? cause.message : "A ligação falhou. Verifique a internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (booking) return (
    <section className="booking-confirmation" role="status">
      <span className="result-icon">✓</span>
      <p className="eyebrow">Pedido registado</p>
      <h2>Obrigado, {booking.customerName.split(" ")[0]}.</h2>
      <p className="booking-status">{statusLabels[booking.status]}</p>
      <dl className="booking-receipt">
        <div><dt>Código para acompanhar</dt><dd className="booking-code">{booking.code}</dd></div>
        <div><dt>Data e hora pretendidas</dt><dd>{formatDate(booking.startsAt)}</dd></div>
        <div><dt>Serviço</dt><dd>{booking.service} · {booking.durationMinutes} min</dd></div>
        <div><dt>Viatura</dt><dd>{booking.plate}</dd></div>
        <div><dt>Preço indicativo</dt><dd>{booking.priceMzn.toLocaleString("pt-MZ")} MT</dd></div>
      </dl>
      <p className="demo-notice">O seu pedido foi guardado pela equipa. Guarde o código e consulte o acompanhamento para ver quando a marcação for confirmada.</p>
      <div className="editor-actions"><Link className="primary-link" href={{ pathname: "/fila", query: { code: booking.code } }}>Acompanhar pedido</Link><Link className="secondary-button" href={{ pathname: "/notificacoes", query: { code: booking.code } }}>Ver notificações</Link><Link className="secondary-button" href="/marcacoes/historico">Ver as minhas marcações</Link><button className="secondary-button" onClick={() => setBooking(null)}>Nova marcação</button></div>
    </section>
  );

  return <>
    <div className="booking-layout">
    <form className="demo-form" onSubmit={submit}>
      <div className="booking-step-heading"><span>1</span><div><h2>Escolha o serviço e o horário</h2><p>Veja primeiro as opções para a sua visita.</p></div></div>
      <label>Qual serviço pretende?
        <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} required>
          {services.map((service) => <option value={service.id} key={service.id}>{service.name} — {service.priceMzn.toLocaleString("pt-MZ")} MT{service.isDemo ? " (preço de exemplo)" : ""}</option>)}
        </select>
      </label>
      <label>Que dia prefere?<input name="date" type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} required /></label>
      <p className="field-hint">Horário de atendimento: das 08:00 às 18:00. Os horários mostrados já consideram a duração do serviço.</p>
      {date && <fieldset className="slot-picker" disabled={loadingSlots || !!slotsError || slots.length === 0}>
        <legend>Escolha um horário</legend>
        {loadingSlots ? <p className="slot-message" role="status">A verificar disponibilidade…</p> : slotsError ? <p className="slot-message slot-error" role="alert">{slotsError}</p> : slots.length === 0 ? <p className="slot-message">Não há horários disponíveis neste dia. Escolha outra data.</p> : (
          <div className="slot-grid">{slots.map((time) => <label className={`slot-option${selectedTime === time ? " selected" : ""}`} key={time}><input type="radio" name="timeChoice" value={time} checked={selectedTime === time} onChange={() => setSelectedTime(time)} required />{time}</label>)}</div>
        )}
      </fieldset>}
      <div className="booking-step-heading second-step"><span>2</span><div><h2>Deixe os seus dados</h2><p>Para a equipa identificar a viatura e responder ao pedido.</p></div></div>
      {customerProfile && <div className="fleet-booking-picker"><p>Conta empresarial: {customerProfile.name} · {customerProfile.phone}</p><label>Escolher viatura da frota<select value={useOtherPlate ? "OTHER" : businessPlate} onChange={(event) => { if (event.target.value === "OTHER") { setUseOtherPlate(true); setBusinessPlate(""); } else { setUseOtherPlate(false); setBusinessPlate(event.target.value); } }}><option value="">Introduzir matrícula manualmente</option>{customerProfile.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.plate}>{vehicle.plate}</option>)}<option value="OTHER">Outra viatura</option></select></label></div>}
      <label>Nome<input name="name" autoComplete="name" placeholder="Nome e apelido" minLength={2} maxLength={100} required /></label>
      <label>Contacto telefónico<input name="phone" type="tel" autoComplete="tel" placeholder="84 123 4567" pattern="(\+?258[\s-]?)?8[2-7]([\s-]?[0-9]){7}" title="Use um número moçambicano, por exemplo 84 123 4567." required /><small>Usaremos este número para localizar o seu pedido.</small></label>
      {customerProfile && !useOtherPlate && businessPlate ? <label>Viatura seleccionada<input name="plate" value={businessPlate} readOnly required /></label> : <label>Matrícula da viatura<input name="plate" placeholder="Ex.: ABC-123-MC" minLength={5} maxLength={12} required /></label>}
      <input type="hidden" name="time" value={selectedTime} />
      <div className="demo-notice"><strong>O que acontece a seguir?</strong><br />O pedido fica registado e a equipa confirma a disponibilidade. O atendimento só fica confirmado após a validação; preços assinalados como referência são indicativos.</div>
      {selected && <div className="booking-summary"><span>{selected.durationMinutes} min estimados</span><strong>{selected.priceMzn.toLocaleString("pt-MZ")} MT</strong></div>}
      {error && <p className="feedback error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={loading || !selectedTime}>{loading ? "A enviar pedido…" : "Enviar pedido à equipa"}</button>
      <p className="form-privacy-note">Ao continuar, os dados serão usados para gerir este pedido de pré-marcação.</p>
    </form>

      <aside className="booking-sidecard">
        <p className="eyebrow">Resumo da visita</p>
        <h2>{selected?.name ?? "Escolha um serviço"}</h2>
        {selected && <><div className="booking-summary"><span>Duração estimada</span><strong>{selected.durationMinutes} min</strong></div><div className="booking-summary"><span>{selected.isDemo ? "Preço de exemplo" : "Preço"}</span><strong>{selected.priceMzn.toLocaleString("pt-MZ")} MT</strong></div><p className="field-hint">{selected.isDemo ? "Este valor é apenas ilustrativo; não será cobrado online." : "A equipa confirmará o valor ao validar o pedido."}</p></>}
        {date && <div className="booking-summary"><span>Dia escolhido</span><strong>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeZone: "Africa/Maputo" }).format(new Date(`${date}T12:00:00+02:00`))}</strong></div>}
        {selectedTime && <div className="booking-summary"><span>Hora escolhida</span><strong>{selectedTime}</strong></div>}
        <div className="sidecard-note"><span className="open-dot" /> Lava Já · Matola<br /><small>Atendimento das 08:00 às 18:00</small></div>
      </aside>
    </div>
    <details className="booking-lookup">
      <summary>Já tem um pedido? Consulte o estado</summary>
      <p>Use o código recebido e o mesmo contacto telefónico indicado no pedido.</p>
      <form className="lookup-form" onSubmit={findBooking}>
        <label>Código do pedido<input name="code" placeholder="Ex.: A1B2C3D4" minLength={8} maxLength={8} required /></label>
        <label>Contacto telefónico<input name="lookupPhone" type="tel" placeholder="84 123 4567" pattern="(\+?258[\s-]?)?8[2-7]([\s-]?[0-9]){7}" title="Use um número moçambicano válido." required /></label>
        <button className="secondary-button" type="submit" disabled={loading}>{loading ? "A consultar…" : "Consultar pedido"}</button>
      </form>
      {lookupError && <p className="feedback error" role="alert">{lookupError}</p>}
      <p className="lookup-security">Só apresentamos o pedido quando o código e o contacto coincidem.</p>
    </details>
  </>;
}
