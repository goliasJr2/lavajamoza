"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: "BOOKING" | "REMINDER" | "PROMOTION" | "MARKETPLACE";
  title: string;
  message: string;
  actionUrl: string | null;
  availableAt: string;
  readAt: string | null;
  createdAt: string;
  booking: { publicCode: string } | null;
};
type Identity = { code: string; phone: string; account?: boolean };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function readError(response: Response) {
  try { const body = await response.json() as { message?: string }; if (body.message) return body.message; } catch { /* resposta sem JSON */ }
  return "Não foi possível consultar as notificações.";
}

export default function NotificationCenter({ initialCode = "" }: { initialCode?: string }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async (currentIdentity: Identity, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const token = currentIdentity.account ? window.sessionStorage.getItem("lavaja-customer-token") : null;
      const query = new URLSearchParams({ code: currentIdentity.code, phone: currentIdentity.phone });
      const response = await fetch(currentIdentity.account ? `${apiUrl}/api/customer-auth/notifications` : `${apiUrl}/api/notifications?${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
      if (!response.ok) throw new Error(await readError(response));
      const data = await response.json() as { notifications: Notification[]; unreadCount: number };
      setItems(data.notifications); setUnreadCount(data.unreadCount); setSyncError("");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Falha de ligação à API.";
      if (quiet) setSyncError(message); else setError(message);
    } finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    const token = window.sessionStorage.getItem("lavaja-customer-token");
    if (token) { const identity = { code: "Conta", phone: "", account: true }; setIdentity(identity); void refresh(identity); }
  }, [refresh]);

  useEffect(() => {
    if (!identity) return;
    const timer = window.setInterval(() => void refresh(identity, true), 30_000);
    return () => window.clearInterval(timer);
  }, [identity, refresh]);

  async function identify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setSyncError("");
    const next = { code: code.trim().toUpperCase(), phone: phone.trim() };
    try {
      const query = new URLSearchParams(next);
      const response = await fetch(`${apiUrl}/api/notifications?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await readError(response));
      const data = await response.json() as { notifications: Notification[]; unreadCount: number };
      setItems(data.notifications); setUnreadCount(data.unreadCount); setIdentity(next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); }
    finally { setLoading(false); }
  }

  async function markRead() {
    if (!identity) return;
    setLoading(true); setError(""); setNotice("");
    try {
      const token = identity.account ? window.sessionStorage.getItem("lavaja-customer-token") : null;
      const response = await fetch(identity.account ? `${apiUrl}/api/customer-auth/notifications/read-all` : `${apiUrl}/api/notifications/read-all`, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(identity.account ? {} : { body: JSON.stringify(identity) }),
      });
      if (!response.ok) throw new Error(await readError(response));
      await refresh(identity, true); setNotice("Notificações marcadas como lidas.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível actualizar as notificações."); }
    finally { setLoading(false); }
  }

  return <>
    <div className="demo-notice prominent-notice"><strong>Notificações na aplicação.</strong> As actualizações são guardadas e sincronizadas enquanto esta página está aberta. Não enviamos SMS, email ou notificações de sistema.</div>
    {!identity ? <form className="demo-form notification-lookup" onSubmit={identify}>
      <div className="booking-step-heading"><span>1</span><div><h2>Consultar as suas notificações</h2><p>Confirme uma marcação com o respectivo código e telefone.</p></div></div>
      <label>Código do pedido<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ex.: LAVA1002" minLength={8} maxLength={8} required /></label>
      <label>Contacto telefónico<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" placeholder="84 123 4567" pattern="(\+?258[\s-]?)?8[2-7]([\s-]?[0-9]){7}" required /></label>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <button className="primary-button" disabled={loading}>{loading ? "A verificar…" : "Abrir notificações"}</button>
      <p className="lookup-security">Só mostramos notificações depois de confirmar código e contacto.</p>
    </form> : <section className="notification-inbox" aria-live="polite">
      <div className="notification-inbox-heading"><div><p className="eyebrow">Pedido {identity.code}</p><h2>As suas notificações {unreadCount > 0 && <span className="notification-count">{unreadCount} por ler</span>}</h2></div><div className="editor-actions"><button type="button" className="secondary-button" disabled={loading} onClick={() => void refresh(identity)}>Actualizar</button>{unreadCount > 0 && <button type="button" className="secondary-button" disabled={loading} onClick={() => void markRead()}>Marcar como lidas</button>}</div></div>
      {syncError && <p className="feedback error" role="status">Não foi possível sincronizar. A lista apresentada pode estar desactualizada.</p>}
      {error && <p className="feedback error" role="alert">{error}</p>}
      {notice && <p className="feedback success" role="status">{notice}</p>}
      {items.length ? <div className="notification-list">{items.map((item) => <article className={`notification-card${item.readAt ? " is-read" : " is-unread"}`} key={item.id}>
        <span className="notification-dot" aria-hidden="true" />
        <div className="notification-copy"><div className="notification-card-heading"><h3>{item.title}</h3><time dateTime={item.availableAt}>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(item.availableAt))}</time></div><p>{item.message}</p>{item.actionUrl ? <Link href={item.actionUrl}>{item.type === "PROMOTION" ? "Ver promoção →" : item.type === "MARKETPLACE" ? "Ver oferta →" : item.type === "REMINDER" || item.title.toLowerCase().includes("conclu") ? "Agendar próxima lavagem →" : "Abrir →"}</Link> : item.booking && <Link href={{ pathname: "/fila", query: { code: item.booking.publicCode } }}>Acompanhar marcação →</Link>}</div>
      </article>)}</div> : <p className="catalog-state">Ainda não há notificações para esta marcação.</p>}
      <button className="secondary-button" type="button" onClick={() => { setIdentity(null); setItems([]); setError(""); setNotice(""); }}>Consultar outra marcação</button>
    </section>}
  </>;
}
