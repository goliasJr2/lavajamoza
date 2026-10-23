"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Campaign = {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  sentAt: string | null;
  status: "SCHEDULED" | "SENT" | "CANCELLED";
  actionUrl: string | null;
  recipientCount: number;
};

const apiBase = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;
const campaignStatus: Record<Campaign["status"], string> = { SCHEDULED: "Programada", SENT: "Enviada", CANCELLED: "Cancelada" };

async function errorMessage(response: Response) {
  const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
  return Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Ocorreu um erro. Tente novamente.";
}

function maputoInput(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function maputoIso(value: string) {
  return new Date(`${value}:00+02:00`).toISOString();
}

export default function AdminPromotionCampaigns({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [minimumTime, setMinimumTime] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${apiBase}/notifications/campaigns/manage`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) onUnauthorized();
        throw new Error(await errorMessage(response));
      }
      setCampaigns(await response.json() as Campaign[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as campanhas.");
    }
  }, [onUnauthorized, token]);

  useEffect(() => {
    setMinimumTime(maputoInput(new Date(Date.now() + 60_000)));
    void load();
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const scheduledAt = String(values.get("scheduledAt") ?? "");
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${apiBase}/notifications/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: String(values.get("title") ?? "").trim(),
          message: String(values.get("message") ?? "").trim(),
          scheduledAt: maputoIso(scheduledAt),
          actionUrl: String(values.get("actionUrl") ?? "").trim() || null,
        }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      form.reset();
      setNotice("Campanha agendada. Os clientes vão encontrá-la nas notificações da aplicação.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível agendar a campanha.");
    } finally { setBusy(false); }
  }

  async function cancel(campaign: Campaign) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${apiBase}/notifications/campaigns/${campaign.id}/cancel`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      setNotice("Campanha cancelada.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível cancelar a campanha.");
    } finally { setBusy(false); }
  }

  return <section className="admin-promotion-campaigns" id="promotion-campaigns">
    <div className="admin-local-places-heading"><div><p className="eyebrow">Comunicação com clientes</p><h2>Campanhas e notificações</h2><p>Agende promoções para aparecerem na caixa de notificações dos clientes.</p></div><button className="secondary-button" type="button" onClick={() => void load()}>Actualizar</button></div>
    <p className="demo-notice">As campanhas são enviadas dentro da aplicação a todos os clientes registados. Não enviam SMS, email ou notificações push.</p>
    {notice && <p className="feedback success" role="status">{notice}</p>}
    {error && <p className="feedback error" role="alert">{error}</p>}
    <form className="admin-form promotion-campaign-form" onSubmit={create}>
      <h3>Agendar promoção</h3>
      <div className="form-grid">
        <label>Título<input name="title" minLength={3} maxLength={100} required /></label>
        <label>Data e hora de envio (Maputo)<input name="scheduledAt" type="datetime-local" min={minimumTime} required /></label>
        <label className="wide-field">Mensagem<textarea name="message" minLength={5} maxLength={500} rows={2} required /></label>
        <label className="wide-field">Ligação interna opcional<input name="actionUrl" maxLength={300} pattern="/(?!/)[A-Za-z0-9/_?&=%#.-]*" placeholder="/marcacoes ou /marketplace/oferta" /></label>
      </div>
      <button className="primary-button" type="submit" disabled={busy || !minimumTime}>Agendar campanha</button>
    </form>
    <div className="promotion-campaign-list">
      {campaigns.map((campaign) => <article className="promotion-campaign-card" key={campaign.id}>
        <div className="service-card-top"><strong>{campaign.title}</strong><span className={`demo-badge campaign-${campaign.status.toLowerCase()}`}>{campaignStatus[campaign.status]}</span></div>
        <p>{campaign.message}</p>
        <small>{campaign.status === "SENT" ? `Enviada para ${campaign.recipientCount} clientes · ${new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(campaign.sentAt ?? campaign.scheduledAt))}` : `Agendada para ${new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(campaign.scheduledAt))}`}</small>
        {campaign.actionUrl && <code>{campaign.actionUrl}</code>}
        {campaign.status === "SCHEDULED" && <button className="secondary-button" type="button" disabled={busy} onClick={() => void cancel(campaign)}>Cancelar campanha</button>}
      </article>)}
      {campaigns.length === 0 && !error && <p className="catalog-state">Ainda não há campanhas. As que agendar aparecerão aqui.</p>}
    </div>
  </section>;
}
