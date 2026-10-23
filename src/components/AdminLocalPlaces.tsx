"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Category = "SHOPS" | "FOOD" | "ENTERTAINMENT";
type LocalPlace = {
  id: string;
  name: string;
  category: Category;
  description: string;
  estimatedMinutes: number;
  externalUrl: string | null;
  isActive: boolean;
  isDemo: boolean;
};
type PlacePayload = Omit<LocalPlace, "id" | "isActive" | "isDemo">;

const apiBase = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;
const categories: { value: Category; label: string }[] = [
  { value: "SHOPS", label: "Lojas e serviços" },
  { value: "FOOD", label: "Cafés e refeições" },
  { value: "ENTERTAINMENT", label: "Entretenimento" },
];

async function responseError(response: Response) {
  const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
  return Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Ocorreu um erro. Tente novamente.";
}

export default function AdminLocalPlaces({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [places, setPlaces] = useState<LocalPlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${apiBase}/local-guide/manage`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) onUnauthorized();
        throw new Error(await responseError(response));
      }
      setPlaces(await response.json() as LocalPlace[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as sugestões.");
    }
  }, [onUnauthorized, token]);

  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload: PlacePayload = {
      name: String(values.get("name") ?? "").trim(),
      category: String(values.get("category") ?? "SHOPS") as Category,
      description: String(values.get("description") ?? "").trim(),
      estimatedMinutes: Number(values.get("estimatedMinutes")),
      externalUrl: String(values.get("externalUrl") ?? "").trim() || null,
    };
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${apiBase}/local-guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await responseError(response));
      form.reset();
      setNotice("Sugestão adicionada ao guia.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível guardar a sugestão.");
    } finally { setBusy(false); }
  }

  async function update(place: LocalPlace, payload: Partial<PlacePayload> & { isActive?: boolean }) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${apiBase}/local-guide/${place.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setNotice("Sugestão actualizada.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível actualizar a sugestão.");
    } finally { setBusy(false); }
  }

  async function remove(place: LocalPlace) {
    if (!window.confirm(`Remover “${place.name}” do guia?`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${apiBase}/local-guide/${place.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await responseError(response));
      setNotice("Sugestão removida do guia.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível remover a sugestão.");
    } finally { setBusy(false); }
  }

  return <section className="admin-local-places" id="local-places">
    <div className="admin-local-places-heading"><div><p className="eyebrow">Experiência do cliente</p><h2>Serviços locais</h2><p>Gira sugestões de lojas, refeições e actividades apresentadas ao cliente.</p></div><button className="secondary-button" type="button" onClick={() => void load()}>Actualizar lista</button></div>
    {notice && <p className="feedback success" role="status">{notice}</p>}
    {error && <p className="feedback error" role="alert">{error}</p>}
    <form className="admin-form local-place-create" onSubmit={create}>
      <h3>Adicionar sugestão</h3>
      <div className="form-grid">
        <label>Nome<input name="name" minLength={2} maxLength={120} required /></label>
        <label>Categoria<select name="category" defaultValue="SHOPS">{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
        <label>Tempo estimado (minutos)<input name="estimatedMinutes" type="number" min={1} max={240} step={1} required /></label>
        <label>Ligação externa (opcional)<input name="externalUrl" type="url" placeholder="https://…" maxLength={500} /></label>
        <label className="wide-field">Descrição<textarea name="description" minLength={5} maxLength={500} rows={2} required /></label>
      </div>
      <button className="primary-button" type="submit" disabled={busy}>Adicionar ao guia</button>
    </form>
    <div className="local-place-admin-list">
      {places.map((place) => <LocalPlaceEditor key={place.id} place={place} disabled={busy} onSave={update} onDelete={remove} />)}
      {places.length === 0 && !error && <p className="catalog-state">Ainda não há sugestões. Adicione a primeira para apresentar opções no guia.</p>}
    </div>
  </section>;
}

function LocalPlaceEditor({ place, disabled, onSave, onDelete }: {
  place: LocalPlace;
  disabled: boolean;
  onSave: (place: LocalPlace, payload: Partial<PlacePayload> & { isActive?: boolean }) => Promise<void>;
  onDelete: (place: LocalPlace) => Promise<void>;
}) {
  const [name, setName] = useState(place.name);
  const [category, setCategory] = useState<Category>(place.category);
  const [description, setDescription] = useState(place.description);
  const [estimatedMinutes, setEstimatedMinutes] = useState(String(place.estimatedMinutes));
  const [externalUrl, setExternalUrl] = useState(place.externalUrl ?? "");

  return <form className={`manage-service-card local-place-editor${place.isActive ? "" : " is-inactive"}`} onSubmit={(event) => {
    event.preventDefault();
    void onSave(place, { name: name.trim(), category, description: description.trim(), estimatedMinutes: Number(estimatedMinutes), externalUrl: externalUrl.trim() || null });
  }}>
    <div className="service-card-top"><span className="service-icon" aria-hidden="true">⌖</span><span className="demo-badge">{place.isActive ? "Visível no guia" : "Oculta"}</span></div>
    <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required /></label>
    <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <label>Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={5} maxLength={500} rows={2} required /></label>
    <div className="form-grid compact-grid">
      <label>Tempo (min)<input type="number" min={1} max={240} value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(event.target.value)} required /></label>
      <label>Ligação externa<input type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} maxLength={500} placeholder="https://…" /></label>
    </div>
    <div className="editor-actions">
      <button className="primary-button" type="submit" disabled={disabled}>Guardar</button>
      <button className="secondary-button" type="button" disabled={disabled} onClick={() => void onSave(place, { isActive: !place.isActive })}>{place.isActive ? "Ocultar" : "Publicar"}</button>
      <button className="secondary-button" type="button" disabled={disabled} onClick={() => void onDelete(place)}>Remover</button>
    </div>
  </form>;
}
