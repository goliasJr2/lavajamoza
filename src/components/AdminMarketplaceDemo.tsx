"use client";

import { useEffect, useState } from "react";
import { readMarketplaceRequests, saveMarketplaceRequests, type MarketplaceRequest, type MarketplaceRequestStatus } from "@/lib/marketplace-demo";

const labels: Record<MarketplaceRequestStatus, string> = { PENDING: "Pendente", APPROVED: "Aprovado · demo", REJECTED: "Rejeitado" };

export default function AdminMarketplaceDemo() {
  const [requests, setRequests] = useState<MarketplaceRequest[]>([]);

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

  function update(id: string, status: MarketplaceRequestStatus) {
    const updated = readMarketplaceRequests().map((item) => item.id === id ? { ...item, status } : item);
    saveMarketplaceRequests(updated);
    setRequests(updated);
  }

  return <section className="admin-marketplace-demo" id="marketplace-demo">
    <div className="admin-local-places-heading"><div><p className="eyebrow">Demonstração · marketplace</p><h2>Pedidos de benefícios</h2><p>Veja os pedidos dos clientes e simule a validação pela equipa.</p></div></div>
    <p className="demo-notice"><strong>Dados fictícios locais.</strong> Ofertas e decisões são guardadas no navegador actual; não notificam parceiros nem emitem vouchers reais.</p>
    {requests.length ? <div className="marketplace-admin-list">{requests.map((item) => <article key={item.id}>
      <div className="marketplace-admin-request"><div><strong>{item.offerTitle}</strong><span>{item.customerName} · {item.customerPhone}</span><small>Recebido em {new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Maputo" }).format(new Date(item.createdAt))}</small></div><span className={`demo-badge marketplace-status-${item.status.toLowerCase()}`}>{labels[item.status]}</span></div>
      {item.status === "PENDING" && <div className="editor-actions"><button className="primary-button" type="button" onClick={() => update(item.id, "APPROVED")}>Aprovar pedido demo</button><button className="secondary-button" type="button" onClick={() => update(item.id, "REJECTED")}>Rejeitar</button></div>}
    </article>)}</div> : <p className="catalog-state">Ainda não há pedidos. Envie um pedido em <a href="/marketplace">Marketplace</a> usando o mesmo navegador.</p>}
  </section>;
}
