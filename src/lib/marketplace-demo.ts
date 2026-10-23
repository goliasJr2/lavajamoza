export type MarketplaceRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type MarketplaceRequest = {
  id: string;
  offerId: string;
  offerTitle: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  status: MarketplaceRequestStatus;
};

export const MARKETPLACE_REQUESTS_KEY = "lavaja-marketplace-demo-requests";

export const marketplaceOffers = [
  { id: "cafe-matola", partner: "Café da Matola", title: "10% de desconto numa refeição", category: "Restauração", points: 100, description: "Apresente o voucher ao parceiro numa refeição participante.", icon: "☕" },
  { id: "auto-centro", partner: "Auto Centro Demo", title: "Inspecção visual gratuita", category: "Serviços automóveis", points: 400, description: "Uma inspecção visual básica para preparar a próxima viagem.", icon: "🔧" },
  { id: "bebidas-locais", partner: "Sabores Locais", title: "Bebida de cortesia", category: "Restauração", points: 100, description: "Escolha uma bebida de cortesia numa visita participante.", icon: "🥤" },
] as const;

export function readMarketplaceRequests(): MarketplaceRequest[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(MARKETPLACE_REQUESTS_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is MarketplaceRequest => Boolean(item && typeof item.id === "string" && typeof item.offerId === "string" && typeof item.offerTitle === "string" && typeof item.customerName === "string" && typeof item.customerPhone === "string" && typeof item.createdAt === "string" && ["PENDING", "APPROVED", "REJECTED"].includes(item.status)));
  } catch {
    return [];
  }
}

export function saveMarketplaceRequests(requests: MarketplaceRequest[]) {
  window.localStorage.setItem(MARKETPLACE_REQUESTS_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event("lavaja-marketplace-demo-change"));
}
