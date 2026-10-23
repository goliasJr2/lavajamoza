import CustomerShell from "@/components/CustomerShell";
import MozaDemoCheckout from "@/components/MozaDemoCheckout";

export const metadata = { title: "Pagamento | Lava Já Smart" };
export default function PaymentPage() { return <CustomerShell active="/pagamento"><MozaDemoCheckout /></CustomerShell>; }
