"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const api = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;
type Vehicle = { id: string; plate: string };
type Booking = { publicCode: string; status: string; startsAt: string; priceMznAtBooking: number; durationAtBooking: number; rating: { score: number; comment: string | null } | null; service: { name: string }; vehicle: { plate: string } };
type Profile = { id: string; name: string; phone: string; cardCode: string; accountType: "INDIVIDUAL" | "BUSINESS"; accountStatus: string; businessName: string | null; nuit: string | null; createdAt: string; vehicles: Vehicle[]; bookings: Booking[]; demoWallet: { loadedBalanceMzn: number; promoBalanceMzn: number; mozaCreditBalanceMzn: number; pointsBalance: number } | null };
const statusLabels: Record<string, string> = { REQUESTED: "Pendente", ACCEPTED: "Aceite", IN_PROGRESS: "Em atendimento", COMPLETED: "ConcluÃ­da", REJECTED: "NÃ£o aceite", CANCELLED: "Cancelada" };

export default function CustomerAccount() {
  const [token, setToken] = useState(""); const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<"login" | "register" | "business">("login"); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const loadProfile = useCallback(async (accessToken: string) => {
    const response = await fetch(`${api}/customer-auth/me`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) throw new Error("A sessÃ£o expirou. Entre novamente.");
    setProfile(await response.json() as Profile);
  }, []);
  useEffect(() => { const saved = window.sessionStorage.getItem("lavaja-customer-token"); if (!saved) return; setToken(saved); void loadProfile(saved).catch(() => { window.sessionStorage.removeItem("lavaja-customer-token"); setToken(""); }); }, [loadProfile]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice(""); const data = new FormData(event.currentTarget);
    const business = mode === "business";
    const payload = business ? { businessName: String(data.get("businessName")).trim(), nuit: String(data.get("nuit")).trim(), contactName: String(data.get("contactName")).trim(), phone: String(data.get("phone")).trim(), password: String(data.get("password")) } : mode === "register" ? { code: String(data.get("code")).trim().toUpperCase(), phone: String(data.get("phone")).trim(), password: String(data.get("password")) } : { phone: String(data.get("phone")).trim(), password: String(data.get("password")) };
    const endpoint = business ? "business/register" : mode;
    try {
      const response = await fetch(`${api}/customer-auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json();
      if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "NÃ£o foi possÃ­vel concluir o pedido.");
      if (business) { setNotice(body.message ?? "Pedido empresarial enviado para aprovaÃ§Ã£o."); setMode("login"); return; }
      window.sessionStorage.setItem("lavaja-customer-token", body.accessToken); setToken(body.accessToken); await loadProfile(body.accessToken);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de ligaÃ§Ã£o Ã  API."); } finally { setBusy(false); }
  }
  function logout() { window.sessionStorage.removeItem("lavaja-customer-token"); setToken(""); setProfile(null); }
  return <main className="shell"><header className="page-heading"><p className="eyebrow">A sua conta Lava JÃ¡</p><h1>Perfil do cliente</h1><p>Consulte as suas marcaÃ§Ãµes, cartÃ£o e saldo de fidelizaÃ§Ã£o no mesmo perfil.</p></header>
    {!token || !profile ? <section className="demo-form customer-account-form"><div className="account-mode-switch"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); setNotice(""); }}>Entrar</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); setNotice(""); }}>Conta cliente</button><button type="button" className={mode === "business" ? "active" : ""} onClick={() => { setMode("business"); setError(""); setNotice(""); }}>Conta empresarial</button></div>
      <h2>{mode === "login" ? "Bem-vindo de volta" : mode === "business" ? "Pedir conta empresarial" : "Criar conta cliente"}</h2>
      {mode === "register" && <p>Para associar a conta cliente, use o cÃ³digo e telefone de uma marcaÃ§Ã£o existente.</p>}
      {mode === "business" && <p>O acesso empresarial fica disponÃ­vel depois da validaÃ§Ã£o pelo administrador.</p>}
      <form onSubmit={submit}>
        {mode === "business" && <><label>Nome da empresa<input name="businessName" minLength={2} maxLength={120} required /></label><label>NUIT<input name="nuit" inputMode="numeric" pattern="[0-9]{9}" minLength={9} maxLength={9} required /></label><label>Nome do responsÃ¡vel<input name="contactName" autoComplete="name" minLength={2} maxLength={100} required /></label></>}
        {mode === "register" && <label>CÃ³digo da marcaÃ§Ã£o<input name="code" required minLength={8} maxLength={8} pattern="[A-Za-z0-9]{8}" /></label>}
        <label>Telefone<input name="phone" required autoComplete="tel" /></label><label>Palavra-passe<input name="password" type="password" minLength={12} maxLength={100} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
        {mode !== "login" && <small>Use pelo menos 12 caracteres. O registo nÃ£o envia SMS nesta versÃ£o.</small>}
        {error && <p className="feedback error" role="alert">{error}</p>}{notice && <p className="feedback success" role="status">{notice}</p>}
        <button className="primary-button" disabled={busy}>{busy ? "A processarâ€¦" : mode === "login" ? "Entrar na conta" : mode === "business" ? "Enviar pedido empresarial" : "Criar conta"}</button>
      </form>
    </section> : <section className="customer-profile"><div className="profile-heading"><div><p className="eyebrow">{profile.accountType === "BUSINESS" ? "Conta empresarial" : "Perfil activo"}</p><h2>{profile.accountType === "BUSINESS" ? profile.businessName : profile.name}</h2><p>{profile.name} Â· {profile.phone}{profile.accountType === "BUSINESS" ? ` Â· NUIT ${profile.nuit}` : ""}</p></div><button className="secondary-button" type="button" onClick={logout}>Terminar sessÃ£o</button></div>
      <div className="profile-quicklinks"><Link href="/cartao">CartÃ£o virtual Â· {profile.cardCode}</Link><Link href="/marcacoes/historico">Ver histÃ³rico</Link><Link href="/credito">CrÃ©dito demonstrativo</Link></div>
      {profile.accountType === "BUSINESS" && <BusinessFleet token={token} vehicles={profile.vehicles} refresh={() => loadProfile(token)} />}
      <section className="overview-recent"><h3>MarcaÃ§Ãµes recentes</h3>{profile.bookings.length ? <div className="overview-booking-list">{profile.bookings.map((booking) => <article className="overview-booking-row" key={booking.publicCode}><div><strong>{booking.service.name} Â· {booking.vehicle.plate}</strong><small>{booking.publicCode} Â· {new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(booking.startsAt))}</small></div><span className="booking-admin-status">{booking.rating ? `${booking.rating.score}/5` : statusLabels[booking.status] ?? booking.status}</span></article>)}</div> : <p className="catalog-state">Ainda nÃ£o tem marcaÃ§Ãµes associadas.</p>}</section>
      <section className="overview-grid profile-wallet"><article className="overview-card"><span>CrÃ©dito carregado Â· demo</span><strong>{(profile.demoWallet?.loadedBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong></article><article className="overview-card"><span>CrÃ©dito promocional Â· demo</span><strong>{(profile.demoWallet?.promoBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong></article><article className="overview-card"><span>Pontos Â· demo</span><strong>{(profile.demoWallet?.pointsBalance ?? 0).toLocaleString("pt-MZ")}</strong></article></section>
      <p className="field-hint">Credito especial Moza: <strong>{(profile.demoWallet?.mozaCreditBalanceMzn ?? 0).toLocaleString("pt-MZ")} MT</strong> · demonstrativo e separado dos pontos e do saldo carregado.</p>
    </section>}
  </main>;
}

function BusinessFleet({ token, vehicles, refresh }: { token: string; vehicles: Vehicle[]; refresh: () => Promise<void> }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = event.currentTarget; const plate = String(new FormData(form).get("plate") ?? "");
    try { const response = await fetch(`${api}/customer-auth/vehicles`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ plate }) }); const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "NÃ£o foi possÃ­vel adicionar a viatura."); form.reset(); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao adicionar viatura."); } finally { setBusy(false); }
  }
  return <section className="overview-recent"><h3>Frota da empresa</h3><form className="fleet-add-form" onSubmit={addVehicle}><label>Nova matrÃ­cula<input name="plate" minLength={5} maxLength={12} placeholder="ABC-123-MC" required /></label><button className="secondary-button" disabled={busy}>Adicionar viatura</button></form>{error && <p className="feedback error" role="alert">{error}</p>}<div className="fleet-list">{vehicles.map((vehicle) => <div className="overview-booking-row" key={vehicle.id}><strong>{vehicle.plate}</strong><button className="secondary-button" type="button" disabled={busy} onClick={async () => { setBusy(true); try { await fetch(`${api}/customer-auth/vehicles/${vehicle.id}/deactivate`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }); await refresh(); } catch { setError("NÃ£o foi possÃ­vel remover a viatura."); } finally { setBusy(false); } }}>Remover da frota</button></div>)}{!vehicles.length && <p className="catalog-state">Adicione as viaturas que a empresa pretende gerir.</p>}</div></section>;
}
