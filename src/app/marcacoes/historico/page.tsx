import CustomerShell from "@/components/CustomerShell";
import BookingHistory from "@/components/BookingHistory";

export const metadata = { title: "As minhas marcações | Lava Já Smart" };

export default function BookingHistoryPage() {
  return <CustomerShell active="/marcacoes"><main className="shell content-page"><BookingHistory /></main></CustomerShell>;
}
