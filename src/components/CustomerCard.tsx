"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

const api = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;

export default function CustomerCard() {
  const [card, setCard] = useState<{ name: string; identifier: string; status: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    const token = window.sessionStorage.getItem("lavaja-customer-token");
    if (!token) return;
    setHasToken(true); setBusy(true);
    fetch(`${api}/customer-auth/card`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("A sessão expirou. Entre novamente."); setCard(await response.json()); })
      .catch((cause) => { setError(cause instanceof Error ? cause.message : "Não foi possível carregar o cartão."); setHasToken(false); })
      .finally(() => setBusy(false));
  }, []);
  async function identify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = new FormData(event.currentTarget);
    const query = new URLSearchParams({ code: String(values.get("code")).trim().toUpperCase(), phone: String(values.get("phone")).trim() });
    try {
      const response = await fetch(`${api}/bookings/card?${query}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Não foi possível validar os dados.");
      setCard(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); }
    finally { setBusy(false); }
  }
  return <main className="shell content-page"><header className="page-heading"><p className="eyebrow">Identificação digital</p><h1>Cartão Lava Já</h1><p>Apresente o QR à equipa para identificar o seu perfil. O código não autoriza pagamentos ou débitos.</p></header>
    {!card ? <>{!hasToken && <p className="account-entry"><Link href="/perfil">Entre na sua conta</Link> para abrir o cartão directamente.</p>}<form className="demo-form card-lookup" onSubmit={identify}><h2>Validar o seu perfil</h2><p>Use o código e o telefone de uma marcação existente.</p><label>Código da marcação<input name="code" required minLength={8} maxLength={8} pattern="[A-Za-z0-9]{8}" /></label><label>Telefone<input name="phone" required autoComplete="tel" /></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? "A validar…" : "Mostrar cartão"}</button></form></> : <section className="customer-card"><div><p className="eyebrow">LAVA JÁ · CLIENTE</p><h2>{card.name}</h2><p>Identificador do cliente</p><strong className="card-identifier">{card.identifier}</strong><span className="demo-badge">Cartão activo</span></div><div className="card-qr"><QRCodeSVG value={card.identifier} size={190} level="Q" includeMargin aria-label={`QR de identificação ${card.identifier}`} /><small>QR apenas para identificação</small></div><button className="secondary-button" onClick={() => setCard(null)}>Fechar cartão</button></section>}
  </main>;
}
