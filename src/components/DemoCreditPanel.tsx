"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

type WalletMode = "credit" | "loyalty";
type Movement = { id: string; type: "LOAD" | "PROMO_CREDIT" | "PAYMENT" | "POINTS_EARNED" | "POINTS_REDEEMED" | "MOZA_BONUS_CREDIT"; amount: number; loadedAmountMzn: number; promoAmountMzn: number; mozaCreditAmountMzn: number; description: string; createdAt: string };
type RewardType = "WASH_DISCOUNT";
type Reward = { id: string; rewardType: RewardType; pointsSpent: number; promoCreditGrantedMzn: number; code: string; createdAt: string };
type Wallet = { demo: true; booking: { code: string; status: string; service: string; priceMzn: number }; balanceMzn: number; loadedBalanceMzn: number; promoBalanceMzn: number; mozaCreditBalanceMzn: number; pointsBalance: number; movements: Movement[]; rewards: Reward[] };
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
  const [accountToken, setAccountToken] = useState("");
  const [accountBookings, setAccountBookings] = useState<Array<{ publicCode: string; status: string; service: { name: string }; vehicle: { plate: string } }>>([]);
  const retryKey = useRef<string | null>(null);

  useEffect(() => {
    const token = window.sessionStorage.getItem("lavaja-customer-token");
    if (!token) return;
    setAccountToken(token); setLoading(true);
    fetch(`${apiUrl}/api/customer-auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("A sessão expirou. Entre novamente."); return response.json(); })
      .then(async (profile) => {
        const bookings = profile.bookings as typeof accountBookings; setAccountBookings(bookings);
        const preferred = bookings.find((b) => ["ACCEPTED", "COMPLETED"].includes(b.status)) ?? bookings[0];
        if (!preferred) return;
        setIdentity({ code: preferred.publicCode, phone: "" });
        const response = await fetch(`${apiUrl}/api/customer-auth/wallet?code=${preferred.publicCode}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (!response.ok) throw new Error(await errorMessage(response));
        setWallet(await response.json() as Wallet);
      })
      .catch((cause) => { setError(cause instanceof Error ? cause.message : "Não foi possível abrir a carteira."); setAccountToken(""); })
      .finally(() => setLoading(false));
  }, []);

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

  async function operate(path: "loads" | "payments" | "rewards/redeem", reward?: RewardType) {
    if (!identity) return;
    setLoading(true); setError(""); setNotice("");
    retryKey.current ??= crypto.randomUUID().replaceAll("-", "");
    try {
      const accountPath = path === "rewards/redeem" ? "wallet/rewards/redeem" : `wallet/${path}`;
      const response = await fetch(accountToken ? `${apiUrl}/api/customer-auth/${accountPath}` : `${apiUrl}/api/demo-wallet/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accountToken ? { Authorization: `Bearer ${accountToken}` } : {}) },
        body: JSON.stringify(accountToken ? { code: identity.code, ...(path === "loads" ? { method } : {}), ...(reward ? { reward } : {}), idempotencyKey: retryKey.current } : { ...identity, ...(path === "loads" ? { method } : {}), ...(reward ? { reward } : {}), idempotencyKey: retryKey.current }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      setWallet(await response.json() as Wallet);
      retryKey.current = null;
      setNotice(path === "loads" ? "Carregamento demonstrativo registado na carteira." : path === "payments" ? "Pagamento registado. Os pontos são atribuídos após a conclusão da lavagem." : "Crédito promocional resgatado e registado na carteira.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação. Pode tentar novamente."); }
    finally { setLoading(false); }
  }

  const points = mode === "loyalty";
  const rewardOptions: Array<{ type: RewardType; points: number; title: string; description: string }> = [
    { type: "WASH_DISCOUNT", points: 250, title: "Desconto parcial numa lavagem", description: "Receba 100 MT de credito promocional" },
  ];
  return <>
    <div className="demo-notice prominent-notice"><strong>Demonstração sem valor monetário.</strong> Use o código e telefone de uma marcação. Nenhum valor é movimentado em bancos, M-Pesa ou e-Mola.</div>
    {!identity ? <><p className="account-entry"><Link href="/perfil">Entre na sua conta</Link> para abrir a carteira associada ao seu perfil.</p><form className="demo-form wallet-identity-form" onSubmit={identify}>
      <div className="booking-step-heading"><span>1</span><div><h2>Identifique a sua carteira demonstrativa</h2><p>Confirme um pedido seu com o código e o contacto associado.</p></div></div>
      <label>Código do pedido<input name="code" placeholder="Ex.: A1B2C3D4" minLength={8} maxLength={8} required /></label>
      <label>Contacto telefónico<input name="phone" type="tel" placeholder="84 123 4567" pattern="(\+?258[\s-]?)?8[2-7]([\s-]?[0-9]){7}" required /></label>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <button className="primary-button" disabled={loading}>{loading ? "A verificar…" : "Abrir carteira de demonstração"}</button>
    </form></> : <>
      {accountToken && <label className="wallet-booking-select">Marcação<select value={identity.code} onChange={async (event) => { const code = event.target.value; setIdentity({ code, phone: "" }); setLoading(true); try { const response = await fetch(`${apiUrl}/api/customer-auth/wallet?code=${code}`, { headers: { Authorization: `Bearer ${accountToken}` }, cache: "no-store" }); if (!response.ok) throw new Error(await errorMessage(response)); setWallet(await response.json() as Wallet); } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao consultar a carteira."); } finally { setLoading(false); } }}>{accountBookings.map((booking) => <option key={booking.publicCode} value={booking.publicCode}>{booking.publicCode} · {booking.service.name} · {booking.vehicle.plate}</option>)}</select></label>}
      {!points && <section className="wallet-card">
        <div className="wallet-topline"><span>CRÉDITO LAVA JÁ · DEMONSTRAÇÃO</span><span className="demo-badge">Sem valor monetário</span></div>
        <p>Saldo demonstrativo disponível</p><strong className="wallet-amount">{(wallet?.balanceMzn ?? 0).toLocaleString("pt-MZ")} <small>MT</small></strong>
        <div className="wallet-balance-breakdown"><span>Carregado <strong>{(wallet?.loadedBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong></span><span>Promocional <strong>{(wallet?.promoBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong></span><span>Bonus Moza <strong>{(wallet?.mozaCreditBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong></span></div>
        <span className="wallet-footnote">Não pode ser transferido, levantado ou usado fora desta demonstração.</span>
      </section>}
      {!points && <p className="field-hint">Saldo de fidelização demonstrativo: <strong>{(wallet?.pointsBalance ?? 0).toLocaleString("pt-MZ")} pontos</strong>. Pode consultar ou resgatar na área de Fidelização.</p>}
      {!points && <p className="field-hint">Ao pagar, sao usados primeiro creditos promocionais, depois bonus Moza e por fim o saldo carregado. Pontos nao sao dinheiro nem credito recarregado.</p>}
      {points && <section className="points-card"><div><span className="wallet-topline">PONTOS LAVA JA · DEMONSTRACAO</span><h2>Ganhe pontos por cada servico pago e concluido.</h2><p>+50 pontos por servico. O pagamento Moza por cartao tambem gera 5% em credito especial Moza, separado dos pontos e do saldo carregado.</p></div><div className="points-total"><strong>{(wallet?.pointsBalance ?? 0).toLocaleString("pt-MZ")}</strong><span>pontos</span></div></section>}
      {points && <section className="credit-panel"><span className="feature-icon">✦</span><h2>Troque pontos por beneficios</h2><div className="reward-options">{rewardOptions.map((reward) => <article className="reward-option" key={reward.type}><div><strong>{reward.points} pontos · {reward.title}</strong><p>{reward.description}</p></div><button className="secondary-button" disabled={loading || (wallet?.pointsBalance ?? 0) < reward.points} onClick={() => void operate("rewards/redeem", reward.type)}>Resgatar</button></article>)}</div><small>Vouchers de parceiros sao demonstrativos ate existirem parceiros integrados. O credito da lavagem fica no saldo promocional, separado do carregado.</small></section>}
      {points && !!wallet?.rewards.length && <div className="reward-redemptions"><h3>Vouchers e recompensas resgatados</h3>{wallet.rewards.map((reward) => <article key={reward.id}><strong>{reward.rewardType.replaceAll("_", " ")}</strong><span>Codigo: {reward.code}</span><small>{reward.pointsSpent} pontos{reward.promoCreditGrantedMzn ? ` · ${reward.promoCreditGrantedMzn} MT em credito promocional` : " · voucher demonstrativo"}</small></article>)}</div>}
      {!points && <div className="credit-actions">
        <section className="credit-panel"><span className="feature-icon">＋</span><h2>Adicionar crédito</h2><p>O método serve apenas para ilustrar o fluxo.</p><label>Meio simulado<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="MOZA_DEMO">Moza Banco · demonstração</option><option value="MPESA_DEMO">M-Pesa · demonstração</option><option value="EMOLA_DEMO">e-Mola · demonstração</option><option value="PROMO_DEMO">Crédito promocional · demonstração</option></select></label><button className="primary-button" disabled={loading} onClick={() => void operate("loads")}>Simular carregamento de 500 MT</button></section>
        <section className="credit-panel"><span className="feature-icon">↗</span><h2>Pagar uma marcação</h2><p>{wallet?.booking.service} · pedido {wallet?.booking.code}</p><div className="booking-summary"><span>Preço guardado</span><strong>{wallet?.booking.priceMzn.toLocaleString("pt-MZ")} MT demo</strong></div><button className="secondary-button" disabled={loading} onClick={() => void operate("payments")}>Simular pagamento</button><small>Estado: {wallet?.booking.status}. Apenas pedidos aceites ou concluídos podem ser pagos uma vez.</small></section>
      </div>}
      {error && <p className="feedback error" role="alert">{error}</p>}
      {notice && <p className="feedback success" role="status">{notice}</p>}
      <section className="transaction-list"><div className="section-heading section-heading-left"><p className="eyebrow">Actividade persistida</p><h2>{points ? "Pontos e movimentos" : "Movimentos da carteira"}</h2></div>
        {!points && <p className="field-hint">Cada pagamento regista quanto foi descontado de cada saldo, incluindo nos detalhes devolvidos pela carteira.</p>}
        {wallet?.movements.length ? wallet.movements.map((movement) => <div className="loyalty-row" key={movement.id}><span className="loyalty-row-icon">{movement.type === "LOAD" || movement.type === "PROMO_CREDIT" || movement.type === "POINTS_EARNED" || movement.type === "MOZA_BONUS_CREDIT" ? "+" : "−"}</span><div><strong>{movement.description}</strong><small>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(movement.createdAt))}</small>{movement.type === "PAYMENT" && movement.loadedAmountMzn + movement.promoAmountMzn + movement.mozaCreditAmountMzn > 0 && <small>Promocional: {movement.promoAmountMzn.toLocaleString("pt-MZ")} MT · carregado: {movement.loadedAmountMzn.toLocaleString("pt-MZ")} MT</small>}</div><b>{movement.type === "PAYMENT" || movement.type === "POINTS_REDEEMED" ? "−" : "+"}{movement.amount.toLocaleString("pt-MZ")} {movement.type === "POINTS_EARNED" || movement.type === "POINTS_REDEEMED" ? "pts" : "MT demo"}</b></div>) : <p>Ainda não existem movimentos demonstrativos.</p>}
      </section>
      {!accountToken && <button className="secondary-button" type="button" onClick={() => { setIdentity(null); setWallet(null); setNotice(""); setError(""); }}>Consultar outra marcação</button>}
    </>}
  </>;
}
