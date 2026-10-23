"use client";

import { useState } from "react";

type Place = {
  id: string;
  name: string;
  category: "SHOPS" | "FOOD" | "ENTERTAINMENT";
  description: string;
  estimatedMinutes: number;
  externalUrl: string | null;
  isDemo: boolean;
};

const filters = [
  { value: "ALL", label: "Tudo" },
  { value: "SHOPS", label: "Lojas" },
  { value: "FOOD", label: "Cafés e refeições" },
  { value: "ENTERTAINMENT", label: "Entretenimento" },
] as const;
const categoryNames: Record<Place["category"], string> = { SHOPS: "Loja · exemplo", FOOD: "Café e refeições · exemplo", ENTERTAINMENT: "Entretenimento · exemplo" };
const categoryIcons: Record<Place["category"], string> = { SHOPS: "⌂", FOOD: "☕", ENTERTAINMENT: "◇" };

export default function LocalGuide({ places }: { places: Place[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("ALL");
  const visible = filter === "ALL" ? places : places.filter((place) => place.category === filter);
  return <>
    <div className="demo-notice prominent-notice"><strong>Guia demonstrativo.</strong> Os estabelecimentos, descrições e tempos são exemplos não verificados; não representam negócios reais, parcerias ou distâncias garantidas. Confirme sempre a informação antes de se deslocar.</div>
    <div className="local-guide-filters" role="group" aria-label="Filtrar sugestões">
      {filters.map((item) => <button type="button" key={item.value} className={`filter-chip${filter === item.value ? " active" : ""}`} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}
    </div>
    {visible.length ? <div className="local-place-grid">{visible.map((place) => <article className="local-place-card" key={place.id}>
      <span className="local-place-icon" aria-hidden="true">{categoryIcons[place.category]}</span>
      <span className="demo-badge">{categoryNames[place.category]}</span>
      <h2>{place.name}</h2><p>{place.description}</p>
      <div className="local-place-meta"><span>Tempo ilustrativo</span><strong>~{place.estimatedMinutes} min</strong></div>
      {place.externalUrl && <a className="local-place-link" href={place.externalUrl} target="_blank" rel="noreferrer">Ver localização ou contacto <span aria-hidden="true">↗</span></a>}
      <small>Não afiliado · localização não verificada</small>
    </article>)}</div> : <p className="catalog-state">Não há sugestões nesta categoria.</p>}
  </>;
}
