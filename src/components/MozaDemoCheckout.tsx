"use client";

import { useState, type FormEvent } from "react";

const api = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;
type Result = { status: "PENDING" | "CONFIRMED" | "NOT_REQUESTED"; amountMzn: number | null; demo: true };

export default function MozaDemoCheckout() {
  const [identity, setIdentity] = useState<{ code: string; phone: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget); const id = { code: String(data.get("code")).trim().toUpperCase(), phone: String(data.get("phone")).trim() };
    try {
      const response = await fetch(`${api}/payments/demo/moza`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id) });
      const body = await response.json(); if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Não foi possível criar o pedido.");
      setIdentity(id); setResult(body);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); }
    finally { setBusy(false); }
  }
  async function refresh() {
    if (!identity) return; setBusy(true); setError("");
    try { const q = new URLSearchParams(identity); const response = await fetch(`${api}/payments/demo/moza?${q}`, { cache: "no-store" }); const body = await response.json(); if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Não foi possível consultar o pedido."); setResult(body); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); } finally { setBusy(false); }
  }
  return <main className="shell content-page"><header className="page-heading"><p className="eyebrow">Lava Já Smart · Pagamentos</p><h1>Pagar com Moza</h1><p>Acompanhe o pagamento da sua marcação e o respectivo estado.</p></header>
    <div className="moza-demo-banner"><span className="demo-badge">Ambiente de apresentação</span><span>Fluxo Moza demonstrativo · sem movimentação financeira.</span></div>
    {!result ? <form className="demo-form card-lookup" onSubmit={request}><h2>Identifique a marcação</h2><p>Introduza o código e telefone associados ao pedido.</p><label>Código da marcação<input name="code" required minLength={8} maxLength={8} pattern="[A-Za-z0-9]{8}" /></label><label>Telefone<input name="phone" required autoComplete="tel" /></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? "A validar…" : "Continuar para pagamento"}</button></form> : <section className="credit-panel moza-payment-card"><span className="demo-badge">{result.status === "CONFIRMED" ? "Validado pela equipa" : result.status === "PENDING" ? "A aguardar validação" : "Sem pedido"}</span><h2>{result.status === "CONFIRMED" ? "Pagamento registado" : result.status === "PENDING" ? "Pedido de pagamento criado" : "Ainda não existe pedido"}</h2><p>{result.status === "PENDING" ? "A equipa actualizará o estado após validar o recebimento." : result.status === "CONFIRMED" ? "O estado foi actualizado pela equipa no fluxo de apresentação." : "Crie um pedido para acompanhar o estado."}</p>{result.amountMzn !== null && <div className="booking-summary"><span>Total da marcação</span><strong>{result.amountMzn.toLocaleString("pt-MZ")} MT</strong></div>}{error && <p role="alert" className="form-error">{error}</p>}<div className="hero-actions"><button className="primary-button" type="button" onClick={() => void refresh()} disabled={busy}>{busy ? "A consultar…" : "Actualizar estado"}</button><button className="secondary-button" type="button" onClick={() => { setResult(null); setIdentity(null); }}>Nova consulta</button></div></section>}
  </main>;
}
