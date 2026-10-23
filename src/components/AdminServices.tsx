"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import BookingManagement from "@/components/BookingManagement";
import AdminStatistics from "@/components/AdminStatistics";
import AdminPayments from "@/components/AdminPayments";
import AdminOverview from "@/components/AdminOverview";
import AdminLocalPlaces from "@/components/AdminLocalPlaces";
import AdminPromotionCampaigns from "@/components/AdminPromotionCampaigns";
import AdminCustomerAccounts from "@/components/AdminCustomerAccounts";

type Service = {
  id: string;
  name: string;
  description: string;
  priceMzn: number;
  durationMinutes: number;
  isActive: boolean;
  isDemo: boolean;
};

type ServicePayload = Omit<Service, "id" | "isActive" | "isDemo">;

const apiBase = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;

async function getError(response: Response) {
  const result = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | null;
  return Array.isArray(result?.message)
    ? result.message.join(" ")
    : result?.message ?? "Ocorreu um erro. Tente novamente.";
}

export default function AdminServices() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(window.sessionStorage.getItem("lavaja-admin-token") ?? "");
  }, []);

  useEffect(() => {
    if (token) void loadServices(token);
    // Fetch only when the authenticated token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadServices(accessToken: string) {
    setError("");
    try {
      const response = await fetch(`${apiBase}/services/manage`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) logout();
        throw new Error(await getError(response));
      }
      setServices((await response.json()) as Service[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível ligar à API.");
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error(await getError(response));
      const result = (await response.json()) as { accessToken: string };
      window.sessionStorage.setItem("lavaja-admin-token", result.accessToken);
      setToken(result.accessToken);
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  const logout = useCallback(() => {
    window.sessionStorage.removeItem("lavaja-admin-token");
    setToken("");
    setServices([]);
  }, []);

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: ServicePayload = {
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      priceMzn: Number(form.get("priceMzn")),
      durationMinutes: Number(form.get("durationMinutes")),
    };
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiBase}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await getError(response));
      formElement.reset();
      setNotice("Serviço criado. O preço aparece como referência no catálogo.");
      await loadServices(token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o serviço.");
    } finally {
      setBusy(false);
    }
  }

  async function updateService(service: Service, payload: Partial<ServicePayload> & { isActive?: boolean }) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiBase}/services/${service.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await getError(response));
      setNotice("Serviço actualizado.");
      await loadServices(token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível actualizar o serviço.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link className="admin-brand" href="/" aria-label="Lava Já Smart, início">
          <Image src="/brand/lava-ja-horizontal.svg" alt="Lava Já Smart" width={726} height={184} priority />
        </Link>
        <Link className="back-link" href="/">← Voltar ao catálogo</Link>
      </header>

      {!token ? (
        <section className="login-card">
          <p className="eyebrow">Acesso reservado à equipa</p>
          <h1>Gestão do Lava Já</h1>
          <p className="admin-intro">Entre para consultar e gerir os serviços do carwash.</p>
          <form className="admin-form" onSubmit={login}>
            <label>
              Email
              <input
                autoComplete="username"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Palavra-passe
              <input
                autoComplete="current-password"
                type="password"
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="primary-button" disabled={busy} type="submit">
              {busy ? "A entrar…" : "Entrar"}
            </button>
          </form>
          <p className="demo-hint">Configure ADMIN_EMAIL e ADMIN_PASSWORD no ficheiro .env local.</p>
          {error && <p className="feedback error" role="alert">{error}</p>}
        </section>
      ) : (
        <section className="admin-content">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">Painel de gestão</p>
              <h1>Painel operacional</h1>
              <p className="admin-intro">Acompanhe o atendimento e gira os serviços do Lava Já.</p>
            </div>
            <button className="secondary-button" onClick={logout} type="button">Terminar sessão</button>
          </div>

          <nav className="admin-section-nav" aria-label="Secções do painel">
            <a href="#overview">Resumo</a>
            <a href="#statistics">Estatísticas</a>
            <a href="#payments">Pagamentos</a>
            <a href="#booking-management">Marcações</a>
            <a href="#local-places">Serviços locais</a>
            <a href="#promotion-campaigns">Campanhas</a>
            <a href="#customer-accounts">Clientes</a>
            <a href="#services">Serviços</a>
          </nav>

          {notice && <p className="feedback success" role="status">{notice}</p>}
          {error && <p className="feedback error" role="alert">{error}</p>}

          <AdminOverview token={token} onUnauthorized={logout} />

          <AdminStatistics token={token} onUnauthorized={logout} />

          <AdminPayments token={token} onUnauthorized={logout} />

          <BookingManagement token={token} />

          <AdminLocalPlaces token={token} onUnauthorized={logout} />

          <AdminPromotionCampaigns token={token} onUnauthorized={logout} />

          <AdminCustomerAccounts token={token} onUnauthorized={logout} />

          <form id="services" className="create-service-card admin-form" onSubmit={createService}>
            <h2>Adicionar serviço</h2>
            <div className="form-grid">
              <label>Nome<input name="name" maxLength={100} minLength={2} required /></label>
              <label>Preço (MT)<input name="priceMzn" type="number" min={1} step={1} required /></label>
              <label>Duração (minutos)<input name="durationMinutes" type="number" min={5} step={5} required /></label>
              <label className="wide-field">Descrição<textarea name="description" maxLength={500} minLength={5} required rows={2} /></label>
            </div>
            <button className="primary-button" disabled={busy} type="submit">Guardar serviço</button>
          </form>

          <div className="admin-service-list">
            {services.map((service) => (
              <ServiceEditor key={service.id} service={service} disabled={busy} onSave={updateService} />
            ))}
            {services.length === 0 && <p className="catalog-state">Ainda não existem serviços. Adicione o primeiro acima.</p>}
          </div>
        </section>
      )}
    </main>
  );
}

function ServiceEditor({
  service,
  disabled,
  onSave,
}: {
  service: Service;
  disabled: boolean;
  onSave: (service: Service, payload: Partial<ServicePayload> & { isActive?: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description);
  const [priceMzn, setPriceMzn] = useState(String(service.priceMzn));
  const [durationMinutes, setDurationMinutes] = useState(String(service.durationMinutes));

  return (
    <form
      className={`manage-service-card${service.isActive ? "" : " is-inactive"}`}
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(service, {
          name: name.trim(),
          description: description.trim(),
          priceMzn: Number(priceMzn),
          durationMinutes: Number(durationMinutes),
        });
      }}
    >
      <div className="service-card-top">
        <span className="service-icon" aria-hidden="true">✦</span>
        <span className="demo-badge">{service.isActive ? "Activo · preço de referência" : "Inactivo"}</span>
      </div>
      <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required /></label>
      <label>Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={5} maxLength={500} rows={2} required /></label>
      <div className="form-grid compact-grid">
        <label>Preço (MT)<input type="number" min={1} step={1} value={priceMzn} onChange={(event) => setPriceMzn(event.target.value)} required /></label>
        <label>Duração (min)<input type="number" min={5} step={5} value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} required /></label>
      </div>
      <div className="editor-actions">
        <button className="primary-button" disabled={disabled} type="submit">Guardar alterações</button>
        <button
          className="secondary-button"
          disabled={disabled}
          onClick={() => void onSave(service, { isActive: !service.isActive })}
          type="button"
        >
          {service.isActive ? "Desactivar" : "Activar"}
        </button>
      </div>
    </form>
  );
}
