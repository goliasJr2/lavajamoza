"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const api = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;
const mozambicanPhonePattern = "(\\+?258[\\s-]?)?8[2-7]([\\s-]?[0-9]){7}";

function getApiError(message: unknown, fallback: string) {
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) {
    const details = message.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
    if (details.length) return details.join(" ");
  }
  return fallback;
}
type Vehicle = { id: string; plate: string };
type Booking = { publicCode: string; status: string; startsAt: string; priceMznAtBooking: number; durationAtBooking: number; rating: { score: number; comment: string | null } | null; service: { name: string }; vehicle: { plate: string } };
type Profile = { id: string; name: string; phone: string; cardCode: string; accountType: "INDIVIDUAL" | "BUSINESS"; accountStatus: string; businessName: string | null; nuit: string | null; createdAt: string; vehicles: Vehicle[]; bookings: Booking[]; demoWallet: { loadedBalanceMzn: number; promoBalanceMzn: number; mozaCreditBalanceMzn: number; pointsBalance: number } | null };
const statusLabels: Record<string, string> = { REQUESTED: "Pendente", ACCEPTED: "Aceite", IN_PROGRESS: "Em atendimento", COMPLETED: "Concluída", REJECTED: "Não aceite", CANCELLED: "Cancelada" };

export default function CustomerAccount() {
  const [token, setToken] = useState(""); const [profile, setProfile] = useState<Profile | null>(null);
  const [screen, setScreen] = useState<"login" | "choose-account" | "customer-register" | "business-register">("login"); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const loadProfile = useCallback(async (accessToken: string) => {
    const response = await fetch(`${api}/customer-auth/me`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) throw new Error("A sessão expirou. Entre novamente.");
    setProfile(await response.json() as Profile);
  }, []);
  useEffect(() => { const saved = window.sessionStorage.getItem("lavaja-customer-token"); if (!saved) return; setToken(saved); void loadProfile(saved).catch(() => { window.sessionStorage.removeItem("lavaja-customer-token"); setToken(""); }); }, [loadProfile]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice(""); const data = new FormData(event.currentTarget);
    const business = screen === "business-register";
    const registering = screen === "customer-register" || business;
    const payload = business ? { businessName: String(data.get("businessName")).trim(), nuit: String(data.get("nuit")).trim(), contactName: String(data.get("contactName")).trim(), phone: String(data.get("phone")).trim(), password: String(data.get("password")) } : screen === "customer-register" ? { code: String(data.get("code")).trim().toUpperCase(), phone: String(data.get("phone")).trim(), password: String(data.get("password")) } : { phone: String(data.get("phone")).trim(), password: String(data.get("password")) };
    const endpoint = business ? "business/register" : registering ? "register" : "login";
    try {
      const response = await fetch(`${api}/customer-auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json();
      if (Array.isArray(body.message)) body.message = getApiError(body.message, "");
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Não foi possível concluir o pedido.");
      if (business) { setNotice(body.message ?? "Pedido empresarial enviado para aprovação."); setScreen("login"); return; }
      window.sessionStorage.setItem("lavaja-customer-token", body.accessToken); setToken(body.accessToken); await loadProfile(body.accessToken);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligação à API."); } finally { setBusy(false); }
  }
  function logout() { window.sessionStorage.removeItem("lavaja-customer-token"); setToken(""); setProfile(null); }
  return <main className="shell"><header className="page-heading"><p className="eyebrow">A sua conta Lava Já</p><h1>Perfil do cliente</h1><p>Consulte as suas marcações, cartão e saldo de fidelização no mesmo perfil.</p></header>
    {!token || !profile ? <section className="demo-form customer-account-form">
      {screen === "login" ? <>
        <div className="account-form-heading"><p className="eyebrow">Acesso à sua conta</p><h2>Entrar</h2><p>Introduza os dados associados ao seu perfil Lava Já.</p></div>
        <form onSubmit={submit}>
          <label>Telefone<input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="84 123 4567" pattern={mozambicanPhonePattern} title="Use um número moçambicano, por exemplo 84 123 4567." required /></label>
          <label>Palavra-passe<input name="password" type="password" minLength={12} maxLength={100} autoComplete="current-password" required /></label>
          {error && <p className="feedback error" role="alert">{error}</p>}{notice && <p className="feedback success" role="status">{notice}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "A entrar…" : "Entrar na conta"}</button>
        </form>
        <div className="account-create-cta"><span>Ainda não tem conta?</span><button className="secondary-button" type="button" onClick={() => { setScreen("choose-account"); setError(""); setNotice(""); }}>Criar conta</button></div>
        <p className="account-admin-link"><Link href="/admin">Acesso da equipa Lava Já</Link></p>
      </> : screen === "choose-account" ? <>
        <button className="account-back-link" type="button" onClick={() => setScreen("login")}>← Voltar ao acesso</button>
        <div className="account-form-heading"><p className="eyebrow">Criar perfil</p><h2>Que tipo de conta pretende?</h2><p>Escolha a conta que corresponde à forma como vai usar o Lava Já.</p></div>
        <div className="account-type-options">
          <button className="account-type-card" type="button" onClick={() => { setScreen("customer-register"); setError(""); }}><span className="account-type-icon" aria-hidden="true">01</span><strong>Conta cliente</strong><small>Para gerir as suas marcações e viaturas pessoais.</small><span className="account-type-action">Continuar →</span></button>
          <button className="account-type-card" type="button" onClick={() => { setScreen("business-register"); setError(""); }}><span className="account-type-icon" aria-hidden="true">02</span><strong>Conta empresarial</strong><small>Para pedir acesso de uma empresa e gerir a sua frota.</small><span className="account-type-action">Continuar →</span></button>
        </div>
      </> : <>
        <button className="account-back-link" type="button" onClick={() => { setScreen("choose-account"); setError(""); }}>← Escolher outro tipo de conta</button>
        <div className="account-form-heading"><p className="eyebrow">{screen === "business-register" ? "Registo empresarial" : "Registo de cliente"}</p><h2>{screen === "business-register" ? "Pedir conta empresarial" : "Criar conta cliente"}</h2><p>{screen === "business-register" ? "O acesso empresarial fica disponível depois da validação pelo administrador." : "Para associar a conta, use o código e telefone de uma marcação existente."}</p></div>
        <form onSubmit={submit}>
          {screen === "business-register" && <><label>Nome da empresa<input name="businessName" minLength={2} maxLength={120} required /></label><label>NUIT<input name="nuit" inputMode="numeric" pattern="[0-9]{9}" minLength={9} maxLength={9} required /></label><label>Nome do responsável<input name="contactName" autoComplete="name" minLength={2} maxLength={100} required /></label></>}
          {screen === "customer-register" && <label>Código da marcação<input name="code" required minLength={8} maxLength={8} pattern="[A-Za-z0-9]{8}" /></label>}
          <label>Telefone<input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="84 123 4567" pattern={mozambicanPhonePattern} title="Use um número moçambicano, por exemplo 84 123 4567." required /></label><label>Palavra-passe<input name="password" type="password" minLength={12} maxLength={100} autoComplete="new-password" required /></label>
          <small>Use pelo menos 12 caracteres. O registo não envia SMS nesta versão.</small>
          {error && <p className="feedback error" role="alert">{error}</p>}{notice && <p className="feedback success" role="status">{notice}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "A processar…" : screen === "business-register" ? "Enviar pedido empresarial" : "Criar conta"}</button>
        </form>
      </>}
    </section> : <section className="customer-profile"><div className="profile-heading"><div><p className="eyebrow">{profile.accountType === "BUSINESS" ? "Conta empresarial" : "Perfil activo"}</p><h2>{profile.accountType === "BUSINESS" ? profile.businessName : profile.name}</h2><p>{profile.name} · {profile.phone}{profile.accountType === "BUSINESS" ? ` · NUIT ${profile.nuit}` : ""}</p></div><button className="secondary-button" type="button" onClick={logout}>Terminar sessão</button></div>
      <div className="profile-quicklinks"><Link href="/cartao">Cartão virtual · {profile.cardCode}</Link><Link href="/marcacoes/historico">Ver histórico</Link><Link href="/credito">Crédito demonstrativo</Link></div>
      {profile.accountType === "BUSINESS" && <BusinessFleet token={token} vehicles={profile.vehicles} refresh={() => loadProfile(token)} />}
      <section className="overview-recent"><h3>Marcações recentes</h3>{profile.bookings.length ? <div className="overview-booking-list">{profile.bookings.map((booking) => <article className="overview-booking-row" key={booking.publicCode}><div><strong>{booking.service.name} · {booking.vehicle.plate}</strong><small>{booking.publicCode} · {new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(booking.startsAt))}</small></div><span className="booking-admin-status">{booking.rating ? `${booking.rating.score}/5` : statusLabels[booking.status] ?? booking.status}</span></article>)}</div> : <p className="catalog-state">Ainda não tem marcações associadas.</p>}</section>
      <section className="overview-grid profile-wallet"><article className="overview-card"><span>Crédito carregado · demo</span><strong>{(profile.demoWallet?.loadedBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong></article><article className="overview-card"><span>Crédito promocional · demo</span><strong>{(profile.demoWallet?.promoBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong></article><article className="overview-card"><span>Pontos · demo</span><strong>{(profile.demoWallet?.pointsBalance ?? 0).toLocaleString("pt-MZ")}</strong></article></section>
      <p className="field-hint">Crédito especial Moza: <strong>{(profile.demoWallet?.mozaCreditBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong> · demonstrativo e separado dos pontos e do saldo carregado.</p>
    </section>}
  </main>;
}

function BusinessFleet({ token, vehicles, refresh }: { token: string; vehicles: Vehicle[]; refresh: () => Promise<void> }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = event.currentTarget; const plate = String(new FormData(form).get("plate") ?? "");
    try { const response = await fetch(`${api}/customer-auth/vehicles`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ plate }) }); const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Não foi possível adicionar a viatura."); form.reset(); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao adicionar viatura."); } finally { setBusy(false); }
  }
  return <section className="overview-recent"><h3>Frota da empresa</h3><form className="fleet-add-form" onSubmit={addVehicle}><label>Nova matrícula<input name="plate" minLength={5} maxLength={12} placeholder="ABC-123-MC" required /></label><button className="secondary-button" disabled={busy}>Adicionar viatura</button></form>{error && <p className="feedback error" role="alert">{error}</p>}<div className="fleet-list">{vehicles.map((vehicle) => <div className="overview-booking-row" key={vehicle.id}><strong>{vehicle.plate}</strong><button className="secondary-button" type="button" disabled={busy} onClick={async () => { setBusy(true); try { await fetch(`${api}/customer-auth/vehicles/${vehicle.id}/deactivate`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }); await refresh(); } catch { setError("Não foi possível remover a viatura."); } finally { setBusy(false); } }}>Remover da frota</button></div>)}{!vehicles.length && <p className="catalog-state">Adicione as viaturas que a empresa pretende gerir.</p>}</div></section>;
}
