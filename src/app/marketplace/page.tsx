import CustomerShell from "@/components/CustomerShell";
import { redirect } from "next/navigation";

export default function LegacyMarketplacePage() {
  redirect("/servicos-locais");
}
