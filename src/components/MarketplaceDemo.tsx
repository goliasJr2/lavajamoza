"use client";

import { useEffect, useState } from "react";
import { marketplaceOffers, readMarketplaceRequests, saveMarketplaceRequests, type MarketplaceRequest } from "@/lib/marketplace-demo";

const statusLabels = { PENDING: "A aguardar confirmação", APPROVED: "Aprovado · voucher demonstrativo", REJECTED: "Não aprovado" } as const;

export default function MarketplaceDemo() {
  const [requests, setRequests] = useState<MarketplaceRequest[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => setRequests(readMarketplaceRequests());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("lavaja-marketplace-demo-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("lavaja-marketplace-demo-change", sync);
    };
  }, []);

  function requestOffer(offerId: string, offerTitle: string) {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanName || !cleanPhone) {
      setError("Preencha o nome e o telefone para simular o pedido.");
      return;
    }
    const current = readMarketplaceRequests();
    const existing = current.find((item) => item.offerId === offerId && item.customerPhone === cleanPhone && item.status !== "REJECTED");
    if (existing) {
      setError("Já existe um pedido deste benefício para este contacto.");
      setNotice("");
      return;
    }
    saveMarketplaceRequests([{ id: crypto.randomUUID(), offerId, offerTitle, customerName: cleanName, customerPhone: cleanPhone, createdAt: new Date().toISOString(), status: "PENDING" }, ...current]);
    setError("");
    setNotice("Pedido demonstrativo enviado. A equipa poderá aprová-lo no painel de administração.");
  }

  const mine = requests.filter((item) => item.customerPhone === phone.trim());

  return <main className="shell content-page marketplace-demo">
    <header className="page-heading"><p className="eyebrow">Benefícios perto de si</p><h1>Marketplace de parceiros</h1><p>Veja como poderia descobrir benefícios, pedi-los e acompanhar a validação pela equipa.</p></header>
    <div className="demo-notice prominent-notice"><strong>Experiência fictícia para apresentação.</strong> Parceiros, benefícios e vouchers são exemplos. Os pedidos não descontam pontos nem criam reservas ou compras reais; ficam guardados apenas neste navegador.</div>
    <form className="demo-form marketplace-customer-form" onSubmit={(event) => event.preventDefault()}>
      <h2>Identificação do cliente</h2><p>Use estes dados para acompanhar o pedido no mesmo navegador.</p>
      <div className="form-grid"><label>Nome<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label><label>Telefone<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel" required /></label></div>
    </form>
    {error && <p className="feedback error" role="alert">{error}</p>}{notice && <p className="feedback success" role="status">{notice}</p>}
    <div className="marketplace-offer-grid">{marketplaceOffers.map((offer) => <article className="marketplace-offer-card" key={offer.id}>
      <div className="marketplace-offer-icon" aria-hidden="true">{offer.icon}</div><span className="demo-badge">Parceiro ilustrativo</span><small>{offer.category} · {offer.partner}</small><h2>{offer.title}</h2><p>{offer.description}</p><div className="marketplace-offer-footer"><strong>{offer.points} pontos</strong><button type="button" className="primary-button" onClick={() => requestOffer(offer.id, offer.title)}>Solicitar benefício</button></div>
    </article>)}</div>
    <section className="marketplace-request-section"><div className="section-heading section-heading-left"><p className="eyebrow">Acompanhamento</p><h2>Os seus pedidos</h2><p>Insira o telefone acima para ver o estado que a equipa definiu no painel.</p></div>
      {mine.length ? <div className="marketplace-request-list">{mine.map((item) => <article key={item.id}><div><strong>{item.offerTitle}</strong><small>Pedido em {new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(item.createdAt))}</small></div><span className={`demo-badge marketplace-status-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></article>)}</div> : <p className="catalog-state">Ainda não existem pedidos para este telefone.</p>}
      <small>Na demonstração, o estado actualiza quando o cliente e o painel admin usam o mesmo navegador.</small>
    </section>
  </main>;
}
