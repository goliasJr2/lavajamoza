"use client";

import { FormEvent, useRef, useState } from "react";

type WalletMode = "credit" | "loyalty";
type Movement = { id: string; type: "LOAD" | "PROMO_CREDIT" | "PAYMENT" | "POINTS_EARNED" | "POINTS_REDEEMED"; amount: number; loadedAmountMzn: number; promoAmountMzn: number; description: string; createdAt: string };
type Wallet = { demo: true; booking: { code: string; status: string; service: string; priceMzn: number }; balanceMzn: number; loadedBalanceMzn: number; promoBalanceMzn: number; pointsBalance: number; movements: Movement[] };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function errorMessage(response: Response) {
  try {
    const body = await response.json() as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (body.message) return body.message;
  } catch { /* resposta sem JSON */ }
  return "Não foi possível concluir a operação. Tente novamente.";
}

export default function DemoCreditPanel({ mode = "credit" }: { mode?: WalletMode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [identity, setIdentity] = useState<{ code: string; phone: string } | null>(null);
  const [method, setMethod] = useState("MOZA_DEMO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const retryKey = useRef<string | null>(null);

  async function identify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const nextIdentity = { code: String(form.get("code") ?? "").trim().toUpperCase(), phone: String(form.get("phone") ?? "").trim() };
    try {
      const query = new URLSearchParams(nextIdentity);
      const response = await fetch(`${apiUrl}/api/demo-wallet?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await errorMessage(response));
      setWallet(await response.json() as Wallet); setIdentity(nextIdentity);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); }
    finally { setLoading(false); }
  }

  async function operate(path: "loads" | "payments" | "rewards/redeem") {
    if (!identity) return;
    setLoading(true); setError(""); setNotice("");
    retryKey.current ??= crypto.randomUUID().replaceAll("-", "");
    try {
      const response = await fetch(`${apiUrl}/api/demo-wallet/${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identity, ...(path === "loads" ? { method } : {}), idempotencyKey: retryKey.current }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      setWallet(await response.json() as Wallet);
      retryKey.current = null;
      setNotice(path === "loads" ? "Carregamento demonstrativo registado na carteira." : path === "payments" ? "Pagamento demonstrativo registado e pontos actualizados." : "Recompensa demonstrativa resgatada; os pontos foram actualizados.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação. Pode tentar novamente."); }
    finally { setLoading(false); }
  }

  const points = mode === "loyalty";
  return <>
    <div className="demo-notice prominent-notice"><strong>Demonstração sem valor monetário.</strong> Use o código e telefone de uma marcação. Nenhum valor é movimentado em bancos, M-Pesa ou e-Mola.</div>
    {!identity ? <form className="demo-form wallet-identity-form" onSubmit={identify}>
      <div className="booking-step-heading"><span>1</span><div><h2>Identifique a sua carteira demonstrativa</h2><p>Confirme um pedido seu com o código e o contacto associado.</p></div></div>
      <label>Código do pedido<input name="code" placeholder="Ex.: A1B2C3D4" minLength={8} maxLength={8} required /></label>
      <label>Contacto telefónico<input name="phone" type="tel" placeholder="84 123 4567" pattern="(\+?258[\s-]?)?8[2-7]([\s-]?[0-9]){7}" required /></label>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <button className="primary-button" disabled={loading}>{loading ? "A verificar…" : "Abrir carteira de demonstração"}</button>
    </form> : <>
      {!points && <section className="wallet-card">
        <div className="wallet-topline"><span>CRÉDITO LAVA JÁ · DEMONSTRAÇÃO</span><span className="demo-badge">Sem valor monetário</span></div>
        <p>Saldo demonstrativo disponível</p><strong className="wallet-amount">{(wallet?.balanceMzn ?? 0).toLocaleString("pt-MZ")} <small>MT</small></strong>
        <div className="wallet-balance-breakdown"><span>Carregado <strong>{(wallet?.loadedBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong></span><span>Promocional <strong>{(wallet?.promoBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong></span></div>
        <span className="wallet-footnote">Não pode ser transferido, levantado ou usado fora desta demonstração.</span>
      </section>}
      {!points && <p className="field-hint">Saldo de fidelização demonstrativo: <strong>{(wallet?.pointsBalance ?? 0).toLocaleString("pt-MZ")} pontos</strong>. Pode consultar ou resgatar na área de Fidelização.</p>}
      {!points && <p className="field-hint">Os pagamentos simulados usam primeiro o saldo promocional e depois o saldo carregado.</p>}
      {points && <section className="points-card"><div><span className="wallet-topline">PONTOS DE DEMONSTRAÇÃO</span><h2>Benefícios associados às operações simuladas.</h2><p>Os pontos são ilustrativos e não têm valor de resgate nesta versão.</p></div><div className="points-total"><strong>{(wallet?.pointsBalance ?? 0).toLocaleString("pt-MZ")}</strong><span>pontos</span></div></section>}
      {points && <section className="credit-panel"><span className="feature-icon">✦</span><h2>Recompensa demonstrativa</h2><p>Resgate 500 pontos para registar um benefício ilustrativo. Não dá direito a desconto real.</p><button className="primary-button" disabled={loading || (wallet?.pointsBalance ?? 0) < 500} onClick={() => void operate("rewards/redeem")}>Resgatar 500 pontos</button></section>}
      {!points && <div className="credit-actions">
        <section className="credit-panel"><span className="feature-icon">＋</span><h2>Adicionar crédito</h2><p>O método serve apenas para ilustrar o fluxo.</p><label>Meio simulado<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="MOZA_DEMO">Moza Banco · demonstração</option><option value="MPESA_DEMO">M-Pesa · demonstração</option><option value="EMOLA_DEMO">e-Mola · demonstração</option><option value="PROMO_DEMO">Crédito promocional · demonstração</option></select></label><button className="primary-button" disabled={loading} onClick={() => void operate("loads")}>Simular carregamento de 500 MT</button></section>
        <section className="credit-panel"><span className="feature-icon">↗</span><h2>Pagar uma marcação</h2><p>{wallet?.booking.service} · pedido {wallet?.booking.code}</p><div className="booking-summary"><span>Preço guardado</span><strong>{wallet?.booking.priceMzn.toLocaleString("pt-MZ")} MT demo</strong></div><button className="secondary-button" disabled={loading} onClick={() => void operate("payments")}>Simular pagamento</button><small>Estado: {wallet?.booking.status}. Apenas pedidos aceites ou concluídos podem ser pagos uma vez.</small></section>
      </div>}
      {error && <p className="feedback error" role="alert">{error}</p>}
      {notice && <p className="feedback success" role="status">{notice}</p>}
      <section className="transaction-list"><div className="section-heading section-heading-left"><p className="eyebrow">Actividade persistida</p><h2>{points ? "Pontos e movimentos" : "Movimentos da carteira"}</h2></div>
        {!points && <p className="field-hint">Cada pagamento regista quanto foi descontado de cada saldo, incluindo nos detalhes devolvidos pela carteira.</p>}
        {wallet?.movements.length ? wallet.movements.map((movement) => <div className="loyalty-row" key={movement.id}><span className="loyalty-row-icon">{movement.type === "LOAD" || movement.type === "PROMO_CREDIT" || movement.type === "POINTS_EARNED" ? "+" : "−"}</span><div><strong>{movement.description}</strong><small>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(movement.createdAt))}</small>{movement.type === "PAYMENT" && movement.loadedAmountMzn + movement.promoAmountMzn > 0 && <small>Promocional: {movement.promoAmountMzn.toLocaleString("pt-MZ")} MT · carregado: {movement.loadedAmountMzn.toLocaleString("pt-MZ")} MT</small>}</div><b>{movement.type === "PAYMENT" || movement.type === "POINTS_REDEEMED" ? "−" : "+"}{movement.amount.toLocaleString("pt-MZ")} {movement.type === "POINTS_EARNED" || movement.type === "POINTS_REDEEMED" ? "pts" : "MT demo"}</b></div>) : <p>Ainda não existem movimentos demonstrativos.</p>}
      </section>
      <button className="secondary-button" type="button" onClick={() => { setIdentity(null); setWallet(null); setNotice(""); setError(""); }}>Consultar outra marcação</button>
    </>}
  </>;
}
