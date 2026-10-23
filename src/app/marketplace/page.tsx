import CustomerShell from "@/components/CustomerShell";
import MarketplaceDemo from "@/components/MarketplaceDemo";

export const metadata = { title: "Marketplace demonstrativo | Lava Já Smart" };

export default function MarketplacePage() {
  return <CustomerShell active="/marketplace"><MarketplaceDemo /></CustomerShell>;
}
